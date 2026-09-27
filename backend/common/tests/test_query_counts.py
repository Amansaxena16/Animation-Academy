"""List endpoints must not run one query per row (N+1): the number of queries stays the same
whether there are 3 rows or 15."""

import pytest
from django.core.management import call_command
from django.db import connection
from django.test.utils import CaptureQueriesContext

from conftest import auth_client
from students.models import Enrollment
from students.services import issue_certificate
from students.tests.test_portal import make_student
from website.models import Announcement, ContactMessage, Course

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def _seed():
    call_command("seed_courses", verbosity=0)


def add_rows(n, start=0):
    courses = list(Course.objects.all())
    for i in range(start, start + n):
        student = make_student(email=f"s{i}@example.in", name=f"Student {chr(65 + i % 26)} Test")
        enrollment = Enrollment.objects.create(
            student=student, course=courses[i % len(courses)], status="Active"
        )
        issue_certificate(enrollment)
        Enrollment.objects.create(student=student, course=courses[(i + 1) % len(courses)])
        Announcement.objects.create(title=f"Notice {i}", text="t", date="2026-10-01")
        ContactMessage.objects.create(
            name=f"Visitor {i}", email=f"v{i}@example.in", message="A question here"
        )


def queries(client, url):
    with CaptureQueriesContext(connection) as ctx:
        res = client.get(url)
    assert res.status_code == 200, (url, res.status_code)
    return len(ctx.captured_queries)


ADMIN_URLS = [
    "/api/v1/admin/dashboard/",
    "/api/v1/admin/enrollments/",
    "/api/v1/admin/students/",
    "/api/v1/admin/certificates/",
    "/api/v1/admin/courses/",
    "/api/v1/admin/announcements/",
    "/api/v1/admin/contact-messages/",
    "/api/v1/courses/",
    "/api/v1/announcements/",
]


@pytest.mark.parametrize("url", ADMIN_URLS)
def test_admin_and_public_lists_do_not_grow_with_rows(admin_user, url):
    client = auth_client(admin_user)
    add_rows(3)
    small = queries(client, url)
    add_rows(12, start=3)
    assert queries(client, url) == small


@pytest.mark.parametrize(
    "url", ["/api/v1/me/dashboard/", "/api/v1/me/enrollments/", "/api/v1/me/certificates/"]
)
def test_student_lists_do_not_grow_with_rows(url):
    student = make_student(email="me@example.in", name="Aarav Mehta")
    client = auth_client(student.user)
    courses = list(Course.objects.all())

    def enroll(slugs):
        for c in slugs:
            issue_certificate(Enrollment.objects.create(student=student, course=c, status="Active"))

    enroll(courses[:2])
    small = queries(client, url)
    enroll(courses[2:8])
    assert queries(client, url) == small


def test_student_detail_is_bounded(admin_user):
    student = make_student(email="me@example.in", name="Aarav Mehta")
    client = auth_client(admin_user)
    url = f"/api/v1/admin/students/{student.code}/"
    Enrollment.objects.create(student=student, course=Course.objects.get(slug="dtp"))
    small = queries(client, url)
    for c in Course.objects.exclude(slug="dtp")[:5]:
        Enrollment.objects.create(student=student, course=c)
    assert queries(client, url) == small
