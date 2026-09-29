"""Per-account lockout after repeated wrong passwords.

Both the website's login (/api/v1/auth/login/) and the Django admin's login go through
LockoutModelBackend, so password guessing is capped per account whatever address it comes
from. The per-address rate limit (DRF's "login" scope) sits on top of this for the website.
Counts live in the cache (per server process; a restart forgets them, which is acceptable)."""

from django.contrib.auth.backends import ModelBackend
from django.core.cache import cache
from django.core.exceptions import PermissionDenied

MAX_FAILURES = 10
LOCK_SECONDS = 15 * 60
LOCKED_MESSAGE = "Too many wrong passwords for this account. Try again in 15 minutes."


def _key(email: str) -> str:
    return f"login-failures:{email.strip().lower()}"


def is_locked(email: str | None) -> bool:
    return bool(email) and cache.get(_key(email), 0) >= MAX_FAILURES


def record_failure(email: str) -> None:
    key = _key(email)
    cache.add(key, 0, LOCK_SECONDS)  # starts the window on the first failure
    try:
        cache.incr(key)
    except ValueError:  # expired between add and incr
        cache.set(key, 1, LOCK_SECONDS)


def clear(email: str) -> None:
    cache.delete(_key(email))


class LockoutModelBackend(ModelBackend):
    """ModelBackend that refuses a locked account and counts wrong passwords."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        email = username if username is not None else kwargs.get("email")
        if not email:
            return None
        if is_locked(email):
            # PermissionDenied stops Django trying other backends; the login simply fails.
            raise PermissionDenied(LOCKED_MESSAGE)
        user = super().authenticate(request, username=email, password=password, **kwargs)
        if user is None:
            record_failure(email)
        else:
            clear(email)
        return user
