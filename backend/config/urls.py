from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from common.health import healthz

admin.site.site_header = "Animation Academy — Django admin"
admin.site.site_title = "Animation Academy"

api_v1 = [
    path("auth/", include("accounts.urls")),
    path("", include("website.urls")),
    path("", include("students.urls")),
    path("admin/", include("config.console_urls")),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]

urlpatterns = [
    # /admin is left free for the Next.js admin console.
    path("django-admin/", admin.site.urls),
    path("api/v1/", include(api_v1)),
    path("healthz", healthz),
    # Someone opening the API's own address lands on the website instead of a bare 404.
    path("", RedirectView.as_view(url=settings.PUBLIC_SITE_URL, permanent=False)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
