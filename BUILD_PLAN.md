# Animation Academy — Build Plan

The order we build in, step by step, with every API endpoint defined in the step that needs it. Design, content and data rules are in `PROJECT_GUIDE.md`; this file is about **sequence and API**.

**Approach:** set up the foundations first (Phase 0–2). After that we build in **vertical slices**: each slice ships its models, API, tests and frontend pages together, so every phase ends with something working in the browser.

```
Phase 0  Project setup
Phase 1  Backend foundation (settings, custom user, JWT, API conventions)
Phase 2  Frontend foundation (tokens, Tailwind, fonts, base components, API client)
Phase 3  Courses catalogue            → public Courses + Course detail pages
Phase 4  Site content                 → Home, About, Updates, Contact
Phase 5  Admission (registration)     → 4-step admission form
Phase 6  Login + student portal       → Student dashboard, My Courses, Profile
Phase 7  Lesson progress              → Student course view
Phase 8  Certificates + verify        → Certificates, print/PDF, public Verify
Phase 9  Admin console                → all admin screens
Phase 10 Hardening                    → security, performance, accessibility, tests
Phase 11 Deployment
```

---

## Phase 0 — Project setup ✅ done (25 Sep 2026)

Installed: Django 6.1, DRF 3.18, simplejwt 5.5, Next.js 16.3, React 19.2, Tailwind 4, Postgres 16. `SECRET_KEY`, `DEBUG` and `DATABASE_URL` are read from `backend/.env`.


1. Run `git init`; add a `.gitignore` for Python, Node, `.env` and `media/`.
2. Create the folder structure:
   ```
   Animation_Academy/
   ├── backend/            Django project
   ├── frontend/           Next.js app
   ├── design-system/      tokens.json, bundle.css, logos (reference, already here)
   ├── docker-compose.yml  Postgres (+ later backend/frontend services)
   ├── PROJECT_GUIDE.md
   └── BUILD_PLAN.md
   ```
3. In `docker-compose.yml`, add a `postgres:16` service with a volume, and `.env.example` entries for `POSTGRES_DB`, `POSTGRES_USER` and `POSTGRES_PASSWORD`.
4. Backend: a Python 3.12 virtualenv and `requirements.txt`:
   - `django`, `djangorestframework`, `djangorestframework-simplejwt`
   - `psycopg[binary]`, `django-cors-headers`, `django-filter`
   - `drf-spectacular` (OpenAPI docs), `Pillow` (photos)
   - `python-dotenv` or `django-environ`
   - `weasyprint` (certificate PDF; can come in Phase 8)
   - `pytest-django`, `factory-boy`
5. Frontend: `create-next-app` with TypeScript, App Router, Tailwind, ESLint and the `src/` dir, then add `lucide-react`, `zod`, `react-hook-form` and `@tanstack/react-query`.
6. Tooling:
   - backend: `ruff` + `black`
   - frontend: `prettier`
   - one root `Makefile` or npm scripts (`dev`, `test`, `lint`, `seed`)

**Done when:** `docker compose up -d db` (or `podman compose`) runs, `python manage.py runserver` shows the Django welcome page, and `npm run dev` shows the Next.js starter.

---

## Phase 1 — Backend foundation

### 1.1 Django project and apps
Create project `config` and these apps (one per domain):

| App | Owns |
|---|---|
| `accounts` | Custom `User` (email login, `role`), auth views |
| `courses` | CourseCategory, Course, CourseModule, Lesson |
| `students` | Student, Qualification |
| `enrollments` | Enrollment, LessonProgress |
| `certificates` | Certificate, verification, PDF |
| `content` | SiteSettings, Announcement, MediaItem, ContactMessage |
| `common` | ID generators, permissions, pagination, formatting helpers, base test utils |

### 1.2 Settings
- Split settings into `base.py`, `dev.py` and `prod.py`; read secrets from `.env`.
- Database: Postgres from env. Timezone `Asia/Kolkata`, `USE_TZ=True`.
- Set `MEDIA_ROOT` / `MEDIA_URL` for photos and gallery images.
- CORS: allow `http://localhost:3000` in dev.
- Move Django admin to **`/django-admin/`**, so `/admin` stays free for the Next.js admin console.

