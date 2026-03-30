# BazaarFlow Ecommerce Monorepo

BazaarFlow is a full-stack e-commerce project built as a real-world style monorepo:

- Next.js storefront + account pages
- Next.js admin panel
- NestJS API
- PostgreSQL (Supabase)
- Meilisearch
- Redis cache
- Stripe + bKash payments
- Brevo transactional email
- Supabase Storage uploads

This README is intentionally detailed so one developer can understand the project end-to-end without opening other docs.

## Table of Contents

1. [What This Project Does](#what-this-project-does)
2. [Main Features](#main-features)
3. [Architecture](#architecture)
4. [Monorepo Structure](#monorepo-structure)
5. [Getting Started (Fastest Path)](#getting-started-fastest-path)
6. [All Useful Commands](#all-useful-commands)
7. [Environment Variables (What, Why, How To Get)](#environment-variables-what-why-how-to-get)
8. [API Surface Overview](#api-surface-overview)
9. [Data Model Overview](#data-model-overview)
10. [Security and Performance Notes](#security-and-performance-notes)
11. [Testing and Validation](#testing-and-validation)
12. [Deployment Guide](#deployment-guide)
13. [Troubleshooting](#troubleshooting)
14. [Contributing](#contributing)
15. [License](#license)

## What This Project Does

### Customer side

- Browse products by category and filters
- Search products with Meilisearch-backed results (database fallback exists)
- View product details, reviews, stock state, and related products
- Add to cart and checkout
- Apply coupons
- Pay with Stripe or bKash
- Register, login, reset password
- View personal order history and order details
- Manage wishlist

### Admin side

- Admin login with password + TOTP flow
- Dashboard with metrics and recent orders
- Product CRUD and image uploads
- Category CRUD with tree structure
- Order listing, order detail, and status updates
- Customer listing and customer detail view
- Coupon management
- Inventory monitoring + restock action
- Analytics page (charts)
- Settings endpoint + panel

### Platform behavior

- Response envelope normalization (`data` + `meta`)
- Structured logging (Winston + rotating files)
- Rate limiting, Helmet, input validation, sanitization
- Caching and cache-key strategy for store endpoints
- Email scheduler (abandoned-cart nudges)

## Main Features

| Area | Highlights |
| --- | --- |
| Storefront | Product listing, product detail, search, cart, checkout, account |
| Admin | Dashboard, products, categories, orders, customers, coupons, inventory, analytics |
| Auth | Customer JWT + refresh cookies, admin auth + TOTP |
| Payments | Stripe intent + webhook, bKash create/execute/callback |
| Search | Meilisearch indexing + database fallback |
| Messaging | Brevo welcome/order/password/cart emails |
| Storage | Supabase Storage upload endpoints |
| Infra | Vercel + Railway + Cloudflare deployment path |

## Architecture

```txt
Browser (Storefront/Admin)
          |
          v
Frontend: Next.js (Vercel)
          |
          v
Backend: NestJS API (Railway)
   |            |            |            |            |
   v            v            v            v            v
Postgres     Supabase      Meilisearch   Redis       Stripe/bKash
(Supabase)   Storage       (catalog)     cache       + Brevo email
```

## Monorepo Structure

```txt
ecommerce-app/
├── backend/              NestJS API
├── frontend/             Next.js app (store + admin)
├── shared/               Shared TypeScript types
├── docs/                 Setup references (Cloudflare, env guide)
├── .env.example          Canonical variable template
├── package.json          Workspace scripts
└── README.md             This file
```

## Getting Started (Fastest Path)

### 1) Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop (recommended for Redis + Meilisearch local services)
- Supabase project (Postgres + Storage)
- Stripe account (test keys)
- bKash merchant sandbox credentials (if using bKash flow)
- Brevo account (for email features)

### 2) Install dependencies

Run from `ecommerce-app` root:

```bash
npm install
```

### 3) Start local infrastructure services (Docker)

Use whichever Meilisearch command you prefer.

Without explicit master key:

```bash
docker run -p 7700:7700 -v "$(pwd)/meili_data:/meili_data" getmeili/meilisearch:latest
```

With explicit master key:

```bash
docker run -p 7700:7700 -v "$(pwd)/meili_data:/meili_data" getmeili/meilisearch:latest --master-key O99aNSnbzPaW5AhLq3nTRTReATTcwo767A3toR1XpmU
```

Redis:

```bash
docker run -d --name redis-cache -p 6379:6379 redis:7-alpine
```

If you are using PowerShell and volume syntax acts up, use:

```powershell
docker run -p 7700:7700 -v "${PWD}/meili_data:/meili_data" getmeili/meilisearch:latest
```

### 4) Create environment files

From root (`ecommerce-app`):

```bash
# Linux/macOS
cp .env.example backend/.env

# PowerShell
Copy-Item .env.example backend/.env
```

Create frontend local file manually:

```bash
frontend/.env.local
```

Add at least:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_MEILISEARCH_URL=http://localhost:7700
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=your_search_key
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX
```

### 5) Generate admin password hash

From root:

```bash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_password_here', 10).then(hash => console.log(hash))"
```

Copy output into `ADMIN_PASSWORD_HASH` in `backend/.env`.

### 6) Run backend + frontend

From root in separate terminals:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

URLs:

- Frontend: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`
- Backend: `http://localhost:3001`
- Backend health: `http://localhost:3001/health`

## All Useful Commands

### Root workspace commands

```bash
npm run dev:frontend
npm run dev:backend
npm run build:frontend
npm run build:backend
npm run lint:frontend
npm run test:backend
```

### Backend commands

```bash
cd backend
npm run build
npm run start:dev
npm run start:prod
npm run lint
npm run test
npm run test:e2e
npm run test:cov
```

### Frontend commands

```bash
cd frontend
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

### Docker helper commands

```bash
# Stop and remove Redis container
docker stop redis-cache
docker rm redis-cache

# Run Redis again
docker run -d --name redis-cache -p 6379:6379 redis:7-alpine

# Run Meilisearch (basic)
docker run -p 7700:7700 -v "$(pwd)/meili_data:/meili_data" getmeili/meilisearch:latest

# Run Meilisearch with master key
docker run -p 7700:7700 -v "$(pwd)/meili_data:/meili_data" getmeili/meilisearch:latest --master-key O99aNSnbzPaW5AhLq3nTRTReATTcwo767A3toR1XpmU
```

## Environment Variables (What, Why, How To Get)

This section explains each variable in practical terms.

- What it is
- Why it is needed
- Where to get it

### Runtime / app

| Variable | What it controls | Why it exists | How to get value |
| --- | --- | --- | --- |
| `NODE_ENV` | Runtime mode (`development`/`production`) | Enables correct behavior (logs, perf, security modes) | Set manually |
| `PORT` | Backend port | Needed so API binds to expected port | Local: `3001`; Railway can auto-set |
| `FRONTEND_URL` | Allowed frontend origin | Used by CORS and callback URL generation | Local: `http://localhost:3000`, prod: your Vercel domain |

### Database / Supabase

| Variable | What it controls | Why it exists | How to get value |
| --- | --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | TypeORM uses it for all DB reads/writes | Supabase Project -> Database -> Connection string (pooler) |
| `SUPABASE_URL` | Supabase project URL | Required for storage client initialization | Supabase Project -> Settings -> API -> Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | Required for privileged storage uploads/deletes | Supabase Project -> Settings -> API -> service role key |

### Customer auth

| Variable | What it controls | Why it exists | How to get value |
| --- | --- | --- | --- |
| `JWT_SECRET` | Access-token signing secret | Prevents token forgery | Generate: `openssl rand -hex 32` |
| `JWT_EXPIRY` | Access-token lifetime | Balances security + UX | Set manually, e.g. `15m` |
| `REFRESH_TOKEN_SECRET` | Refresh-token signing secret | Separates refresh and access token trust | Generate: `openssl rand -hex 32` |
| `REFRESH_TOKEN_EXPIRY` | Refresh-token lifetime | Controls session length | Set manually, e.g. `30d` |

### Admin auth

| Variable | What it controls | Why it exists | How to get value |
| --- | --- | --- | --- |
| `ADMIN_EMAIL` | Admin login email | Protects admin access path | Set your admin mailbox |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password | Never store admin password in plaintext | Generate with the Node/bcrypt command above |
| `ADMIN_ALLOWED_IPS` | Comma-separated allowlist for admin routes | Optional hardening for admin area | Put office/VPN static IPs, or leave empty in local dev |

### Stripe

| Variable | What it controls | Why it exists | How to get value |
| --- | --- | --- | --- |
| `STRIPE_SECRET_KEY` | Server-side Stripe API key | Needed for payment intent creation and server calls | Stripe Dashboard -> Developers -> API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe signature secret | Required for secure webhook verification | Stripe Dashboard -> Developers -> Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Browser-safe Stripe key | Needed by frontend Stripe components | Stripe Dashboard -> Developers -> API keys |

### bKash

| Variable | What it controls | Why it exists | How to get value |
| --- | --- | --- | --- |
| `BKASH_APP_KEY` | bKash app key | Required for bKash token and payment APIs | bKash merchant portal |
| `BKASH_APP_SECRET` | bKash app secret | Required for secure API auth | bKash merchant portal |
| `BKASH_USERNAME` | bKash username | Required for tokenized API calls | bKash merchant portal |
| `BKASH_PASSWORD` | bKash password | Required for tokenized API calls | bKash merchant portal |
| `BKASH_BASE_URL` | bKash endpoint base | Switches sandbox vs production | Use sandbox during development |

### Email (Brevo)

| Variable | What it controls | Why it exists | How to get value |
| --- | --- | --- | --- |
| `BREVO_API_KEY` | Email API auth | Required to send transactional emails | Brevo Dashboard -> SMTP & API -> API keys |
| `SENDER_EMAIL` | Email sender address | Required by provider and templates | Create/verify sender in Brevo |
| `SENDER_NAME` | Sender display name | Better deliverability + branding clarity | Set manually |
| `BRAND_COLOR` | Template accent color | Keeps transactional mails on-brand | Set manually (`#RRGGBB`) |

### Search (Meilisearch)

| Variable | What it controls | Why it exists | How to get value |
| --- | --- | --- | --- |
| `MEILISEARCH_URL` | Search server URL | Required for backend indexing/search | Local: `http://localhost:7700` |
| `MEILISEARCH_API_KEY` | Admin/search API key | Required for backend index management and queries | Meilisearch master key or cloud key |
| `NEXT_PUBLIC_MEILISEARCH_URL` | Browser search endpoint | Needed if frontend sends search traffic directly | Typically same as `MEILISEARCH_URL` in local |
| `NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY` | Browser-safe search-only key | Prevents exposing admin key in frontend | Create search key in Meilisearch |

### Redis cache

| Variable | What it controls | Why it exists | How to get value |
| --- | --- | --- | --- |
| `UPSTASH_REDIS_URL` | Redis endpoint | Cache module uses it for endpoint caching | Upstash dashboard or local redis URL |
| `UPSTASH_REDIS_TOKEN` | Redis auth token/password | Required when redis requires auth | Upstash dashboard token |

### Frontend public values

| Variable | What it controls | Why it exists | How to get value |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | API base URL in browser | All frontend API requests depend on it | Local: `http://localhost:3001`, prod: backend public URL |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID | Enables web-vitals/analytics reporting | Google Analytics 4 property settings |

### Important naming notes (to avoid silent bugs)

- Code reads `MEILISEARCH_API_KEY`, not `MEILISEARCH_KEY`.
- Code reads `UPSTASH_REDIS_URL` / `UPSTASH_REDIS_TOKEN`, not `REDIS_URL`.
- If your local `.env` still uses old names, map them to current names.

### Canonical `.env.example` block

```dotenv
# APP
NODE_ENV=
PORT=
FRONTEND_URL=

# DATABASE
DATABASE_URL=

# SUPABASE
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# AUTH
JWT_SECRET=
JWT_EXPIRY=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=

# ADMIN
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
ADMIN_ALLOWED_IPS=

# STRIPE
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# BKASH
BKASH_APP_KEY=bkash_app_key_placeholder
BKASH_APP_SECRET=bkash_app_secret_placeholder
BKASH_USERNAME=bkash_username_placeholder
BKASH_PASSWORD=bkash_password_placeholder
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta

# BREVO
BREVO_API_KEY=
SENDER_EMAIL=
SENDER_NAME=
BRAND_COLOR=

# MEILISEARCH
MEILISEARCH_URL=
MEILISEARCH_API_KEY=
NEXT_PUBLIC_MEILISEARCH_URL=
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=

# REDIS
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# FRONTEND PUBLIC
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

## API Surface Overview

### Public / store endpoints

- `GET /` and `GET /health`
- `POST /store/auth/register`
- `POST /store/auth/login`
- `POST /store/auth/logout`
- `POST /store/auth/refresh`
- `POST /store/auth/forgot-password`
- `POST /store/auth/reset-password`
- `GET /store/auth/me`
- `GET /store/products`
- `GET /store/products/:slug`
- `GET /store/categories`
- `GET /store/categories/:slug/products`
- `POST /store/coupons/validate`
- `GET /store/search`
- `POST /store/orders`
- `GET /store/orders/my`
- `GET /store/orders/:id`
- `POST /store/wishlist/:productId`
- `DELETE /store/wishlist/:productId`
- `GET /store/wishlist`
- `POST /store/payments/stripe/create-intent`
- `POST /store/payments/stripe/webhook`
- `POST /store/payments/bkash/create`
- `POST /store/payments/bkash/execute`
- `GET /store/payments/bkash/callback`
- `POST /store/products/:id/reviews`
- `GET /store/products/:id/reviews`

### Admin endpoints

- `POST /admin/auth/login`
- `GET /admin/auth/me`
- `POST /admin/auth/logout`
- `GET /admin/dashboard`
- `GET /admin/customers`
- `GET /admin/customers/:id`
- `GET /admin/inventory`
- `PUT /admin/inventory/:id/restock`
- `GET /admin/analytics`
- `GET /admin/settings`
- `PUT /admin/settings`
- `GET /admin/orders`
- `GET /admin/orders/:id`
- `PUT /admin/orders/:id/status`
- `GET /admin/products`
- `POST /admin/products`
- `PUT /admin/products/:id`
- `DELETE /admin/products/:id`
- `POST /admin/categories`
- `PUT /admin/categories/:id`
- `POST /admin/coupons`
- `GET /admin/coupons`
- `PUT /admin/coupons/:id`
- `DELETE /admin/reviews/:id`
- `POST /admin/upload`
- `POST /admin/upload/multiple`

## Data Model Overview

Core entities:

- `Customer`
- `RefreshToken`
- `Product`
- `Category` (self-referential parent/children)
- `Order`
- `OrderItem`
- `Coupon`
- `Review`
- `Wishlist`

Relationship summary:

- One customer -> many orders, reviews, wishlist entries, refresh tokens
- One order -> many order items
- One product -> many order items and reviews
- One category -> many products
- Category tree supports parent and children

## Security and Performance Notes

### Security in code

- Helmet with CSP
- Global throttling + route-level throttles
- DTO validation pipe
- Sanitization guard/interceptor
- JWT + refresh rotation
- Admin JWT guard + IP whitelist guard
- Stripe webhook signature verification
- httpOnly auth cookies

### Performance in code

- Cache module with Redis support
- TTL on category/search/product list routes
- Cache-key interceptor for deterministic cache keys
- Meilisearch indexing hooks on product mutations
- Database fallback if search engine is unavailable
- Winston + slow-query logger

## Testing and Validation

### Backend

```bash
cd backend
npm run test
npm run test:e2e
npm run test:cov
```

### Frontend

```bash
cd frontend
npm run test
npm run lint
```

### Build checks

```bash
# from root
npm run build:backend
npm run build:frontend
```

## Deployment Guide

### Frontend (Vercel)

- Config file: `frontend/vercel.json`
- Build command: `npm run build`
- Required public env vars set in Vercel project settings

### Backend (Railway)

- Docker config: `backend/Dockerfile`
- Railway config: `backend/railway.json`
- Health check endpoint: `/health`
- All backend secret env vars must be configured in Railway

### Cloudflare

- Use Cloudflare for DNS, SSL, and WAF/rate-limiting layers
- Full setup walkthrough: `docs/cloudflare-setup.md`

### CI workflow

- File: `.github/workflows/deploy.yml`
- Runs backend tests and frontend build checks before deploy job

## Troubleshooting

### `401` from frontend API calls

- Ensure `NEXT_PUBLIC_API_URL` points to backend
- Ensure backend cookies are enabled and `FRONTEND_URL` is correct
- Verify refresh endpoint is reachable (`/store/auth/refresh`)

### Search returns fallback-quality results

- Meilisearch may be down or key may be wrong
- Check `MEILISEARCH_URL` and `MEILISEARCH_API_KEY`
- Confirm Meilisearch container is running at `:7700`

### Admin login fails even with correct email/password

- Check `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`
- If first login, TOTP setup must complete before token issuance
- If IP whitelist is set, make sure your current IP is allowed

### Redis cache not used

- Ensure `UPSTASH_REDIS_URL` (and token if needed) are set
- For local Redis test: `redis://localhost:6379`

### Stripe webhook fails

- Check `STRIPE_WEBHOOK_SECRET`
- Ensure raw body parsing path is preserved for webhook route

## Contributing

1. Create a branch from `main`
2. Keep changes scoped and documented
3. Run checks before PR:

```bash
npm run test:backend
npm run build:frontend
npm run lint:frontend
```

4. Open PR with change summary + validation proof

## License

MIT

---

If this README helped you run everything end-to-end, keep it updated whenever you add a module, endpoint, env var, or infra step. A project is only as maintainable as its documentation.
