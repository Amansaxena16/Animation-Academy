import io
import json

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from PIL import Image

from common import revalidate as revalidate_module
from conftest import auth_client
from students.models import Enrollment
from students.tests.test_portal import make_student
from website.models import Announcement, ContactMessage, Course, SiteSettings

pytestmark = pytest.mark.django_db

A = "/api/v1/admin"


@pytest.fixture(autouse=True)
def _setup(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    call_command("seed_courses", verbosity=0)


@pytest.fixture
def office(admin_user):
    return auth_client(admin_user)


NEW_COURSE = {
    "name": "DCA — Graphics",
    "kind": "Diploma",
    "category": "Design",
    "level": "Beginner",
    "status": "Draft",
    "duration_label": "6 Months",
    "months": 6,
    "monthly_fee": 900,
    "description": "CorelDraw and Photoshop for print and social media.",
    "syllabus": [{"items": ["CorelDraw", " Photoshop ", ""]}],
}


class TestCourses:
    def test_list_includes_drafts_and_counts(self, office):
        Course.objects.filter(slug="dtp").update(status="Draft")
        make = make_student()
        Enrollment.objects.create(student=make, course=Course.objects.get(slug="dtp"))
        items = {c["slug"]: c for c in office.get(f"{A}/courses/").data}
        assert len(items) == 9
        assert items["dtp"]["status"] == "Draft" and items["dtp"]["enrollment_count"] == 1
        assert [c["slug"] for c in office.get(f"{A}/courses/", {"status": "Draft"}).data] == ["dtp"]

    def test_create_generates_a_slug_and_cleans_the_syllabus(self, office):
        res = office.post(f"{A}/courses/", NEW_COURSE, format="json")
        assert res.status_code == 201, res.data
        assert res.data["slug"] == "dca-graphics"
        assert res.data["syllabus"] == [
            {"title": "", "duration": "", "tools": "", "items": ["CorelDraw", "Photoshop"]}
        ]
        assert res.data["total_fee"] == 5400
        again = office.post(f"{A}/courses/", NEW_COURSE, format="json")
        assert again.data["slug"] == "dca-graphics-2"

    @pytest.mark.parametrize(
        "changes, field",
        [
            ({"syllabus": []}, "syllabus"),
            ({"syllabus": [{"items": ["", " "]}]}, "syllabus"),
            ({"months": 1, "first_month_fee": 1000}, "first_month_fee"),
            ({"slug": "dtp"}, "slug"),
            ({"category": "Cooking"}, "category"),
        ],
    )
    def test_validation(self, office, changes, field):
        res = office.post(f"{A}/courses/", {**NEW_COURSE, **changes}, format="json")
        assert res.status_code == 400 and field in res.data["errors"], res.data

    def test_edit(self, office):
        res = office.patch(
            f"{A}/courses/dtp/", {"monthly_fee": 850, "status": "Draft"}, format="json"
        )
        assert res.data["monthly_fee"] == 850 and res.data["total_fee"] == 5100
        assert office.get("/api/v1/courses/dtp/").status_code == 404  # hidden from the public site

    def test_delete_is_refused_once_someone_applied(self, office):
        Enrollment.objects.create(student=make_student(), course=Course.objects.get(slug="dtp"))
        res = office.delete(f"{A}/courses/dtp/")
        assert res.status_code == 409 and res.data["code"] == "has_enrollments"
        assert office.delete(f"{A}/courses/ccc/").status_code == 204
        assert not Course.objects.filter(slug="ccc").exists()

    def test_image_upload_and_remove(self, office):
        buf = io.BytesIO()
        Image.new("RGB", (3000, 2000), (10, 99, 168)).save(buf, format="PNG")
        upload = SimpleUploadedFile("art.png", buf.getvalue(), content_type="image/png")
        res = office.post(f"{A}/courses/dtp/image/", {"image": upload}, format="multipart")
        assert res.status_code == 200 and res.data["image"].endswith(".jpg")
        with Image.open(Course.objects.get(slug="dtp").image.path) as img:
            assert img.size[0] <= 1600
        res = office.post(f"{A}/courses/dtp/image/", {"image": None}, format="json")
        assert res.data["image"] is None


class TestAnnouncements:
    def test_crud_and_filter(self, office):
        res = office.post(
            f"{A}/announcements/",
            {
                "title": "Diwali break",
                "text": "Closed 8–12 Nov.",
                "category": "Holiday",
                "date": "2026-11-08",
                "published": False,
            },
            format="json",
        )
        assert res.status_code == 201
        pk = res.data["id"]
        assert office.get(f"{A}/announcements/", {"published": "false"}).data["count"] == 1
        assert office.get("/api/v1/announcements/").data == []  # drafts stay off the website

        office.patch(f"{A}/announcements/{pk}/", {"published": True}, format="json")
        assert len(office.get("/api/v1/announcements/").data) == 1
        assert office.delete(f"{A}/announcements/{pk}/").status_code == 204
        assert not Announcement.objects.exists()


class TestSiteSettings:
    def test_read_and_update(self, office):
        data = office.get(f"{A}/site/").data
        assert data["registration_fee"] == 250 and "director_name" in data
        res = office.patch(
            f"{A}/site/",
            {
                "director_name": "Anil Verma",
                "phones": " 8707447880 ,9336202125,",
                "show_stats": False,
            },
            format="json",
        )
        assert res.status_code == 200
        s = SiteSettings.load()
        assert (s.director_name, s.phones, s.show_stats) == (
            "Anil Verma",
            "8707447880, 9336202125",
            False,
        )

    def test_bad_phone(self, office):
        res = office.patch(f"{A}/site/", {"phones": "8707447880, call us"}, format="json")
        assert res.status_code == 400 and "phones" in res.data["errors"]


class TestContactMessages:
    def test_list_and_mark_handled(self, office):
        m = ContactMessage.objects.create(
            name="Meera", email="m@example.in", message="Which DTP batch?"
        )
        assert office.get(f"{A}/contact-messages/", {"handled": "false"}).data["count"] == 1
        res = office.patch(
            f"{A}/contact-messages/{m.pk}/", {"handled": True, "message": "changed"}, format="json"
        )
        assert res.data["handled"] is True and res.data["message"] == "Which DTP batch?"
        assert office.get(f"{A}/contact-messages/", {"handled": "false"}).data["count"] == 0


class TestWebsiteRefresh:
    @pytest.fixture
    def calls(self, settings, monkeypatch):
        settings.FRONTEND_REVALIDATE_URL = "http://frontend/api/revalidate"
        settings.REVALIDATE_SECRET = "s3cret"
        sent = []

        class InlineThread:  # run the request straight away instead of in the background
            def __init__(self, target, args, daemon):
                self.target, self.args = target, args

            def start(self):
                self.target(*self.args)

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *a):
                return False

        def fake_urlopen(request, timeout):
            sent.append(
                (
                    request.full_url,
                    request.headers.get("X-revalidate-secret"),
                    json.loads(request.data),
                )
            )
            return FakeResponse()

        monkeypatch.setattr(revalidate_module.threading, "Thread", InlineThread)
        monkeypatch.setattr(revalidate_module.urllib.request, "urlopen", fake_urlopen)
        return sent

    def test_edits_refresh_the_matching_tag_after_commit(
        self, office, calls, django_capture_on_commit_callbacks
    ):
        SiteSettings.load()  # exists in real use; creating it here would add a refresh of its own
        calls.clear()
        with django_capture_on_commit_callbacks(execute=True):
            office.patch(f"{A}/courses/dtp/", {"monthly_fee": 820}, format="json")
        with django_capture_on_commit_callbacks(execute=True):
            office.patch(f"{A}/site/", {"about": "New text"}, format="json")
        assert calls == [
            ("http://frontend/api/revalidate", "s3cret", {"tags": ["courses"]}),
            ("http://frontend/api/revalidate", "s3cret", {"tags": ["site"]}),
        ]

    def test_off_when_not_configured(
        self, office, settings, calls, django_capture_on_commit_callbacks
    ):
        settings.FRONTEND_REVALIDATE_URL = ""
        with django_capture_on_commit_callbacks(execute=True):
            office.patch(f"{A}/courses/dtp/", {"monthly_fee": 820}, format="json")
        assert calls == []
