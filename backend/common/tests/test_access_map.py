"""Every API endpoint is either on the public list below or needs a login. A new view that
forgets its permission_classes (and so becomes public by accident) fails this test."""

from django.urls import URLPattern, URLResolver, get_resolver
from rest_framework.permissions import AllowAny, IsAuthenticated

from common.permissions import IsAdmin, IsStudent

# Anyone may call these (the website and the admission form).
PUBLIC = {
    "api/v1/auth/login/",
    "api/v1/auth/refresh/",
    "api/v1/auth/logout/",
    "api/v1/courses/",
    "api/v1/courses/categories/",
    "api/v1/courses/<slug:slug>/",
    "api/v1/site/",
    "api/v1/announcements/",
    "api/v1/contact/",
    "api/v1/admissions/",
    "api/v1/admissions/validate/",
    "api/v1/verify/<str:code>/",
    "api/v1/schema/",  # staff-only in production (SPECTACULAR_SETTINGS)
    "api/v1/docs/",
}


def api_views(patterns=None, prefix=""):
    for p in patterns if patterns is not None else get_resolver().url_patterns:
        route = prefix + str(p.pattern)
        if isinstance(p, URLResolver):
            yield from api_views(p.url_patterns, route)
        elif isinstance(p, URLPattern) and route.startswith("api/v1/"):
            view = getattr(p.callback, "view_class", None) or getattr(p.callback, "cls", None)
            if view is not None:
                yield route, view


def permissions(view):
    return {cls for cls in getattr(view, "permission_classes", [])}


def test_public_list_matches_the_code():
    open_routes = {route for route, view in api_views() if AllowAny in permissions(view)}
    assert open_routes == PUBLIC, "Public endpoints changed. If that's intended, update PUBLIC."


def test_everything_else_needs_a_login_and_the_right_role():
    for route, view in api_views():
        if route in PUBLIC:
            continue
        perms = permissions(view)
        assert perms & {IsAuthenticated, IsStudent, IsAdmin}, f"{route} is not protected"
        if route.startswith("api/v1/admin/"):
            assert IsAdmin in perms, f"{route} must be staff-only"
        if route.startswith("api/v1/me/"):
            assert IsStudent in perms, f"{route} must be student-only"


def test_every_route_was_seen():
    routes = {route for route, _ in api_views()}
    assert len(routes) > 30
    assert PUBLIC <= routes
