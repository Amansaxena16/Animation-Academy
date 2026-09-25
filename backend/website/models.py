"""Public, office-edited content: the course catalogue (site settings, announcements and
contact messages arrive in Phase 4)."""

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
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