### 1.3 Custom user (must come before the first migration)
- `accounts.User(AbstractBaseUser, PermissionsMixin)`: `email` (unique, the USERNAME_FIELD), `role` (`student` | `admin`), `is_active`, `is_staff`, `date_joined`.
- A `UserManager` with `create_user` and `create_superuser` (superuser → role `admin`).
- Set `AUTH_USER_MODEL = "accounts.User"`, then run `makemigrations` / `migrate`.

### 1.4 JWT
- `simplejwt`: access token 15 min, refresh token 7 days, rotate refresh, blacklist after rotation (`token_blacklist` app).
- A custom token serializer adds `role` and `name` to the token claims.
- **Token storage (recommended):**
  - the refresh token goes in an **httpOnly, Secure, SameSite=Lax cookie** set by the backend
  - the access token is kept in memory on the frontend
  - this keeps tokens out of `localStorage`, where page scripts could read them

### 1.5 API conventions (set once, used everywhere)
- Base path: **`/api/v1/`**. Public, student and admin endpoints are grouped by prefix:
  - `/api/v1/…`: public
  - `/api/v1/me/…`: logged-in student
  - `/api/v1/admin/…`: admin only
- **Permissions** (`common/permissions.py`): `IsStudent`, `IsAdmin`, and `IsOwner` (a student can only reach their own data).
- **Pagination:** page-number style, default 20, max 100. Response: `{count, next, previous, results}`.
- **Errors:** one shape everywhere: `{"detail": "...", "errors": {"field": ["message"]}}`. Field messages use the wording from PROJECT_GUIDE §8.
- **IDs in URLs:** use the human codes (`AA-STU-1042`, `EN-2107`, `AA-2026-000123`) and course `slug`, never the internal PK.
- **Human code generation** (`common/ids.py`): allocate inside `transaction.atomic()` with a counter row locked by `select_for_update()`, so two requests can't get the same number.
  - `AA-STU-{n:04d}`
  - `EN-{n:04d}`
  - `AA-{year}-{n:06d}`
- **Money:** store whole rupees as `PositiveIntegerField`. Format on the frontend with `en-IN`.
- **OpenAPI:** serve the schema at `/api/v1/schema/` and Swagger UI at `/api/v1/docs/` (drf-spectacular). The frontend generates TypeScript types from it (Phase 2.5).
- **Throttling:** anonymous rate limits on login, admission, contact and verify.

### 1.6 Auth endpoints (built now)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/login/` | public | `{email, password}` → `{access, user:{email, role, name, code}}`; sets the refresh cookie |
| POST | `/api/v1/auth/refresh/` | refresh cookie | → new `{access}`; rotates the cookie |
| POST | `/api/v1/auth/logout/` | auth | Blacklists the refresh token, clears the cookie |
| GET | `/api/v1/auth/me/` | auth | The current user, role and student code |
| POST | `/api/v1/auth/change-password/` | auth | `{old_password, new_password}` |

Password reset by email or OTP is left for later (see Phase 10).

**Done when:**
- pytest covers login, refresh, logout, me, and a wrong-role request getting 403
- `createsuperuser` can log in through `/api/v1/auth/login/`
- Swagger shows the endpoints

---

## Phase 2 — Frontend foundation

### 2.1 Design tokens
- Generate `src/styles/tokens.css` from `design-system/tokens.json`: the colours as CSS variables under `:root` (light) and `[data-theme="dark"]`, plus spacing, radius and shadow.
- Map every token into Tailwind. **Tailwind v4 has no `tailwind.config.ts`**: tokens go in an `@theme` block in `src/app/globals.css`, covering `colors.brand`, `colors.navy`, `colors.accent`, `ink`, `surface`…, `borderRadius`, `boxShadow`, `spacing`, and the type scale as `fontSize` entries.

### 2.2 Fonts
Load Archivo, Source Sans 3, EB Garamond (italic 600) and JetBrains Mono through `next/font/google`, as CSS variables `--font-display`, `--font-sans`, `--font-serif` and `--font-mono`.

### 2.3 Theme
- A `ThemeProvider` sets `data-theme` on `<html>`.
- Public pages are light only. Dashboards get a light/dark toggle, remembered in `localStorage`.

### 2.4 Base components (`src/components/ui/`)
Port them from `design-system/bundle.css`, in this order, because later ones use earlier ones:

