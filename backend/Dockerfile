# The API in production (Render builds this; see render.yaml and DEPLOY.md).
FROM docker.io/library/python:3.14-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_SETTINGS_MODULE=config.settings.prod

# WeasyPrint (certificate PDFs) needs Pango and HarfBuzz; the fonts themselves are vendored.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
# Settings need a key and a database URL to load; neither is used by collectstatic.
RUN DJANGO_SECRET_KEY=build DATABASE_URL=sqlite:///:memory: python manage.py collectstatic --noinput \
    && useradd --system app
USER app

# Render sets PORT. Two workers × four threads fits the smallest paid instance (512 MB).
CMD ["sh", "-c", "exec gunicorn config.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 2 --threads 4 --timeout 60 --access-logfile -"]
