# Shop POS

A single-shop Point of Sale system built with Next.js (App Router), TypeScript, Prisma and PostgreSQL. Two roles are supported out of the box: **Administrator** and **Salesperson**.

## Tech stack

- **Next.js 16** (App Router, Turbopack, Server Actions)
- **TypeScript**, strict mode
- **Prisma 7** ORM with the `@prisma/adapter-pg` driver adapter, **PostgreSQL**
- **Tailwind CSS 4** + **shadcn/ui** components
- **Zod** for server-side validation
- **bcryptjs** for password hashing, **jose** for signed session JWTs (custom cookie-based auth — no third-party auth library)
- **Recharts** for the dashboard sales trend chart
- **Vitest** for automated tests

## Getting started

Installing on a new system? The same guide is available in the running app at `http://localhost:3000/docs` (public, no login needed).

### 1. Install prerequisites

- **Node.js 20.9+** (includes npm) — check with `node -v`
- **PostgreSQL** running locally or on a reachable server
- **Git** (optional, only if you copy the project via a repository)

### 2. Copy the project

```bash
git clone <your-repository-url> pos
cd pos
```

If copying the folder manually, do **not** copy `node_modules`, `.next` or `generated` — they are rebuilt below. Copy your `.env` if you want the same settings.

### 3. Install dependencies

```bash
npm install
```

### 4. Create the database

```bash
psql -U postgres
CREATE USER pos_user WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE pos_db OWNER pos_user;
\q
```

If you are restoring existing shop data, restore your backup into this database and skip the seed in step 7.

### 5. Configure environment variables

Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`) and fill in your own values:

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://pos_user:password@localhost:5432/pos_db?schema=public` |
| `SESSION_SECRET` | Random secret used to sign session JWTs. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Credentials for the administrator account created by the seed script |

Never commit `.env`, and use a different `SESSION_SECRET` on every system.

### 6. Generate the Prisma client

The generated client (`generated/prisma`) is gitignored, so it must be created on every new system:

```bash
npx prisma generate
```

### 7. Run migrations and seed data

```bash
npx prisma migrate deploy
npx prisma db seed
```

(Use `npx prisma migrate dev` instead on a development machine if you are changing the schema.)

The seed script creates:

- An **administrator** account (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, defaults to `admin@shop.local` / `ChangeMe123!`)
- A demo **salesperson** account (`salesperson@shop.local` / `Salesperson123!`)
- Default shop settings, 3 categories, 6 products with initial stock, and 1 demo customer

Change the default passwords after first login.

### 8. Start the app

```bash
npm run dev
```

Visit `http://localhost:3000` (or the port Next.js reports if 3000 is busy) — you'll be redirected to `/login`.

### 9. Production build

```bash
npm run build
npm run start
```

Keep the process alive with a manager such as PM2 or a Windows service, and put it behind HTTPS.

### 10. Run tests

```bash
npm run test
```

The integration tests run against your real `DATABASE_URL` (they create and clean up their own isolated rows — nothing in the seed data is touched), so make sure it points at a database you're comfortable writing test data to during test runs (a local/dev database, not production).

### Troubleshooting

- **Cannot find module `generated/prisma`** — run `npx prisma generate` (step 6).
- **Can't reach database server** — check PostgreSQL is running and `DATABASE_URL` has the right user, password, host and port.
- **Redirected to login in a loop / session errors** — make sure `SESSION_SECRET` is set, then restart the server.
- **Port 3000 already in use** — run `npm run dev -- -p 3001`.

## Project structure

```
app/
  (auth)/login          Login page
  (dashboard)/          Everything behind the authenticated app shell (sidebar + topbar)
    admin/               Administrator dashboard
    pos/                 Point-of-sale screen (both roles)
    products/            Product management (admin)
    categories/          Category management (admin)
    customers/           Customer management (admin)
    sales/               Sales history (both roles — salespersons see only their own)
    inventory/           Stock alerts + movement history (admin)
    reports/             Sales/Products/Customers/Inventory reports + CSV export (admin)
    salespersons/        Salesperson account management (admin)
    settings/            Shop settings (admin)
    profile/             Own profile + change password (both roles)
  api/reports/           CSV export route handler
actions/                 Server Actions (mutations), one file per domain
services/                Business logic + Prisma queries, one file per domain
schemas/                 Zod validation schemas
components/              UI components (ui/ = shadcn primitives, rest organized by feature)
lib/                     Auth, session, Prisma client, money/csv helpers, nav config
prisma/                  schema.prisma, migrations, seed.ts
tests/                   Vitest unit + integration tests
proxy.ts                 Route protection (Next.js 16's replacement for middleware.ts)
```

## Roles & permissions

All authorization is enforced **server-side** — in `proxy.ts` (coarse route gating) and again inside every Server Action via `requireUser(...)` (fine-grained, defense-in-depth). The client never decides what a user is allowed to do.

- **Administrator**: full access — dashboard, POS, products, categories, customers, all sales, inventory, reports, salesperson management, shop settings.
- **Salesperson**: POS, their own sales history, and their own profile. Blocked at both the route level and the Server Action level from admin-only pages and mutations.

## Assumptions

These decisions weren't explicitly specified in the brief; sensible defaults were chosen and are documented here rather than fabricated as requirements:

- **Auth implementation**: rolled a small custom session system (bcrypt + signed JWT in an httpOnly cookie) instead of a third-party auth library, since Next.js 16 is very new and library compatibility was uncertain at the time of building. Sessions are re-validated against the database on every request, so deactivating a user revokes access immediately rather than at next login.
- **One payment per sale**: the schema stores a single `Payment` per `Sale` (no split payments across multiple methods). This matches how the brief describes payment recording; split payments were treated as out of scope.
- **Walk-in customer**: implemented as a nullable `customerId` on `Sale` rather than a special seeded "Walk-in" customer row — simpler, and the UI just displays "Walk-in Customer" when it's null.
- **Discount/Tax**: entered as flat manual amounts at checkout (not percentage-based or config-driven), since the brief only asked that they be "supported," not how they're calculated.
- **Receipt numbers**: format `RCT-YYYYMMDD-####`, a daily sequence per calendar day, generated inside the sale's database transaction with retry-on-conflict for the rare concurrent-collision case.
- **CSV over PDF**: reports export as CSV via a route handler; the printable HTML receipt (browser print-to-PDF) covers the PDF use case for receipts. A dedicated PDF report generator was treated as beyond what's needed for a single shop.
- **Rate limiting**: an in-memory per-process limiter on login attempts. Adequate for a single-shop deployment running one Node instance; would need a shared store (e.g. Redis) if ever run behind multiple instances.
- **Money math**: stored as `Decimal(12,2)` in Postgres; arithmetic is done with rounding to 2 decimal places at each step to avoid floating-point drift.
- **No product/category/customer deletion**: only activate/deactivate, per the brief's explicit instruction not to allow deleting products, and to preserve historical sales integrity (line items snapshot product name/SKU/price at time of sale, so they remain accurate even if a product is later edited or deactivated).
- **Prisma 7 / Next.js 16**: both are materially different from their prior major versions (new `prisma.config.ts` + driver-adapter model; `middleware.ts` renamed to `proxy.ts`, fully async `cookies()`/`headers()`/`params`). The code follows the current APIs for the versions actually installed, not older conventions.
"# pos" 