1. Logo (two images, theme swap)
2. Button (all variants, sizes, loading)
3. Badge (with status mapping helpers)
4. Avatar
5. FormField (Input, Select, Textarea, Checkbox, RadioCard, PhotoUpload)
6. Card
7. Alert and Toast
8. Modal (confirmation; focus management, Esc)
9. Tabs and SegmentedControl
10. Progress
11. Stepper
12. Breadcrumbs
13. EmptyState and Skeleton
14. Table (stacks into cards below 720px) and Pager
15. StatCard
16. CourseCard and FeeBox
17. Announcement
18. Sidebar and BottomNav
19. Certificate (built properly in Phase 8)

Put copies of the logos in `public/brand/`, and use `aa-mark-512.png` as the favicon.

### 2.5 API client
- `src/lib/api.ts`: a typed `fetch` wrapper with the base URL from `NEXT_PUBLIC_API_URL`.
  - It attaches the access token.
  - On a 401 it calls `/auth/refresh/` once and retries.
  - It converts the error shape into form errors.
- Generate types from the OpenAPI schema with `openapi-typescript` into `src/types/api.ts`.
- `src/lib/format.ts`:
  - `inr(n)` → `₹4,800`
  - date formats: `formatDateLong` → "24 September 2026", `formatDateShort` → "24 Sep"
  - `courseTotal(course)`, which handles the PDM special fee

### 2.6 Layouts
- `app/(public)/layout.tsx`: header, nav, footer.
- `app/(student)/student/layout.tsx` and `app/(admin)/admin/layout.tsx`: sidebar, top bar, BottomNav.
- `middleware.ts` redirects to `/login` when the refresh cookie is missing on dashboard routes. The role check happens in the layout via `/auth/me/`.

A `/dev/components` page shows every component in light and dark for visual checks. Remove it before launch.

**Done when:** the components page renders every component in both themes, and the API client can call `/auth/me/`.

---

## Phase 3 — Courses catalogue

### 3.1 Models (`courses`)
- `CourseCategory`: name, slug, order.
- `Course`: every field from PROJECT_GUIDE §10, including the nullable `special_first_fee`, `special_rest_fee` and `special_rest_count`, `status` (Published/Draft), `featured`, `tag`, `schedule`, `next_batch_start` (text, because "Every Monday" is a valid value), and `combines` (M2M to self).
- `CourseModule`: course, order, title, duration_label, tools.
- `Lesson`: module, order, title.
- A model property `total_fee`.

### 3.2 Seed command
`python manage.py seed_courses` loads the 9 prospectus courses from `backend/courses/fixtures/courses.json`, with all syllabi and the PDM's 5 semesters.
- Modules are built as described in PROJECT_GUIDE §10: syllabus items grouped into units of 4, or the semesters for the PDM.
- The command is idempotent (update_or_create by slug).

### 3.3 Public API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/categories/` | public | Category list for the filter chips |
| GET | `/api/v1/courses/` | public | Published courses. Filters: `q` (name, description, syllabus), `category`, `level`, `price` (`lt800` / `800-1000` / `gt1000`, or min/max), `featured=true`. Ordering: `order`, `fee`, `name` |
| GET | `/api/v1/courses/{slug}/` | public | Detail with modules → lessons, fee breakdown and computed total |

The list serializer is light (card fields only); the detail serializer includes the modules.

### 3.4 Frontend
- `/courses`: search, category chips, level and price filters, CourseCard grid, empty state.
- `/courses/[slug]`: breadcrumbs, hero, Overview/Syllabus tabs, module accordion, FeeBox, schedule and start date, Enroll Now.
  - For now, Enroll Now links to `/admission?course=slug`; Phase 6 adds the logged-in path.
- Use Server Components with `fetch` + `revalidate: 300` for SEO, plus `generateMetadata` per course.

**Done when:** all 9 courses are browsable with correct monthly fees, totals and the ₹250 note, and the PDM shows "₹4,000 + ₹3,000 × 17".

---

## Phase 4 — Site content

