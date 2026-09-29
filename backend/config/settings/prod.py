"""Production. Set DJANGO_SETTINGS_MODULE=config.settings.prod.

Checked with: python manage.py check --deploy (with the production environment variables)."""

from .base import *  # noqa: F401,F403
from .base import ALLOWED_HOSTS, DATABASES, MIDDLEWARE, SPECTACULAR_SETTINGS, STORAGES, env

DEBUG = False

# Fail fast (and say so in the logs) if the database can't be reached, instead of hanging.
# Keep connections open between requests, checking them before reuse.
DATABASES["default"].setdefault("OPTIONS", {})["connect_timeout"] = 10
DATABASES["default"]["CONN_MAX_AGE"] = 60
DATABASES["default"]["CONN_HEALTH_CHECKS"] = True

# Render sets RENDER_EXTERNAL_HOSTNAME (e.g. aa-api.onrender.com) on every web service.
if env("RENDER_EXTERNAL_HOSTNAME", default=""):
    ALLOWED_HOSTS = [*ALLOWED_HOSTS, env("RENDER_EXTERNAL_HOSTNAME")]

# HTTPS everywhere (the site sits behind a proxy that terminates TLS).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SECURE_REDIRECT_EXEMPT = [r"^healthz$"]  # the host's health check may use plain HTTP
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# Preloading is hard to undo (browsers hard-code HTTPS for the domain). Turn it on only once
# every subdomain is permanently on HTTPS.
SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", default=False)
SILENCED_SYSTEM_CHECKS = [] if SECURE_HSTS_PRELOAD else ["security.W021"]

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

# Plain JSON only: no browsable API in production.
# Rate limits key on the visitor's IP. Behind Vercel → Render, X-Forwarded-For holds the visitor
# plus each proxy; TRUSTED_PROXY_COUNT tells DRF how many trailing entries are proxies
# (see DEPLOY.md, "Check the rate limits").
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "NUM_PROXIES": env.int("TRUSTED_PROXY_COUNT", default=None),
}

# Static files (the Django admin's CSS/JS) are served by the app itself with WhiteNoise.
MIDDLEWARE = [
    MIDDLEWARE[0],  # SecurityMiddleware first
    "whitenoise.middleware.WhiteNoiseMiddleware",
    *MIDDLEWARE[1:],
]

# Uploads (student photos, course images) go to an S3-compatible bucket (e.g. Cloudflare R2),
# because the app's own disk is wiped on every deploy. The bucket stays private: every link
# is signed. Student photo links expire after an hour; course image links after 7 days (the
# S3 maximum), because the website caches course data, links included.
STORAGES = {
    **STORAGES,
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
if env("S3_BUCKET", default=""):
    s3_options = {
        "bucket_name": env("S3_BUCKET"),
        "endpoint_url": env("S3_ENDPOINT_URL", default=None),
        "region_name": env("S3_REGION", default="auto"),
        "access_key": env("S3_ACCESS_KEY_ID"),
        "secret_key": env("S3_SECRET_ACCESS_KEY"),
        "default_acl": None,
        "signature_version": "s3v4",
        "querystring_auth": True,
        "querystring_expire": 3600,
        "file_overwrite": False,
    }
    STORAGES["default"] = {"BACKEND": "storages.backends.s3.S3Storage", "OPTIONS": s3_options}
    STORAGES["course_images"] = {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {**s3_options, "querystring_expire": 7 * 24 * 3600},
    }

# The API schema and Swagger page are for staff only in production.
SPECTACULAR_SETTINGS = {
    **SPECTACULAR_SETTINGS,
    "SERVE_PERMISSIONS": ["common.permissions.IsAdmin"],
    "SERVE_AUTHENTICATION": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
}

# Email over SMTP (for future notifications and error reports).
MAILERS = {
    "default": {
        "BACKEND": "django.core.mail.backends.smtp.EmailBackend",
        "OPTIONS": {
            "host": env("EMAIL_HOST", default="localhost"),
            "port": env.int("EMAIL_PORT", default=587),
            "username": env("EMAIL_HOST_USER", default=""),
            "password": env("EMAIL_HOST_PASSWORD", default=""),
            "use_tls": env.bool("EMAIL_USE_TLS", default=True),
            "timeout": 10,
        },
    },
}
DEFAULT_FROM_EMAIL = env(
    "DEFAULT_FROM_EMAIL", default="Animation Academy <info@animationacademy.in>"
)
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# Errors go to the server log (collected by the host); nothing sensitive is printed to users.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "WARNING"},
    "loggers": {"django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False}},
}
