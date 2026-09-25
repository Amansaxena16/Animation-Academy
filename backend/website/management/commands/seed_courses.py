import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from website.models import Course

FIXTURE = Path(__file__).resolve().parents[2] / "fixtures" / "courses.json"


class Command(BaseCommand):
    help = "Create or update the prospectus courses from website/fixtures/courses.json."

    @transaction.atomic
    def handle(self, *args, **options):
        created = updated = 0
        for data in json.loads(FIXTURE.read_text(encoding="utf-8")):
            slug = data.pop("slug")
            course = Course.objects.filter(slug=slug).first() or Course(slug=slug)
            is_new = course.pk is None
            for field, value in data.items():
                setattr(course, field, value)
            course.full_clean()  # runs the syllabus validator and the fee rules
            course.save()
            created += is_new
            updated += not is_new
        self.stdout.write(self.style.SUCCESS(f"Courses: {created} created, {updated} updated."))
