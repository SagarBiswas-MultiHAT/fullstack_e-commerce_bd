# Ecommerce App Monorepo

This workspace contains a production-oriented e-commerce monorepo with a Next.js frontend, a NestJS backend, and shared TypeScript types.

## Structure

- `frontend` - Next.js 14 App Router storefront/admin app
- `backend` - NestJS API with TypeORM and PostgreSQL
- `shared` - Shared TypeScript interfaces used by both apps

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL connection string (Supabase)

## Setup

1. Install dependencies from the monorepo root:
   ```bash
   npm install
   ```
2. Copy environment templates and set values:
   - Root: `.env.example` (reference)
   - Backend: `backend/.env`
   - Frontend: `frontend/.env.local`
3. Start backend:
   ```bash
   npm run dev:backend
   ```
4. Start frontend (new terminal):
   ```bash
   npm run dev:frontend
   ```

## Workspace Scripts

From the monorepo root:

- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run build:frontend`
- `npm run build:backend`
- `npm run lint:frontend`
- `npm run test:backend`

## Notes

- Do not commit `.env` or `.env.local` files.
- Backend and frontend evolve phase-by-phase based on the implementation prompt pack.
