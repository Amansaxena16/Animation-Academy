from django.db import connection
from django.http import HttpResponse


def healthz(request):
    """For the host's health check: 200 when the app can reach the database, 503 otherwise."""
    try:
        connection.ensure_connection()
    except Exception:
        return HttpResponse("database unavailable", status=503, content_type="text/plain")
    return HttpResponse("ok", content_type="text/plain")
