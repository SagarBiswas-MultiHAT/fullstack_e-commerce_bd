# Environment Variables

This table lists all environment variables used across the monorepo.

| Name | Used In | Description | Where to Get It |
| --- | --- | --- | --- |
| NODE_ENV | Backend | Application mode (`development`, `production`) | Set manually |
| PORT | Backend | HTTP port for NestJS server | Railway service settings or local `.env` |
| FRONTEND_URL | Backend | Allowed CORS origin for storefront/admin | Vercel frontend URL |
| DATABASE_URL | Backend | PostgreSQL connection string | Supabase project database settings |
| SUPABASE_URL | Backend | Supabase project URL for storage and services | Supabase project settings |
| SUPABASE_SERVICE_ROLE_KEY | Backend | Elevated key for storage/admin operations | Supabase API settings |
| JWT_SECRET | Backend | JWT signing secret for customer access tokens | Generate securely (`openssl rand -hex 32`) |
| JWT_EXPIRY | Backend | Access token lifetime (for example `15m`) | Set manually |
| REFRESH_TOKEN_SECRET | Backend | JWT signing secret for refresh tokens | Generate securely (`openssl rand -hex 32`) |
| REFRESH_TOKEN_EXPIRY | Backend | Refresh token lifetime (for example `30d`) | Set manually |
| ADMIN_EMAIL | Backend | Default admin login email | Internal operations setting |
| ADMIN_PASSWORD_HASH | Backend | bcrypt hash for default admin password | Generate with bcrypt utility script |
| ADMIN_ALLOWED_IPS | Backend | Comma-separated IP allowlist for admin routes | Office/VPN static IPs |
| STRIPE_SECRET_KEY | Backend | Stripe API secret key | Stripe dashboard |
| STRIPE_WEBHOOK_SECRET | Backend | Stripe webhook signature secret | Stripe webhook endpoint settings |
| BKASH_APP_KEY | Backend | bKash app key | bKash merchant portal |
| BKASH_APP_SECRET | Backend | bKash app secret | bKash merchant portal |
| BKASH_USERNAME | Backend | bKash API username | bKash merchant portal |
| BKASH_PASSWORD | Backend | bKash API password | bKash merchant portal |
| BKASH_BASE_URL | Backend | bKash API base URL (sandbox/live) | bKash API docs |
| BREVO_API_KEY | Backend | Brevo transactional email API key | Brevo dashboard |
| SENDER_EMAIL | Backend | Email "from" address for transactional emails | Verified sender in Brevo |
| SENDER_NAME | Backend | Display name for outbound emails | Set manually |
| BRAND_COLOR | Backend | Primary brand color for email templates/admin defaults | Set manually |
| MEILISEARCH_URL | Backend | Search engine endpoint | Meilisearch cloud/self-hosted URL |
| MEILISEARCH_API_KEY | Backend | Admin key for indexing and search settings | Meilisearch dashboard |
| UPSTASH_REDIS_URL | Backend | Upstash Redis connection URL | Upstash Redis database settings |
| UPSTASH_REDIS_TOKEN | Backend | Upstash Redis token/password | Upstash Redis database settings |
| NEXT_PUBLIC_API_URL | Frontend | Public API base URL used by browser requests | Backend public URL (Railway/custom domain) |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Frontend | Stripe publishable key for Checkout UI | Stripe dashboard |
| NEXT_PUBLIC_GA_MEASUREMENT_ID | Frontend | GA4 measurement ID for web vitals and analytics | Google Analytics property settings |
| NEXT_PUBLIC_MEILISEARCH_URL | Frontend | Public search endpoint URL | Meilisearch search endpoint |
| NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY | Frontend | Search-only key for client-side queries | Meilisearch key management |

## Notes

- Backend values go in `backend/.env`.
- Frontend values go in `frontend/.env.local`.
- For Vercel and Railway, set environment variables in platform dashboards rather than committing local env files.
