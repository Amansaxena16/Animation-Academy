#!/usr/bin/env bash
# Starts both apps in the single-container setup (see Dockerfile). If either stops, the
# container exits and the host restarts it.
set -euo pipefail

# Pass the host's stop signal on to both apps, so they shut down cleanly.
trap 'kill -TERM $(jobs -p) 2>/dev/null; wait' TERM INT

# In this container Django is always next door. Set here (not only in the Dockerfile) so a
# leftover host setting from a two-service setup can't point the website elsewhere.
export API_INTERNAL_URL=http://127.0.0.1:8000/api/v1

# The website first, so the host sees the port open straight away; until Django is up,
# its pages show the error page and /healthz fails, which the host treats as "starting".
PORT="${PORT:-10000}" HOSTNAME=0.0.0.0 node /web/server.js &

# Migrate, and on the very first start seed the data and create the admin.
python manage.py bootstrap
gunicorn config.wsgi --bind 127.0.0.1:8000 --workers "${WEB_CONCURRENCY:-1}" --threads 4 \
  --timeout 60 --access-logfile - &

wait -n
exit $?
