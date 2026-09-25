import copy
import io
import json
import re

import pytest
from django.conf import settings as django_settings
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.db import IntegrityError, transaction
from PIL import Image

from accounts.models import User
from students.models import Enrollment, Student, blank_qualifications, validate_qualifications
from website.models import Course, SiteSettings

pytestmark = pytest.mark.django_db

ADMIT = "/api/v1/admissions/"
CHECK = "/api/v1/admissions/validate/"
ME = "/api/v1/auth/me/"


def quals():
    rows = blank_qualifications()
    rows[0].update(year="2020", board="UP Board", subject="Science", percentage="78")
    rows[1].update(year="2022", board="UP Board", subject="Commerce", percentage="71.5")
    return rows


VALID = {
    "email": "Nisha.Bhatt@Gmail.com",
    "password": "Sketch#2026pass",
    "name": "  nisha   bhatt ",
    "father_name": "Girish Bhatt",
    "dob": "2006-04-12",
    "gender": "Female",
    "address": "C-12, Kakadeo",
    "pincode": "208025",
    "city": "Kanpur",
    "mobile": "+91 88262 91458",
    "phone": "",
    "qualifications": quals(),
    "course": "pdm",
    "employment": "Student",
    "accept_no_refund": True,
}


@pytest.fixture(autouse=True)
def _setup(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path  # uploaded photos go to a throwaway folder
    call_command("seed_courses", verbosity=0)


def payload(**changes):
    data = copy.deepcopy(VALID)
    data.update(changes)
    return data


def image_file(fmt="PNG", size=(1200, 1600), name="photo.png"):
    buf = io.BytesIO()
    Image.new("RGB", size, (30, 60, 110)).save(buf, format=fmt)
    return SimpleUploadedFile(name, buf.getvalue(), content_type=f"image/{fmt.lower()}")


def multipart(**changes):
    data = payload(**changes)
    data["qualifications"] = json.dumps(data["qualifications"])
    data["accept_no_refund"] = "true"
    return data


class TestAdmission:
    def test_creates_login_student_and_pending_enrollment_and_signs_in(self, api):
        res = api.post(ADMIT, payload(), format="json")
        assert res.status_code == 201, res.data

        assert re.fullmatch(r"AA-STU-\d{4}", res.data["student_code"])
        assert re.fullmatch(r"EN-\d{4}", res.data["enrollment_code"])
        assert res.data["course"] == {"slug": "pdm", "name": "Professional Diploma in Multimedia"}

        user = User.objects.get(email="nisha.bhatt@gmail.com")
        assert user.role == "student" and user.check_password(VALID["password"])
        student = user.student
        assert (student.name, student.father_name) == ("NISHA BHATT", "GIRISH BHATT")
        assert student.mobile == "8826291458"
        assert student.status == Student.Status.PENDING
        assert student.qualifications[1]["percentage"] == "71.5"
        enrollment = student.enrollments.get()
        assert enrollment.status == Enrollment.Status.PENDING and enrollment.course.slug == "pdm"

        # Signed in: the refresh cookie and role cookie are set, and the access token works.
        cfg = django_settings.REFRESH_COOKIE
        assert res.cookies[cfg["NAME"]]["httponly"]
        assert res.cookies[cfg["SESSION_NAME"]].value == "student"
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        me = api.get(ME).data
        assert me["student_code"] == student.code and me["name"] == "NISHA BHATT"

    def test_multipart_with_photo_is_reencoded(self, api):
        res = api.post(ADMIT, {**multipart(), "photo": image_file()}, format="multipart")
        assert res.status_code == 201, res.data
        photo = Student.objects.get().photo
        assert photo.name.endswith(".jpg")
        with Image.open(photo.path) as img:
            assert img.format == "JPEG"
            assert max(img.size) <= 800

    def test_photo_must_be_an_image(self, api):
        bad = SimpleUploadedFile("photo.png", b"not an image", content_type="image/png")
        res = api.post(ADMIT, {**multipart(), "photo": bad}, format="multipart")
        assert res.status_code == 400 and "photo" in res.data["errors"]

    def test_photo_size_limit(self, api):
        big = SimpleUploadedFile("big.png", b"0" * (2 * 1024 * 1024 + 1), content_type="image/png")
        res = api.post(ADMIT, {**multipart(), "photo": big}, format="multipart")
        assert res.status_code == 400 and "photo" in res.data["errors"]

    @pytest.mark.parametrize(
        "changes, field",
        [
            ({"name": "Al"}, "name"),
            ({"name": "Nisha123"}, "name"),
            ({"father_name": ""}, "father_name"),
            ({"address": ""}, "address"),
            ({"pincode": "20801"}, "pincode"),
            ({"pincode": "008012"}, "pincode"),
            ({"mobile": "12345"}, "mobile"),
            ({"mobile": "5826291458"}, "mobile"),
            ({"dob": "2024-01-01"}, "dob"),
            ({"email": "nope"}, "email"),
            ({"password": "12345678"}, "password"),
            ({"password": "nisha.bhatt"}, "password"),
            ({"course": "no-such-course"}, "course"),
            ({"employment": "Retired"}, "employment"),
            ({"accept_no_refund": False}, "accept_no_refund"),
            ({"qualifications": blank_qualifications()}, "qualifications"),
        ],
    )
    def test_validation(self, api, changes, field):
        res = api.post(ADMIT, payload(**changes), format="json")
        assert res.status_code == 400
        assert field in res.data["errors"], res.data
        assert not User.objects.exists()

    def test_high_school_row_message(self, api):
        res = api.post(ADMIT, payload(qualifications=blank_qualifications()), format="json")
        assert res.data["errors"]["qualifications"] == [
            "Fill in at least the High School row — year and board."
        ]

    def test_draft_course_cannot_be_chosen(self, api):
        Course.objects.filter(slug="pdm").update(status=Course.Status.DRAFT)
        res = api.post(ADMIT, payload(), format="json")
        assert res.data["errors"]["course"] == ["Choose a course from the list."]

    def test_email_already_registered(self, api):
        User.objects.create_user(email="nisha.bhatt@gmail.com", password="x")
        res = api.post(ADMIT, payload(), format="json")
        assert res.status_code == 400
        assert res.data["errors"]["email"] == [
            "An account with this email already exists. Log in instead."
        ]

    def test_registration_closed(self, api):
        s = SiteSettings.load()
        s.allow_registration = False
        s.save()
        for url, body in [(ADMIT, payload()), (CHECK, {"step": "course", "data": {}})]:
            res = api.post(url, body, format="json")
            assert res.status_code == 403
            assert res.data["detail"].startswith("Online registration is closed")

    def test_is_throttled(self, api):
        codes = [
            api.post(ADMIT, payload(email=f"student{i}@example.in"), format="json").status_code
            for i in range(6)
        ]
        assert codes == [201] * 5 + [429]


class TestStepCheck:
    def check(self, api, step, data):
        return api.post(CHECK, {"step": step, "data": data}, format="json")

    def test_each_valid_step(self, api):
        v = VALID
        steps = {
            "account": {"email": v["email"], "password": v["password"], "name": v["name"]},
            "personal": {
                k: v[k] for k in ["name", "father_name", "dob", "address", "pincode", "mobile"]
            },
            "education": {"qualifications": v["qualifications"]},
            "course": {k: v[k] for k in ["course", "employment", "accept_no_refund"]},
        }
        for step, data in steps.items():
            res = self.check(api, step, data)
            assert res.status_code == 200, (step, res.data)
            assert res.data == {"valid": True}
        assert not User.objects.exists()  # nothing is saved

    def test_invalid_step_reports_only_that_steps_fields(self, api):
        res = self.check(api, "personal", {"name": "A", "pincode": "1"})
        assert res.status_code == 400
        assert {"name", "pincode", "father_name", "mobile"} <= set(res.data["errors"])
        assert "email" not in res.data["errors"]

    def test_account_step_reports_a_taken_email(self, api):
        User.objects.create_user(email="nisha.bhatt@gmail.com", password="x")
        res = self.check(
            api, "account", {"email": "NISHA.BHATT@gmail.com", "password": "Sketch#2026pass"}
        )
        assert "email" in res.data["errors"]

    def test_unknown_step(self, api):
        assert self.check(api, "payment", {}).status_code == 400


class TestModels:
    def make_student(self):
        user = User.objects.create_user(email="a@b.in", password="x")
        return Student.objects.create(
            user=user,
            name="aarav mehta",
            father_name="Rakesh Mehta",
            dob="2004-03-14",
            address="C-42, Nehru Nagar",
            pincode="208012",
            mobile="9811045236",
            employment="Unemployed",
            qualifications=quals(),
        )

    def test_codes_and_uppercase_name(self):
        student = self.make_student()
        assert student.code == f"AA-STU-{1000 + student.pk:04d}"
        assert student.name == "AARAV MEHTA"
        enrollment = Enrollment.objects.create(
            student=student, course=Course.objects.get(slug="dtp")
        )
        assert enrollment.code == f"EN-{2000 + enrollment.pk:04d}"
        assert enrollment.certificate_code is None

    def test_one_live_enrollment_per_course(self):
        student = self.make_student()
        dtp = Course.objects.get(slug="dtp")
        first = Enrollment.objects.create(student=student, course=dtp)
        with pytest.raises(IntegrityError), transaction.atomic():
            Enrollment.objects.create(student=student, course=dtp)
        first.status = Enrollment.Status.CANCELLED
        first.save()
        Enrollment.objects.create(student=student, course=dtp)  # allowed again after cancelling

    @pytest.mark.parametrize(
        "mutate",
        [
            lambda q: q.pop(),
            lambda q: q.reverse(),
            lambda q: q[0].update(year="20"),
            lambda q: q[0].update(year="1900"),
            lambda q: q[1].update(percentage="120"),
            lambda q: q[1].update(percentage="abc"),
            lambda q: q[2].update(extra="x"),
            lambda q: q[0].update(board=""),
        ],
    )
    def test_qualification_validator_rejects(self, mutate):
        rows = quals()
        mutate(rows)
        with pytest.raises(ValidationError):
            validate_qualifications(rows)

    def test_qualification_validator_accepts(self):
        rows = quals()
        rows[1]["percentage"] = "71.5%"
        validate_qualifications(rows)
