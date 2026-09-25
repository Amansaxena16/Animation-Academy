"""Public, office-edited content: courses, site settings, announcements and contact messages."""

from django.core.exceptions import ValidationError
from django.core.validators import MinLengthValidator, MinValueValidator
from django.db import models


def validate_syllabus(value):
    """A list of groups: [{"title", "duration", "tools", "items": [str, ...]}, ...].

    Ordinary courses have one group with an empty title; the Professional Diploma in
    Multimedia has one group per semester.
    """
    if not isinstance(value, list) or not value:
        raise ValidationError("The syllabus must be a non-empty list of groups.")
    for i, group in enumerate(value, start=1):
        if not isinstance(group, dict):
            raise ValidationError(f"Group {i} must be an object.")
        unknown = set(group) - {"title", "duration", "tools", "items"}
        if unknown:
            raise ValidationError(f"Group {i} has unknown keys: {', '.join(sorted(unknown))}.")
        for key in ("title", "duration", "tools"):
            if not isinstance(group.get(key, ""), str):
                raise ValidationError(f"Group {i}: {key} must be text.")
        items = group.get("items")
        if not isinstance(items, list) or not items:
            raise ValidationError(f"Group {i} needs at least one topic in items.")
        if not all(isinstance(item, str) and item.strip() for item in items):
            raise ValidationError(f"Group {i}: every topic must be non-empty text.")


class Course(models.Model):
    class Kind(models.TextChoices):
        DIPLOMA = "Diploma"
        CERTIFICATE = "Certificate"
        PG_DIPLOMA = "PG Diploma"
        PROFESSIONAL_DIPLOMA = "Professional Diploma"

    class Category(models.TextChoices):
        PROGRAMMING = "Programming"
        ACCOUNTING = "Accounting"
        DESIGN = "Design"
        WEB_DESIGNING = "Web Designing"
        COMPUTER_BASICS = "Computer Basics"
        MULTIMEDIA = "Multimedia"

    class Level(models.TextChoices):
        BEGINNER = "Beginner"
        INTERMEDIATE = "Intermediate"
        ADVANCED = "Advanced"

    class Status(models.TextChoices):
        PUBLISHED = "Published"
        DRAFT = "Draft"

    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=120, help_text="Exactly as the prospectus prints it.")
    kind = models.CharField(max_length=30, choices=Kind.choices)
    category = models.CharField(max_length=30, choices=Category.choices)
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BEGINNER)

    duration_label = models.CharField(max_length=30, help_text='As printed: "6 Months", "1 Year".')
    months = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    monthly_fee = models.PositiveIntegerField(help_text="Rupees per month.")
    first_month_fee = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Only if the first month costs more (PDM: ₹4,000, then ₹3,000 × 17).",
    )

    description = models.TextField(help_text="One or two sentences for course cards.")
    syllabus = models.JSONField(validators=[validate_syllabus])
    image = models.ImageField(upload_to="courses/", blank=True)

    featured = models.BooleanField(default=False, help_text="Show on the home page.")
    tag = models.CharField(max_length=30, blank=True, help_text='"Most enrolled", "Flagship"…')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    schedule = models.CharField(max_length=80, blank=True, help_text='"Mon–Fri, 10–11 AM"')
    next_batch_start = models.CharField(
        max_length=40, blank=True, help_text='Text, so "Every Monday" works too.'
    )
    order = models.PositiveSmallIntegerField(default=0, help_text="Lower comes first.")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "name"]
        indexes = [models.Index(fields=["status", "order"])]

    def __str__(self):
        return self.name

    def clean(self):
        if self.first_month_fee is not None and self.months < 2:
            raise ValidationError(
                {"first_month_fee": "A different first-month fee needs a course of 2+ months."}
            )

    @property
    def total_fee(self):
        """Every month's fee added up (the one-time registration fee is separate)."""
        if self.first_month_fee is not None:
            return self.first_month_fee + self.monthly_fee * (self.months - 1)
        return self.monthly_fee * self.months


class SiteSettings(models.Model):
    """One row (pk=1) of institute details and homepage text the office can edit."""

    STAT_LABELS = [
        "Students trained",
        "Courses offered",
        "Years of teaching",
        "Certificates issued",
    ]

    hero_headline = models.CharField(max_length=80, default="Learn the tools. Build the work.")
    hero_sub = models.TextField(
        default=(
            "An ISO 9001:2000 certified multimedia institute in Nehru Nagar, Kanpur — computer, "
            "accounting, design and animation courses taught on real machines, from typing to an "
            "eighteen-month multimedia diploma."
        )
    )
    stat_students = models.CharField("Students trained", max_length=12, default="500+")
    stat_courses = models.CharField("Courses offered", max_length=12, default="9")
    stat_years = models.CharField("Years of teaching", max_length=12, default="9+")
    stat_certificates = models.CharField("Certificates issued", max_length=12, default="1000+")
    show_stats = models.BooleanField(
        default=True, help_text="Show the numbers band on the home page."
    )
    about = models.TextField(
        default=(
            "Animation Academy is run by IOCSGT Computer Education at 107/235 Nehru Nagar, Kanpur. "
            "Small batches, a machine for every student, and certificates carrying a verifiable ID."
        )
    )

    phones = models.CharField(
        max_length=80, default="8707447880, 9336202125", help_text="Comma-separated, first is main."
    )
    email = models.EmailField(default="info@animationacademy.in")
    address = models.CharField(
        max_length=200, default="107/235 Nehru Nagar, Kanpur, Uttar Pradesh 208012"
    )
    registration_fee = models.PositiveIntegerField(default=250, help_text="One-time, in rupees.")
    director_name = models.CharField(
        max_length=80, blank=True, help_text="Signs the certificates (Phase 7)."
    )

    allow_registration = models.BooleanField(
        default=True, help_text="Off: the admission form says registration is closed."
    )
    maintenance_mode = models.BooleanField(
        default=False, help_text="On: the public site shows a maintenance page."
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "site settings"
        verbose_name_plural = "site settings"

    def __str__(self):
        return "Site settings"

    def save(self, *args, **kwargs):
        self.pk = 1  # there is only ever one row
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Site settings can't be deleted.")

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    @property
    def phone_list(self):
        return [p.strip() for p in self.phones.split(",") if p.strip()]

    @property
    def stats(self):
        values = [self.stat_students, self.stat_courses, self.stat_years, self.stat_certificates]
        return [
            {"value": v, "label": label} for v, label in zip(values, self.STAT_LABELS, strict=True)
        ]


class Announcement(models.Model):
    class Category(models.TextChoices):
        GENERAL = "General"
        HOLIDAY = "Holiday"
        COURSE_UPDATE = "Course Update"
        EXAM = "Exam"
        EVENT = "Event"
        IMPORTANT = "Important Notice"

    title = models.CharField(max_length=120)
    text = models.CharField(max_length=300, help_text="One or two sentences.")
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.GENERAL)
    date = models.DateField(help_text="The day it's about (holiday, exam, event) or posted.")
    published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        indexes = [models.Index(fields=["published", "date"])]

    def __str__(self):
        return self.title


class ContactMessage(models.Model):
    name = models.CharField(max_length=80, validators=[MinLengthValidator(2)])
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    message = models.TextField(max_length=2000)
    handled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["handled", "-created_at"]

    def __str__(self):
        return f"{self.name} <{self.email}>"
