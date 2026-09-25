"""Students, their enrollments and certificates (a certificate is fields on Enrollment)."""

import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone

from common import ids

EXAMS = ["High School", "Intermediate", "Graduation", "Post Graduation"]
QUALIFICATION_KEYS = {"exam", "year", "board", "subject", "percentage"}


def validate_qualifications(value):
    """The paper form's table: exactly four rows, in order, each with year, board, subject and
    percentage as text. The High School row needs at least a year and a board."""
    if not isinstance(value, list) or len(value) != len(EXAMS):
        raise ValidationError(
            "Give one row each for High School, Intermediate, Graduation and Post Graduation."
        )
    current_year = timezone.localdate().year
    for row, exam in zip(value, EXAMS, strict=True):
        if not isinstance(row, dict) or set(row) != QUALIFICATION_KEYS or row["exam"] != exam:
            raise ValidationError(f"The {exam} row is malformed.")
        if not all(isinstance(row[k], str) for k in QUALIFICATION_KEYS):
            raise ValidationError(f"The {exam} row must be text.")
        year, pct = row["year"].strip(), row["percentage"].strip()
        if year and (not re.fullmatch(r"\d{4}", year) or not 1950 <= int(year) <= current_year):
            raise ValidationError(f"{exam}: enter the year you passed, e.g. 2020.")
        if pct:
            try:
                number = float(pct.rstrip("%"))
            except ValueError:
                number = -1
            if not 0 <= number <= 100:
                raise ValidationError(f"{exam}: the percentage must be between 0 and 100.")
    high_school = value[0]
    if not high_school["year"].strip() or not high_school["board"].strip():
        raise ValidationError("Fill in at least the High School row — year and board.")


def blank_qualifications():
    return [{"exam": e, "year": "", "board": "", "subject": "", "percentage": ""} for e in EXAMS]


class Student(models.Model):
    class Gender(models.TextChoices):
        MALE = "Male"
        FEMALE = "Female"
        OTHER = "Other"

    class Employment(models.TextChoices):
        STUDENT = "Student"
        UNEMPLOYED = "Unemployed"
        EMPLOYED = "Employed"
        SELF_EMPLOYED = "Self-employed"
        PART_TIME = "Part-time"

    class Status(models.TextChoices):
        PENDING = "Pending"
        ACTIVE = "Active"
        INACTIVE = "Inactive"
        GRADUATED = "Graduated"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student"
    )
    code = models.CharField(max_length=20, unique=True, blank=True, editable=False)

    name = models.CharField(max_length=100, help_text="In capitals, as it prints on certificates.")
    father_name = models.CharField("father's name", max_length=100)
    mobile = models.CharField(max_length=10)
    phone = models.CharField(max_length=15, blank=True)
    dob = models.DateField("date of birth")
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    photo = models.ImageField(upload_to="students/photos/", blank=True)

    address = models.CharField(max_length=250)
    pincode = models.CharField(max_length=6)
    city = models.CharField(max_length=60, default="Kanpur")
    state = models.CharField(max_length=60, default="Uttar Pradesh")
    country = models.CharField(max_length=60, default="India")

    employment = models.CharField(max_length=20, choices=Employment.choices)
    qualifications = models.JSONField(
        default=blank_qualifications, validators=[validate_qualifications]
    )

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    joined_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-joined_at"]
        indexes = [models.Index(fields=["status"])]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def save(self, *args, **kwargs):
        self.name = " ".join(self.name.split()).upper()
        super().save(*args, **kwargs)
        if not self.code:  # the code comes from the pk, so it's set after the first insert
            self.code = ids.student_code(self.pk)
            super().save(update_fields=["code"])


class Enrollment(models.Model):
    class Status(models.TextChoices):
        PENDING = "Pending"
        ACTIVE = "Active"
        COMPLETED = "Completed"
        CANCELLED = "Cancelled"

    code = models.CharField(max_length=20, unique=True, blank=True, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(
        "website.Course", on_delete=models.PROTECT, related_name="enrollments"
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    applied_at = models.DateTimeField(default=timezone.now)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    note = models.CharField(max_length=250, blank=True, help_text="E.g. why it was cancelled.")

    # The certificate, once issued (Phase 7). Blank until then.
    certificate_code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    certificate_issued_on = models.DateField(null=True, blank=True)
    certificate_issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        ordering = ["-applied_at"]
        indexes = [models.Index(fields=["status"])]
        constraints = [
            # One live enrollment per student and course; a cancelled one can be re-applied for.
            models.UniqueConstraint(
                fields=["student", "course"],
                condition=~Q(status="Cancelled"),
                name="one_live_enrollment_per_course",
                violation_error_message="This student is already enrolled in this course.",
            )
        ]

    def __str__(self):
        return f"{self.code} · {self.student.name} · {self.course.name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.code:
            self.code = ids.enrollment_code(self.pk)
            super().save(update_fields=["code"])

    @property
    def owner_user(self):
        return self.student.user
