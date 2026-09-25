<p align="center">
  <img src="design-system/logos/aa-mark.png" alt="" height="64">
  <img src="design-system/logos/aa-wordmark.png" alt="Animation Academy" height="52">
</p>

# Animation Academy

The website for **Animation Academy**, an ISO 9001:2000 certified multimedia institute run by IOCSGT Computer Education at 107/235 Nehru Nagar, Kanpur. Its courses run from computer fundamentals and Tally Prime with GST up to an 18-month Professional Diploma in Multimedia.

The product has three parts:

- **Public website:** courses with monthly fees and full syllabi, online admission that follows the institute's paper form, announcements, contact, and public certificate verification.
- **Student portal:** profile, enrolled courses with their admission status, and certificates to print or download. Teaching happens at the institute, so there are no online lessons.
- **Admin console:** approve admissions, manage students and courses, issue certificates, post announcements, and edit website content and settings.

> **Status:** Phases 0–3 are complete (project setup, JWT auth, the frontend foundation, and the course catalogue). See [`BUILD_PLAN.md`](BUILD_PLAN.md) for the roadmap.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Django 6.1 · Django REST Framework · JWT (simplejwt) |
| Database | PostgreSQL 16 |
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 |
| Forms and data | react-hook-form · zod · TanStack Query |
| Icons | Lucide |

## Repository layout

```
.
├── backend/            Django project: config/ (settings/base|dev|prod), 3 apps
│                       (accounts, website, students) and common/ helpers
├── frontend/           Next.js app (src/app)
├── design-system/      Design tokens, reference component CSS, logo files
├── Images/             Source material: prospectus pamphlet, paper admission form, logo
├── docker-compose.yml  PostgreSQL for local development
├── PROJECT_GUIDE.md    Brand, content rules, pages, data model, course data
└── BUILD_PLAN.md       Build phases and the full API list
```

## Getting started

**Requirements:** Python 3.12+, Node.js 20+, and Docker or Podman (for PostgreSQL).

### 1. Environment files

```bash
cp .env.example .env                              # Postgres container settings
cp backend/.env.example backend/.env              # Django settings
cp frontend/.env.example frontend/.env.local      # API URL for Next.js
```

Set a strong `POSTGRES_PASSWORD` and use the same one in `DATABASE_URL` in `backend/.env`. Generate a `DJANGO_SECRET_KEY` with:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

If port 5432 is already used by a local PostgreSQL, set `POSTGRES_PORT=5433` in `.env` and change the port in `DATABASE_URL` to match.

### 2. Database

```bash
docker compose up -d db          # or: podman compose up -d db
```

### 3. Backend (http://localhost:8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py seed_courses      # the 9 prospectus courses (safe to re-run)
python manage.py createsuperuser   # email + password; gets the admin role
python manage.py runserver
```

- API docs (Swagger): http://localhost:8000/api/v1/docs/
- Django admin: http://localhost:8000/django-admin/ (`/admin` is kept for the Next.js admin console)
- Settings module: `config.settings.dev` locally, `config.settings.prod` in production (set `DJANGO_SETTINGS_MODULE`)

### 4. Frontend (http://localhost:3000)

```bash
cd frontend
npm install
npm run dev
```

Frontend scripts:

```bash
npm run dev         # http://localhost:3000
npm run build       # production build
npm run lint        # eslint
npm test            # vitest (formatting helpers)
npm run tokens      # regenerate src/styles/tokens.css from design-system/tokens.json
npm run api-types   # regenerate src/types/api.ts from the running API's OpenAPI schema
```

In development, http://localhost:3000/dev/components shows every UI component in light and dark.

### Make shortcuts

```bash
make install     # backend venv + frontend node_modules
make db          # start Postgres (COMPOSE="podman compose" make db for Podman)
make backend     # Django dev server
make frontend    # Next.js dev server
make test        # backend tests
make lint        # ruff + black + eslint
make format      # auto-format everything
```

## Authentication

JWT via `djangorestframework-simplejwt`:

| Endpoint | Purpose |
|---|---|
| `POST /api/v1/auth/login/` | `{email, password}` → `{access, user}`; sets the refresh cookie |
| `POST /api/v1/auth/refresh/` | Uses the cookie → new `{access, user}`; rotates the cookie |
| `POST /api/v1/auth/logout/` | Blacklists the refresh token and clears the cookie |
| `GET /api/v1/auth/me/` | The signed-in user |
| `POST /api/v1/auth/change-password/` | Changes the password and signs out every other session |

- The access token lasts 15 minutes and is sent as `Authorization: Bearer <token>`. The frontend keeps it in memory only.
- The refresh token lasts 7 days and lives only in the httpOnly `aa_refresh` cookie (path `/api/v1/auth/`, SameSite=Lax). It is rotated on every refresh and blacklisted on logout.
- The frontend must call the API with `credentials: "include"`.
- The API also sets `aa_session` (the role only, path `/`). The Next.js proxy (`src/proxy.ts`) uses it to redirect signed-out visitors away from `/student` and `/admin`. It is not a credential.
- Errors always look like `{"detail": "...", "errors": {"field": ["message"]}}`. An ended session returns 401 with `"code": "no_session"`.

## Documentation

- [`PROJECT_GUIDE.md`](PROJECT_GUIDE.md) covers:
  - institute details and tone
  - design tokens (colours, type, spacing), component rules, content and fee rules
  - the admission form spec, certificate spec, data model, and all course and syllabus data
- [`BUILD_PLAN.md`](BUILD_PLAN.md) covers:
  - the phase-by-phase build order
  - every API endpoint, and when it gets built
  - decisions still open with the institute

## Brand in brief

- **Colours:**
  - Azure `#0A63A8` leads.
  - Navy `#1E3A6B` is used for structure.
  - Orange `#F08030` is only for enrolling and paying.
  - The maroon of the wordmark is never used as a UI colour.
- **Type:** Archivo for display, Source Sans 3 for text, EB Garamond italic for certificate names, JetBrains Mono for IDs.
- **Content:**
  - Course names are written exactly as the prospectus prints them.
  - Fees are shown per month first, e.g. "₹800 per month · 6 Months", plus a one-time ₹250 registration fee.
  - No emoji.

## Contact

IOCSGT Computer Education, 107/235 Nehru Nagar, Kanpur, Uttar Pradesh 208012 · 8707447880, 9336202125

The logos and the prospectus content belong to Animation Academy / IOCSGT Computer Education.
