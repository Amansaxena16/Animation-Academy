import copy
import json

import pytest
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import IntegrityError, transaction

from accounts.models import User
from students.models import Enrollment, Student, blank_qualifications, validate_qualifications
from students.serializers import EducationStep, PersonalStep
from website.models import Course

pytestmark = pytest.mark.django_db

ADMIT = "/api/v1/admissions/"
CHECK = "/api/v1/admissions/validate/"


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


class TestPublicAdmissionIsClosed:
    """Admissions are made by the office in the admin console; the website takes none."""

    @pytest.mark.parametrize("url", [ADMIT, CHECK])
    def test_public_admission_endpoints_are_gone(self, api, url):
        res = api.post(url, payload(), format="json")
        assert res.status_code == 404
        assert not User.objects.exists()
        assert not Student.objects.exists()


def personal(**changes):
    return {k: v for k, v in payload(**changes).items() if k in PersonalStep().fields}


class TestSharedValidation:
    """The paper-form rules the console's student form and the student profile both use."""

    def test_valid_details_are_normalised(self):
        s = PersonalStep(data=personal())
        assert s.is_valid(), s.errors
        assert (s.validated_data["name"], s.validated_data["father_name"]) == (
            "NISHA BHATT",
            "GIRISH BHATT",
        )
        assert s.validated_data["mobile"] == "8826291458"

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
        ],
    )
    def test_personal_details(self, changes, field):
        s = PersonalStep(data=personal(**changes))
        assert not s.is_valid()
        assert field in s.errors, s.errors

    def test_high_school_row_is_required(self):
        s = EducationStep(data={"qualifications": blank_qualifications()})
        assert not s.is_valid()
        assert s.errors["qualifications"] == [
            "Fill in at least the High School row — year and board."
        ]

    def test_qualifications_from_a_multipart_form(self):
        s = EducationStep(data={"qualifications": json.dumps(quals())})
        assert s.is_valid(), s.errors
        assert s.validated_data["qualifications"][1]["percentage"] == "71.5"


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
