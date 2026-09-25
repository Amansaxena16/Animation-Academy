.PHONY: db db-stop backend-install frontend-install install backend frontend migrate test lint format

# Postgres (docker compose, or podman compose)
COMPOSE ?= docker compose
db:
	$(COMPOSE) up -d db
db-stop:
	$(COMPOSE) stop db

backend-install:
	cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
frontend-install:
	cd frontend && npm install
install: backend-install frontend-install

backend:
	cd backend && .venv/bin/python manage.py runserver 8000
frontend:
	cd frontend && npm run dev
migrate:
	cd backend && .venv/bin/python manage.py migrate

test:
	cd backend && .venv/bin/pytest

lint:
	cd backend && .venv/bin/ruff check . && .venv/bin/black --check .
	cd frontend && npm run lint

format:
	cd backend && .venv/bin/ruff check --fix . && .venv/bin/black .
	cd frontend && npm run format
