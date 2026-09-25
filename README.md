<p align="center">
  <img src="design-system/logos/aa-mark.png" alt="" height="64">
  <img src="design-system/logos/aa-wordmark.png" alt="Animation Academy" height="52">
</p>

# Animation Academy

The website for **Animation Academy**, an ISO 9001:2000 certified multimedia institute run by IOCSGT Computer Education at 107/235 Nehru Nagar, Kanpur. Its courses run from computer fundamentals and Tally Prime with GST up to an 18-month Professional Diploma in Multimedia.

The product has three parts:

- **Public website:** courses with monthly fees and full syllabi, online admission that follows the institute's paper form, announcements, contact, and public certificate verification.
- **Student portal:** admissions, course progress, and certificates to print or download.
- **Admin console:** approve admissions, manage students and courses, issue certificates, post announcements, and edit website content and settings.

> **Status:** Phase 0 (project setup) is complete. See [`BUILD_PLAN.md`](BUILD_PLAN.md) for the roadmap.

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
├── backend/            Django project (config/, apps are added from Phase 1)
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
python manage.py runserver
```

### 4. Frontend (http://localhost:3000)

```bash
cd frontend
npm install
npm run dev
```

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
