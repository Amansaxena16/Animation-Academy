# Animation Academy — Project Guide

The single reference for building the Animation Academy website. Read this before starting any feature.

**Sources this guide is built from:**
1. **The design system:** https://claude.ai/artifact/7hHFMdVut76fw24sophiiq. It holds the brand book, tokens and components. Local copies are in `design-system/`.
2. **The prototype:** `Animation Academy Prototype – Desktop · Full prototype (all journeys) (1).html`. It is a clickable prototype of every journey, with sample data and business logic.
3. **`Images/`:** the prospectus pamphlet (courses, syllabi, fees), the paper IOCSGT admission form, `logo.svg` and `name.png`.

Where the sources disagree, the rule is: **design-system README and tokens > prototype > component READMEs**. The known conflicts are listed in §13.

---

## 1. The institute

| | |
|---|---|
| Name | **Animation Academy** — "An ISO 9001:2000 Certified Multimedia Institute" |
| Run by | **IOCSGT Computer Education** (Institute of Computer Science & Graphics' Technology) |
| Address | 107/235 Nehru Nagar, Kanpur, Uttar Pradesh 208012 |
| Phone | 8707447880, 9336202125 |
| Email | info@animationacademy.in |
| Registration fee | **₹250**, one-time |
| Tagline (hero) | "Learn the tools. Build the work." |
| Hero sub | "An ISO 9001:2000 certified multimedia institute in Nehru Nagar, Kanpur — computer, accounting, design and animation courses taught on real machines, from typing to an eighteen-month multimedia diploma." |
| About | "Animation Academy is run by IOCSGT Computer Education at 107/235 Nehru Nagar, Kanpur. Small batches, a machine for every student, and certificates carrying a verifiable ID." |

**Tone:** professional, practical and trustworthy. It should read like a working neighbourhood institute with a real lab and real certificates, not a glossy ed-tech brand.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Backend | **Django** + Django REST Framework |
| Auth | **JWT** (e.g. `djangorestframework-simplejwt`): access + refresh tokens |
| Database | **PostgreSQL** |
| Frontend | **Next.js** (App Router) + **TypeScript** |
| Styling | **Tailwind CSS**, with the design tokens (§5) as CSS variables and mapped into the Tailwind theme |
| Icons | **Lucide** (`lucide-react`), stroke-width 1.75 |
| Fonts | Google Fonts via `next/font`: Archivo, Source Sans 3, EB Garamond (italic 600), JetBrains Mono |

Suggested layout: `backend/` (Django project), `frontend/` (Next.js), and `docker-compose.yml` for Postgres.

---

## 3. Users and roles

The system has **two roles**: **Student** and **Admin**. There is no teacher role (see §13). Public visitors are unauthenticated.

**Scope:** the website **presents the courses and takes enrollments**. All teaching happens in person at the institute: there are no online lessons, no course content and no progress tracking. A student logs in only to see their profile, the courses they are enrolled in (with admission status) and their certificates.

| Role | Sidebar navigation |
|---|---|
| Student | Dashboard · My Courses · Certificates · Profile |
| Admin | Dashboard · Students · Courses · Enrollments · Certificates · Announcements · Website Content · Settings |

**Privacy rule:** the public site shows only courses, fees and aggregate numbers. Student names, parentage, phone numbers, addresses and enrollments appear **only inside authenticated dashboards**.

---

## 4. Pages and screens

### Public site (1200px max width)
Top navigation: **Home · Courses · Admission · About · Updates · Contact**, plus the Login and Register buttons.

| Route | Content |
|---|---|
| `/` Home | Hero (overline "ISO 9001:2000 certified · Nehru Nagar, Kanpur", headline, sub, **Explore Courses** + **Join Animation Academy**, "Monthly fees from ₹700 · one-time registration ₹250") → stats band (count-up: Students trained 500+, Courses offered 20+, Years of teaching 9+, Certificates issued 1000+; admin-editable and can be hidden) → featured courses → flagship (Professional Diploma in Multimedia) → "Why Animation Academy" (6 points, below) → latest updates → CTA |
| `/courses` | Search (e.g. "Try 'Tally' or 'CorelDraw'"), category chips (All, Programming, Accounting, Design, Web Designing, Computer Basics, Multimedia), level and price filters, and a course card grid |
| `/courses/[slug]` | Breadcrumbs, hero, tabs (Overview / Syllabus), the syllabus as information only (a topic list shown in units of 4, or the 5 semesters for PDM), fee box, schedule, next batch start, **Enroll Now** |
| `/admission` (register) | The online admission form, a 4-step stepper: **Account → Personal → Education → Course** (§8) |
| `/about` | About the institute and IOCSGT |
| `/updates` | Published announcements, filterable by category |
| `/verify` (+ `/verify/[id]`) | Certificate verification by ID (`AA-2026-000123`). Shareable link format: `animationacademy.in/verify/<ID>` |
| `/contact` | Address, phones, email, and a form (name, email, message). On success: "Our counsellor will call you within one working day." |
| `/login` | Email + password, with a role toggle (Student / Admin) |

**"Why Animation Academy" (use verbatim):**
1. **ISO 9001:2000 certified**: A certified multimedia institute running to a documented syllabus, not an ad-hoc coaching class.
2. **A machine for every student**: Batches are capped to the lab, so nobody shares a keyboard or watches over a shoulder.
3. **Job-ready syllabi**: Tally Prime with GST returns, CorelDraw, Photoshop, PHP and MySQL — what employers here actually ask for.
4. **Verifiable certificates**: Every certificate carries a unique ID that an employer can check on this website.
5. **Beginner to professional**: Start at typing and computer fundamentals, finish at Maya, ZBrush and After Effect.
6. **Monthly fees**: Pay month by month after a one-time ₹250 registration — no lump sum before you have seen a class.

### Student dashboard (`/student/...`)
- **Dashboard:** greeting, enrolled courses with their status, certificates, upcoming holidays and events.
- **My Courses:** tabs All / Pending / Active / Completed. Each row shows the course, its batch schedule, the fee and the admission status. There are no lessons and no progress bars.
- **Certificates:** list, then view, print or download, and copy the verification link.
- **Profile:** name, father's name, email, phone, DOB, gender, address, pincode, city, state, country, qualification, board, employment.

### Admin console (`/admin/...`; don't clash with Django's `/admin`, so move Django admin to e.g. `/django-admin`)
- **Dashboard:** KPI stat cards, pending admissions (approve or reject inline), recent activity.
- **Students:** searchable, filterable (All / Active / Pending / Inactive / Graduated) and paginated table; student detail; add/edit form.
- **Courses:** list (All / Published / Draft), add/edit (name, kind, category, level, duration, months, fee, description, syllabus topics, start date, schedule).
- **Enrollments:** tabs by status. Actions: **Approve** (Pending → Active, and the student becomes Active), **Reject** (confirmation modal), **Complete & issue** (→ Completed, certificate issued).
- **Certificates:** list and issue (choose student + course).
- **Announcements:** create/edit (title, text, category, date, published toggle), delete via modal.
- **Website Content:** hero headline and sub, the 4 stats, show-stats toggle, about text.
- **Settings:** phone, email, address, registration fee, allow-registration toggle, maintenance mode toggle.

---

## 5. Design tokens

Copies: `design-system/tokens.json` (source of truth) and `design-system/bundle.css` (the reference `aa-` component CSS). Expose the tokens as CSS variables on `:root` / `[data-theme="dark"]` and map them into `tailwind.config`.

### Colour (light / dark)
| Token | Light | Dark | Use |
|---|---|---|---|
| `brand` | `#0a63a8` | `#1470b8` | Azure from the logo sphere. **Leads.** Primary buttons, fee figures, eyebrows, active tabs, the stepper |
| `brand-deep` | `#07497e` | `#0a5c9c` | Hover/pressed on brand |
| `brand-soft` | `#e1f0fb` | `#0e2740` | Fee wells, selected rows, icon wells |
| `on-brand` | `#ffffff` | `#ffffff` | Text on brand |
| `brand-ink` | `#0a5c9c` | `#7dbcea` | Azure text on light grounds |
| `navy` | `#1e3a6b` | `#24457f` | Structure: sidebars, hero bands, footer, course pills |
| `navy-deep` | `#142949` | `#17325c` | Navy hover, footer band |
| `navy-soft` | `#e3e9f4` | `#17203a` | Info badges, selected nav |
| `on-navy` | `#ffffff` | `#ffffff` | Text on navy |
| `navy-ink` | `#1e3a6b` | `#a3bae4` | Links, tab labels |
| `accent` | `#f08030` | `#f08030` | Orange. **Only** for Enroll/pay, ribbons, ratings, the active-nav bar |
| `on-accent` | `#111c2b` | `#111c2b` | Text on accent: **never white** |
| `accent-ink` | `#a8480d` | `#f7ab63` | Amber text (overlines, meta), never body copy |
| `accent-soft` | `#fdeedd` | `#3a230e` | Highlight and holiday badge grounds |
| `surface` | `#f8fafc` | `#0c1119` | Page background |
| `surface-raised` | `#ffffff` | `#141b26` | Cards, modals, inputs |
| `surface-sunken` | `#eef2f7` | `#1b2432` | Table headers, filter bars, skeletons |
| `line` | `#dde5ee` | `#27303e` | Hairline borders |
| `line-strong` | `#7d8ca1` | `#70809a` | Input borders |
| `ink` | `#111c2b` | `#e8edf3` | Primary text |
| `ink-muted` | `#55647a` | `#9aa8bb` | Secondary text |
| `success` / `-ink` / `-soft` | `#15803d` / `#11602e` / `#e2f4e8` | `#2fa757` / `#58d98a` / `#0b2a18` | Always paired with a word |
| `danger` / `-ink` / `-soft` | `#b42318` / `#b42318` / `#fdeae8` | `#e5544a` / `#f78b80` / `#38130f` | Always paired with a word and an icon |
| `focus` | `#0a63a8` | `#7dbcea` | 2px ring, 2px offset |

- **Maroon (`#903028`) is NOT a UI colour.** It exists only inside the wordmark image and the certificate's printed lettering.
- Light is the primary theme. Dark exists mainly for dashboards. **The certificate always stays light** (it prints).
- No gradients except inside artwork. No blue-purple gradients, emoji cards or left-border cards.

### Typography
| Style | Family | Size / line | Weight | Use |
|---|---|---|---|---|
| `display-xl` | Archivo | 54/58 (38px < 720px), -0.02em | 700 | Home hero only |
| `display` | Archivo | 38/46, -0.015em | 700 | Page heroes, CTA bands |
| `h1` | Archivo | 29/36, -0.01em | 700 | Page titles, greetings |
| `h2` | Archivo | 22/30 | 600 | Section titles |
| `h3` | Archivo | 17/24 | 600 | Card titles |
| `pill` | Archivo | 13/18, 0.03em, UPPERCASE | 700 | Prospectus course-header pill on navy |
| `stat` | Archivo | 32/36, -0.02em | 700 | Stat numbers |
| `body-lg` | Source Sans 3 | 17/28 | 400 | Intros |
| `body` | Source Sans 3 | 15/24 | 400 | Default |
| `label` | Source Sans 3 | 14/20 | 600 | Labels, buttons, nav |
| `small` | Source Sans 3 | 13/20 | 400 | Meta, helper text |
| `overline` | Source Sans 3 | 12/16, 0.08em, UPPERCASE | 700 | Eyebrows in `accent-ink` or `brand-ink` |
| `certificate-name` | EB Garamond italic | 46/54 | 600 | Certificate recipient only |
| `mono` | JetBrains Mono | 13/20 | 500 | IDs (certificates, students, enrollments, receipts) |

Font stacks: display `Archivo, "Arial Narrow", "Segoe UI", system-ui, sans-serif`; sans `"Source Sans 3", "Segoe UI", system-ui, sans-serif`; serif `"EB Garamond", Georgia, serif`; mono `"JetBrains Mono", ui-monospace, monospace`. For any Hindi content, add **Noto Sans Devanagari**.

### Spacing, radius and shadow
- **Spacing (4px base):** `space-1` 4 · `2` 8 · `3` 12 · `4` 16 · `6` 24 · `8` 32 · `12` 48 · `16` 64 · `24` 96.
- **Radius:** `sm` 5 (badges) · `md` 8 (buttons, inputs) · `lg` 14 (cards, modals) · `xl` 22 (hero media, CTA bands, certificate) · `pill` 999.
- **Shadow:**
  - `shadow-sm` `0 1px 2px rgba(17,28,43,.07)`: resting cards.
  - `shadow-md` `0 8px 22px -8px rgba(17,28,43,.16)`: hover, dropdowns.
  - `shadow-lg` `0 22px 46px -16px rgba(10,99,168,.28)`: modals, hero media, certificate.
  - Dark theme shadows use `rgba(0,0,0,…)` (see tokens.json). Borders (`line`) do most of the separating.

### Layout and breakpoints
- Public pages: max width **1200px**. Sections are `space-24` apart on desktop and `space-12` on mobile.
- Dashboards: **260px sidebar** plus fluid content, `space-6` gutters and card padding (`space-4` on mobile).
- Breakpoints:
  - **1024px:** the sidebar becomes a drawer.
  - **720px:** the BottomNav appears and tables stack into cards.
  - **640px:** forms and grids go to a single column.
- Course grid: 3 columns ≥1024px, 2 columns ≥640px, 1 column below.

### Motion and states
- **Motion:**
  - 150–250ms, `cubic-bezier(.2,.8,.2,1)`.
  - Cards lift 2px on hover; course art zooms 4%.
  - Stats count up once on first view.
  - Respect `prefers-reduced-motion`.
- **Focus:** 2px `focus` outline with 2px offset on everything interactive.
- **Hover:** darkens fills (`brand-deep`, `navy-deep`) or strengthens borders.
- **Disabled:** 50% opacity.
- **Loading:** spinner inside the button (`is-loading`); `aa-skel` shimmer for content.
- **Errors:** `danger` border with a `danger-ink` message under the field.
- **Contrast:** text needs 4.5:1 (3:1 for 24px+ text and for control borders, focus rings and icons) in **both** themes.

---

## 6. Components

The reference implementation is `design-system/bundle.css` (`aa-` prefix, wrap surfaces in `.aa`). Rebuild each one as a React component styled with Tailwind + tokens, keeping the same variants.

| Component | Key rules |
|---|---|
| **Logo** | Two separate images side by side: `aa-mark.png` (sphere) + `aa-wordmark.png`. Swap to `aa-wordmark-reversed.png` on navy and in dark mode (the sphere stays in colour). `--fixed` pins the colour wordmark (used on the certificate). Below ~200px wide use the sphere alone. Never set a width, recolour, rotate or redraw it. Clear space = sphere height. Mark 42px / type 34px (sm 32/25, lg 64). |
| **Button** | `primary` (azure; **one per view**), `navy` (strong alternative, e.g. Download Prospectus), `accent` (orange; **only** Enroll Now and fee payment), `secondary` (outline), `ghost`, `danger` (always behind a confirmation Modal), `inverse` (on navy). Sizes: sm 34px, default 42px, lg 50px; `block`, `icon`. Labels are Title Case verbs. 18px icons; a trailing arrow only for forward navigation. |
| **Badge** | Always a word, never colour alone. Levels: Beginner = neutral, Intermediate = info, Advanced = brand. Enrollment: Active = info, Pending = warning, Completed = success, Cancelled = danger. Student: Active = info, Inactive = neutral, Graduated = success, Pending = warning. Course: Published = success, Draft = neutral. Announcement: Holiday = warning, Course Update = info, Exam = brand, Event = success, Important Notice = danger, General = neutral. `--dot` for live statuses. `--navy` solid = prospectus pill. |
| **CourseCard** | 16:10 artwork (+ optional tag badge such as "Most enrolled", "Flagship", "CCC"), "Diploma · 6 Months", level badge, title, 2-line description, meta, fee (`₹800/month` + "₹4,800 total · ₹250 registration"), rating, then **View Details** (secondary) and **Enroll Now** (accent). |
| **FeeBox** | Standalone fee panel on the course page. |
| **StatCard** | Icon well (blue/amber/green) + optional delta, value in `stat` style, label. Rows of 4–6 on desktop, 2 per row on mobile. |
| **FormField** | Label (+ `*` for required), control (44px), helper text, 6px gap; `is-error` / `is-valid`. Extras: input with icon, radio-card, checkbox, photo upload drop zone. **Validate on blur**; error copy says how to fix it. |
| **Stepper** | Account → Personal → Education → Course; one-word labels; done steps show a check. |
| **Tabs / Seg** | Tabs for page sections (horizontal scroll on mobile); a segmented control for in-place filters (All / Active / Completed). |
| **Table** | Card → table; the first column is the entity (avatar, name, ID); row actions are right-aligned icon buttons with `aria-label`; delete opens the Modal; stacks into labelled cards below 720px (`data-label`); paginate 10–25 rows with "Showing a–b of n". |
| **Breadcrumbs** | Course detail and admin detail/edit pages; the last item is not a link. |
| **Announcement** | Date tile (day + month), category badge, title, one-line summary. |
| **Alert / Toast** | info / success / warning / danger, icon first. Success toasts auto-dismiss after 4s; errors stay until closed. |
| **Modal** | Required before every destructive action. Icon, a title naming the object, text naming the consequence, then Cancel (secondary, **focused on open**) and a danger verb repeating the object ("Remove student"). Esc or an overlay click cancels. |
| **EmptyState** | Icon, title, one helpful sentence, one action. |
| **Sidebar** | Navy ground, inverse logo, amber inset bar on the active item, group labels, counts, sub-links. It becomes a drawer below 1024px. |
| **BottomNav** | Mobile (<720px), 4–5 icon+label items, 48px targets, safe-area padding. |
| **Avatar** | 32 / 40 / 64 / 120px; photo or two initials; tints rotate brand-soft / accent-soft / navy-soft / success-soft. |
| **Certificate** | See §9. |
| **Timeline** | Keyframe-diamond list; not needed while there is no teacher role. |

**Icons:** Lucide, 24px grid, stroke 1.75, round caps, `currentColor`. 18px in buttons, 20px in stat wells and nav, 15px in meta rows. Icons never replace a label (except in the BottomNav, which still shows text).

**Logo files** (in `design-system/logos/`, copy to `frontend/public/brand/`):
- `aa-mark.png`: the sphere.
- `aa-wordmark.png` and `aa-wordmark-reversed.png`: the wordmark and its ivory version.
- `aa-mark-512.png`: favicon and app icon.
- `aa-social.png`: OG and profile image.
- `aa-lockup.png` and `aa-lockup-reversed.png`: for email and third-party listings only, never in the product.

---

## 7. Content rules

- **Course and tool names are exactly as the prospectus prints them.** Never modernise them: "DCA — Programming", "Tally Prime with GST", "CorelDraw X7", "Macromedia Flash", "Swiss Max", "Maya & Zbrush".
- **Fees are monthly.** Lead with the monthly figure and duration ("₹800 per month · 6 Months"). Put the total and the ₹250 registration fee in secondary text. **Never show a total on its own.** The PDM states its own terms: **₹4,000 + ₹3,000 × 17**.
- **Numbers** use Indian grouping (`₹4,800`, `1,24,500`, via `toLocaleString('en-IN')`). Durations use the prospectus wording: "6 Months", "1½ Months", "1 Year", "18 Months".
- **Dates:** "24 September 2026" in documents; "24 Sep" in tables.
- **Voice:** plain, warm and direct. Address the student as "you" and the institute as "we". Say what a course leads to, not what it promises.
- **Casing:** Title Case for buttons and nav, sentence case for headings. **No emoji anywhere.**

---

## 8. Admission form (mirrors the paper IOCSGT form)

Ask for the same fields in the same order as the paper form:

1. **Account:** email, password (≥ 8 chars).
2. **Personal:**
   - Name (**in capitals**, as it should appear on the certificate)
   - **Father's Name**
   - Address, **Pincode** (6 digits) and City (default Kanpur)
   - Mobile (10 digits) and Phone (optional)
   - Date of Birth
   - **Photo** upload
3. **Education:** a qualification table with one row each for **High School, Intermediate, Graduation, Post Graduation**. Columns: Year · Board/Univ. · Subject · %. At least the High School year and board are required.
4. **Course:**
   - Course Applied For
   - Duration (derived from the course)
   - **Employment Status**: Student / Unemployed / Employed / Self-employed / Part-time
   - A fee summary
   - The line **"No refund allowed after confirmation of admission."**, shown **before** the final confirm button

Validation messages from the prototype (reuse them):
- "Enter your full name in capitals, as it should appear on the certificate."
- "Father's name is required."
- "Enter a 6-digit pincode, e.g. 208012."
- "Enter a 10-digit mobile number."
- "Enter a valid email, e.g. name@example.com"
- "Use at least 8 characters."
- "Fill in at least the High School row — year and board."

Submitting creates a **Student (Pending)** and an **Enrollment (Pending)**. The office confirms within one working day.

---

## 9. Certificate

- Certificate of Completion, **A4 landscape** (ratio 1.414), always light: ivory stock, navy rule, maroon title, orange seal ring.
- **Content:**
  - Logo (`--fixed`) and the line "IOCSGT Computer Education · Nehru Nagar, Kanpur".
  - "Certificate of Completion" and "This certificate is proudly presented to" **[Name in EB Garamond italic]**.
  - "for successfully completing" **[Course name as printed]**.
  - Meta: ID (mono) · Duration · Completed date ("24 September 2026").
  - A Verified seal and the Director's signature.
- It scales with its container (container query units), so the same markup renders as thumbnail, screen and print. It also needs a print stylesheet and a PDF download.
- **Every certificate is verifiable** on the public `/verify` page by ID.

---

## 10. Data model (Django)

**3 apps with models, 7 models** (plus `common/`, a helper package with no models). IDs are human-readable and shown in mono. Each is built from the row's auto-increment PK (`common/ids.py`) and stored in a unique `code` field.

| App | Model | Fields |
|---|---|---|
| `accounts` | **User** (custom, email login) | email (unique), password, full_name, role (`student` / `admin`), is_active |
| `website` | **Course** | slug, name, kind (Diploma/Certificate/PG Diploma/Professional Diploma), category (choices: Programming, Accounting, Design, Web Designing, Computer Basics, Multimedia), level (Beginner/Intermediate/Advanced), duration_label ("6 Months"), months, monthly_fee, first_month_fee (nullable; only the PDM: ₹4,000, then monthly_fee ₹3,000 for the other 17 months), description, **syllabus (JSON)**, image, featured, tag, status (Published/Draft), schedule ("Mon–Fri, 10–11 AM"), next_batch_start, sort order |
| `students` | **Student** (1:1 User) | code `AA-STU-NNNN`, name, father_name, mobile, phone, dob, gender, address, pincode, city, state (default Uttar Pradesh), country (India), photo, employment (Student/Unemployed/Employed/Self-employed/Part-time), **qualifications (JSON)**, status (Pending/Active/Inactive/Graduated), joined date |
| `students` | **Enrollment** | code `EN-NNNN`, student FK, course FK, applied date, status (Pending/Active/Completed/Cancelled), approved_at, completed_at, note, **certificate_code** `AA-YYYY-NNNNNN` (unique, blank until issued), **certificate_issued_on**, **certificate_issued_by** |
| `website` | **SiteSettings** (singleton) | hero headline, hero sub, stat1–4, show_stats, about, phone, email, address, registration_fee (250), allow_registration, maintenance_mode, director_name |
| `website` | **Announcement** | title, text, category (General/Holiday/Course Update/Exam/Event/Important Notice), date, published |
| `website` | **ContactMessage** | name, email, phone, message, created_at, handled |

**JSON fields, and why they aren't separate tables:**
- **`Course.syllabus`** is displayed, never tracked, so it is a list of groups:
  ```json
  [{"title": "Sem-I — Graphic Designing", "duration": "1½ Months",
    "tools": "Adobe Photoshop, Adobe Illustrator", "items": ["...", "..."]}]
  ```
  Ordinary courses have a single group with an empty title, and the course page shows its items in units of 4. The PDM has 5 groups, one per semester.
- **`Student.qualifications`** is always the same 4 rows from the paper form:
  ```json
  [{"exam": "High School", "year": "2020", "board": "UP Board", "subject": "Science", "percentage": "78"}, ...]
  ```
  The serializer checks the exam names and that the High School row has a year and a board.

**Certificates are part of Enrollment.** A completed enrollment has at most one certificate, so there is no separate table. "Has a certificate" means `certificate_code` is set. The Verify page looks up an enrollment by `certificate_code`.

**ID formats** (from the PK, so they are unique without a counter table; numbers can skip):
- Student: `AA-STU-{1000 + pk}`
- Enrollment: `EN-{2000 + pk}`
- Certificate: `AA-{issue year}-{enrollment pk:06d}`. It does not restart each year.

**Computed:**
- `total = monthly_fee × months`
- With a first-month fee: `total = first_month_fee + monthly_fee × (months − 1)`. For the PDM that is 4000 + 3000 × 17 = **₹55,000**

**Removed during planning, and why:**
- **CourseCategory:** 6 fixed categories work as choices.
- **CourseModule and Lesson:** the syllabus is only displayed, so it lives in `Course.syllabus`.
- **Qualification:** replaced by `Student.qualifications`.
- **LessonProgress:** there are no online lessons.
- **MediaItem:** there is no gallery.
- **The separate `enrollments` and `certificates` apps:** they were folded into `students`.
- **Certificate:** its fields moved onto Enrollment (1:1).
- **Sequence:** codes come from the PK instead.
- **`courses` and `content` apps:** merged into `website`, which holds everything public and office-edited.

---

## 11. Business rules and flows

1. **Public admission (new user)** → Student `Pending` + Enrollment `Pending`. The toast reads "Admission requested — [course] is awaiting confirmation."
2. **Logged-in student taps Enroll Now:**
   - If they are already enrolled in that course: "Already enrolled — Find it under My Courses."
   - Otherwise a confirmation modal shows: "Apply for [course]?", then "[fee] per month for [dur], plus a one-time registration fee of ₹250. The next batch starts [date]. The office confirms your seat within one working day. No refund is allowed after confirmation of admission." The button is **Confirm Admission**, and it creates a Pending enrollment.
3. **Admin Approve:** Enrollment → `Active`, and the Student → `Active` if they were Pending. Toast: "Admission confirmed."
4. **Admin Reject:** a confirmation modal, then the enrollment is cancelled. Copy: "…will be cancelled and they will be informed by phone."
5. **Studying happens at the institute.** The enrollment stays `Active` while the student attends. There is nothing to track online.
6. **Admin Complete & issue:** Enrollment → `Completed`, and a certificate is issued if that enrollment doesn't have one. **Only an admin can complete a course**; nothing is issued automatically.
7. **Certificate IDs** are the issue year plus the enrollment number: `AA-2026-000057`. They are unique but not consecutive (see §10).
8. **Verify:** a public lookup by ID returns the student name, course, duration and date, or a "not found" state.
9. **Settings:**
   - `allow_registration = false` hides or disables admission.
   - `maintenance_mode` shows a maintenance page to the public.
   - `show_stats` toggles the home stats band.
10. **Announcements:** only `published` ones appear on the public site and dashboards. Home shows the latest 4; "upcoming" shows Holiday and Event items.
11. **Destructive actions** (delete student, course or announcement; reject) always go through the Modal.

---

## 12. Seed data: courses (from the prospectus)

Fees are **per month**. Registration is ₹250 for every course.

| slug | Name | Kind | Category | Level | Duration | Fee | Total | Tag |
|---|---|---|---|---|---|---|---|---|
| `dca-prog` | DCA — Programming | Diploma | Programming | Beginner | 6 Months | ₹850 | ₹5,100 | |
| `dca-acc` | DCA — Accounting | Diploma | Accounting | Beginner | 6 Months | ₹800 | ₹4,800 | Most enrolled |
| `dtp` | Desk Top Publishing | Certificate | Design | Beginner | 6 Months | ₹800 | ₹4,800 | |
| `dwd` | DWD — Web Designing | Diploma | Web Designing | Advanced | 6 Months | ₹1,000 | ₹6,000 | |
| `ccc` | Course on Computer Concepts | Certificate | Computer Basics | Beginner | 3 Months | ₹1,200 | ₹3,600 | CCC |
| `pgdca` | PGDCA | PG Diploma | Accounting | Intermediate | 1 Year | ₹700 | ₹8,400 | |
| `pgdwd` | PG Diploma in Web Designing | PG Diploma | Web Designing | Intermediate | 1 Year | ₹800 | ₹9,600 | |
| `pgctt` | PG Diploma in Computer Teachers Training | PG Diploma | Programming | Intermediate | 15 Months | ₹800 | ₹12,000 | |
| `pdm` | Professional Diploma in Multimedia | Professional Diploma | Multimedia | Advanced | 18 Months | ₹4,000 + ₹3,000 × 17 | ₹55,000 | Flagship |

Featured on Home: dca-prog, dca-acc, dtp, dwd, ccc, pdm.

**Descriptions and syllabi:**
- **DCA — Programming**
  - Description: "Computer fundamentals and MS Office through to programming technique, C, and HTML & CSS."
  - Syllabus: Computer Fundamental · Windows 7 · Typing Master · MS Office — MS Word · MS Office — MS Excel · MS Office — MS PowerPoint · Internet Operating · Programming Technique & System Concept · Programming in 'C' · HTML & CSS
  - Schedule: Mon · Wed · Fri, 4–6 PM · starts 6 Oct 2026
- **DCA — Accounting**
  - Description: "Computer fundamentals, MS Office and Tally Prime with GST, including GSTR1 and GSTR 3B return filing."
  - Syllabus: Computer Fundamental · Windows 7 · Typing Master · MS Office — MS Word · MS Office — MS Excel · MS Office — MS PowerPoint · Internet Operating · Manual Accounting Concept · Accounting Package — Tally 9.0 · Tally Prime with GST · Return File GSTR1 & GSTR 3B
  - Schedule: Mon–Fri, 10–11 AM · starts 6 Oct 2026
- **Desk Top Publishing**
  - Description: "CorelDraw X6 and Adobe Photoshop for print work, on top of computer fundamentals and MS Word."
  - Syllabus: Computer Fundamental · Windows 7 · Typing Master · MS Word · CorelDraw X6 · Adobe Photoshop · Internet Operating
  - Schedule: Tue · Thu · Sat, 5–7 PM · starts 8 Oct 2026
- **DWD — Web Designing**
  - Description: "Photoshop, Flash and Dreamweaver through to HTML, CSS, PHP, MySQl and JavaScript (jQuery)."
  - Syllabus: Internet Operating · Adobe Photoshop · Flash · Adobe Dreamweaver · CSS (Cascade Style Sheet) · HTML · PHP · MySQl · JavaScript (jQuery)
  - Schedule: Mon–Fri, 7–8:30 PM · starts 3 Nov 2026
- **Course on Computer Concepts**
  - Description: "The CCC syllabus: Windows, MS Office, internet, e-governance services, digital payments and cyber security."
  - Syllabus: Introduction to Computer · Windows 7 · MS Word · MS Excel · MS PowerPoint · Introduction to Internet & WWW · E-mail, Social Networking and eGovernance Services · Digital Financial Tools & Application · Overview of Futureskills & Cyber Security
  - Schedule: Mon–Fri, 12–1 PM · starts Every Monday
- **PGDCA**
  - Description: "A year covering accounting with Tally Prime and GST returns alongside CorelDraw, Photoshop, Flash and Dreamweaver."
  - Syllabus: Computer Fundamental · Windows 7 · Typing Master · MS Office — MS Word · MS Office — MS Excel · MS Office — MS PowerPoint · Manual Accounting Concept · A/c Package Tally9 & Tally Prime GST · Return File GSTR1 & GSTR 3B · CorelDraw X7 · Adobe Photoshop · Basic Flash · Adobe Dreamweaver · CSS · HTML · Internet Operating
  - Schedule: Mon · Wed · Fri, 6–8 PM · starts 12 Oct 2026
- **PG Diploma in Web Designing**
  - Description: "A year of web work: CorelDraw and advanced Photoshop through Flash Advance, Swish Max, PHP, MySQL and jQuery."
  - Syllabus: Computer Fundamental · Windows 7 · Typing Master · MS Office — MS Word · MS Office — MS Excel · MS Office — MS PowerPoint · CorelDraw X6 · Adobe Photoshop (Advance) · Flash Advance · Swish Max · Adobe Dreamweaver · CSS (Cascade Style Sheet) · HTML · PHP Language · MySQL · JavaScript (jQuery) · Internet Operating
  - Schedule: Tue · Thu · Sat, 6–8 PM · starts 13 Oct 2026
- **PG Diploma in Computer Teachers Training**
  - Description: "Fifteen months combining the PGDCA and PG Diploma in Web Designing syllabi, for those who want to teach computers."
  - Syllabus: Covers the full PGDCA syllabus (1 Year) · Covers the full PG Diploma in Web Designing syllabus (1 Year) · Teaching practice and lab supervision
  - Schedule: Mon–Sat, 2–4 PM · starts 20 Oct 2026
- **Professional Diploma in Multimedia**
  - Description: "Five semesters from graphic design and 2D animation through A/V editing, 3D modeling in Maya and ZBrush, to compositing in After Effect."
  - Schedule: Mon–Sat, 11 AM–2 PM · starts 12 Oct 2026
  - Semesters:
    - **Sem-I Graphic Designing** (1½ Months; Adobe Photoshop, Adobe Illustrator): Adobe Photoshop — Image Editing Work · Adobe Photoshop — Designing Work · Adobe Illustrator — Cartoon Designing · Adobe Illustrator — 3D Product Designing
    - **Sem-II 2D & Web Animation** (3 Months; Macromedia Flash, Dreamweaver, Swiss Max): Flash — Basics: Key Frame Animation, Motion & Shape Tween, Masking · Flash — 2D Story · Flash — Website · Dreamweaver — Website using Photoshop Web Template · Swiss Max
    - **Sem-III A/V Editing** (1½ Months; Adobe Premiere, Sound Forge): Adobe Premiere — A/V Editing, Remix, Promo, Add · Sound Forge — Sound Editing, Remix
    - **Sem-IV 3D Modeling, Animation & Sculpting** (9 Months; Maya & Zbrush): 3D Modeling — Interior & Exterior · 3D Modeling — Car Modeling · 3D Modeling — Character Modeling · Lighting & Texturing · Rigging · Animation · Rendering · Sculpting
    - **Sem-V Compositing** (3 Months; After Effect): After Effect — compositing and finishing

**Sample announcements** (from the prototype):
- Institute closed for Gandhi Jayanti (2 Oct, Holiday)
- New batch: Professional Diploma in Multimedia (28 Sep, Course Update; 20 seats, registration closes 5 Oct)
- CCC practical assessment (6 Oct, Exam)
- Student showreel & print display (18 Oct, Event)
- Dussehra holidays (20 Oct, Holiday)
- GST module updated in DCA — Accounting (22 Sep, Important Notice)
- Diwali break schedule (8 Nov, Holiday, unpublished)

The prototype also has 14 sample students (`AA-STU-1038`…`1121`), 21 enrollments and 5 certificates. Use them for a dev seed only.

---

## 13. Conflicts and open questions

**Conflicts between the sources, with the resolution to follow:**
- **The primary colour is azure `brand`, not maroon.** The Button, Badge and CourseCard READMEs still say "maroon" in places; that is stale. The main README and tokens say maroon is not a UI colour.
- **There is no teacher role.** The design-system README says so, but the Sidebar, Breadcrumbs, Table and Timeline READMEs and the prototype (`t: 'ankit'`, instructor names on cards and certificates) still mention teachers. Decision to follow: no instructor is shown publicly. The CourseCard README asks for an instructor line and the Certificate README for an instructor signature; drop both. The certificate keeps only the Director's signature.
- **The prototype's placeholder body CSS** (`#1d4ed8` links, DM Sans) is leftover. Ignore it.

**Open questions for the institute or owner:**
1. ~~Auto-issue certificates at 100% progress?~~ **Decided:** there is no progress tracking; an admin completes the course and issues the certificate.
2. Is fee **payment** online (Razorpay/UPI) or tracked offline by the office? The `accent` button is reserved for "fee payment", but the prototype has no payment flow.
3. Should admission send an email or SMS notification to the office or the student?
4. Who is the Director named on certificates? (The preview uses the placeholder "Anil Verma". The name is stored in `SiteSettings.director_name`.)
5. Where does the course artwork come from? The prototype's images weren't embedded. Per the design system, use flat geometric illustrations in the palette until real Nehru Nagar lab photos exist; never staged stock. (A photo gallery is out of scope.)
6. Prospectus spellings: keep "Swish Max" / "Swiss Max" and "MySQl" exactly as printed, or correct them?

---

## 14. Build checklist

- [ ] Tokens are CSS variables (light + dark via `[data-theme]`) mapped into Tailwind; fonts load via `next/font`
- [ ] Logo component uses the two-image rule and the theme swap
- [ ] Every `aa-` component is ported to React + Tailwind
- [ ] Indian number formatting helper (`₹` + `en-IN`) and fee helpers (monthly, total, PDM special)
- [ ] Django models, migrations and a seed command with the prospectus courses
- [ ] JWT auth with role-based permissions (student sees only their own data)
- [ ] Public pages → admission flow → student portal (profile, enrollments, certificates) → admin console
- [ ] Certificate: print CSS, PDF, and a public verify endpoint
- [ ] Responsive at 1024 / 720 / 640; `prefers-reduced-motion` respected; 4.5:1 contrast in both themes
- [ ] No emoji; Title Case buttons; prospectus names verbatim