### 4.1 Models (`content`)
- `SiteSettings`: a singleton (`pk=1`, a `load()` classmethod) holding the hero headline and sub, `stat_1`…`stat_4`, `show_stats`, `about`, `phone`, `email`, `address`, `registration_fee` (250), `allow_registration`, `maintenance_mode`, and `auto_issue_certificate` (default **False**; see open question 1).
- `Announcement`: title, text, category (choices), date, published, created_by.
- `MediaItem`: image, caption, order.
- `ContactMessage`: name, email, phone (optional), message, created_at, handled.

Seed: `seed_content` loads the settings defaults and the 7 sample announcements.

### 4.2 Public API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/site/` | public | Public settings: hero, stats (only if `show_stats`), contact info, registration fee, `allow_registration`, `maintenance_mode` |
| GET | `/api/v1/announcements/` | public | Published only. Filters: `category`, `upcoming=true` (Holiday + Event, date ≥ today), `limit` |
| GET | `/api/v1/media/` | public | Gallery images |
| POST | `/api/v1/contact/` | public, throttled | `{name, email, phone?, message}` → 201 |

### 4.3 Frontend
- **Home:**
  - hero with the overline, headline, sub, two CTAs and the "from ₹700" line
  - stats band with a one-time count-up
  - featured courses and the flagship PDM band
  - "Why Animation Academy" (the 6 points, verbatim)
  - the latest 4 announcements, then the CTA band
- **About**, **Updates** (category filter), and **Contact** (form and toast: "Our counsellor will call you within one working day.").
- A maintenance page shown when `maintenance_mode` is on (checked in the public layout).
- A header and footer with the address and phones from `/site/`.

**Done when:** the whole public site renders from API data, and changing a setting in Django admin shows up on the site.

---

## Phase 5 — Admission (registration)

### 5.1 Models (`students`)
- `Student`: `user` (1:1), `code`, name (stored uppercase), father_name, mobile, phone, dob, gender, address, pincode, city, state, country, photo, employment (choices), status (Pending/Active/Inactive/Graduated), joined_at.
- `Qualification`: student, exam (choices: High School/Intermediate/Graduation/Post Graduation), year, board, subject, percentage. Unique on (student, exam).

`Enrollment` is created in this phase too (the model lives in `enrollments`; the full API comes in Phase 6):
- fields: code, student, course, applied_at, status (Pending/Active/Completed/Cancelled), progress, approved_at, completed_at
- unique on (student, course) while not Cancelled

### 5.2 API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/admissions/validate/` | public | Validates one step (`{step, data}`) so the form can show errors before moving on. Also checks that the email is still free |
| POST | `/api/v1/admissions/` | public, throttled | **multipart**: account + personal + photo + `qualifications[]` + `course` + `employment` + `accept_no_refund=true` |

What `POST /admissions/` does, in **one transaction**:
1. Reject the request if `allow_registration` is false, the course is not Published, or the email already exists.
2. Validate everything with the PROJECT_GUIDE §8 rules:
   - name at least 3 characters, stored uppercase
   - father's name required
   - 6-digit pincode, 10-digit mobile, DOB in the past
   - password ≥ 8 characters
   - the High School row needs a year and a board
   - photo: JPEG or PNG, at most 2 MB
   - `accept_no_refund` must be true
3. Create `User(role=student)`, then `Student(status=Pending)` with its qualifications, then `Enrollment(status=Pending)`.
4. Return `{student_code, enrollment_code, course, fee_summary}` and log the user in (JWT + refresh cookie), so they land on their dashboard showing the Pending admission.

### 5.3 Frontend
- `/admission`: a 4-step Stepper (**Account → Personal → Education → Course**), using react-hook-form + zod that mirror the backend rules. Each step calls `/admissions/validate/`.
- The Education step is a 4-row table (a stacked card per row on mobile).
- The Course step has the course select (prefilled from `?course=`), duration (read-only), employment, the fee summary, and **"No refund allowed after confirmation of admission."** above the confirm checkbox and button.
- Success screen, then redirect to the student dashboard.
- When `allow_registration` is false, show a "Registration is closed" message with the contact phones.

**Done when:** a new person can apply end to end, and the Pending student and enrollment appear in Django admin.

---

## Phase 6 — Login + student portal

