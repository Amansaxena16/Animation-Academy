"""Every form field, probed with good, bad and borderline values through the API (the browser's
checks can be bypassed, so the API is the real gate). Each case states the correct outcome:
ok (saved) or err (400 with a message on that field). Nothing may ever answer 500."""

import datetime
import io
import json
import zlib

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.utils import timezone
from PIL import Image

from conftest import auth_client
from students.models import Enrollment, blank_qualifications
from students.tests.test_portal import make_student
from website.models import Course

pytestmark = pytest.mark.django_db

A = "/api/v1/admin"
OK, ERR = "ok", "err"


@pytest.fixture(autouse=True)
def _setup(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    call_command("seed_courses", verbosity=0)


@pytest.fixture
def office(admin_user):
    return auth_client(admin_user)


def years_ago(n, days=0):
    today = timezone.localdate()
    return (today.replace(year=today.year - n) - datetime.timedelta(days=days)).isoformat()


def quals(**high_school):
    rows = blank_qualifications()
    rows[0].update(year="2021", board="UP Board", subject="Science", percentage="78")
    rows[0].update(high_school)
    return rows


def check(res, expect, field):
    """ok → 2xx; err → 400 naming the field. Never 500."""
    assert res.status_code < 500, f"server error {res.status_code}"
    if expect == OK:
        assert 200 <= res.status_code < 300, res.data
    else:
        assert res.status_code == 400, f"accepted ({res.status_code})"
        if field:
            errors = res.data.get("errors", {})
            assert field in errors or "non_field_errors" in errors, errors


# --- Admin: add a student (the office's admission form) ----------------------------------------

STUDENT = {
    "email": "riya@example.test",
    "name": "Riya Sharma",
    "father_name": "Mohan Sharma",
    "dob": "2005-06-15",
    "gender": "",
    "mobile": "9876543210",
    "phone": "",
    "address": "12, Nehru Nagar",
    "pincode": "208012",
    "city": "Kanpur",
    "employment": "Student",
    "qualifications": quals(),
}

STUDENT_CASES = [
    # name: printed on the certificate, letters only
    ("name", "riya sharma", OK),
    ("name", "Om Prakash", OK),
    ("name", "Mary D'Souza", OK),
    ("name", "Ram-Kumar Verma", OK),
    ("name", "R", ERR),
    ("name", "   ", ERR),
    ("name", "", ERR),
    ("name", "Riya 123", ERR),
    ("name", "<script>alert(1)</script>", ERR),
    ("name", "A" * 101, ERR),
    # father's name
    ("father_name", "Mohan Lal", OK),
    ("father_name", "Mo", ERR),
    ("father_name", "", ERR),
    ("father_name", "12345", ERR),
    ("father_name", "<b>Mohan</b>", ERR),
    ("father_name", "M" * 101, ERR),
    # date of birth: 10 to 80 years old
    ("dob", years_ago(10), OK),
    ("dob", years_ago(80), OK),
    ("dob", years_ago(10, days=-1), ERR),
    ("dob", years_ago(81), ERR),
    ("dob", "2031-01-01", ERR),
    ("dob", "2005-02-30", ERR),
    ("dob", "15/06/2005", ERR),
    ("dob", "", ERR),
    # gender: optional choice
    ("gender", "Female", OK),
    ("gender", "Unknown", ERR),
    # mobile: Indian mobile, 10 digits starting 6-9
    ("mobile", "+91 98765 43210", OK),
    ("mobile", "09876543210", OK),
    ("mobile", "919876543210", OK),
    ("mobile", "98765-43210", OK),
    ("mobile", "1234567890", ERR),
    ("mobile", "98765", ERR),
    ("mobile", "98765432101", ERR),
    ("mobile", "abcdefghij", ERR),
    ("mobile", "", ERR),
    # phone: optional landline
    ("phone", "0512-2345678", OK),
    ("phone", "123", ERR),
    ("phone", "abc", ERR),
    ("phone", "1234567890123", ERR),
    # address
    ("address", "C-42", ERR),
    ("address", "", ERR),
    ("address", "A" * 251, ERR),
    # pincode: 6 digits, not starting with 0
    ("pincode", " 208012 ", OK),
    ("pincode", "20801", ERR),
    ("pincode", "2080122", ERR),
    ("pincode", "008012", ERR),
    ("pincode", "abcdef", ERR),
    ("pincode", "", ERR),
    # city
    ("city", "", OK),
    ("city", "12345", ERR),
    ("city", "C" * 61, ERR),
    # employment: one of the form's options
    ("employment", "Self-employed", OK),
    ("employment", "Retired", ERR),
    ("employment", "", ERR),
    # login email
    ("email", "RIYA@Example.TEST", OK),
    ("email", "not-an-email", ERR),
    ("email", "", ERR),
    ("email", "a" * 250 + "@example.test", ERR),
    # course (optional)
    ("course", "dtp", OK),
    ("course", "no-such-course", ERR),
]


@pytest.mark.parametrize(("field", "value", "expect"), STUDENT_CASES)
def test_admin_add_student(office, field, value, expect):
    res = office.post(f"{A}/students/", {**STUDENT, field: value}, format="json")
    check(res, expect, field)


QUAL_CASES = [
    ({"year": "1950"}, OK),
    ({"year": "1949"}, ERR),
    ({"year": str(timezone.localdate().year + 1)}, ERR),
    ({"year": "20a1"}, ERR),
    ({"year": ""}, ERR),
    ({"board": ""}, ERR),
    ({"percentage": "85%"}, OK),
    ({"percentage": "85.5"}, OK),
    ({"percentage": "100"}, OK),
    ({"percentage": "101"}, ERR),
    ({"percentage": "-1"}, ERR),
    ({"percentage": "abc"}, ERR),
    ({"percentage": "nan"}, ERR),
    ({"board": "B" * 101}, ERR),
    ({"subject": "S" * 101}, ERR),
]


@pytest.mark.parametrize(("change", "expect"), QUAL_CASES)
def test_admin_add_student_qualifications(office, change, expect):
    res = office.post(
        f"{A}/students/", {**STUDENT, "qualifications": quals(**change)}, format="json"
    )
    check(res, expect, "qualifications")


@pytest.mark.parametrize(
    "value",
    [[], quals()[:3], "not json", [{"exam": "High School"}] * 4, {"rows": 4}],
    ids=["empty", "3-rows", "bad-json", "missing-keys", "object"],
)
def test_admin_add_student_malformed_qualifications(office, value):
    res = office.post(f"{A}/students/", {**STUDENT, "qualifications": value}, format="json")
    check(res, ERR, "qualifications")


def test_admin_add_student_duplicate_email_any_case(office):
    assert office.post(f"{A}/students/", STUDENT, format="json").status_code == 201
    again = {**STUDENT, "email": "RIYA@example.test", "mobile": "9876500000"}
    check(office.post(f"{A}/students/", again, format="json"), ERR, "email")


# --- Student: own profile and password ---------------------------------------------------------

PROFILE_CASES = [
    ("mobile", "98765 43210", OK),
    ("mobile", "12345", ERR),
    ("pincode", "208 012", ERR),
    ("pincode", "208012", OK),
    ("address", "ab", ERR),
    ("state", "", OK),
    ("state", "S" * 61, ERR),
    ("country", "C" * 61, ERR),
    ("employment", "Retired", ERR),
    ("gender", "X", ERR),
]


@pytest.mark.parametrize(("field", "value", "expect"), PROFILE_CASES)
def test_student_profile(field, value, expect):
    student = make_student()
    res = auth_client(student.user).patch("/api/v1/me/profile/", {field: value}, format="json")
    check(res, expect, field)


def test_student_cannot_change_identity_fields():
    student = make_student()
    res = auth_client(student.user).patch(
        "/api/v1/me/profile/", {"name": "HACKER", "dob": "2000-01-01"}, format="json"
    )
    assert res.status_code == 200
    student.refresh_from_db()
    assert student.name.upper() == "AARAV MEHTA" and str(student.dob) == "2004-03-14"


PASSWORD_CASES = [
    ("Kanpur@2026!", OK),
    ("short1!", ERR),  # under 8
    ("password123", ERR),  # common
    ("1234567890", ERR),  # numeric only
    ("aaravmehta1", ERR),  # like the name
    ("x", ERR),  # the current password is "x" in make_student; also too short
]


@pytest.mark.parametrize(("new", "expect"), PASSWORD_CASES)
def test_change_password(new, expect):
    student = make_student()
    res = auth_client(student.user).post(
        "/api/v1/auth/change-password/",
        {"old_password": "x", "new_password": new},
        format="json",
    )
    check(res, expect, "new_password")


def test_change_password_wrong_current():
    student = make_student()
    res = auth_client(student.user).post(
        "/api/v1/auth/change-password/",
        {"old_password": "wrong", "new_password": "Kanpur@2026!"},
        format="json",
    )
    check(res, ERR, "old_password")


# --- Student: request another course -----------------------------------------------------------


@pytest.mark.parametrize(
    ("body", "expect"),
    [
        ({"course": "ccc", "accept_no_refund": True}, OK),
        ({"course": "ccc", "accept_no_refund": False}, ERR),
        ({"course": "ccc"}, ERR),
        ({"course": "nope", "accept_no_refund": True}, ERR),
        ({"course": "", "accept_no_refund": True}, ERR),
    ],
)
def test_student_apply(body, expect):
    student = make_student()
    res = auth_client(student.user).post("/api/v1/me/enrollments/", body, format="json")
    check(res, expect, None)


def test_student_apply_draft_course_rejected():
    Course.objects.filter(slug="ccc").update(status=Course.Status.DRAFT)
    student = make_student()
    res = auth_client(student.user).post(
        "/api/v1/me/enrollments/", {"course": "ccc", "accept_no_refund": True}, format="json"
    )
    check(res, ERR, "course")


# --- Public: message form, login, verify -------------------------------------------------------

CONTACT = {"name": "Meera Nair", "phone": "9015177420"}
CONTACT_CASES = [
    ("name", "Me", OK),
    ("name", "M", ERR),
    ("name", "   ", ERR),
    ("name", "N" * 81, ERR),
    ("name", "<script>alert(1)</script>", OK),  # stored as text, shown escaped
    ("phone", "+91 90151 77420", OK),
    ("phone", "090151 77420", OK),
    ("phone", "5015177420", ERR),
    ("phone", "901517742", ERR),
    ("phone", "90151774200", ERR),
    ("phone", "abcdefghij", ERR),
    ("phone", "", ERR),
    ("course", "dtp", OK),
    ("course", None, OK),
    ("course", "DTP", ERR),
    ("course", "no-such", ERR),
    ("message", "", OK),
    ("message", "M" * 2000, OK),
    ("message", "M" * 2001, ERR),
]


@pytest.mark.parametrize(("field", "value", "expect"), CONTACT_CASES)
def test_contact_form(api, field, value, expect):
    res = api.post("/api/v1/contact/", {**CONTACT, field: value}, format="json")
    check(res, expect, field)


@pytest.mark.parametrize(
    ("email", "password", "status"),
    [
        ("AARAV@example.in", "x", 200),  # any case
        ("  aarav@example.in  ", "x", 200),
        ("aarav@example.in", "X", 401),
        ("nobody@example.in", "x", 401),
        ("' OR 1=1 --", "x", 401),
        ("", "x", 400),
        ("aarav@example.in", "", 400),
    ],
)
def test_login(api, email, password, status):
    make_student(email="aarav@example.in")
    res = api.post("/api/v1/auth/login/", {"email": email, "password": password}, format="json")
    assert res.status_code == status


@pytest.mark.parametrize(
    "code", ["AA-2026-999999", "aa-2026-999999", "../../etc/passwd", "' OR 1=1 --", "A" * 500]
)
def test_verify_unknown_codes_are_404(api, code):
    assert api.get(f"/api/v1/verify/{code}/").status_code == 404


# --- Admin: courses ----------------------------------------------------------------------------

COURSE = {
    "name": "Test Course",
    "kind": "Certificate",
    "category": "Design",
    "level": "Beginner",
    "status": "Draft",
    "duration_label": "3 Months",
    "months": 3,
    "monthly_fee": 800,
    "description": "A short description.",
    "syllabus": [{"items": ["Topic one", "Topic two"]}],
}

COURSE_CASES = [
    ("name", "", ERR),
    ("name", "N" * 121, ERR),
    ("slug", "my-course", OK),
    ("slug", "My Course", ERR),
    ("slug", "dtp", ERR),  # taken
    ("slug", "s" * 51, ERR),
    ("kind", "Degree", ERR),
    ("category", "Cooking", ERR),
    ("level", "Expert", ERR),
    ("status", "Live", ERR),
    ("duration_label", "", ERR),
    ("duration_label", "D" * 31, ERR),
    ("months", 0, ERR),
    ("months", -1, ERR),
    ("months", "abc", ERR),
    ("months", 120, OK),
    ("months", 32768, ERR),
    ("monthly_fee", 0, ERR),  # a course can't be free by mistake
    ("monthly_fee", -5, ERR),
    ("monthly_fee", "abc", ERR),
    ("monthly_fee", 2**31, ERR),
    ("first_month_fee", 4000, OK),
    ("first_month_fee", -1, ERR),
    ("description", "", ERR),
    ("syllabus", [], ERR),
    ("syllabus", [{"items": []}], ERR),
    ("syllabus", [{"items": ["   "]}], ERR),
    ("syllabus", "Topic one", ERR),
    ("syllabus", [{"items": ["T" * 201]}], ERR),
    ("tag", "T" * 31, ERR),
    ("schedule", "S" * 81, ERR),
    ("next_batch_start", "N" * 41, ERR),
    ("order", -1, ERR),
    ("featured", "maybe", ERR),
]


@pytest.mark.parametrize(("field", "value", "expect"), COURSE_CASES)
def test_admin_course(office, field, value, expect):
    res = office.post(f"{A}/courses/", {**COURSE, field: value}, format="json")
    check(res, expect, field)


def test_admin_course_first_month_fee_needs_two_months(office):
    body = {**COURSE, "months": 1, "first_month_fee": 900}
    check(office.post(f"{A}/courses/", body, format="json"), ERR, "first_month_fee")


# --- Admin: announcements, site settings, enrollments ------------------------------------------

NOTICE = {
    "title": "Holiday",
    "text": "Closed on Friday.",
    "category": "General",
    "date": "2026-10-02",
}


@pytest.mark.parametrize(
    ("field", "value", "expect"),
    [
        ("title", "", ERR),
        ("title", "T" * 121, ERR),
        ("text", "", ERR),
        ("text", "T" * 301, ERR),
        ("category", "Party", ERR),
        ("date", "2026-13-01", ERR),
        ("date", "", ERR),
        ("published", "maybe", ERR),
    ],
)
def test_admin_announcement(office, field, value, expect):
    res = office.post(f"{A}/announcements/", {**NOTICE, field: value}, format="json")
    check(res, expect, field)


SITE_CASES = [
    ("phones", "8707447880, 9336202125", OK),
    ("phones", "8707447880", OK),
    ("phones", "", ERR),  # the website's Call buttons need a number
    ("phones", "abc", ERR),
    ("phones", "12345", ERR),
    ("email", "office@example.in", OK),
    ("email", "not-an-email", ERR),
    ("email", "", ERR),
    ("address", "", ERR),
    ("registration_fee", 0, OK),
    ("registration_fee", -1, ERR),
    ("registration_fee", "abc", ERR),
    ("hero_headline", "", ERR),
    ("hero_headline", "H" * 81, ERR),
    ("stat_students", "S" * 13, ERR),
    ("director_name", "D" * 81, ERR),
    ("allow_registration", "maybe", ERR),
]


@pytest.mark.parametrize(("field", "value", "expect"), SITE_CASES)
def test_admin_site_settings(office, field, value, expect):
    check(office.patch(f"{A}/site/", {field: value}, format="json"), expect, field)


def test_admin_cancel_reason_length(office):
    enrollment = Enrollment.objects.create(
        student=make_student(), course=Course.objects.get(slug="dtp")
    )
    url = f"{A}/enrollments/{enrollment.code}/reject/"
    check(office.post(url, {"reason": "R" * 251}, format="json"), ERR, "reason")
    check(office.post(url, {"reason": "Moved to Lucknow"}, format="json"), OK, None)


# --- Uploads: student photo and course image ---------------------------------------------------


def image_file(fmt="PNG", size=(40, 40), name="p.png", content_type="image/png"):
    buf = io.BytesIO()
    Image.new("RGB", size, "orange").save(buf, fmt)
    return SimpleUploadedFile(name, buf.getvalue(), content_type=content_type)


def png_bomb(width=20000, height=20000):
    """A small file that claims a huge image (width × height pixels): a decompression bomb."""

    def chunk(kind, data):
        body = kind + data
        return len(data).to_bytes(4, "big") + body + zlib.crc32(body).to_bytes(4, "big")

    header = width.to_bytes(4, "big") + height.to_bytes(4, "big") + bytes([8, 0, 0, 0, 0])
    packer, row, parts = zlib.compressobj(9), b"\0" * (width + 1), []
    for _ in range(height):
        parts.append(packer.compress(row))
    parts.append(packer.flush())
    data = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", b"".join(parts))
        + chunk(b"IEND", b"")
    )
    return SimpleUploadedFile("bomb.png", data, content_type="image/png")


