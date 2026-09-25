import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from website.models import Announcement, SiteSettings

FIXTURE = Path(__file__).resolve().parents[2] / "fixtures" / "announcements.json"


class Command(BaseCommand):
    help = (
        "Create the site settings row (defaults only if missing; never overwrites) and the "
        "sample announcements from website/fixtures/announcements.json."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        existed = SiteSettings.objects.filter(pk=1).exists()
        SiteSettings.load()
        created = 0
        for data in json.loads(FIXTURE.read_text(encoding="utf-8")):
            _, made = Announcement.objects.get_or_create(
                title=data.pop("title"), date=data.pop("date"), defaults=data
            )
            created += made
        settings_msg = "kept as they were" if existed else "created with defaults"
        self.stdout.write(
            self.style.SUCCESS(f"Site settings {settings_msg}. Announcements: {created} created.")
        )
