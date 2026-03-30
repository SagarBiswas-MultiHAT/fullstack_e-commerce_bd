# BazaarFlow Ecommerce Monorepo

BazaarFlow is a full-stack commerce platform built for production-style workflows: storefront, admin panel, auth, search, payments, transactional email, uploads, and deployment automation.

## Feature Highlights

- Customer storefront with search, filters, product detail, cart, checkout, and account pages
- Admin dashboard with products, categories, orders, customers, coupons, inventory, analytics, and settings
- Auth with JWT + refresh cookies and admin-auth protection
- Payments (Stripe + bKash) and transactional email integration
- Search powered by Meilisearch with database fallback
- File upload pipeline to Supabase Storage
- Security hardening: Helmet, throttling, request sanitization, admin IP whitelist, structured logs
- Performance features: Redis caching, endpoint TTLs, cache invalidation, and query-index migrations

## Architecture

```txt
Browser / Mobile Web
        |
        v
Vercel (Next.js frontend)
        |
        v
Railway (NestJS backend API)
   |             |            |
   v             v            v
Supabase      Meilisearch   Upstash Redis
(Postgres +   (catalog       (cache layer)
Storage)      search)
```

## Repository Structure

- `frontend` - Next.js App Router application
- `backend` - NestJS API server
- `shared` - Shared TypeScript packages/types
- `docs/env-variables.md` - Full environment variable reference
- `docs/cloudflare-setup.md` - Cloudflare DNS/SSL/WAF setup guide

## Tech Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Frontend framework | [Next.js](https://nextjs.org/) | `16.2.1` |
| UI runtime | [React](https://react.dev/) | `19.2.4` |
| Backend framework | [NestJS](https://nestjs.com/) | `11.x` |
| ORM | [TypeORM](https://typeorm.io/) | `0.3.28` |
| Database | [PostgreSQL (Supabase)](https://supabase.com/) | managed |
| Search | [Meilisearch](https://www.meilisearch.com/) | `0.56.0` client |
| Cache | [Upstash Redis](https://upstash.com/) + `cache-manager` | `7.x` |
| Payments | [Stripe](https://stripe.com/) + bKash | current |
| Email | [Brevo](https://www.brevo.com/) | API |
| Charts | [Recharts](https://recharts.org/) | `3.8.1` |
| Testing | [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) + Supertest | `30.x` |

## Local Development (Beginner Friendly)

1. Install prerequisites.
   - Node.js `20+`
   - npm `10+`
   - A Supabase project (for PostgreSQL + Storage)

2. Install dependencies from monorepo root.
   ```bash
   npm install
   ```

3. Create environment files.
   - Use `.env.example` as your reference.
   - Create `backend/.env` and set backend values.
   - Create `frontend/.env.local` and set public frontend values.

4. Start backend API.
   ```bash
   npm run dev:backend
   ```
   Backend default URL: `http://localhost:3001`

5. Start frontend app in a new terminal.
   ```bash
   npm run dev:frontend
   ```
   Frontend default URL: `http://localhost:3000`

6. Open the app.
   - Storefront: `http://localhost:3000`
   - Admin login: `http://localhost:3000/admin/login`
   - Backend health: `http://localhost:3001/health`

## Useful Workspace Scripts

- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run build:frontend`
- `npm run build:backend`
- `npm run lint:frontend`
- `npm run test:backend`

## Environment Variables

Complete variable reference with descriptions and source locations:

- [docs/env-variables.md](docs/env-variables.md)

## Deployment Summary

- Frontend deploy target: Vercel (`frontend/vercel.json`)
- Backend deploy target: Railway (`backend/Dockerfile`, `backend/railway.json`)
- Edge security/CDN: Cloudflare

Cloudflare full setup guide:

- [docs/cloudflare-setup.md](docs/cloudflare-setup.md)

CI pipeline definition:

- `.github/workflows/deploy.yml`

## How to Add a New Payment Method

1. Create a new service in `backend/src/payments/` (example: `rocket.service.ts`).
2. Add DTOs for initialize/verify/refund payloads in `backend/src/payments/dto/`.
3. Register the service in `backend/src/payments/payments.module.ts`.
4. Add controller endpoints in `backend/src/payments/payments.controller.ts`.
5. Update order status transitions in `backend/src/orders/orders.service.ts`.
6. Add webhook handling in `backend/src/main.ts` if raw-body verification is needed.
7. Add frontend checkout UI controls in `frontend/src/app/checkout/page.tsx`.
8. Add integration tests in `backend/src/tests/orders.e2e-spec.ts`.

## How to Add a New Email Template

1. Add a render method to `backend/src/email/email.service.ts`.
2. Keep template styles inline for client compatibility.
3. Expose a dedicated send method (for example, `sendOrderPackedEmail`).
4. Trigger it from the relevant domain service (orders, auth, admin events).
5. Add fallback logging on send failure.
6. Add a test case that validates invocation payloads.

## Free Tier Limits and Upgrade Signals

| Service | Typical Free-Tier Constraint | Upgrade When |
| --- | --- | --- |
| Vercel | Build minutes and bandwidth limits | Builds queue often, traffic spikes, or image optimization limits hit |
| Railway | Limited monthly execution/runtime credits | API uptime suffers or credits deplete before cycle end |
| Supabase | Database size, storage, and egress caps | Query latency rises or storage/egress nears cap |
| Upstash Redis | Request and data limits | Cache hit strategy is constrained by quota |
| Meilisearch Cloud/self-hosted | Node size and memory constraints | Search indexing or query latency grows under catalog load |
| Cloudflare Free | Rule complexity/features are limited | Need advanced WAF rules, enterprise bot controls, or analytics depth |

## Contributing

1. Create a feature branch from `main`.
2. Keep changes scoped (backend, frontend, docs, or infra).
3. Run local checks before opening PR.
   - `npm run test:backend`
   - `npm run build:frontend`
   - `npm run lint:frontend`
4. Include migration files for database schema/index updates.
5. Update docs when adding env vars, services, or deployment steps.
6. Open a pull request with a clear summary and verification steps.

## License

MIT
