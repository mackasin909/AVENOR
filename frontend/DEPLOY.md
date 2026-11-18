# Deploying AVENOR to Vercel

The site runs on Vercel's free **Hobby** plan (personal / portfolio use).
Two free services keep the data that Vercel itself cannot store:

| What | Service | Why |
|---|---|---|
| Database | [Turso](https://turso.tech) (cloud SQLite) | Vercel's disk is temporary |
| Car photos uploaded on the site | Vercel Blob | Same reason, plus Vercel's ~4.5 MB request limit |

Locally nothing changes: the SQLite file `prisma/dev.db` and the `uploads/`
folder are used when the Turso / Blob variables are empty.

Commands below are for PowerShell, run in the `frontend` folder.

---

## 1. Create the Turso database

1. Sign up at <https://turso.tech> (GitHub login works).
2. In the dashboard create a database, e.g. `avenor`. Pick the region
   closest to you (or to the Vercel region you will use).
3. Open the database and copy:
   - **Database URL** — looks like `libsql://avenor-yourname.turso.io`
   - **Auth token** — create one with read & write access.

## 2. Create the tables and add the cars

Point the scripts at Turso for this terminal session only (your `.env`
stays on the local file):

```powershell
$env:DATABASE_URL = "libsql://avenor-yourname.turso.io"
$env:TURSO_AUTH_TOKEN = "<your token>"
npm run db:deploy
npm run db:seed
```

`db:deploy` applies everything in `prisma/migrations` (safe to run again
after future migrations); `db:seed` adds the 18 demo cars.

Close the terminal (or open a new one) afterwards so later local commands
use the local database again.

## 3. Create the Vercel project

1. Sign up at <https://vercel.com> with your GitHub account.
2. **Add New → Project**, import the `AVENOR` repository.
3. **Root Directory**: click *Edit* and choose `frontend`. The framework is
   detected as Next.js; keep the default build settings.
4. Before clicking *Deploy*, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | your Turso URL (`libsql://…`) |
   | `TURSO_AUTH_TOKEN` | your Turso token |
   | `WHATSAPP_PHONE` | dealer number, digits only (optional) |

5. Click **Deploy**.

## 4. Connect Vercel Blob (photo uploads)

1. In the project open **Storage → Create → Blob**, create a store and
   connect it to the project (all environments).
2. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.
3. Go to **Deployments**, open the latest one → **⋯ → Redeploy** so the new
   variable is picked up.

## 5. Make yourself admin

Register on the deployed site, then from your computer:

```powershell
$env:DATABASE_URL = "libsql://avenor-yourname.turso.io"
$env:TURSO_AUTH_TOKEN = "<your token>"
npm run make-admin -- <your username>
```

Reload the site and the **Admin panel** link appears in the account menu.

---

## Later changes

- **Code**: push to `main` and Vercel redeploys automatically.
- **New migration** (after `npm run db:migrate` locally): run `npm run db:deploy`
  with the Turso variables set, as in step 2.
- **Photos**: car photos added in seed data are links to external sites;
  photos uploaded on the live site go to Vercel Blob.

## Notes

- Photos of cars 10–18 come from Wikimedia Commons under CC BY / CC BY-SA
  licenses, which require crediting the authors when the site is public.
- The Hobby plan is for non-commercial use. A real dealership site needs
  Vercel Pro.
