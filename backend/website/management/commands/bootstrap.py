import os

from django.core.management import call_command
from django.core.management.base import BaseCommand

from accounts.models import User
from website.models import Course


class Command(BaseCommand):
    help = (
        "Run on every start of the production server: migrate, drop expired login tokens, and on"
        " the very first start only, load the courses and site content and create the admin."
    )

    def handle(self, *args, **options):
        self.stdout.write("bootstrap: migrating the database…")
        call_command("migrate", interactive=False, verbosity=1)
        call_command("flushexpiredtokens")

        # First start only: seed_courses would undo the office's edits if it ran again.
        if not Course.objects.exists():
            call_command("seed_courses")
            call_command("seed_content")

        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "").strip()
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "")
        if User.objects.filter(role=User.Role.ADMIN).exists():
            self.stdout.write("bootstrap: done.")
            return
        if email and password:
            User.objects.create_superuser(email, password, full_name="Office")
            self.stdout.write(self.style.SUCCESS(f"Created the admin login {email}."))
        else:
            self.stdout.write(
                self.style.WARNING(
                    "No admin exists: set DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD."
                )
            )
