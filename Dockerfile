# The whole site in one container: the Next.js website on $PORT, and the Django API on
# 127.0.0.1:8000 behind it. Used on Render's free plan, where a sleeping service is woken by
# visitors but not by another Render service, so the two apps must wake together.
# (backend/Dockerfile is the API on its own, for hosts that run them separately.)

# 1. Build the website.
FROM docker.io/library/node:22-bookworm-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Built into the site: the browser uses /api/v1 on this address; the server reaches Django
# directly. NEXT_PUBLIC_SITE_URL comes from the host's environment as a build argument.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=/api/v1 \
    API_INTERNAL_URL=http://127.0.0.1:8000/api/v1 \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build \
    && cp -r public .next/standalone/ \
    && cp -r .next/static .next/standalone/.next/

# 2. The runtime: Python for Django, plus the Node binary for the website.
FROM docker.io/library/python:3.14-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    NEXT_TELEMETRY_DISABLED=1 \
    API_INTERNAL_URL=http://127.0.0.1:8000/api/v1 \
    ALLOWED_HOSTS=127.0.0.1,localhost \
    SECURE_SSL_REDIRECT=False

# The website's server reaches Django inside the container. Render's edge already sends plain
# HTTP visitors to HTTPS, so Django doesn't redirect (its requests come from the website).
# WeasyPrint (certificate PDFs) needs Pango and HarfBuzz; Node needs libstdc++.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 libstdc++6 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=web /usr/local/bin/node /usr/local/bin/node

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ ./
RUN DJANGO_SECRET_KEY=build DATABASE_URL=sqlite:///:memory: python manage.py collectstatic --noinput
COPY --from=web /web/.next/standalone /web
COPY start.sh /start.sh

RUN useradd --system --create-home app
USER app
CMD ["bash", "/start.sh"]
