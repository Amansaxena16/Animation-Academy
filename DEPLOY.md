# Deploying Animation Academy

The whole site runs on **Render's free plans** as **one web service** (the website and the API in one container) plus a free Postgres database. Everything Render needs is in the repo:
- `render.yaml`: the Blueprint
- `Dockerfile` and `start.sh`: the combined container
- `.github/workflows/ci.yml`: CI

```
Visitor ──► animation-academy.onrender.com ── one container ──────────────────────────┐
              Next.js website on $PORT                                                  │
                │  /api/v1/*, /django-admin/*, /static/*, /healthz are passed through   │
                └──► Django API (gunicorn) on 127.0.0.1:8000 ──► Render Postgres (free) │
            ────────────────────────────────────────────────────────────────────────────┘
```

**Why one container:** on the free plan, a sleeping service is woken by visitors but *not* by another Render service. With separate services, the website could not wake the API, and pages failed with a 502. In one container, both apps wake together.

**Why the website passes `/api/v1` through:** the browser only ever talks to one address, so the login cookies are first-party.

(`backend/Dockerfile` still builds the API on its own, for hosts that run the two apps separately.)

## Free plan limits

The free plan is for trying the site out. It is not for real students yet.

| Limit | What it means |
|---|---|
| The service sleeps after 15 minutes idle | The next visitor waits about a minute while it wakes up. |
| The free database is deleted after 30 days | Everything entered in that time is lost, unless you move to a paid database first. |
| No storage bucket yet | Uploaded photos aren't shown and are lost on each deploy. Photos are optional, so admissions still work. |

## 1. Create everything from the Blueprint

1. Render → **New → Blueprint** → pick `Amansaxena16/Animation-Academy`. Name it `animation-academy`.
2. Render asks for two values (the office's admin login, created on the first start):
   - `DJANGO_SUPERUSER_EMAIL`: the office's login email
   - `DJANGO_SUPERUSER_PASSWORD`: a strong password, typed by you
3. **Apply.** The first deploy takes 5–10 minutes. The container starts the website first, then runs `manage.py bootstrap`, which does the following:
   - applies database migrations and removes expired login tokens (on every start)
   - loads the 9 courses and the site content, but only on the very first start, so the office's later edits are never overwritten
   - creates the admin login, if no admin exists yet
4. When the service shows **Live**, delete `DJANGO_SUPERUSER_PASSWORD` from its Environment page. The account already exists, and the password shouldn't sit in settings.

If Render had to rename the service (e.g. `animation-academy-xyz1`), change `https://animation-academy.onrender.com` to the real address in `NEXT_PUBLIC_SITE_URL`, `PUBLIC_SITE_URL` and `CSRF_TRUSTED_ORIGINS`, then redeploy.

## 2. Check it

Open https://animation-academy.onrender.com in a private window. Allow a minute on the first visit.

1. The home page and courses show; `/sitemap.xml` lists the courses.
2. `/login` → log in with the admin → you land in the admin console.
3. In **Settings**, fill in the institute details. Change a course's fee, and its public page shows the new fee straight away (this proves instant refresh works).
4. Apply for a course on `/admission` with a test email. In the console, **Approve** it, then **Complete** it, then download the PDF. Open the certificate code at `/verify`.
5. Delete the test student at `https://animation-academy.onrender.com/django-admin/` → Students.
6. **Rate limits:** on `/login`, enter a wrong password 11 times in a minute. The 11th attempt must say to try again later. Then log in from a phone on mobile data; it must work. If the limit never triggers, or blocks everyone, set `TRUSTED_PROXY_COUNT` (try `2`) on the service and check again.

## Everyday updates

- Push to `main`, and GitHub CI runs the tests. When CI passes, Render rebuilds the container and deploys the website and the API together.

## Moving to paid plans (before real students)

1. In `render.yaml`, change the plans, commit and push. Render applies Blueprint changes automatically. Check the prices shown in Render.
   - the database: `plan: free` → `basic-256mb` (or the smallest paid plan Render lists). This keeps the data past 30 days and adds point-in-time recovery.
   - the service: `plan: free` → `starter`. It stops sleeping.
   - optionally set `WEB_CONCURRENCY: "2"`.
2. **Photos:** create a private Cloudflare R2 bucket and an API token with *Object Read & Write* on that bucket.
   - Add `S3_BUCKET`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `NEXT_PUBLIC_MEDIA_ORIGIN` (the R2 endpoint origin) to the service.
   - `NEXT_PUBLIC_MEDIA_ORIGIN` is built into the site, so also add it as an `ARG`/`ENV` in the web stage of the `Dockerfile`, then redeploy.
3. **Backups:** Render's point-in-time recovery covers paid databases. Also keep a monthly copy on the office computer:

   ```bash
   pg_dump "<External Database URL from aa-db → Connect>" -Fc -f aa-$(date +%F).dump
   ```

   It holds students' personal details. Keep it private, and **never put it in the GitHub repo**, which is public. Restore with `pg_restore -d "<database URL>" --no-owner <file>`.

## When you buy a domain

1. On the service: **Settings → Custom Domains** → add `animationacademy.in` and `www`, and follow the DNS instructions. Render issues the HTTPS certificate.
2. Replace `https://animation-academy.onrender.com` with the new address in `NEXT_PUBLIC_SITE_URL`, `PUBLIC_SITE_URL` and `CSRF_TRUSTED_ORIGINS`, then redeploy.
3. Certificates issued earlier print the old link. It keeps working, because the onrender.com address stays.
4. After a few months on HTTPS only, you may set `SECURE_HSTS_PRELOAD=True`. It is hard to undo.

## If something is wrong

Everything logs to the one service: Render → `animation-academy` → **Logs**.

| Symptom | Likely cause |
|---|---|
| First page load takes about a minute | The service was asleep. This is normal on the free plan. |
| Pages show "This page couldn't load" just after waking | Django was still starting (it starts a few seconds after the website). Reload. |
| The very first deploy says "Timed Out" | On the free plan, Render can take ~15 minutes to start the container, and first-start seeding then runs past its deadline. Check the Logs for "Created the admin login": the data is in place. Press **Manual Deploy → Deploy latest commit**. |
| Logging in returns to the login page | The site must be opened over `https://`. |
| Admin edits take 5 minutes to show | `FRONTEND_REVALIDATE_URL` must be `http://127.0.0.1:10000/api/revalidate` (Render's default `PORT` is 10000). |
| "No admin exists" in the logs | `DJANGO_SUPERUSER_EMAIL` and `DJANGO_SUPERUSER_PASSWORD` weren't set on the first start. Set them and restart the service. |
| Django admin says "CSRF verification failed" | Add the address you're using to `CSRF_TRUSTED_ORIGINS`. |