### 6.1 API (student, `IsStudent` + own data only)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/me/dashboard/` | Counts (active, completed, certificates), active enrollments with progress, recent certificates, upcoming announcements |
| GET | `/api/v1/me/profile/` | Profile + qualifications |
| PATCH | `/api/v1/me/profile/` | Update the editable fields (not `code` or `status`); multipart for a new photo |
| PUT | `/api/v1/me/qualifications/` | Replace the 4 qualification rows |
| GET | `/api/v1/me/enrollments/` | Filter `status` = all / Active / Completed / Pending |
| POST | `/api/v1/me/enrollments/` | `{course, accept_no_refund}`. Returns **409** "Already enrolled — Find it under My Courses." if one exists; otherwise creates a Pending enrollment |
| GET | `/api/v1/me/enrollments/{code}/` | Detail with course modules and lessons (the done flags come in Phase 7) |

### 6.2 Frontend
- `/login`: Student/Admin toggle (only a UI hint; the server decides the role), email, password, errors, redirect by role.
- The student layout: sidebar (Dashboard, My Courses, Certificates, Profile), BottomNav on mobile, the user menu and Logout.
- `/student`: the dashboard.
- `/student/courses`: tabs All / Active / Completed / Pending.
- `/student/profile`: form with a photo, and the qualification table.
- On the course detail page, **Enroll Now** for a logged-in student opens a Modal: "Apply for [course]?", the fee text, the next batch date, the no-refund line and **Confirm Admission**, then a toast "Admission requested".

**Done when:** a student can log in and see their dashboard, courses and profile, can apply for a second course, and cannot reach another student's data (tested).

---

## Phase 7 — Lesson progress

### 7.1 Model
`LessonProgress`: enrollment, lesson, done, done_at. Unique on (enrollment, lesson).

`Enrollment.progress` is recalculated in a service function each time a lesson is toggled: done ÷ total lessons, rounded.

### 7.2 API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/me/enrollments/{code}/` | Now includes `done` per lesson and `progress` |
| PUT | `/api/v1/me/enrollments/{code}/lessons/{lesson_id}/` | `{done: true/false}` → the updated progress. Only allowed while the enrollment is **Active** |

**When progress reaches 100%:**
- if `auto_issue_certificate` is on: set the enrollment to Completed and issue the certificate (Phase 8 service)
- otherwise: mark it **"Awaiting completion"**, and it shows on the admin dashboard for **Complete & issue**

### 7.3 Frontend
`/student/courses/[code]`: modules as an accordion, a checkbox per lesson, a progress bar that eases to its width, and a completion message.

**Done when:** ticking lessons updates progress everywhere, and a Pending or Cancelled enrollment can't be ticked.

---

## Phase 8 — Certificates and verification

### 8.1 Model and service
- `Certificate`: code `AA-{year}-{n:06d}`, student, course, enrollment (1:1), issued_on, issued_by. Unique on (student, course).
- `certificates.services.issue_certificate(enrollment, by)`:
  - it is idempotent
  - it sets the enrollment to Completed with progress 100
  - it creates the certificate
  - if every one of the student's enrollments is completed, it can set the student to Graduated (to be confirmed with the institute)

### 8.2 API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/me/certificates/` | student | Own certificates |
| GET | `/api/v1/me/certificates/{code}/` | student | Detail for the on-screen certificate |
| GET | `/api/v1/me/certificates/{code}/pdf/` | student | A4 landscape PDF (WeasyPrint from a Django template matching the design) |
| GET | `/api/v1/verify/{code}/` | public, throttled | `{valid: true, code, student_name, course_name, duration, issued_on}` or 404 `{valid: false}`. **Returns nothing else about the student** (privacy rule) |

### 8.3 Frontend
- The **Certificate component**: ivory, navy rule, the fixed-colour logo, the name in EB Garamond italic, ID in mono, a Verified seal and the Director's signature. It scales with its container and has a print stylesheet.
- `/student/certificates`: a list with thumbnails.
- `/student/certificates/[code]`: the full view with Print, Download PDF, and Copy Verification Link (`/verify/AA-2026-000123`).
- `/verify` and `/verify/[code]`: an ID input with valid and not-found states.

**Done when:**
- an issued certificate can be viewed, printed, downloaded and verified publicly
- a wrong ID shows "not found"
- the PDF matches the screen version

---

## Phase 9 — Admin console

