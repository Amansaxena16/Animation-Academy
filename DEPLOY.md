# Deploying Animation Academy

The whole site runs on **Render's free plans**: the website, the API and the Postgres database. Everything Render needs is in the repo: `render.yaml` (the Blueprint), `backend/Dockerfile`, and `.github/workflows/ci.yml`.

```
Visitor ──► animation-academy.onrender.com (website, Next.js)
              │  /api/v1/* is passed through
              └──► animation-academy-api.onrender.com (API, Django + gunicorn) ──► Render Postgres (free)
```

**Why the website passes `/api/v1` through:** the browser only ever talks to the website's own address. The login cookies are therefore first-party, and there are no cross-site cookie settings to get wrong. The Django admin is served on the API's address, at `/django-admin/`.

## Free plan limits

The free plan is for trying the site out. It is not for real students yet.

| Limit | What it means |
|---|---|
| Services sleep after 15 minutes idle | The next visitor waits about a minute while the website and the API wake up. |
| The free database is deleted after 30 days | Everything entered in that time is lost, unless you move to a paid database first. |
| No storage bucket yet | Uploaded photos aren't shown and are lost on each deploy. Photos are optional, so admissions still work. |

## 1. Create everything from the Blueprint

1. Render → **New → Blueprint** → pick `Amansaxena16/Animation-Academy`. Name it `animation-academy`.
2. Render asks for two values (the office's admin login, created on the first start):
   - `DJANGO_SUPERUSER_EMAIL`: the office's login email
   - `DJANGO_SUPERUSER_PASSWORD`: a strong password, typed by you
3. **Apply.** The first deploy takes 5–10 minutes. When the API starts, it runs `manage.py bootstrap`, which does the following:
   - applies database migrations and removes expired login tokens (on every start)
   - loads the 9 courses and the site content, but only on the very first start, so the office's later edits are never overwritten
   - creates the admin login, if no admin exists yet
4. When both services show **Live**, delete `DJANGO_SUPERUSER_PASSWORD` from the API's Environment page. The account already exists, and the password shouldn't sit in settings.

If Render had to rename a service (e.g. `animation-academy-xyz1`), the addresses in `render.yaml` are wrong. Update these to the real addresses and redeploy:
- the API: `PUBLIC_SITE_URL`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_REVALIDATE_URL`
- the website: `API_INTERNAL_URL`, `NEXT_PUBLIC_SITE_URL`

## 2. Check it

Open https://animation-academy.onrender.com in a private window. Allow a minute on the first visit.

1. The home page and courses show; `/sitemap.xml` lists the courses.
2. `/login` → log in with the admin → you land in the admin console.
3. In **Settings**, fill in the institute details. Change a course's fee, and its public page shows the new fee straight away (this proves instant refresh works).
4. Apply for a course on `/admission` with a test email. In the console, **Approve** it, then **Complete** it, then download the PDF. Open the certificate code at `/verify`.
5. Delete the test student at `https://animation-academy-api.onrender.com/django-admin/` → Students.
6. **Rate limits:** on `/login`, enter a wrong password 11 times in a minute. The 11th attempt must say to try again later. Then log in from a phone on mobile data; it must work. If the limit never triggers, or blocks everyone, set `TRUSTED_PROXY_COUNT=2` on the API and check again.

## Everyday updates

- Push to `main`, and GitHub CI runs the tests. When CI passes, Render redeploys whichever service changed: `backend/` → the API, `frontend/` → the website.
- Keep API changes backwards-compatible (add new fields first, remove old ones later), because the two services deploy separately.

## Moving to paid plans (before real students)

1. In `render.yaml`, change the plans, commit and push. Render applies Blueprint changes automatically. Check the prices shown in Render.
   - the database: `plan: free` → `basic-256mb` (or the smallest paid plan Render lists). This keeps the data past 30 days and adds point-in-time recovery.
   - both services: `plan: free` → `starter`. They stop sleeping.
   - optionally add `WEB_CONCURRENCY: "2"` on the API.
2. **Photos:** create a private Cloudflare R2 bucket and an API token with *Object Read & Write* on that bucket.
   - Add `S3_BUCKET`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` to the API.
   - Add `NEXT_PUBLIC_MEDIA_ORIGIN` (the R2 endpoint origin) to the website, then redeploy it.
3. **Backups:** Render's point-in-time recovery covers paid databases. Also keep a monthly copy on the office computer:

   ```bash
   pg_dump "<External Database URL from aa-db → Connect>" -Fc -f aa-$(date +%F).dump
   ```

   It holds students' personal details. Keep it private, and **never put it in the GitHub repo**, which is public. Restore with `pg_restore -d "<database URL>" --no-owner <file>`.

## When you buy a domain

1. On the website service: **Settings → Custom Domains** → add `animationacademy.in` and `www`, and follow the DNS instructions. Render issues the HTTPS certificate.
2. Replace `https://animation-academy.onrender.com` with the new address in all six variables listed in step 1, then redeploy both services.
3. Certificates issued earlier print the old link. It keeps working, because the onrender.com address stays.
4. After a few months on HTTPS only, you may set `SECURE_HSTS_PRELOAD=True` on the API. It is hard to undo.

## If something is wrong

| Symptom | Likely cause |
|---|---|
| First page load takes about a minute | Free services were asleep. This is normal on the free plan. |
| The very first API deploy says "Timed Out" | On the free plan, Render can take ~15 minutes to start the container, and first-start seeding then runs past its deadline. Check the Logs for "Created the admin login": the data is in place. Press **Manual Deploy → Deploy latest commit** and it goes live in under a minute. |
| Website build fails: "API_INTERNAL_URL must give the API's full URL" | `API_INTERNAL_URL` is missing on the website. |
| `/api/v1/...` gives 404 or 502 | `API_INTERNAL_URL` is wrong, or the API is down (`/healthz` on the API). Redeploy the website after fixing it. |
| Logging in returns to the login page | The site must be opened over `https://`, and `NEXT_PUBLIC_API_URL` must be `/api/v1`. |
| Admin edits take 5 minutes to show | `FRONTEND_REVALIDATE_URL` on the API is wrong. |
| "No admin exists" in the API's logs | `DJANGO_SUPERUSER_EMAIL` and `DJANGO_SUPERUSER_PASSWORD` weren't set on the first start. Set them and restart the API. |
| Django admin says "CSRF verification failed" | Add the address you're using to `CSRF_TRUSTED_ORIGINS`. |
