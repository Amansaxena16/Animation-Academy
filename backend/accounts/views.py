"""Auth endpoints. The access token is returned in the body; the refresh token lives only in an
httpOnly cookie scoped to /api/v1/auth/, so page scripts can never read it.

A second cookie, `aa_session`, holds only the role ("student" / "admin") with path "/". It is
not a credential: the Next.js proxy reads it to redirect signed-out visitors away from the
dashboards before rendering. Every API request is still checked with the access token."""

from django.conf import settings
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    AccessTokenSerializer,
    ChangePasswordSerializer,
    LoginSerializer,
    UserSerializer,
)

SESSION_ENDED = "Your session has ended. Please log in again."


def set_refresh_cookie(response, refresh, role):
    cfg = settings.REFRESH_COOKIE
    common = {
        "max_age": int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        "domain": cfg["DOMAIN"],
        "secure": cfg["SECURE"],
        "httponly": True,
        "samesite": cfg["SAMESITE"],
    }
    response.set_cookie(cfg["NAME"], str(refresh), path=cfg["PATH"], **common)
    response.set_cookie(cfg["SESSION_NAME"], role, path="/", **common)


def clear_refresh_cookie(response):
    cfg = settings.REFRESH_COOKIE
    for name, path in [(cfg["NAME"], cfg["PATH"]), (cfg["SESSION_NAME"], "/")]:
        response.delete_cookie(name, path=path, domain=cfg["DOMAIN"], samesite=cfg["SAMESITE"])


def issue_tokens(user):
    """A fresh refresh token (with role and name claims) and its access token."""
    refresh = LoginSerializer.get_token(user)
    return refresh, str(refresh.access_token)


def blacklist_all(user):
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)


class PublicAuthView(APIView):
    """No request authentication, but failures are still 401 (with a Bearer challenge), not 403."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get_authenticate_header(self, request):
        return 'Bearer realm="api"'


class LoginView(PublicAuthView):
    throttle_scope = "login"

    @extend_schema(request=LoginSerializer, responses=AccessTokenSerializer)
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        response = Response({"access": data["access"], "user": data["user"]})
        set_refresh_cookie(response, data["refresh"], data["user"]["role"])
        return response


class RefreshView(PublicAuthView):

    @extend_schema(request=None, responses=AccessTokenSerializer)
    def post(self, request):
        raw = request.COOKIES.get(settings.REFRESH_COOKIE["NAME"])
        try:
            if not raw:  # RefreshToken(None) would mint a blank token instead of failing
                raise TokenError("No refresh cookie.")
            refresh = RefreshToken(raw)  # checks signature, expiry and the blacklist
            user = User.objects.get(pk=refresh["user_id"], is_active=True)
            refresh.blacklist()  # rotate: this token can't be used again
        except (TokenError, User.DoesNotExist, KeyError):
            # No cookie, a tampered or expired token, or a deactivated user: same answer.
            response = Response(
                {"detail": SESSION_ENDED, "errors": {}, "code": "no_session"},
                status=status.HTTP_401_UNAUTHORIZED,
                headers={"WWW-Authenticate": self.get_authenticate_header(request)},
            )
            clear_refresh_cookie(response)
            return response

        new_refresh, access = issue_tokens(user)
        response = Response({"access": access, "user": UserSerializer(user).data})
        set_refresh_cookie(response, new_refresh, user.role)
        return response


class LogoutView(PublicAuthView):
    """Works even when the access token has expired: it only needs the refresh cookie."""

    @extend_schema(request=None, responses={204: None})
    def post(self, request):
        raw = request.COOKIES.get(settings.REFRESH_COOKIE["NAME"])
        if raw:
            try:
                RefreshToken(raw).blacklist()
            except TokenError:
                pass  # Already invalid; clearing the cookie is all that's left.
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=UserSerializer)
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    """Changes the password, signs out every other session and starts a new one here."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=ChangePasswordSerializer,
        responses=inline_serializer("PasswordChanged", {"access": serializers.CharField()}),
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        blacklist_all(user)

        refresh, access = issue_tokens(user)
        response = Response({"access": access})
        set_refresh_cookie(response, refresh, user.role)
        return response