All endpoints live under `/api/v1/admin/`, with the `IsAdmin` permission, pagination and `django-filter`. Every write is logged in an `AuditLog` (who, what, when). We build them in this order, **one screen at a time: API → tests → page**.

### 9.1 Dashboard
| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/dashboard/` | KPIs (total students, active enrollments, pending admissions, certificates issued, admissions this month), the latest pending admissions, enrollments awaiting completion, recent contact messages |

### 9.2 Enrollments (first after the dashboard: this is the daily work)
| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/enrollments/` | Filters `status`, `course`, `q` (student name or code) |
| GET | `/admin/enrollments/{code}/` | Detail |
| POST | `/admin/enrollments/{code}/approve/` | Pending → Active (and the student Pending → Active) |
| POST | `/admin/enrollments/{code}/reject/` | `{reason?}` → Cancelled |
| POST | `/admin/enrollments/{code}/complete/` | → Completed + `issue_certificate` |

### 9.3 Students
| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/students/` | Filters `status`, `city`, `q`; pager "Showing a–b of n" |
| POST | `/admin/students/` | Add a student (creates a User with a temporary password, returned once) |
| GET | `/admin/students/{code}/` | Profile, qualifications, enrollments, certificates |
| PATCH | `/admin/students/{code}/` | Edit, including status |
| DELETE | `/admin/students/{code}/` | Soft delete (sets Inactive and deactivates the User); the frontend asks for confirmation first |
| POST | `/admin/students/{code}/reset-password/` | Returns a new temporary password |

### 9.4 Courses
| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/admin/courses/` | List (all statuses) / create |
| GET/PATCH/DELETE | `/admin/courses/{slug}/` | Detail / edit (fees, status, featured, schedule…) / delete (blocked if it has enrollments; set it to Draft instead) |
| PUT | `/admin/courses/{slug}/syllabus/` | Replace the modules and lessons in one call (ordered list) |
| POST | `/admin/courses/{slug}/image/` | Upload the artwork |
| GET/POST | `/admin/categories/` | List / add |
| PATCH/DELETE | `/admin/categories/{slug}/` | Rename / delete (blocked if in use) |

### 9.5 Certificates
| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/certificates/` | Filters `course`, `year`, `q` |
| POST | `/admin/certificates/` | Issue manually: `{student, course}` (it needs that enrollment) |
| GET | `/admin/certificates/{code}/pdf/` | Download any certificate |

### 9.6 Announcements
| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/admin/announcements/` | Tabs All / Published / Draft; create |
| PATCH/DELETE | `/admin/announcements/{id}/` | Edit, publish toggle / delete (confirmation first) |

### 9.7 Media
| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/admin/media/` | List / upload (multipart, image type and size checked) |
| PATCH/DELETE | `/admin/media/{id}/` | Caption and order / delete |

### 9.8 Website content and settings
| Method | Path | Purpose |
|---|---|---|
| GET/PATCH | `/admin/site/content/` | Hero headline and sub, the 4 stats, show_stats, about |
| GET/PATCH | `/admin/site/settings/` | Phone, email, address, registration fee, allow_registration, maintenance_mode, auto_issue_certificate |

### 9.9 Contact messages
| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/contact-messages/` | Filter `handled` |
| PATCH | `/admin/contact-messages/{id}/` | Mark as handled |

### 9.10 Frontend
Pages under `/admin/…`, in the same order as above: Dashboard → Enrollments → Students (list, detail, add/edit) → Courses (list, add/edit with a syllabus editor, categories) → Certificates → Announcements → Media → Website Content → Settings.
- Every destructive action goes through the confirmation Modal.
- Every save shows a toast.
- Every table stacks into cards on mobile.

**Done when:** the office can run a full day's work from the console, from approving an admission through issuing a certificate and posting a holiday notice, without opening Django admin.

---

## Phase 10 — Hardening

1. **Security:**
   - Permission tests for every endpoint (anonymous, student, other student, admin).
   - Throttles on login, admission, contact and verify.
   - Upload checks (type, size, re-encode images with Pillow).
   - Production security settings: `SECURE_*`, HSTS, CSRF for cookie auth, and strict CORS.
