# 🛒 Top-Class E-Commerce — Copilot Agent Prompt Pack (NestJS Edition)
**Stack:** Next.js · NestJS · Supabase (PostgreSQL) · TypeORM · Meilisearch · Stripe · bKash · Brevo · Cloudflare · GA4  
**Method:** Run each prompt independently in Copilot Agent mode, in order.  
**Rule:** Never skip a phase. Each phase builds on the last.

---

## ⚙️ HOW TO USE THIS PACK

1. Open VS Code with GitHub Copilot Agent mode active
2. Copy one prompt block at a time (between the triple dashes)
3. Paste into Copilot Agent chat and let it execute fully before moving to the next
4. After each phase, test the output before proceeding
5. Environment variables go into `.env` (backend) and `.env.local` (frontend) — never commit these files

---

---

## PHASE 0 — Project Scaffolding & Monorepo Setup

```
You are a senior full-stack engineer. Scaffold a production-ready e-commerce monorepo with the following structure:

/ecommerce-app
  /frontend     ← Next.js 14 (App Router, TypeScript, Tailwind CSS)
  /backend      ← NestJS (TypeScript, TypeORM, PostgreSQL)
  /shared       ← Shared TypeScript types between frontend and backend

Tasks:
1. Initialize the monorepo using npm workspaces with a root package.json

2. Scaffold /frontend:
   Run: `npx create-next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*"`

3. Scaffold /backend:
   Run: `npm install -g @nestjs/cli && nest new backend --package-manager npm`
   Then install core dependencies inside /backend:
   `npm install @nestjs/typeorm typeorm pg @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt passport-local bcrypt class-validator class-transformer @nestjs/throttler helmet compression cookie-parser`
   Dev dependencies:
   `npm install -D @types/bcrypt @types/passport-jwt @types/passport-local @types/cookie-parser @types/compression`

4. Create /shared/types/index.ts with shared interfaces:
   - Product, Category, Order, OrderItem, Customer, CartItem, Review, Wishlist, Coupon

5. Create root .env.example listing all required environment variables (values blank)

6. Create root .gitignore excluding: node_modules, .env, .env.local, dist, .next, build, logs

7. Create root README.md with monorepo setup instructions

Output: Confirm all folders and files are created. Print the full directory tree.
```

---

## PHASE 1 — Supabase Database Setup (TypeORM + PostgreSQL)

```
You are a database architect. Connect the NestJS backend to Supabase PostgreSQL using TypeORM.

Context:
- Backend at /backend (NestJS, TypeScript)
- ORM: TypeORM
- Database: Supabase PostgreSQL
- Connection string in env: DATABASE_URL

Tasks:
1. Configure TypeORM in /backend/src/app.module.ts using TypeOrmModule.forRootAsync():
   - Read DATABASE_URL from ConfigService
   - Set: type: "postgres", ssl: { rejectUnauthorized: false }, synchronize: false (never true in production), logging: true in development
   - Enable autoLoadEntities: true

2. Create these TypeORM entity files in /backend/src/entities/:
   a. product.entity.ts — id (uuid), title, slug, description, price (decimal), discountPrice, stock (int), images (text array), isActive, createdAt, updatedAt. Relations: ManyToOne Category, OneToMany OrderItem, OneToMany Review
   b. category.entity.ts — id, name, slug, parentId (nullable self-reference), createdAt
   c. customer.entity.ts — id, email (unique), passwordHash, name, phone, isVerified, failedLoginAttempts (int, default 0), lockedUntil (datetime, nullable), createdAt
   d. order.entity.ts — id, status (enum: pending/paid/processing/shipped/delivered/cancelled), total (decimal), paymentMethod, paymentReference, createdAt. Relations: ManyToOne Customer, OneToMany OrderItem
   e. order-item.entity.ts — id, quantity, price. Relations: ManyToOne Order, ManyToOne Product
   f. review.entity.ts — id, rating (int 1-5), body, isVerified, createdAt. Relations: ManyToOne Product, ManyToOne Customer
   g. wishlist.entity.ts — id, createdAt. Relations: ManyToOne Customer, ManyToOne Product
   h. coupon.entity.ts — id, code (unique), type (enum: percentage/fixed), value, usageLimit, usedCount, expiresAt, isActive
   i. refresh-token.entity.ts — id, token (unique), customerId, expiresAt, isRevoked

3. Create /backend/src/database/migrations/ folder. Write the first migration file 001_create_indexes.ts that adds indexes on:
   - product.slug, product.category_id, customer.email, order.customer_id, order.status

4. Add GET /health endpoint in /backend/src/app.controller.ts that returns:
   { status: "ok", db: "connected", timestamp: new Date() }
   Test the DB connection inside this handler and return { db: "error" } if it fails.

Output: All entity files, app.module.ts TypeORM config, migration file, and health endpoint with full content.
```

---

## PHASE 2 — NestJS Backend Core (Modules, Controllers, Services)

```
You are a backend engineer. Build the core API layer using NestJS with a clean modular architecture.

