import pytest
from django.conf import settings
from rest_framework_simplejwt.tokens import AccessToken

from conftest import PASSWORD

LOGIN = "/api/v1/auth/login/"
REFRESH = "/api/v1/auth/refresh/"
LOGOUT = "/api/v1/auth/logout/"
ME = "/api/v1/auth/me/"
CHANGE = "/api/v1/auth/change-password/"
COOKIE = settings.REFRESH_COOKIE["NAME"]
SESSION = settings.REFRESH_COOKIE["SESSION_NAME"]

pytestmark = pytest.mark.django_db


def login(api, email="aarav.mehta@gmail.com", password=PASSWORD):
    return api.post(LOGIN, {"email": email, "password": password}, format="json")


class TestLogin:
    def test_returns_access_and_user_and_sets_refresh_cookie(self, api, student_user):
        res = login(api)
        assert res.status_code == 200
        assert set(res.data) == {"access", "user"}  # refresh never in the body
        assert res.data["user"] == {
            "email": "aarav.mehta@gmail.com",
            "name": "Aarav Mehta",
            "role": "student",
            "student_code": None,
        }
        cookie = res.cookies[COOKIE]
        assert cookie["httponly"]
        assert cookie["path"] == "/api/v1/auth/"
        assert cookie["samesite"] == "Lax"
        session = res.cookies[SESSION]
        assert session.value == "student"
        assert session["path"] == "/"
        assert session["httponly"]

    def test_access_token_carries_role_and_name(self, api, admin_user):
        res = login(api, email=admin_user.email)
        token = AccessToken(res.data["access"])
        assert token["role"] == "admin"
        assert token["name"] == "Office"

    def test_email_is_case_insensitive(self, api, student_user):
        assert login(api, email="  Aarav.Mehta@GMAIL.com ").status_code == 200

    def test_wrong_password(self, api, student_user):
        res = login(api, password="wrong-password")
        assert res.status_code == 401
        assert res.data["detail"] == "Email or password is incorrect."
        assert res.data["errors"] == {}
        assert COOKIE not in res.cookies

    def test_inactive_user_cannot_log_in(self, api, student_user):
        student_user.is_active = False
        student_user.save()
        assert login(api).status_code == 401

    def test_missing_fields_use_the_error_shape(self, api):
        res = api.post(LOGIN, {}, format="json")
        assert res.status_code == 400
        assert res.data["detail"] == "Check the highlighted fields."
        assert set(res.data["errors"]) == {"email", "password"}

    def test_is_throttled(self, api, student_user):
        codes = [login(api, password="wrong-password").status_code for _ in range(11)]
        assert codes[:10] == [401] * 10
        assert codes[10] == 429


class TestMe:
    def test_with_bearer_token(self, api, student_user):
        access = login(api).data["access"]
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        res = api.get(ME)
        assert res.status_code == 200
        assert res.data["email"] == student_user.email

    def test_anonymous_gets_401_in_error_shape(self, api):
        res = api.get(ME)
        assert res.status_code == 401
        assert set(res.data) >= {"detail", "errors"}


class TestRefresh:
    def test_rotates_cookie_and_old_one_stops_working(self, api, student_user):
        login(api)
        old = api.cookies[COOKIE].value

        res = api.post(REFRESH)
        assert res.status_code == 200
        assert res.data["user"]["email"] == student_user.email
        new = res.cookies[COOKIE].value
        assert new and new != old

        api.cookies[COOKIE] = old
        res = api.post(REFRESH)
        assert res.status_code == 401
        assert res.data["code"] == "no_session"

    def test_without_cookie(self, api):
        res = api.post(REFRESH)
        assert res.status_code == 401
        assert res.data == {
            "detail": "Your session has ended. Please log in again.",
            "errors": {},
            "code": "no_session",
        }

    def test_garbage_cookie_is_cleared(self, api):
        api.cookies[COOKIE] = "not-a-token"
        res = api.post(REFRESH)
        assert res.status_code == 401
        assert res.cookies[COOKIE].value == ""
        assert res.cookies[SESSION].value == ""

    def test_deactivated_user_loses_session(self, api, student_user):
        login(api)
        student_user.is_active = False
        student_user.save()
        assert api.post(REFRESH).status_code == 401


class TestLogout:
    def test_blacklists_refresh_and_clears_cookie(self, api, student_user):
        login(api)
        token = api.cookies[COOKIE].value

        res = api.post(LOGOUT)
        assert res.status_code == 204
        assert res.cookies[COOKIE].value == ""
        assert res.cookies[SESSION].value == ""

        api.cookies[COOKIE] = token
        assert api.post(REFRESH).status_code == 401

    def test_without_cookie_still_succeeds(self, api):
        assert api.post(LOGOUT).status_code == 204


class TestChangePassword:
    def _authed(self, api):
        access = login(api).data["access"]
        api.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def test_wrong_current_password(self, api, student_user):
        self._authed(api)
        res = api.post(CHANGE, {"old_password": "nope", "new_password": "Sketch#2027"})
        assert res.status_code == 400
        assert res.data["errors"]["old_password"] == ["Your current password is incorrect."]

    def test_weak_new_password(self, api, student_user):
        self._authed(api)
        res = api.post(CHANGE, {"old_password": PASSWORD, "new_password": "1234"})
        assert res.status_code == 400
        assert "new_password" in res.data["errors"]

    def test_same_password_rejected(self, api, student_user):
        self._authed(api)
        res = api.post(CHANGE, {"old_password": PASSWORD, "new_password": PASSWORD})
        assert res.status_code == 400
        assert "new_password" in res.data["errors"]

    def test_success_ends_other_sessions(self, api, student_user):
        other = type(api)()
        login(other)  # a second device
        self._authed(api)

        res = api.post(CHANGE, {"old_password": PASSWORD, "new_password": "Sketch#2027"})
        assert res.status_code == 200
        assert "access" in res.data

        assert other.post(REFRESH).status_code == 401  # the other device is signed out
        assert api.post(REFRESH).status_code == 200  # this device got a new session
        assert login(type(api)(), password="Sketch#2027").status_code == 200
