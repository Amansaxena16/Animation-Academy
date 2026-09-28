import pytest
from django.core.management import call_command
from django.utils import timezone

from conftest import auth_client
from students.models import Enrollment, blank_qualifications
from students.tests.test_portal import course, make_student
from website.models import ContactMessage

pytestmark = pytest.mark.django_db

A = "/api/v1/admin"
LOGIN = "/api/v1/auth/login/"
REFRESH = "/api/v1/auth/refresh/"


@pytest.fixture(autouse=True)
def _setup(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    call_command("seed_courses", verbosity=0)


@pytest.fixture
def office(admin_user):
    return auth_client(admin_user)


@pytest.fixture
def student():
    return make_student()


def enroll(student, slug, status="Pending"):
    return Enrollment.objects.create(student=student, course=course(slug), status=status)


def quals():
    rows = blank_qualifications()
    rows[0].update(year="2019", board="CBSE")
    return rows


GET_URLS = [
    "/dashboard/",
    "/enrollments/",
    "/students/",
    "/certificates/",
    "/courses/",
    "/announcements/",
    "/site/",
    "/contact-messages/",
]


class TestAccess:
    @pytest.mark.parametrize("url", GET_URLS)
    def test_anonymous_401_and_student_403(self, api, student, url):
        assert api.get(A + url).status_code == 401
        assert auth_client(student.user).get(A + url).status_code == 403

    @pytest.mark.parametrize("url", GET_URLS)
    def test_staff_200(self, office, url):
        assert office.get(A + url).status_code == 200


class TestDashboard:
    def test_counts_and_lists(self, office, student):
        enroll(student, "dtp")
        enroll(student, "ccc", "Active")
        inactive = make_student(email="gone@example.in", name="Kabir Singh")
        inactive.status = "Inactive"
        inactive.save()
        ContactMessage.objects.create(
            name="Meera", email="m@example.in", message="Which batch starts next?"
        )
        ContactMessage.objects.create(
            name="Old", email="o@example.in", message="Handled already", handled=True
        )

        data = office.get(f"{A}/dashboard/").data
        assert data["counts"] == {
            "students": 1,
            "pending_admissions": 1,
            "active_enrollments": 1,
            "certificates": 0,
            "admissions_this_month": 2,
            "unhandled_messages": 1,
        }
        assert data["pending"][0]["course"]["slug"] == "dtp"
        assert [m["name"] for m in data["recent_messages"]] == ["Meera"]


class TestEnrollments:
    def test_list_filters(self, office, student):
        other = make_student(email="sneha@example.in", name="Sneha Kapoor")
        first = enroll(student, "dtp")
        enroll(other, "dtp")
        enroll(student, "ccc", "Active")

        pending = office.get(f"{A}/enrollments/", {"status": "Pending"}).data
        assert pending["count"] == 2
        assert pending["results"][0]["code"] == first.code  # oldest first
        assert office.get(f"{A}/enrollments/", {"q": "sneha"}).data["count"] == 1
        assert office.get(f"{A}/enrollments/", {"q": student.code}).data["count"] == 2
        assert office.get(f"{A}/enrollments/", {"course": "ccc"}).data["count"] == 1
        assert office.get(f"{A}/enrollments/", {"status": "Nope"}).status_code == 400

    def test_approve(self, office, student):
        e = enroll(student, "dtp")
        res = office.post(f"{A}/enrollments/{e.code}/approve/")
        assert res.status_code == 200 and res.data["status"] == "Active"
        assert res.data["approved_at"]
        student.refresh_from_db()
        assert student.status == "Active"
        assert office.post(f"{A}/enrollments/{e.code}/approve/").data["code"] == "not_pending"

    def test_reject_keeps_the_reason(self, office, student):
        e = enroll(student, "dtp")
        res = office.post(
            f"{A}/enrollments/{e.code.lower()}/reject/", {"reason": "Batch full"}, format="json"
        )
        assert res.data["status"] == "Cancelled" and res.data["note"] == "Batch full"
        again = office.post(f"{A}/enrollments/{e.code}/reject/", {}, format="json")
        assert again.status_code == 409

    def test_complete_issues_the_certificate(self, office, student, admin_user):
        e = enroll(student, "dtp", "Active")
        res = office.post(f"{A}/enrollments/{e.code}/complete/")
        assert res.status_code == 200
        assert res.data["status"] == "Completed" and res.data["certificate_code"]
        e.refresh_from_db()
        assert e.certificate_issued_by == admin_user

    def test_pending_cannot_be_completed(self, office, student):
        e = enroll(student, "dtp")
        res = office.post(f"{A}/enrollments/{e.code}/complete/")
        assert res.status_code == 409 and res.data["code"] == "not_active"

    def test_enroll_a_student_at_the_office(self, office):
        walk_in = make_student(email="walkin@example.in", name="Dev Malhotra")
        assert walk_in.status == "Pending"
        res = office.post(
            f"{A}/enrollments/", {"student": walk_in.code, "course": "dwd"}, format="json"
        )
        assert res.status_code == 201 and res.data["status"] == "Active"
        walk_in.refresh_from_db()
        assert walk_in.status == "Active"
        dup = office.post(
            f"{A}/enrollments/", {"student": walk_in.code, "course": "dwd"}, format="json"
        )
        assert dup.status_code == 409

    def test_unknown_code_is_404(self, office):
        assert office.get(f"{A}/enrollments/EN-9999/").status_code == 404


class TestStudents:
    NEW = {
        "email": "Arjun.Reddy@Gmail.com",
        "name": "arjun reddy",
        "father_name": "Srinivas Reddy",
        "dob": "2003-07-21",
        "address": "7/12, Kalyanpur",
        "pincode": "208017",
        "mobile": "99103 84521",
        "employment": "Student",
        "qualifications": quals(),
        "course": "dca-prog",
    }

    def test_create_with_temporary_password_and_course(self, office, api):
        res = office.post(f"{A}/students/", self.NEW, format="json")
        assert res.status_code == 201, res.data
        password = res.data["temporary_password"]
        assert len(password) == 12
        created = res.data["student"]
        assert (created["name"], created["status"], created["email"]) == (
            "ARJUN REDDY",
            "Active",
            "arjun.reddy@gmail.com",
        )
        assert [e["status"] for e in created["enrollments"]] == ["Active"]
        login = api.post(
            LOGIN, {"email": "arjun.reddy@gmail.com", "password": password}, format="json"
        )
        assert login.status_code == 200

    def test_create_duplicate_email(self, office, student):
        res = office.post(
            f"{A}/students/", {**self.NEW, "email": student.user.email}, format="json"
        )
        assert res.status_code == 400 and "email" in res.data["errors"]

    def test_list_search(self, office, student):
        make_student(email="sneha@example.in", name="Sneha Kapoor")
        for q, n in [
            ("aarav", 1),
            (student.code.lower(), 1),
            ("98110", 2),
            ("sneha@", 1),
            ("zz", 0),
        ]:
            assert office.get(f"{A}/students/", {"q": q}).data["count"] == n, q

    def test_staff_can_edit_identity_and_email(self, office, student):
        res = office.patch(
            f"{A}/students/{student.code}/",
            {"name": "aarav k mehta", "dob": "2004-03-15", "email": "Aarav.New@Example.in"},
            format="json",
        )
        assert res.status_code == 200, res.data
        student.refresh_from_db()
        student.user.refresh_from_db()
        assert student.name == "AARAV K MEHTA" and str(student.dob) == "2004-03-15"
        assert (student.user.email, student.user.full_name) == (
            "aarav.new@example.in",
            "AARAV K MEHTA",
        )

    def test_email_must_be_unique(self, office, student):
        other = make_student(email="sneha@example.in", name="Sneha Kapoor")
        res = office.patch(
            f"{A}/students/{student.code}/", {"email": other.user.email}, format="json"
        )
        assert res.status_code == 400 and "email" in res.data["errors"]

    def test_deactivate_blocks_login_and_ends_sessions(self, office, api, student):
        student.user.set_password("OldPass#2026")
        student.user.save()
        assert (
            api.post(
                LOGIN, {"email": student.user.email, "password": "OldPass#2026"}, format="json"
            ).status_code
            == 200
        )

        assert office.delete(f"{A}/students/{student.code}/").status_code == 204
        student.refresh_from_db()
        assert student.status == "Inactive" and not student.user.is_active
        assert api.post(REFRESH).status_code == 401  # the existing session is gone
        assert (
            api.post(
                LOGIN, {"email": student.user.email, "password": "OldPass#2026"}, format="json"
            ).status_code
            == 401
        )

        office.patch(f"{A}/students/{student.code}/", {"status": "Active"}, format="json")
        student.user.refresh_from_db()
        assert student.user.is_active

    def test_reset_password(self, office, api, student):
        res = office.post(f"{A}/students/{student.code}/reset-password/")
        password = res.data["temporary_password"]
        assert (
            api.post(
                LOGIN, {"email": student.user.email, "password": password}, format="json"
            ).status_code
            == 200
        )

    def test_detail_lists_enrollments(self, office, student):
        enroll(student, "dtp")
        data = office.get(f"{A}/students/{student.code}/").data
        assert data["enrollments"][0]["course"]["slug"] == "dtp"


class TestCertificates:
    def test_list_filter_and_pdf(self, office, student):
        e = enroll(student, "dtp", "Active")
        office.post(f"{A}/enrollments/{e.code}/complete/")
        e.refresh_from_db()
        year = timezone.localdate().year

        data = office.get(f"{A}/certificates/").data
        assert data["count"] == 1 and data["results"][0]["code"] == e.certificate_code
        assert office.get(f"{A}/certificates/", {"year": year - 1}).data["count"] == 0
        assert office.get(f"{A}/certificates/", {"q": "aarav"}).data["count"] == 1
        assert office.get(f"{A}/certificates/", {"year": "x"}).status_code == 400

        pdf = office.get(f"{A}/certificates/{e.certificate_code}/pdf/")
        assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF")


class TestStudentPhoto:
    """The office adds or replaces a student's photo (multipart PATCH on the record)."""

    @staticmethod
    def png(size=(400, 500)):
        import io

        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image

        buf = io.BytesIO()
        Image.new("RGB", size, "orange").save(buf, "PNG")
        return SimpleUploadedFile("photo.png", buf.getvalue(), content_type="image/png")

    def test_upload_and_replace(self, office, student):
        url = f"{A}/students/{student.code}/"
        res = office.patch(url, {"photo": self.png()}, format="multipart")
        assert res.status_code == 200 and res.data["photo"]
        student.refresh_from_db()
        first = student.photo.name
        res = office.patch(url, {"photo": self.png((300, 300))}, format="multipart")
        assert res.status_code == 200
        student.refresh_from_db()
        assert student.photo.name != first

    def test_not_an_image_is_rejected(self, office, student):
        from django.core.files.uploadedfile import SimpleUploadedFile

        bad = SimpleUploadedFile("x.png", b"not an image", content_type="image/png")
        res = office.patch(f"{A}/students/{student.code}/", {"photo": bad}, format="multipart")
        assert res.status_code == 400 and "photo" in res.data["errors"]