Context:
- Backend at /backend (NestJS, TypeScript, TypeORM)
- All responses must be JSON. Use NestJS @Controller, @Get, @Post, @Put, @Delete decorators
- Use class-validator DTOs for all input validation
- Use NestJS Guards for route protection

Tasks:
1. Generate these NestJS modules (each with module/controller/service/dto files):

   a. ProductsModule at /backend/src/products/
      - GET /store/products — list with pagination (?page=1&limit=20), filter by ?category=&minPrice=&maxPrice=&inStock=&sort=price_asc|price_desc|newest|popular
      - GET /store/products/:slug — single product detail
      - POST /admin/products — create product (admin only)
      - PUT /admin/products/:id — update product (admin only)
      - DELETE /admin/products/:id — soft delete product (admin only)
      - DTOs: CreateProductDto, UpdateProductDto, ProductQueryDto

   b. CategoriesModule at /backend/src/categories/
      - GET /store/categories — full category tree
      - GET /store/categories/:slug/products — products in a category with pagination
      - POST /admin/categories — create (admin only)
      - PUT /admin/categories/:id — update (admin only)

   c. OrdersModule at /backend/src/orders/
      - POST /store/orders — create order (customer JWT required). Validates stock, calculates total, applies coupon if provided
      - GET /store/orders/my — customer's own orders (customer JWT required)
      - GET /store/orders/:id — order detail (customer JWT, own orders only)
      - GET /admin/orders — all orders with filters (?status=&page=) (admin only)
      - PUT /admin/orders/:id/status — update order status (admin only)
      - DTOs: CreateOrderDto (items[], addressId, couponCode, paymentMethod), UpdateOrderStatusDto

   d. ReviewsModule at /backend/src/reviews/
      - POST /store/products/:id/reviews — create review (customer JWT, must have purchased product)
      - GET /store/products/:id/reviews — list reviews with pagination
      - DELETE /admin/reviews/:id — delete review (admin only)

   e. WishlistModule at /backend/src/wishlist/
      - POST /store/wishlist/:productId — add to wishlist (customer JWT)
      - DELETE /store/wishlist/:productId — remove from wishlist (customer JWT)
      - GET /store/wishlist — get my wishlist (customer JWT)

   f. CouponsModule at /backend/src/coupons/
      - POST /store/coupons/validate — validate a coupon code, return discount amount
      - POST /admin/coupons — create coupon (admin only)
      - GET /admin/coupons — list all coupons (admin only)
      - PUT /admin/coupons/:id — update (admin only)

2. Create a shared /backend/src/common/ folder with:
   - decorators/current-user.decorator.ts — extracts user from request
   - guards/customer-jwt.guard.ts — validates customer JWT
   - guards/admin-jwt.guard.ts — validates admin JWT
   - interceptors/transform.interceptor.ts — wraps all responses in { data, meta } format
   - filters/http-exception.filter.ts — global error handler returning { error, message, statusCode }
   - pipes/validation.pipe.ts — global ValidationPipe with whitelist: true, forbidNonWhitelisted: true

3. Register the global interceptor, filter, and pipe in /backend/src/main.ts

4. Add ThrottlerModule in app.module.ts: global 100 requests per 60 seconds per IP

Output: All module, controller, service, and DTO files with full content.
```

---

## PHASE 3 — Authentication System (JWT + Refresh Tokens)

```
You are a security-focused NestJS engineer. Implement a complete authentication system for customers and admins.

Context:
- Backend: NestJS at /backend
- Frontend: Next.js at /frontend
- Use JWT access tokens (httpOnly cookies) + refresh tokens
- Never store tokens in localStorage

Tasks:
1. Create /backend/src/auth/ module with:

   a. auth.service.ts:
      - register(dto) — hash password with bcrypt (rounds: 12), create customer, send welcome email, return tokens
      - login(dto) — validate credentials, check account lock, reset failedLoginAttempts on success, increment on failure, lock after 5 failures for 15 minutes, return tokens
      - logout(refreshToken) — revoke refresh token in DB
      - refreshTokens(refreshToken) — validate refresh token, issue new access + refresh token pair (rotation)
      - forgotPassword(email) — generate reset token (crypto.randomBytes), store hashed version in DB, send email
      - resetPassword(token, newPassword) — validate token, update password, revoke all refresh tokens for that user

   b. auth.controller.ts with routes:
      - POST /store/auth/register
      - POST /store/auth/login
      - POST /store/auth/logout
      - POST /store/auth/refresh
      - POST /store/auth/forgot-password
      - POST /store/auth/reset-password
      - GET /store/auth/me (CustomerJwtGuard required)

   c. DTOs: RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto (all with class-validator decorators)

   d. strategies/:
      - customer-jwt.strategy.ts — validates access token JWT, reads from cookie named "access_token"
      - admin-jwt.strategy.ts — validates admin JWT, reads from cookie named "admin_access_token"

   e. Token configuration (from ConfigService):
      - Access token: JWT_SECRET, expires in 15 minutes
      - Refresh token: REFRESH_TOKEN_SECRET, expires in 30 days, stored in refresh_tokens table
      - On login: set both as httpOnly, Secure, SameSite=Strict cookies