UPLOAD_CASES = [
    ("png", lambda: image_file(), OK),
    ("jpeg", lambda: image_file("JPEG", name="p.jpg", content_type="image/jpeg"), OK),
    ("gif", lambda: image_file("GIF", name="p.gif", content_type="image/gif"), ERR),
    (
        "svg",
        lambda: SimpleUploadedFile(
            "p.svg", b"<svg onload='alert(1)'/>", content_type="image/svg+xml"
        ),
        ERR,
    ),
    ("text", lambda: SimpleUploadedFile("p.png", b"hello", content_type="image/png"), ERR),
    ("too-big", lambda: SimpleUploadedFile("p.png", b"\0" * (6 * 1024 * 1024)), ERR),
    ("bomb", png_bomb, ERR),
]


@pytest.mark.parametrize(("kind", "make", "expect"), UPLOAD_CASES, ids=[c[0] for c in UPLOAD_CASES])
def test_student_photo_upload(office, kind, make, expect):
    student = make_student()
    res = office.patch(f"{A}/students/{student.code}/", {"photo": make()}, format="multipart")
    check(res, expect, "photo")


@pytest.mark.parametrize(("kind", "make", "expect"), UPLOAD_CASES, ids=[c[0] for c in UPLOAD_CASES])
def test_course_image_upload(office, kind, make, expect):
    res = office.post(f"{A}/courses/dtp/image/", {"image": make()}, format="multipart")
    check(res, expect, "image")


def test_json_body_that_is_not_an_object(office, api):
    """Odd request bodies are a 400, not a crash."""
    for client, url in [(api, "/api/v1/contact/"), (office, f"{A}/students/")]:
        res = client.post(url, json.dumps([1, 2, 3]), content_type="application/json")
        assert res.status_code == 400
        res = client.post(url, "{not json", content_type="application/json")
        assert res.status_code == 400
