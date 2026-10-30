# AquaGuard — Water Body Encroachment Reporting

A civic platform for reporting water body encroachments in India. Citizens file geo-tagged photo reports, Gemini Vision verifies evidence, authorities manage cases via an admin portal, and reporters receive email updates.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Yes | Real AI image verification (Google Gemini) |
| `GEMINI_MODEL` | No | Vision model (defaults to `gemini-3.8-flash`) |
| `RESEND_API_KEY` | Yes* | Email notifications to reporters & authority |
| `AUTHORITY_EMAIL` | Yes* | Inbox that receives new complaint alerts |
| `ADMIN_API_KEY` | Yes | Secret key for `/admin` status updates |
| `EMAIL_FROM` | No | Sender address (Resend verified domain) |
| `NEXT_PUBLIC_APP_URL` | No | Base URL for links in emails |

\*Email is skipped with a console warning if `RESEND_API_KEY` is not set, but the app will otherwise work.

### 3. Initialize the database

```bash
npm run db:push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

1. **Report** (`/report`) — Citizen captures photo + GPS, Gemini analyzes the image, complaint is saved to SQLite and photos stored on disk.
2. **Dashboard** (`/dashboard`) — Public map and list of filed complaints from the database.
3. **Track** (`/status`) — Look up a complaint by ID and view its SLA timeline.
4. **Officials** (`/admin`) — Authority signs in with `ADMIN_API_KEY`, searches and filters the complaint queue, records a verified/not-substantiated decision with a note, updates status, configures the recipient for new-report alerts, or deletes a complaint and its uploaded evidence.

New complaints are stored in the database, appear on `/dashboard`, can be tracked at `/status?id=<complaint-id>`, and are emailed to the configured officer recipient when Resend is configured. The officer recipient can be changed in `/admin`; if left blank, `AUTHORITY_EMAIL` is used.

## Tech stack

- Next.js 16, React 19, TypeScript
- Prisma + SQLite
- Google Gemini Vision API
- Resend (email)
- Leaflet maps

## Production notes

- Switch `DATABASE_URL` to PostgreSQL for production deployments.
- Use a verified domain in Resend for `EMAIL_FROM`.
- Set a strong random `ADMIN_API_KEY`.
- Do not commit `.env` or uploaded photos.