2. Create /backend/src/admin-auth/ module with:
   - POST /admin/auth/login — separate admin credentials from env (ADMIN_EMAIL, ADMIN_PASSWORD_HASH)
   - TOTP 2FA: on first login generate TOTP secret (use otplib), return QR code URL for Google Authenticator setup. On subsequent logins require TOTP code in request body

3. Frontend helpers at /frontend/src/lib/auth.ts:
   - login(email, password) — POST to backend, handles cookie setting automatically
   - logout() — POST to backend logout endpoint
   - getUser() — GET /store/auth/me, returns customer or null
   - isAuthenticated() — boolean check via getUser()
   - refreshSession() — calls /store/auth/refresh

Output: All auth files, strategies, DTOs, guards, and frontend helpers with full content.
```

---

## PHASE 4 — Next.js Frontend Core (Layout, Pages, Components)

```
You are a senior frontend engineer. Build the core frontend with a premium, conversion-optimized design.

Context:
- Framework: Next.js 14 (App Router, TypeScript, Tailwind CSS)
- Design goal: clean, fast, mobile-first, dark/light mode support (use next-themes)
- Backend API base URL from env: NEXT_PUBLIC_API_URL
- Use Server Components for data fetching where possible. Use Client Components only for interactivity.

Tasks:
1. Global layout at /frontend/src/app/layout.tsx:
   - Header: logo, search bar, cart icon with item count badge (from context), wishlist icon, user avatar dropdown (login/register/account/logout), dark/light toggle
   - Footer: category links, return policy, support, newsletter email input, payment icons (Stripe, bKash), copyright
   - Wrap app with: ThemeProvider (next-themes), CartProvider (context), AuthProvider (context)

2. Context providers at /frontend/src/context/:
   - cart.context.tsx — cart state (items[], addItem, removeItem, updateQuantity, clearCart, itemCount, total). Persist to localStorage.
   - auth.context.tsx — currentUser state, login(), logout(), isAuthenticated

3. Pages (App Router):
   a. / (Homepage) — hero banner, featured categories grid (6 categories), trending products (12 products), flash deal section with countdown timer component, personalized "Recently Viewed" section
   b. /products — product grid with sidebar filters (price range slider, category checkboxes, rating filter, in-stock toggle), sort dropdown, pagination
   c. /products/[slug] — image gallery with zoom (use react-image-magnifiers), price + discount badge, stock status badge, variant selector (size/color), quantity input, Add to Cart + Add to Wishlist buttons, product tabs (Description / Specs / Reviews), reviews section with rating breakdown bar chart, Related Products section
   d. /cart — cart items with image/title/price/quantity controls, remove button, coupon code input with validate button, order summary (subtotal, discount, shipping, total), Proceed to Checkout button
   e. /checkout — multi-step: Step 1: Address (name, phone, address fields with autofill), Step 2: Delivery method, Step 3: Payment (Stripe card or bKash selector), Step 4: Order summary confirm
   f. /account — protected route. Tabs: My Orders (with status badges and tracking link), Wishlist (product cards), Profile (edit name/phone/password), Saved Addresses
   g. /account/orders/[id] — order detail: status progress stepper (Pending→Paid→Processing→Shipped→Delivered), items list, pricing breakdown, courier tracking link
   h. /search — search results grid with active filters display, result count, same filters as /products
   i. /auth/login and /auth/register — clean form pages with social login buttons (placeholder)

4. Reusable components at /frontend/src/components/:
   - ProductCard.tsx — image (lazy), title, price display, discount badge, star rating, wishlist heart toggle, add to cart button
   - PriceDisplay.tsx — original price (strikethrough) + discount price + "X% OFF" badge
   - RatingStars.tsx — 1-5 stars, supports half-stars, shows count
   - StockBadge.tsx — green/yellow/red for In Stock / Low Stock / Out of Stock
   - CountdownTimer.tsx — real-time countdown for flash deals
   - LoadingSkeleton.tsx — animated skeleton for product card grid
   - Pagination.tsx — prev/next + page numbers
   - EmptyState.tsx — icon + message + CTA button
   - StatusStepper.tsx — horizontal step progress indicator for order tracking

5. API client at /frontend/src/lib/api.ts:
   - Base fetch wrapper with: base URL from env, credentials: "include" (sends cookies), JSON headers, error handling (throws on non-2xx), automatic token refresh on 401

