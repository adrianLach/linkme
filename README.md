# linkme

> A state-of-the-art URL shortener and IP logger built with **Next.js** and deployed on **Vercel**.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [API Design](#api-design)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Security & Privacy](#security--privacy)
- [Analytics & IP Logging](#analytics--ip-logging)
- [Getting Started](#getting-started)
- [Deployment (Vercel)](#deployment-vercel)
- [Roadmap](#roadmap)

---

## Overview

**linkme** is a full-featured URL shortening service that also captures and aggregates visitor metadata (IP address, geolocation, browser, OS, referrer, etc.) for every redirect. It is designed to be self-hosted in minutes via Vercel and follows modern best practices for performance, security, and observability.

---

## Features

### Core URL Shortening
- Generate short, collision-free slugs (nanoid-based, configurable length)
- Support for custom/vanity slugs
- Optional link expiry (TTL) — set an expiration date/time per link
- Password-protected links
- One-click copy & shareable QR code for every short link
- Bulk URL import via CSV

### IP Logger / Analytics
- Record visitor IP address on every redirect
- Reverse-geocode IP to country, region, city, and ISP (using a free MaxMind GeoLite2 or ip-api.com integration)
- Capture User-Agent details: browser name/version, OS name/version, device type (mobile / desktop / bot)
- Capture HTTP Referer header
- Capture UTM parameters from the original URL
- Store timestamp (UTC) of each visit
- Detect and flag bot/crawler traffic

### Dashboard
- Real-time click counter per link
- Interactive world map showing visitor geolocation
- Time-series chart (clicks over time — hourly / daily / weekly)
- Top referrers table
- Top countries / cities table
- Browser & OS breakdown (pie/bar charts)
- Device-type breakdown
- Recent-visits live feed

### Link Management
- Create, read, update, delete (CRUD) short links
- Organize links into named campaigns/projects
- Tag links for easy filtering
- Per-link enable/disable toggle
- Per-link click limit (auto-disable after N clicks)
- Link preview (unfurled Open Graph metadata before redirect)

### User & Auth
- Email + password registration / login (NextAuth.js with Credentials provider)
- OAuth login (GitHub, Google)
- Role-based access control: `admin` / `user`
- API key generation for programmatic access
- Rate limiting per user / API key

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14+](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | [NextAuth.js v5](https://authjs.dev/) |
| Database | [Vercel Postgres](https://vercel.com/storage/postgres) (PostgreSQL via Neon) |
| ORM | [Prisma](https://www.prisma.io/) |
| Cache / Rate-limit | [Vercel KV](https://vercel.com/storage/kv) (Redis) |
| ID generation | [nanoid](https://github.com/ai/nanoid) |
| Geolocation | [ip-api.com](https://ip-api.com/) (free tier) or MaxMind GeoLite2 |
| User-Agent parsing | [ua-parser-js](https://github.com/faisalman/ua-parser-js) |
| QR codes | [qrcode](https://github.com/soldair/node-qrcode) |
| Charts | [Recharts](https://recharts.org/) |
| Deployment | [Vercel](https://vercel.com/) |
| CI/CD | GitHub Actions → Vercel |

---

## Architecture

```
Browser / Client
      │
      ▼
Vercel Edge Network (CDN + Edge Middleware)
      │
      ├─► Next.js App Router (SSR / RSC)
      │         │
      │         ├─► /[slug]  ← redirect route (Edge Function)
      │         │       └─► logs visit → Vercel KV (queue) → Postgres
      │         │
      │         ├─► /api/links   ← CRUD REST API (Route Handlers)
      │         ├─► /api/stats   ← analytics queries
      │         └─► /dashboard   ← protected React dashboard
      │
      ├─► Vercel Postgres  (links, visits, users)
      └─► Vercel KV        (rate limiting, slug cache)
```

### Redirect Flow (Edge)

1. User visits `https://lnkm.e/<slug>`
2. Next.js Edge Middleware looks up the slug in **Vercel KV** (cache-first, < 5 ms)
3. If not cached, queries **Vercel Postgres**
4. Checks: link exists · not expired · not over click limit · not password-protected
5. Asynchronously writes a visit record (IP, UA, referer, timestamp) to Postgres via a background queue
6. Returns HTTP `307 Temporary Redirect` (or `301` for permanent links)

---

## API Design

All endpoints are prefixed with `/api/v1`.

### Links

| Method | Path | Description |
|---|---|---|
| `GET` | `/links` | List all links (paginated) |
| `POST` | `/links` | Create a new short link |
| `GET` | `/links/:id` | Get link details |
| `PATCH` | `/links/:id` | Update a link |
| `DELETE` | `/links/:id` | Delete a link |

**POST /links — Request body**
```json
{
  "url": "https://example.com/very/long/path",
  "slug": "my-custom-slug",       // optional
  "expiresAt": "2026-12-31T23:59:59Z", // optional
  "password": "secret",           // optional
  "clickLimit": 1000,             // optional
  "tags": ["campaign-a"]          // optional
}
```

### Stats

| Method | Path | Description |
|---|---|---|
| `GET` | `/stats/:linkId` | Aggregate stats for a link |
| `GET` | `/stats/:linkId/visits` | Raw paginated visit log |
| `GET` | `/stats/:linkId/geo` | Geo breakdown |
| `GET` | `/stats/:linkId/devices` | Device/browser/OS breakdown |
| `GET` | `/stats/:linkId/referrers` | Referrer breakdown |
| `GET` | `/stats/:linkId/timeseries` | Clicks over time |

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password    TEXT,                     -- hashed (bcrypt)
  role        TEXT NOT NULL DEFAULT 'user',
  api_key     TEXT UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Links
CREATE TABLE links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  slug         TEXT UNIQUE NOT NULL,
  url          TEXT NOT NULL,
  title        TEXT,
  tags         TEXT[],
  password     TEXT,                    -- hashed
  click_count  BIGINT NOT NULL DEFAULT 0,
  click_limit  BIGINT,
  active       BOOLEAN NOT NULL DEFAULT true,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Visits
CREATE TABLE visits (
  id           BIGSERIAL PRIMARY KEY,
  link_id      UUID REFERENCES links(id) ON DELETE CASCADE,
  ip           INET,
  country      TEXT,
  region       TEXT,
  city         TEXT,
  isp          TEXT,
  lat          DOUBLE PRECISION,
  lon          DOUBLE PRECISION,
  browser      TEXT,
  browser_ver  TEXT,
  os           TEXT,
  os_ver       TEXT,
  device_type  TEXT,     -- 'mobile' | 'desktop' | 'tablet' | 'bot'
  referer      TEXT,
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX visits_link_id_idx  ON visits (link_id);
CREATE INDEX visits_created_idx  ON visits (created_at DESC);
CREATE INDEX visits_country_idx  ON visits (country);
```

---

## Environment Variables

Create a `.env.local` file at the project root:

```env
# Database (Vercel Postgres / Neon)
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Redis / KV (Vercel KV)
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."

# NextAuth
NEXTAUTH_SECRET="change-me-to-a-long-random-string"
NEXTAUTH_URL="https://your-domain.vercel.app"

# OAuth providers (optional)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Geolocation
# Option A: ip-api.com (free, no key required for basic use)
GEO_PROVIDER="ip-api"
# Option B: MaxMind GeoLite2 (requires a free account)
# GEO_PROVIDER="maxmind"
# MAXMIND_ACCOUNT_ID=""
# MAXMIND_LICENSE_KEY=""

# App
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
NEXT_PUBLIC_APP_NAME="linkme"
```

---

## Security & Privacy

- All passwords (user & link) are hashed with **bcrypt** (cost factor ≥ 12)
- API keys are stored hashed; only the plain-text version is shown once at creation
- Short-slug lookup endpoint runs at the **Edge** — no server-side session required, minimal attack surface
- Rate limiting on all mutation endpoints via Vercel KV (sliding window algorithm)
- CSRF protection provided automatically by Next.js Route Handlers
- IP addresses are stored as PostgreSQL `INET` type; optionally **anonymised** (last octet zeroed) to comply with GDPR / DSGVO
- `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` headers set via `next.config.js`
- Redirect destination is validated against an allowlist of protocols (`http`, `https`) to prevent `javascript:` injection
- Input validation on all API endpoints using [Zod](https://zod.dev/)
- Sensitive visit data access is scoped to the link owner only

---

## Analytics & IP Logging

Visit capture happens **asynchronously** to keep the redirect latency under 10 ms:

1. The redirect Edge Function issues the `307` response immediately.
2. It then calls `waitUntil()` (Vercel Edge Runtime) to send the visit payload to a background Route Handler (`/api/internal/track`).
3. The Route Handler enriches the raw IP with geolocation data and writes the full visit record to Postgres.

**Captured fields per visit:**

| Field | Source |
|---|---|
| `ip` | `x-forwarded-for` / `x-real-ip` header (first untrusted IP stripped by Vercel) |
| `country` / `region` / `city` | ip-api.com or MaxMind lookup |
| `isp` | ip-api.com or MaxMind lookup |
| `lat` / `lon` | ip-api.com or MaxMind lookup |
| `browser` / `browser_ver` | `User-Agent` header parsed by ua-parser-js |
| `os` / `os_ver` | `User-Agent` header parsed by ua-parser-js |
| `device_type` | ua-parser-js device type |
| `referer` | `Referer` header |
| `utm_*` | Query parameters on the **incoming short link request** (e.g. `https://lnkm.e/abc?utm_source=email&utm_medium=newsletter`) — forwarded to / merged with the destination URL on redirect |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8 (or npm / yarn)
- A [Vercel](https://vercel.com/) account (for Postgres + KV)
- (Optional) A [MaxMind](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data) account for offline geolocation

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/adrianLach/linkme.git
cd linkme

# 2. Install dependencies
pnpm install

# 3. Pull Vercel environment variables (requires Vercel CLI)
pnpm dlx vercel env pull .env.local
# — OR — copy .env.example to .env.local and fill in the values manually

# 4. Push the Prisma schema to your database
pnpm prisma db push

# 5. (Optional) Seed demo data
pnpm prisma db seed

# 6. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

```bash
# Unit + integration tests
pnpm test

# E2E tests (Playwright)
pnpm test:e2e
```

---

## Deployment (Vercel)

1. Push your code to GitHub.
2. Import the repository in the [Vercel dashboard](https://vercel.com/new).
3. Add the required environment variables (see [Environment Variables](#environment-variables)).
4. Vercel automatically detects Next.js and configures the build.
5. Add a **Vercel Postgres** and **Vercel KV** store in the Storage tab and link them to the project.
6. Trigger a deployment — done! 🎉

Every push to `main` triggers an automatic production deployment.

---

## Roadmap

- [ ] Initial project scaffold (Next.js 14 App Router + Prisma + Tailwind)
- [ ] Authentication (NextAuth.js — credentials + OAuth)
- [ ] Link CRUD API
- [ ] Edge redirect with KV cache
- [ ] Async visit tracking
- [ ] Geolocation enrichment
- [ ] Dashboard UI (charts, map, tables)
- [ ] QR code generation
- [ ] Custom domains support
- [ ] Webhook on visit (POST to user-defined URL)
- [ ] CSV export of visit data
- [ ] GDPR-compliant IP anonymisation toggle
- [ ] Public API documentation (OpenAPI / Swagger)
- [ ] Dark mode

---

## License

MIT — see [LICENSE](LICENSE) for details.