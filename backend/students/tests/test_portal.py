import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.utils import timezone
from PIL import Image

from accounts.models import User
from conftest import auth_client
from students.models import Enrollment, Student, blank_qualifications
from website.models import Announcement, Course, SiteSettings

pytestmark = pytest.mark.django_db

DASHBOARD = "/api/v1/me/dashboard/"
PROFILE = "/api/v1/me/profile/"
ENROLLMENTS = "/api/v1/me/enrollments/"


def quals():
    rows = blank_qualifications()
    rows[0].update(year="2020", board="UP Board")
    return rows


def make_student(email="aarav@example.in", name="Aarav Mehta"):
    user = User.objects.create_user(email=email, password="x", full_name=name)
    return Student.objects.create(
        user=user,
        name=name,
        father_name="Rakesh Mehta",
        dob="2004-03-14",
        address="C-42, Nehru Nagar",
        pincode="208012",
        mobile="9811045236",
        employment="Unemployed",
        qualifications=quals(),
    )


def course(slug):
    return Course.objects.get(slug=slug)


@pytest.fixture(autouse=True)
def _setup(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    call_command("seed_courses", verbosity=0)


@pytest.fixture
def student():
    return make_student()


@pytest.fixture
def client(student):
    return auth_client(student.user)


class TestAccess:
    @pytest.mark.parametrize("url", [DASHBOARD, PROFILE, ENROLLMENTS])
    def test_anonymous_is_401(self, api, url):
        assert api.get(url).status_code == 401

    @pytest.mark.parametrize("url", [DASHBOARD, PROFILE, ENROLLMENTS])
    def test_admin_is_403(self, admin_user, url):
        assert auth_client(admin_user).get(url).status_code == 403

    def test_student_login_without_a_record_is_403(self, student_user):
        res = auth_client(student_user).get(PROFILE)
        assert res.status_code == 403
        assert "no student record" in res.data["detail"]

    def test_students_only_see_their_own_enrollments(self, client, student):
        other = make_student(email="other@example.in", name="Sneha Kapoor")
        Enrollment.objects.create(student=other, course=course("dtp"))
        mine = Enrollment.objects.create(student=student, course=course("ccc"))
        codes = [e["code"] for e in client.get(ENROLLMENTS).data]
        assert codes == [mine.code]


class TestDashboard:
    def test_counts_current_certificates_and_upcoming(self, client, student):
        today = timezone.localdate()
        Enrollment.objects.create(student=student, course=course("dtp"))  # pending
        Enrollment.objects.create(student=student, course=course("ccc"), status="Active")
        Enrollment.objects.create(student=student, course=course("dwd"), status="Cancelled")
        Enrollment.objects.create(
            student=student,
            course=course("dca-acc"),
            status="Completed",
            certificate_code="AA-2026-000099",
            certificate_issued_on=today,
        )
        Announcement.objects.create(title="Holiday", text="t", category="Holiday", date=today)
        Announcement.objects.create(title="Exam", text="t", category="Exam", date=today)

        data = client.get(DASHBOARD).data
        assert data["counts"] == {"pending": 1, "active": 1, "completed": 1, "certificates": 1}
        assert {e["course"]["slug"] for e in data["current"]} == {"dtp", "ccc"}
        assert data["certificates"][0]["certificate_code"] == "AA-2026-000099"
        assert [a["title"] for a in data["upcoming"]] == ["Holiday"]
        assert data["current"][0]["course"]["total_fee"] in {4800, 3600}


class TestProfile:
    def test_read(self, client, student):
        data = client.get(PROFILE).data
        assert data["code"] == student.code
        assert data["email"] == "aarav@example.in"
        assert data["name"] == "AARAV MEHTA"
        assert data["photo"] is None
        assert len(data["qualifications"]) == 4

    def test_update_contact_details_and_normalise(self, client):
        res = client.patch(
            PROFILE,
            {"mobile": "+91 99580 11274", "city": "  Unnao ", "gender": "Male"},
            format="json",
        )
        assert res.status_code == 200, res.data
        assert (res.data["mobile"], res.data["city"], res.data["gender"]) == (
            "9958011274",
            "Unnao",
            "Male",
        )

    def test_identity_fields_are_read_only(self, client, student):
        client.patch(
            PROFILE,
            {"name": "Someone Else", "dob": "1990-01-01", "status": "Graduated"},
            format="json",
        )
        student.refresh_from_db()
        assert (student.name, str(student.dob), student.status) == (
            "AARAV MEHTA",
            "2004-03-14",
            "Pending",
        )

    @pytest.mark.parametrize(
        "changes, field",
        [
            ({"pincode": "12"}, "pincode"),
            ({"mobile": "123"}, "mobile"),
            ({"qualifications": blank_qualifications()}, "qualifications"),
            ({"employment": "Astronaut"}, "employment"),
        ],
    )
    def test_validation(self, client, changes, field):
        res = client.patch(PROFILE, changes, format="json")
        assert res.status_code == 400 and field in res.data["errors"]

    def test_photo_upload_replace_and_remove(self, client, student):
        def png():
            buf = io.BytesIO()
            Image.new("RGB", (1000, 1000), (200, 120, 40)).save(buf, format="PNG")
            return SimpleUploadedFile("me.png", buf.getvalue(), content_type="image/png")

        res = client.patch(PROFILE, {"photo": png()}, format="multipart")
        assert res.status_code == 200 and res.data["photo"].startswith("http")
        student.refresh_from_db()
        first = student.photo.path

        client.patch(PROFILE, {"photo": png()}, format="multipart")
        student.refresh_from_db()
        assert student.photo.path != first
        assert not __import__("os").path.exists(first)  # the old file was removed

        res = client.patch(PROFILE, {"photo": None}, format="json")
        assert res.data["photo"] is None


class TestMyEnrollments:
    def test_list_and_filter(self, client, student):
        Enrollment.objects.create(student=student, course=course("dtp"))
        Enrollment.objects.create(student=student, course=course("ccc"), status="Active")
        assert len(client.get(ENROLLMENTS).data) == 2
        active = client.get(ENROLLMENTS, {"status": "Active"}).data
        assert [e["course"]["slug"] for e in active] == ["ccc"]
        assert client.get(ENROLLMENTS, {"status": "Nope"}).status_code == 400

    def test_apply(self, client, student):
        res = client.post(ENROLLMENTS, {"course": "dwd", "accept_no_refund": True}, format="json")
        assert res.status_code == 201
        assert res.data["status"] == "Pending" and res.data["course"]["slug"] == "dwd"
        assert student.enrollments.count() == 1

    def test_applying_twice_is_409(self, client):
        body = {"course": "dwd", "accept_no_refund": True}
        client.post(ENROLLMENTS, body, format="json")
        res = client.post(ENROLLMENTS, body, format="json")
        assert res.status_code == 409
        assert res.data["code"] == "already_enrolled"

    def test_can_reapply_after_cancellation(self, client, student):
        Enrollment.objects.create(student=student, course=course("dwd"), status="Cancelled")
        res = client.post(ENROLLMENTS, {"course": "dwd", "accept_no_refund": True}, format="json")
        assert res.status_code == 201

    def test_rules(self, client):
        Course.objects.filter(slug="pgctt").update(status="Draft")
        bad = client.post(ENROLLMENTS, {"course": "pgctt", "accept_no_refund": True}, format="json")
        assert "course" in bad.data["errors"]
        refused = client.post(
            ENROLLMENTS, {"course": "dwd", "accept_no_refund": False}, format="json"
        )
        assert "accept_no_refund" in refused.data["errors"]

    def test_registration_closed(self, client):
        s = SiteSettings.load()
        s.allow_registration = False
        s.save()
        res = client.post(ENROLLMENTS, {"course": "dwd", "accept_no_refund": True}, format="json")
        assert res.status_code == 403

    def test_applying_is_throttled_but_reading_is_not(self, client):
        slugs = ["dca-prog", "dca-acc", "dtp", "dwd", "ccc", "pgdca", "pgdwd", "pgctt", "pdm"]
        codes = [
            client.post(
                ENROLLMENTS, {"course": s, "accept_no_refund": True}, format="json"
            ).status_code
            for s in slugs
        ]
        codes += [
            client.post(
                ENROLLMENTS, {"course": "dtp", "accept_no_refund": True}, format="json"
            ).status_code
        ]
        codes += [
            client.post(
                ENROLLMENTS, {"course": "dtp", "accept_no_refund": True}, format="json"
            ).status_code
        ]
        assert codes[:9] == [201] * 9 and codes[9] == 409 and codes[10] == 429
        assert all(client.get(ENROLLMENTS).status_code == 200 for _ in range(12))
