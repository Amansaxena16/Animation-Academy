"""Brute-force protection: the per-account lockout (website and Django admin logins) and the
per-address rate limit behind Render's proxies."""

import pytest
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from accounts.lockout import LOCKED_MESSAGE, MAX_FAILURES
from accounts.models import User

pytestmark = pytest.mark.django_db

LOGIN = "/api/v1/auth/login/"
ADMIN_LOGIN = "/django-admin/login/"
PASSWORD = "Kanpur@2026!"


@pytest.fixture
def office():
    return User.objects.create_superuser("office@example.test", PASSWORD)


@pytest.fixture(autouse=True)
def _no_address_limit(request, monkeypatch):
    """These tests are about the per-account lockout, so lift the per-address rate limit.
    (DRF copies the rates onto the throttle class when it loads, so patch the class.)"""
    if request.node.name.startswith("test_rate_limit"):
        return
    rates = {**ScopedRateThrottle.THROTTLE_RATES, "login": "1000/min"}
    monkeypatch.setattr(ScopedRateThrottle, "THROTTLE_RATES", rates)


def api_login(email, password):
    return APIClient().post(LOGIN, {"email": email, "password": password}, format="json")


def fail(times, email="office@example.test"):
    for _ in range(times):
        assert api_login(email, "wrong-password").status_code == 401


def test_account_locks_after_repeated_wrong_passwords(office):
    fail(MAX_FAILURES)
    res = api_login("office@example.test", PASSWORD)  # even the right password
    assert res.status_code == 429
    assert res.data["detail"] == LOCKED_MESSAGE


def test_lock_ignores_email_case_and_spaces(office):
    fail(MAX_FAILURES, email="  OFFICE@Example.test ")
    assert api_login("office@example.test", PASSWORD).status_code == 429


def test_a_good_login_resets_the_count(office):
    fail(MAX_FAILURES - 1)
    assert api_login("office@example.test", PASSWORD).status_code == 200
    fail(MAX_FAILURES - 1)
    assert api_login("office@example.test", PASSWORD).status_code == 200


def test_other_accounts_are_not_affected(office):
    User.objects.create_user("other@example.test", PASSWORD)
    fail(MAX_FAILURES)
    assert api_login("other@example.test", PASSWORD).status_code == 200


def test_django_admin_login_is_locked_too(client, office):
    for _ in range(MAX_FAILURES):
        client.post(ADMIN_LOGIN, {"username": "office@example.test", "password": "wrong"})
    res = client.post(ADMIN_LOGIN, {"username": "office@example.test", "password": PASSWORD})
    assert res.status_code == 200  # the login form again, not the redirect into the admin
    assert "_auth_user_id" not in client.session
    # …and the website's login says why.
    assert api_login("office@example.test", PASSWORD).status_code == 429


def test_django_admin_login_still_works_normally(client, office):
    res = client.post(ADMIN_LOGIN, {"username": "office@example.test", "password": PASSWORD})
    assert res.status_code == 302


def test_rate_limit_uses_the_real_visitor_behind_render(settings):
    """Behind Render, X-Forwarded-For is "<added by client>, <visitor>, <Cloudflare>, <Render>",
    and the last two change per request. With TRUSTED_PROXY_COUNT=3 the limit follows the
    visitor, whatever the client adds in front."""
    settings.REST_FRAMEWORK = {**settings.REST_FRAMEWORK, "NUM_PROXIES": 3}
    client = APIClient()
    codes = []
    for i in range(11):
        xff = f"203.0.113.{i}, 152.58.115.75, 172.71.124.{i}, 10.25.16.{i}"
        res = client.post(
            LOGIN, {"email": "x@example.test", "password": ""}, HTTP_X_FORWARDED_FOR=xff
        )
        codes.append(res.status_code)
    assert codes == [400] * 10 + [429]
    # A different visitor still gets through.
    other = "152.58.1.1, 172.71.124.1, 10.25.16.1"
    res = client.post(
        LOGIN, {"email": "x@example.test", "password": ""}, HTTP_X_FORWARDED_FOR=other
    )
    assert res.status_code == 400