Output: All page, component, context, and lib files with full content.
```

---

## PHASE 5 — Meilisearch Integration (Smart Search)

```
You are a search systems engineer. Integrate Meilisearch for fast, typo-tolerant product search.

Context:
- Meilisearch: self-hosted (MEILISEARCH_URL and MEILISEARCH_API_KEY in .env)
- Backend: NestJS at /backend
- Frontend: Next.js at /frontend

Tasks:
1. Backend — /backend/src/search/ module:
   a. Install: `npm install meilisearch` in /backend
   b. search.module.ts — register as global module with ConfigService
   c. search.service.ts:
      - On module init: connect to Meilisearch, create "products" index if not exists
      - Configure searchable attributes: ["title", "description", "category"]
      - Configure filterable attributes: ["price", "category_id", "rating", "in_stock", "is_active"]
      - Configure sortable attributes: ["price", "created_at"]
      - indexProduct(product) — add/update product in index
      - removeProduct(id) — remove from index
      - searchProducts(query, filters, pagination) — returns hits + total
      - syncAllProducts() — bulk sync all active products (called on app start)
   d. GET /store/search?q=&category=&minPrice=&maxPrice=&rating=&page=&limit= endpoint in search.controller.ts
   e. Call indexProduct() inside ProductsService whenever a product is created or updated

2. Frontend — Smart Search Bar:
   a. Install: `npm install meilisearch` in /frontend
   b. /frontend/src/components/SearchBar.tsx (Client Component):
      - Controlled input with 200ms debounce
      - On type: call GET /store/search?q= and show dropdown with top 5 results
      - Each result: product thumbnail + title + price
      - "View all results for X →" link at the bottom of dropdown
      - Keyboard navigation: ArrowDown/ArrowUp to move, Enter to go to product, Escape to close
      - Click outside to close dropdown
      - Loading spinner while fetching
   c. Wire /search page to backend search endpoint with full filter sidebar (same as /products page)

Output: All search module files (module, controller, service) and frontend SearchBar component with full content.
```

---

## PHASE 6 — Payment Integration (Stripe + bKash)

```
You are a payments engineer. Integrate Stripe (international) and bKash (Bangladesh) into the NestJS backend.

Context:
- Backend: NestJS at /backend
- Frontend: Next.js at /frontend
- Env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD, BKASH_BASE_URL

Tasks:
1. Create /backend/src/payments/ module:

   a. Install: `npm install stripe` in /backend

   b. stripe.service.ts:
      - createPaymentIntent(amountInCents, currency, orderId, customerEmail) — creates Stripe PaymentIntent, stores orderId in metadata
      - handleWebhook(rawBody, signature) — validates signature using STRIPE_WEBHOOK_SECRET, handles:
        * payment_intent.succeeded → call OrdersService.markAsPaid(orderId)
        * payment_intent.payment_failed → call OrdersService.markAsFailed(orderId)

   c. bkash.service.ts:
      - Private method: grantToken() — POST to BKASH_BASE_URL/token/grant with app credentials, cache token for 55 minutes (token expires in 60)
      - createPayment(amount, orderId, callbackUrl) — initiates payment, returns bKash payment URL
      - executePayment(paymentId) — confirms payment after redirect
      - queryPayment(paymentId) — checks current payment status
      - refundPayment(paymentId, amount, reason) — initiates refund

   d. payments.controller.ts with routes:
      - POST /store/payments/stripe/create-intent (CustomerJwtGuard) — creates PaymentIntent, returns clientSecret
      - POST /store/payments/stripe/webhook — raw body parser (NOT JSON, use rawBody), validates Stripe signature
      - POST /store/payments/bkash/create (CustomerJwtGuard) — creates bKash payment, returns bkashURL to redirect to
      - POST /store/payments/bkash/execute — called after bKash redirects back, executes payment
      - GET /store/payments/bkash/callback — callback URL registered with bKash

   e. After successful payment (either method):
      - Update order.status to "paid" and store paymentReference
      - Decrease product stock for each order item
      - Call EmailService.sendOrderConfirmation()

2. Frontend:
   a. Install: `npm install @stripe/stripe-js @stripe/react-stripe-js` in /frontend
   b. /frontend/src/components/payments/StripeCheckout.tsx:
      - Loads Stripe using NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      - Calls backend to create PaymentIntent
      - Renders Stripe Elements (CardElement)
      - On confirm: calls stripe.confirmCardPayment(), shows success/error state
   c. /frontend/src/components/payments/BkashCheckout.tsx:
      - Button that calls backend to create bKash payment
      - Redirects user to returned bkashURL
      - On return: shows processing screen while backend executes payment

Output: All payment module files and frontend payment components with full content.
```

---

## PHASE 7 — Email System (Brevo Transactional)

```
You are a communications engineer. Set up transactional email using Brevo inside NestJS.

Context:
- Backend: NestJS at /backend
- Env vars: BREVO_API_KEY, SENDER_EMAIL, SENDER_NAME, FRONTEND_URL

