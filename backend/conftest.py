import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from accounts.models import User

PASSWORD = "Learn@2026!"


@pytest.fixture(autouse=True)
def _clear_cache():
    """Throttle counters live in the cache; start every test from zero."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        email="aarav.mehta@gmail.com", password=PASSWORD, full_name="Aarav Mehta"
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="office@animationacademy.in",
        password=PASSWORD,
        full_name="Office",
        role=User.Role.ADMIN,
    )


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user)
    return client
