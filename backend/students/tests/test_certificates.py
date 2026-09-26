import pytest
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import Client
from django.urls import reverse
from django.utils import timezone

from accounts.models import User
from conftest import auth_client
from students.models import Enrollment
from students.pdf import name_size_mm
from students.services import issue_certificate
from students.tests.test_portal import course, make_student
from website.models import SiteSettings

pytestmark = pytest.mark.django_db

MINE = "/api/v1/me/certificates/"


def verify(code):
    return f"/api/v1/verify/{code}/"


@pytest.fixture(autouse=True)
def _setup(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    settings.PUBLIC_SITE_URL = "https://animationacademy.in"
    call_command("seed_courses", verbosity=0)
    s = SiteSettings.load()
    s.director_name = "Anil Verma"
    s.save()


@pytest.fixture
def student():
    return make_student()


@pytest.fixture
def issued(student, admin_user):
    e = Enrollment.objects.create(student=student, course=course("dca-acc"), status="Active")
    return issue_certificate(e, by=admin_user)


class TestIssue:
    def test_completes_and_codes_from_the_year_and_pk(self, issued, admin_user):
        year = timezone.localdate().year
        assert issued.status == "Completed" and issued.completed_at is not None
        assert issued.certificate_code == f"AA-{year}-{issued.pk:06d}"
        assert issued.certificate_issued_on == timezone.localdate()
        assert issued.certificate_issued_by == admin_user

    def test_is_idempotent(self, issued):
        again = issue_certificate(issued)
        assert again.certificate_code == issued.certificate_code

    @pytest.mark.parametrize("status", ["Pending", "Cancelled"])
    def test_only_active_enrollments(self, student, status):
        e = Enrollment.objects.create(student=student, course=course("dtp"), status=status)
        with pytest.raises(ValidationError):
            issue_certificate(e)
        e.refresh_from_db()
        assert e.certificate_code is None


class TestMyCertificates:
    def test_list_and_detail(self, student, issued):
        client = auth_client(student.user)
        items = client.get(MINE).data
        assert [c["code"] for c in items] == [issued.certificate_code]
        assert items[0]["course"]["name"] == "DCA — Accounting"

        detail = client.get(f"{MINE}{issued.certificate_code.lower()}/").data  # any case works
        assert detail == {
            "code": issued.certificate_code,
            "student_name": "AARAV MEHTA",
            "course_name": "DCA — Accounting",
            "course_kind": "Diploma",
            "duration": "6 Months",
            "issued_on": timezone.localdate().isoformat(),
            "director_name": "Anil Verma",
            "verify_url": f"https://animationacademy.in/verify/{issued.certificate_code}",
        }

    def test_pdf(self, student, issued):
        res = auth_client(student.user).get(f"{MINE}{issued.certificate_code}/pdf/")
        assert res.status_code == 200
        assert res["Content-Type"] == "application/pdf"
        assert f'filename="Certificate-{issued.certificate_code}.pdf"' in res["Content-Disposition"]
        assert res.content.startswith(b"%PDF")

    def test_another_students_certificate_is_404(self, issued):
        other = make_student(email="other@example.in", name="Sneha Kapoor")
        client = auth_client(other.user)
        assert client.get(f"{MINE}{issued.certificate_code}/").status_code == 404
        assert client.get(f"{MINE}{issued.certificate_code}/pdf/").status_code == 404
        assert client.get(MINE).data == []

    def test_staff_use_the_admin_pdf_not_me(self, admin_user, issued):
        assert auth_client(admin_user).get(MINE).status_code == 403


class TestVerify:
    def test_valid_certificate_shows_only_public_fields(self, api, issued):
        res = api.get(verify(issued.certificate_code.lower()))
        assert res.status_code == 200
        assert res.data == {
            "valid": True,
            "code": issued.certificate_code,
            "student_name": "AARAV MEHTA",
            "course_name": "DCA — Accounting",
            "duration": "6 Months",
            "issued_on": timezone.localdate().isoformat(),
        }

    def test_unknown_code(self, api):
        res = api.get(verify("AA-2026-999999"))
        assert res.status_code == 404
        assert res.data["valid"] is False
        assert res.data["detail"].startswith("No certificate with this ID")

    def test_a_pending_enrollment_is_not_a_certificate(self, api, student):
        e = Enrollment.objects.create(student=student, course=course("dtp"))
        assert api.get(verify(e.code)).status_code == 404

    def test_works_with_a_stale_token_and_is_throttled(self, api, issued):
        api.credentials(HTTP_AUTHORIZATION="Bearer stale")
        codes = [api.get(verify(issued.certificate_code)).status_code for _ in range(31)]
        assert codes[:30] == [200] * 30 and codes[30] == 429


class TestDjangoAdmin:
    @pytest.fixture
    def staff(self):
        user = User.objects.create_superuser(email="django-admin@animationacademy.in", password="x")
        client = Client()
        client.force_login(user)
        return client

    def test_issue_action(self, staff, student):
        active = Enrollment.objects.create(
            student=student, course=course("dca-acc"), status="Active"
        )
        pending = Enrollment.objects.create(student=student, course=course("dtp"))
        res = staff.post(
            reverse("admin:students_enrollment_changelist"),
            {"action": "issue_certificates", "_selected_action": [active.pk, pending.pk]},
            follow=True,
        )
        text = res.content.decode()
        assert "Issued 1 certificate(s)." in text and f"Skipped {pending.code}" in text
        active.refresh_from_db()
        pending.refresh_from_db()
        assert active.certificate_code and pending.certificate_code is None

    def test_admin_pdf_needs_staff(self, staff, issued):
        url = reverse("admin:students_enrollment_certificate_pdf", args=[issued.pk])
        assert staff.get(url)["Content-Type"] == "application/pdf"
        assert Client().get(url).status_code == 302  # to the admin login


def test_long_names_shrink():
    assert name_size_mm("AARAV MEHTA") == 18.4
    assert name_size_mm("MOHAMMAD FARHAN ALI KHAN SIDDIQUI") < 11