Tasks:
1. Install: `npm install @getbrevo/brevo node-cron` in /backend
   Dev: `npm install -D @types/node-cron`

2. Create /backend/src/email/ module:

   a. email.service.ts with these methods (all async, all fire-and-forget — don't block main flow):
      - sendWelcomeEmail(customer) — welcome message with store link
      - sendOrderConfirmation(order, customer) — itemized order summary, total, payment method, estimated delivery
      - sendPasswordReset(customer, resetLink) — reset link valid 1 hour, clear CTA button
      - sendShippingUpdate(order, customer, status, trackingUrl) — status update with tracking link
      - sendAbandonedCartEmail(customer, cartItems) — "You left something behind" with product images, prices, and checkout link

   b. Email HTML templates as TypeScript template literal strings (no external files):
      - Inline CSS only (no external stylesheets — email clients strip them)
      - Mobile responsive using table-based layout (email standard)
      - Store logo placeholder at top
      - Clean, professional design with consistent brand color from env: BRAND_COLOR (default #2563EB)
      - All links use FRONTEND_URL from env

   c. email-scheduler.service.ts:
      - Uses node-cron to run every hour: `0 * * * *`
      - Queries orders with status "pending" and no payment after 1 hour
      - Cross-references with customer email availability
      - Calls sendAbandonedCartEmail() for each eligible customer
      - Logs how many emails were sent each run

3. Register EmailModule as global in app.module.ts so any other module can inject EmailService

Output: Email module, service, scheduler, and all template strings with full content.
```

---

## PHASE 8 — Security Hardening

```
You are a cybersecurity engineer. Harden the NestJS backend and Next.js frontend against common attacks.

Context:
- Backend: NestJS at /backend
- Frontend: Next.js at /frontend

Tasks:
1. NestJS Backend — main.ts hardening:
   a. helmet() — enable with strict CSP:
      contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], imgSrc: ["'self'", "data:", "https:"], connectSrc: ["'self'", FRONTEND_URL] } }
   b. app.enableCors({ origin: FRONTEND_URL, credentials: true, methods: ['GET','POST','PUT','DELETE','PATCH'] })
   c. compression() middleware — gzip all responses
   d. cookie-parser middleware
   e. Body size limit: app.use(json({ limit: '10mb' }))
   f. Global ValidationPipe: whitelist: true, forbidNonWhitelisted: true, transform: true

2. ThrottlerModule (already installed in Phase 2) — add specific limits:
   - Auth routes (/store/auth/login, /store/auth/register, /store/auth/forgot-password): 10 requests per 15 minutes per IP
   - Store routes: 200 requests per minute per IP
   - Admin routes: 60 requests per minute per IP
   Use @Throttle() decorator override on auth controller

3. SQL Injection — TypeORM uses parameterized queries by default. Add explicit check:
   - Create /backend/src/common/guards/sanitize.guard.ts that strips any SQL keywords from query params: SELECT, INSERT, DROP, DELETE, UPDATE, UNION, --
   - Apply globally in main.ts

4. Input sanitization:
   - Install `npm install xss` in /backend
   - Create /backend/src/common/interceptors/sanitize.interceptor.ts that recursively sanitizes all string fields in request.body using xss() before reaching the controller

