# Perisai — Membership & Website

A membership management system with a public website, built on **Next.js 16 + Tailwind CSS 4**, using **Google Sheets** as the database. Deploys to **Vercel** with no other services needed.

## Features

**Admin (`/admin`)**
- **Sign in** with **email or username + password** (set per user by the super admin) or **Google**, with four roles:
  - **Super admin**: addresses in `SUPERADMIN_EMAILS`. Full access, plus **Users & access** to add people, set and reset passwords, and change roles.
  - **Admin**: can view and update everything.
  - **Editor** (Penyunting): can only see and manage **Halaman & Berita** (pages and news, including cover uploads). Members, statistics, settings and the dashboard are hidden and redirect to the content list.
  - **View only**: can see every admin page but cannot change anything. New users always start here, and the super admin upgrades them to Admin when needed.
  - Role changes and removals take effect immediately, with no re-login needed.
- Passwords are stored as scrypt hashes in the `Users` sheet, never in plain text
- Optional **email sign-in codes** ("Forgot password?"), shown only when SMTP is configured
- Dashboard: member counts, fees collected this year, members needing attention, recent payments
- Members: search, filter by status/type, CSV export, add/edit/delete
- Fees for **Annual** and **Lifetime** membership:
  - *Record payment* auto-extends annual validity (1–5 years) from the current expiry date, or from the payment date if already expired
  - Lifetime payment marks the member as permanently paid
  - One-click *Mark paid / unpaid / pending*
  - Full payment history per member
  - Statuses are computed automatically: `Active`, `Expiring` (≤30 days), `Expired`, `Lifetime`, `Unpaid`, `Pending`
- CMS: pages (shown in the menu) and news posts, written in Markdown with live preview
- Website settings: homepage text, fees, bank details, contact info, and an on/off switch for online applications

**Public website**
- Homepage with hero, about section, membership plans, and latest news
- CMS pages at `/<slug>`, news at `/news`
- `/join` application form → creates a **Pending** member for the admin to approve

## Google Sheets structure

The app **creates the tabs and header rows automatically** on first use:

| Tab | Purpose |
| --- | --- |
| `Members` | One row per member (no IC number column: IC numbers are never collected, per PDPA) |
| `Children` | One row per child with special needs, linked to `Members` by `memberId`: OKU types (`okuType`) and optional specific conditions (`okuDetail`), both `; `-separated |
| `Payments` | Payment log (one row per payment) |
| `Content` | Pages and news posts |
| `Settings` | Key/value website settings |
| `Users` | Email addresses with admin access, their role (`admin` / `editor` / `viewer`), password hash, optional username (unique, lowercase, used instead of the email when signing in) and `sessionsValidAfter` (sessions signed in earlier are rejected; set when the password changes) |
| `LoginCodes` | Temporary email sign-in codes (hashed; removed after use) |
| `LoginAttempts` | Failed password sign-ins per account. 5 failures in 15 minutes lock the account for 15 minutes (Google and email-code sign-in still work); the row is removed after a successful sign-in |

You can also view or edit data directly in the sheet. Changes made in the sheet appear on the site within about 5 minutes, or immediately after any admin save.

Columns are read by position, following `TABLES` in `src/lib/sheets.ts`. Don't reorder, insert or delete columns in the sheet by hand. To change the layout, edit `TABLES`, then run:

```bash
node --env-file=.env.local scripts/migrate-sheet.mjs          # dry run: shows what would change
node --env-file=.env.local scripts/migrate-sheet.mjs --apply  # moves existing data to match
```

The migration matches columns by header name, so data follows its column. Columns removed from `TABLES` are dropped (the dry run says how many rows hold a value). Deploy the new code at the same time: an older deployment still writes the old layout.

The OKU options (`OKU_TYPES`, `OKU_DETAILS` in `src/lib/format.ts`) follow JKM's official registration categories. Specific conditions are stored by name, so renaming an option means records saved under the old name no longer match it.

Test data: `scripts/dummy-members.mjs` and `scripts/dummy-news.mjs` add and remove test records (members with an `@example.com` email; pages and news with the slugs listed in the script) (run either without arguments for usage). `scripts/dummy-editor.mjs add` creates a test **Editor** account (`penyunting` / `penyunting@example.com`) and prints its password; `remove` deletes it.

To start fresh after testing on the live site, `scripts/reset-data.mjs` deletes **every** row in `Members`, `Children`, `Payments`, `LoginCodes` and `Content`, including records testers typed in. `Settings` and `Users` are kept. Add `--keep-content` to keep pages and news. It's a dry run unless you pass `--apply`. To undo, use File → Version history in the sheet.

```bash
node --env-file=.env.local scripts/reset-data.mjs          # shows what would be deleted
node --env-file=.env.local scripts/reset-data.mjs --apply  # deletes it
```

## Setup

### 1. Create the Google Sheet and service account

1. Create a blank Google Sheet. Copy its ID from the URL:
   `https://docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit`
2. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a project (or use an existing one).
3. **APIs & Services → Library** → enable **Google Sheets API**.
4. **IAM & Admin → Service Accounts** → *Create service account* (no roles needed).
5. Open the service account → **Keys → Add key → Create new key → JSON**. A JSON file downloads.
6. Back in your Google Sheet, click **Share** and add the service account's `client_email` as **Editor**.

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Value |
| --- | --- |
| `AUTH_SECRET` | A long random string, e.g. output of `openssl rand -base64 32` |
| `GOOGLE_SHEET_ID` | Sheet ID from step 1 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON key |
| `GOOGLE_PRIVATE_KEY` | `private_key` from the JSON key (including the `-----BEGIN…` / `END…` lines) |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth web client for "Sign in with Google" (see below) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Email sending for sign-in codes. For Gmail: `smtp.gmail.com`, `465`, your Gmail address, and an [App Password](https://myaccount.google.com/apppasswords) |
| `SUPERADMIN_EMAILS` | Required; comma-separated super admin addresses. Without it nobody has super admin access |

#### Sign in with Google (OAuth client)

1. Google Cloud Console → **Google Auth Platform** → **Branding**: set the app name to `PERISAI Admin`, choose **External** audience, and save.
2. **Audience** → **Publish app**, so any Google account can sign in. Access is still limited to the super admin and the **Users & access** list.
3. **Clients → Create client → Web application**, and add these **Authorised redirect URIs**:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://perisai-uum.vercel.app/api/auth/google/callback`
4. Copy the **Client ID** and **Client secret** into `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in at http://localhost:3000/admin. The super admin signs in with Google first, then sets passwords in **Users & access**, including their own.

### 4. Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → Import** the repo. The framework preset should show **Next.js**.
3. Open **Environment Variables** and add all five variables above.
   For `GOOGLE_PRIVATE_KEY`, paste the key value exactly as it appears in the JSON (with the `\n` sequences). Do not add surrounding quotes in Vercel.
4. Click **Deploy**.

To change variables later, use **Settings → Environment Variables**, then **Redeploy**.

## Notes & limits

- Google Sheets API quota is ~60 requests/min per user. Reads are cached, so this is plenty for small and medium organisations (up to a few thousand members).
- To sign everyone out, change `AUTH_SECRET`. Removing a user in **Users & access** revokes their access immediately.
- Images are referenced by URL. Host them anywhere public (e.g. Google Drive public link, Imgur, Cloudinary).
