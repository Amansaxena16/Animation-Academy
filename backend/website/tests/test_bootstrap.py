import pytest
from django.core.management import call_command

from accounts.models import User
from website.models import Announcement, Course

pytestmark = pytest.mark.django_db(transaction=True)


def test_first_start_seeds_and_creates_the_admin(monkeypatch):
    monkeypatch.setenv("DJANGO_SUPERUSER_EMAIL", "office@example.test")
    monkeypatch.setenv("DJANGO_SUPERUSER_PASSWORD", "a-long-test-password")
    call_command("bootstrap", verbosity=0)
    assert Course.objects.count() == 9
    assert Announcement.objects.exists()
    admin = User.objects.get(email="office@example.test")
    assert admin.is_admin and admin.check_password("a-long-test-password")


def test_later_starts_keep_the_office_edits(monkeypatch):
    monkeypatch.setenv("DJANGO_SUPERUSER_EMAIL", "office@example.test")
    monkeypatch.setenv("DJANGO_SUPERUSER_PASSWORD", "a-long-test-password")
    call_command("bootstrap", verbosity=0)
    Course.objects.filter(slug="dtp").update(monthly_fee=999)
    Announcement.objects.all().delete()
    User.objects.filter(email="office@example.test").update(email="renamed@example.test")

    call_command("bootstrap", verbosity=0)
    assert Course.objects.get(slug="dtp").monthly_fee == 999
    assert not Announcement.objects.exists()
    # An admin exists, so no second one is created from the environment.
    assert User.objects.filter(role=User.Role.ADMIN).count() == 1


def test_no_admin_without_credentials(monkeypatch):
    monkeypatch.delenv("DJANGO_SUPERUSER_EMAIL", raising=False)
    monkeypatch.delenv("DJANGO_SUPERUSER_PASSWORD", raising=False)
    call_command("bootstrap", verbosity=0)
    assert not User.objects.filter(role=User.Role.ADMIN).exists()