5. Admin IP whitelist:
   - Create /backend/src/common/guards/ip-whitelist.guard.ts
   - Reads ADMIN_ALLOWED_IPS from env (comma-separated)
   - Apply to all /admin/* routes via AdminJwtGuard chain

6. Logging with Winston:
   - Install `npm install winston nest-winston` in /backend
   - Configure in app.module.ts: log to console (dev) and to /backend/logs/app.log + /backend/logs/errors.log (production)
   - Log format: JSON with timestamp, level, context, message
   - Log all: auth events (login success/fail with IP), payment events, admin actions, unhandled errors
   - Rotate logs daily, keep 14 days (use winston-daily-rotate-file)

7. Frontend — next.config.ts security headers:
   Add headers() config with:
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: camera=(), microphone=(), geolocation=()
   - Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

8. Create /backend/src/common/utils/sanitize.ts:
   - sanitizeHtml(input) — strips all HTML tags from user-generated content
   - sanitizeFilename(name) — removes path traversal characters (../, /, \)

Output: All security files, updated main.ts, and next.config.ts with full content.
```

---

## PHASE 9 — Admin Panel (Product, Order & Customer Management)

```
You are a full-stack engineer. Build a secure, functional admin dashboard in Next.js.

Context:
- Frontend: Next.js 14 at /frontend
- Admin section at /frontend/src/app/admin/
- All admin pages protected by AdminJwtGuard (check admin cookie via backend /admin/auth/me)
- Use recharts for all charts

Tasks:
1. Admin middleware at /frontend/src/middleware.ts:
   - Protect all /admin/* routes
   - Redirect to /admin/login if no valid admin session

2. Admin layout at /frontend/src/app/admin/layout.tsx:
   - Left sidebar: collapsible on mobile, links to all admin sections
   - Sidebar icons + labels: Dashboard, Products, Categories, Orders, Customers, Coupons, Inventory, Analytics, Settings
   - Top bar: page title, admin user name, logout button
   - Dark theme by default for admin panel

3. Admin pages:

   a. /admin (Dashboard):
      - Stats cards: Total Revenue (this month), Orders Today, New Customers (this week), Products Low on Stock
      - Recent Orders table (last 10): ID, customer, total, status badge, date
      - Revenue chart: last 30 days line chart using recharts

   b. /admin/products:
      - Searchable, paginated table: image thumbnail, title, price, stock, category, status (active/inactive)
      - "Add Product" button opens modal with full form: title, slug (auto-generated), description, price, discount price, stock, category dropdown, image uploader (multiple), is_active toggle
      - Edit button opens same modal pre-filled
      - Delete button with confirmation dialog
      - Image upload: POST to /admin/upload, store in Supabase Storage, return URL

   c. /admin/categories:
      - Tree view showing parent/child categories
      - Add/edit/delete with inline form

   d. /admin/orders:
      - Filterable table by status (all/pending/paid/processing/shipped/delivered/cancelled)
      - Click row → order detail page showing: customer info, items, payment info, status update dropdown
      - Status update triggers shipping email automatically

   e. /admin/customers:
      - Searchable customer list: name, email, phone, total orders, joined date
      - Click → customer detail: profile + full order history

   f. /admin/coupons:
      - List coupons with: code, type, value, used/limit, expiry, active toggle
      - Create form: code, type (percentage/fixed), value, usage limit, expiry date

   g. /admin/inventory:
      - Table of products with stock ≤ 10 (low stock threshold)
      - Inline "Restock" input: enter new quantity and save

   h. /admin/analytics:
      - Date range picker (last 7/30/90 days / custom)
      - Line chart: daily revenue
      - Bar chart: top 10 best-selling products
      - Pie chart: order status breakdown
      - KPI cards: conversion rate, average order value, return rate

4. /admin/settings:
   - Store name, logo upload, brand color, sender email, contact info
   - Notification preferences: low stock alert threshold, abandoned cart trigger delay

Output: All admin pages, layout, middleware, and chart components with full content.
```

---

## PHASE 10 — File Uploads (Supabase Storage)

```
You are a backend engineer. Implement secure file uploads for product images using Supabase Storage.

Context:
- Backend: NestJS at /backend
- Storage: Supabase Storage (free 1GB)
- Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Tasks:
1. Install: `npm install @supabase/supabase-js multer` in /backend
   Dev: `npm install -D @types/multer`

2. Create /backend/src/upload/ module:
   a. upload.service.ts:
      - uploadFile(file: Express.Multer.File, folder: string) → returns public URL
      - deleteFile(filePath: string) → removes from Supabase Storage
      - Allowed MIME types: image/jpeg, image/png, image/webp only
      - Max file size: 5MB
      - Sanitize filename: replace spaces with hyphens, strip special chars, prepend UUID

   b. upload.controller.ts:
      - POST /admin/upload — accepts multipart/form-data, field name "file", returns { url: string }
      - POST /admin/upload/multiple — accepts up to 10 files, returns { urls: string[] }
      - Both routes: AdminJwtGuard protected

   c. Supabase Storage setup:
      - Bucket name: "product-images" (public bucket)
      - Folder structure: /products/{productId}/{filename}

3. Frontend upload component at /frontend/src/components/admin/ImageUploader.tsx:
   - Drag-and-drop zone with click-to-browse
   - Preview uploaded images in a grid with delete button per image
   - Shows upload progress bar per file
   - Validates file type and size before uploading
   - Returns array of URLs to parent form

Output: Upload module, service, controller, and frontend ImageUploader component with full content.
```

---

## PHASE 11 — Deployment (Vercel + Railway + Cloudflare)

```
You are a DevOps engineer. Configure production deployment for the full stack.

Context:
- Frontend: Next.js at /frontend → Vercel (free tier)
- Backend: NestJS at /backend → Railway (free tier)
- Database: Supabase (already cloud-hosted)
- CDN + SSL: Cloudflare (free)

Tasks:
1. Vercel (Frontend):
   a. Create /frontend/vercel.json:
      - Build command: "npm run build"
      - Framework: nextjs
      - List all NEXT_PUBLIC_ environment variable names (not values)
   b. Create /frontend/src/app/not-found.tsx — custom 404 page with search bar and home CTA

2. Railway (Backend — NestJS):
   a. Create /backend/Dockerfile:
      ```
      FROM node:20-alpine AS builder
      WORKDIR /app
      COPY package*.json ./
      RUN npm ci
      COPY . .
      RUN npm run build

      FROM node:20-alpine AS production
      WORKDIR /app
      COPY package*.json ./
      RUN npm ci --only=production
      COPY --from=builder /app/dist ./dist
      EXPOSE 3001
      CMD ["node", "dist/main.js"]
      ```
   b. Create /backend/.dockerignore: node_modules, dist, .env, logs, *.test.ts
   c. Create /backend/railway.json:
      { "build": { "builder": "DOCKERFILE" }, "deploy": { "startCommand": "node dist/main.js", "healthcheckPath": "/health", "restartPolicyType": "ON_FAILURE" } }
   d. Ensure /backend/src/main.ts reads PORT from env: app.listen(process.env.PORT || 3001)

3. Environment Variable Docs:
   Create /docs/env-variables.md with a table for every env variable:
   - Name | Used In | Description | Where to Get It

4. Cloudflare Setup Guide:
   Create /docs/cloudflare-setup.md with step-by-step:
   - Add domain to Cloudflare (nameserver change instructions)
   - DNS records: A record for frontend (Vercel IP), CNAME for backend (Railway domain)
   - SSL/TLS mode: Full (Strict)
   - Page Rules: Always use HTTPS, Cache Level: Cache Everything for /static/*
   - Enable: Bot Fight Mode, DDoS protection, Rate Limiting (50 req/10s per IP)
   - Firewall Rule: block requests with suspicious User-Agent strings

5. CI/CD with GitHub Actions:
   Create /.github/workflows/deploy.yml:
   - On push to main branch:
     * Run backend tests
     * Run frontend build check
     * Deploy frontend to Vercel (using vercel CLI action)
     * Railway auto-deploys from Dockerfile on push

Output: Dockerfile, railway.json, vercel.json, GitHub Actions workflow, and all docs files with full content.
```

---

## PHASE 12 — Performance Optimization (Caching + Speed)

```
You are a performance engineer. Optimize for sub-2 second load times and low-bandwidth environments.

Context:
- Frontend: Next.js at /frontend
- Backend: NestJS at /backend
- Cache: Upstash Redis (free tier) — UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN in env

Tasks:
1. Backend — Redis Caching:
   a. Install: `npm install @nestjs/cache-manager cache-manager ioredis` in /backend
   b. Configure CacheModule globally in app.module.ts using Upstash Redis (ioredis store)
   c. Apply @UseInterceptors(CacheInterceptor) with custom TTLs:
      - GET /store/products → TTL: 5 minutes
      - GET /store/categories → TTL: 1 hour
      - GET /store/products/:slug → TTL: 5 minutes
      - GET /store/search → TTL: 2 minutes
   d. Cache invalidation: in ProductsService, after create/update/delete → call cacheManager.reset() or targeted key deletion
   e. Create /backend/src/common/interceptors/cache-key.interceptor.ts — generates cache keys from route + query params

2. Backend — Query Performance:
   a. Write /backend/src/database/migrations/002_performance_indexes.ts adding indexes:
      - products: (is_active, created_at), (category_id, is_active), (price)
      - orders: (customer_id, created_at), (status)
      - reviews: (product_id, created_at)
   b. Add slow query logger: if any TypeORM query exceeds 500ms, log it as a warning with the full query

3. Frontend — Next.js Optimizations:
   a. Replace ALL <img> tags with Next.js <Image> component throughout
   b. Add priority prop to above-the-fold images (hero, first 4 product cards)
   c. Add Suspense + LoadingSkeleton to all data-fetching components
   d. Update /frontend/next.config.ts:
      - images.domains: add Supabase Storage domain
      - compress: true
      - poweredByHeader: false
      - experimental.optimizeCss: true
   e. Add route prefetching: in Header nav links, add prefetch={true} on all top-level routes

4. Frontend — Web Vitals Monitoring:
   Create /frontend/src/app/web-vitals.ts that:
   - Uses Next.js reportWebVitals
   - Sends CLS, LCP, FID, TTFB to GA4 as custom events
   - Logs to console in development

Output: Updated cache config, migration file, Next.js config, and all optimization files with full content.
```

---

## PHASE 13 — Testing & Final Documentation

```
You are a QA engineer and technical writer. Write tests and finalize project documentation.

Context:
- Full monorepo at /ecommerce-app
- Backend: NestJS (use @nestjs/testing, Jest, Supertest)
- Frontend: Next.js (use React Testing Library, Jest)

Tasks:
1. Backend Integration Tests at /backend/src/tests/:

   a. auth.e2e-spec.ts:
      - Register with valid data → 201 + cookie set
      - Register with duplicate email → 409
      - Login with correct credentials → 200 + access token cookie
      - Login with wrong password → 401
      - After 5 failed logins → account locked → 429
      - GET /store/auth/me without cookie → 401
      - GET /store/auth/me with valid cookie → 200 + user data

   b. products.e2e-spec.ts:
      - GET /store/products → 200 + paginated list
      - GET /store/products/:slug (valid) → 200 + product
      - GET /store/products/:slug (invalid) → 404
      - POST /admin/products without admin JWT → 403
      - POST /admin/products with admin JWT + valid body → 201

   c. orders.e2e-spec.ts:
      - POST /store/orders without auth → 401
      - POST /store/orders with out-of-stock item → 400
      - POST /store/orders with valid items → 201 + order created
      - PUT /admin/orders/:id/status (admin) → 200 + status updated

   d. search.e2e-spec.ts:
      - GET /store/search?q=test → 200 + results array
      - GET /store/search with filters → filtered results
      - GET /store/search?q= (empty) → 200 + empty or default results

2. Frontend Component Tests at /frontend/src/tests/:

   a. ProductCard.test.tsx:
      - Renders product title, price, and image
      - Shows discount badge when discountPrice is set
      - Wishlist heart button toggles on click

   b. CartSummary.test.tsx:
      - Calculates subtotal correctly from items
      - Applies valid coupon → shows discounted total
      - Invalid coupon → shows error message

   c. SearchBar.test.tsx:
      - Renders input
      - After typing with 200ms debounce → shows dropdown results
      - Press Escape → closes dropdown
      - Press Enter on result → navigates to product page

3. Root README.md (complete rewrite):
   - Project overview and feature list
   - Architecture diagram (ASCII art showing: Browser ↔ Vercel (Next.js) ↔ Railway (NestJS) ↔ Supabase + Meilisearch + Redis)
   - Tech stack table with versions and links
   - Local development setup (step-by-step, beginner-friendly)
   - All environment variables guide (link to /docs/env-variables.md)
   - Deployment guide summary (link to /docs/cloudflare-setup.md)
   - How to add a new payment method
   - How to add a new email template
   - Known free tier limits and when to upgrade each service
   - Contributing guide

Output: All test files and complete README.md with full content.
```

---

## 📋 PHASE EXECUTION ORDER

| Phase | What It Builds | Key Tech |
|-------|---------------|----------|
| 0 | Monorepo scaffolding | npm workspaces |
| 1 | Database entities & schema | TypeORM + Supabase |
| 2 | NestJS API core (all modules) | NestJS modules |
| 3 | Auth (JWT + refresh tokens + 2FA) | Passport.js + otplib |
| 4 | Next.js frontend (all pages) | Next.js App Router |
| 5 | Smart search | Meilisearch |
| 6 | Payments | Stripe + bKash |
| 7 | Transactional email | Brevo |
| 8 | Security hardening | Helmet + Winston |
| 9 | Admin dashboard | recharts |
| 10 | File uploads | Supabase Storage |
| 11 | Deployment config | Docker + Railway + Vercel |
| 12 | Performance & caching | Redis (Upstash) |
| 13 | Tests + documentation | Jest + RTL |

**Total estimated time with Copilot Agent: ~7–8 hours**

---

## 🔑 MASTER ENVIRONMENT VARIABLES

### /backend/.env
```env
# APP
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# DATABASE
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres

# SUPABASE
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AUTH
JWT_SECRET=your-256-bit-random-secret
JWT_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRY=30d

# ADMIN
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD_HASH=bcrypt-hashed-password
ADMIN_ALLOWED_IPS=your.ip.address.here

# STRIPE
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# BKASH
BKASH_APP_KEY=your-app-key
BKASH_APP_SECRET=your-app-secret
BKASH_USERNAME=your-username
BKASH_PASSWORD=your-password
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta

# BREVO (EMAIL)
BREVO_API_KEY=xkeysib-...
SENDER_EMAIL=noreply@yourdomain.com
SENDER_NAME=Your Store Name
BRAND_COLOR=#2563EB

# MEILISEARCH
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_API_KEY=your-master-key

# REDIS (UPSTASH)
UPSTASH_REDIS_URL=https://your-instance.upstash.io
UPSTASH_REDIS_TOKEN=your-token
```

### /frontend/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_MEILISEARCH_URL=http://localhost:7700
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=your-search-only-key
```

---

## ⚡ NESTJS VS MEDUSA — WHY THIS IS BETTER

| Concern | Medusa.js | NestJS |
|---------|-----------|--------|
| Flexibility | Opinionated commerce structure | Full control over every module |
| Custom logic | Requires overriding Medusa internals | Native — just write a service |
| Learning curve | Medusa-specific concepts | Standard Node.js patterns |
| Community | Commerce-specific | Massive general backend community |
| Testing | Limited built-in test support | First-class Jest + Supertest support |
| Deployment | Heavier (built-in admin, plugins) | Lightweight Docker image |
| Performance | Moderate | Faster — only runs what you build |

---

*Prompt Pack v2.0 (NestJS Edition) — Crafted for Copilot Agent mode (VS Code)*  
*Stack: Next.js · NestJS · Supabase · TypeORM · Meilisearch · Stripe · bKash · Brevo · Cloudflare · GA4*