2. **Password reset:** by email (`/auth/password-reset/` + `/confirm/`) or by the office (Phase 9.3). Pick one with the institute.
3. **Notifications (optional, pending the institute's answer):** an email or SMS to the office on a new admission, and to the student on approval or certificate.
4. **Performance:**
   - `select_related` / `prefetch_related` on list endpoints
   - database indexes on `status`, `code` and `slug`
   - Next.js ISR for public pages, `next/image` for media
5. **Accessibility:**
   - keyboard navigation
   - Modal focus trap
   - labels on every input
   - 4.5:1 contrast in both themes
   - `prefers-reduced-motion`
6. **Tests:**
   - pytest for models, services, permissions and endpoints (target ≥ 85% of backend code)
   - Playwright end-to-end tests for: admission → approve → tick lessons → complete → verify
7. **SEO:** metadata per page, `sitemap.xml`, `robots.txt`, OG image (`aa-social.png`), JSON-LD `EducationalOrganization` + `Course`.

---

## Phase 11 — Deployment

1. **Backend:** gunicorn behind nginx (or a PaaS), `collectstatic`, and `migrate` + the seed commands on first deploy. Media goes to S3-compatible storage or a mounted volume.
2. **Frontend:** `next build` running on Node (or Vercel); `NEXT_PUBLIC_API_URL` points at the API domain.
3. **Domains:** `animationacademy.in` → frontend, `api.animationacademy.in` → backend. HTTPS everywhere. Set the cookie domain so the refresh cookie works across both.
4. **Postgres:** a managed instance or a Docker volume, with **daily backups**.
5. **CI (GitHub Actions):** lint + tests on each PR, and deploy on merge to `main`.
6. **Go-live checklist:**
   - real Director name on certificates
   - real course images
   - the admin account created
   - sample students removed (the dev seed only)
   - maintenance mode off

---

## Full API index (quick reference)

```
AUTH      POST /auth/login/  POST /auth/refresh/  POST /auth/logout/  GET /auth/me/  POST /auth/change-password/
PUBLIC    GET  /categories/  GET /courses/  GET /courses/{slug}/
          GET  /site/  GET /announcements/  GET /media/  POST /contact/
          POST /admissions/validate/  POST /admissions/
          GET  /verify/{code}/
STUDENT   GET  /me/dashboard/
          GET|PATCH /me/profile/   PUT /me/qualifications/
          GET|POST  /me/enrollments/   GET /me/enrollments/{code}/
          PUT  /me/enrollments/{code}/lessons/{lesson_id}/
          GET  /me/certificates/  GET /me/certificates/{code}/  GET /me/certificates/{code}/pdf/
ADMIN     GET  /admin/dashboard/
          GET  /admin/enrollments/  GET /admin/enrollments/{code}/
          POST /admin/enrollments/{code}/approve|reject|complete/
          GET|POST /admin/students/  GET|PATCH|DELETE /admin/students/{code}/  POST /admin/students/{code}/reset-password/
          GET|POST /admin/courses/   GET|PATCH|DELETE /admin/courses/{slug}/
          PUT  /admin/courses/{slug}/syllabus/  POST /admin/courses/{slug}/image/
          GET|POST /admin/categories/  PATCH|DELETE /admin/categories/{slug}/
          GET|POST /admin/certificates/  GET /admin/certificates/{code}/pdf/
          GET|POST /admin/announcements/  PATCH|DELETE /admin/announcements/{id}/
          GET|POST /admin/media/  PATCH|DELETE /admin/media/{id}/
          GET|PATCH /admin/site/content/  GET|PATCH /admin/site/settings/
          GET  /admin/contact-messages/  PATCH /admin/contact-messages/{id}/
DOCS      GET  /schema/   GET /docs/
```
All paths are prefixed with `/api/v1`.

---

## Decisions still needed (they affect the phases shown)

| Question | Affects | Default until answered |
|---|---|---|
| Auto-issue the certificate at 100% progress, or admin confirms? | Phase 7–8 | Admin confirms (`auto_issue_certificate=False`) |
| Online fee payment (Razorpay/UPI)? | A new phase after 9 | Not built; fees are handled offline by the office |
| Email/SMS notifications? | Phase 10 | Not built |
| Password reset: email, or office-only? | Phase 10 | Office resets from the admin console |
| Director name for certificates | Phase 8 | Placeholder, set via settings |
| Student becomes Graduated automatically when all courses are complete? | Phase 8 | Manual (the admin sets the status) |
