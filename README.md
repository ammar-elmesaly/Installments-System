# Installments Backend API

Installments is a backend installment and receivables management API built with NestJS + TypeORM. It supports day-to-day workflows such as client management, installment plan creation, payment collection/unpay, overdue tracking, activity logs, and role-based admin access.

## Tech Stack

- Backend: Node.js, NestJS 11, TypeORM, PostgreSQL, JWT auth
- Tooling: ESLint, Jest (backend), TypeORM migrations

## Prerequisites

- Node.js (latest LTS recommended)
- npm
- PostgreSQL

## Environment Variables (Backend)

Create a `.env` file in `installments/`:

```bash
# App
PORT=3000
NODE_ENV=development
JWT_SECRET=replace_with_a_strong_secret

# Database (Option A: full URL)
DB_URL=postgresql://user:password@localhost:5432/installments

# Database (Option B: discrete variables)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=installments

# Optional: cron endpoint protection
CRON_SECRET_KEY=replace_with_cron_secret

# Optional: Telegram notifications
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_chat_id
```

Notes:

- If `DB_URL` is provided, it is used directly.
- In development, DB schema synchronization is enabled (`synchronize: true` when `NODE_ENV != production`).
- In production, SSL is enabled for PostgreSQL and synchronization is disabled.

## Install Dependencies

Install backend dependencies:

```bash
cd installments
npm ci
```

## Database Setup

Create your PostgreSQL database first, then start the backend.

With default local tools, for example:

```bash
createdb installments
```

If you want explicit migration-driven schema updates, use:

```bash
cd installments
npm run migration:run
```

## Super Admin Seeder

Seed or repair the canonical Super Admin account with these environment variables:

```bash
SEED_SUPER_ADMIN_EMAIL=admin@example.com
SEED_SUPER_ADMIN_PASSWORD=StrongPassword123
SEED_SUPER_ADMIN_FIRST_NAME=Super
SEED_SUPER_ADMIN_SECOND_NAME=Admin
SEED_SUPER_ADMIN_THIRD_NAME=User
SEED_SUPER_ADMIN_LAST_NAME=Account
SEED_SUPER_ADMIN_PHONE_NUMBER=05900000000
```

Optional fields:

```bash
SEED_SUPER_ADMIN_NICK_NAME=
SEED_SUPER_ADMIN_PROFESSION=
SEED_SUPER_ADMIN_ADDRESS=
SEED_SUPER_ADMIN_IMAGE_PATH=
```

Run it in development:

```bash
cd installments
npm run seed:super-admin
```

Run it after building for production use:

```bash
cd installments
npm run build
npm run seed:super-admin:prod
```

## Development

Start backend API:

```bash
cd installments
npm run start:dev
```

Default local address:

- Backend: `http://localhost:3000`

The backend sets a global API prefix, so endpoints are served under `/api/*`.

## Build

Backend build:

```bash
cd installments
npm run build
npm run start:prod
```

## Docker

Build and run the API with PostgreSQL:

```bash
cd installments
docker compose up --build
```

The compose file starts:

- `db` on port `5432`
- `api` on port `3000`

Docker defaults are set for local development in `docker-compose.yml`. If you want to use your own values, edit the `environment` block there or replace it with an `.env`-driven setup.

To stop and remove the containers:

```bash
docker compose down
```

To also remove the database volume:

```bash
docker compose down -v
```

## Scripts

Backend (`installments/package.json`):

- `npm run start:dev` - Run API in watch mode
- `npm run start:prod` - Run compiled API from `dist/src/main`
- `npm run build` - Build backend
- `npm run lint` - Run ESLint with auto-fix
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run e2e tests
- `npm run test:cov` - Run coverage
- `npm run migration:generate -- <path>` - Generate a migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run seed:super-admin` - Seed or repair the Super Admin account in development
- `npm run seed:super-admin:prod` - Seed or repair the Super Admin account from compiled output

## API Routing (Backend)

All routes are prefixed with `/api`.

- `/api/auth/login`
- `/api/auth/signup`
- `/api/auth/signup/admin`
- `/api/dashboard`
- `/api/clients/all`, `/api/clients/:id`, `/api/clients/new`, `/api/clients/update/:id`, `/api/clients/remove/:id`
- `/api/installment-plans/all`, `/api/installment-plans/new`, `/api/installment-plans/pay`, `/api/installment-plans/unpay`, `/api/installment-plans/freeze/:id`, `/api/installment-plans/unfreeze/:id`, `/api/installment-plans/notes/:id`
- `/api/transactions/by-plan/:planId`
- `/api/admins/all`, `/api/admins/:id`, `/api/admins/update/:id`, `/api/admins/remove/:id`
- `/api/fallback-contacts/new`
- `/api/activity-log/all`
- `/api/cron-job` (requires `x-cron-security-token` header matching `CRON_SECRET_KEY`)

## Authorization Model

- JWT guard is applied globally (except routes marked public).
- Admin role is required for protected routes.
- Fine-grained access is enforced via admin levels: `SuperAdmin` (2), `Collector` (1), `Auditor` (0).

## Feature Highlights

- Client onboarding and profile updates
- Installment plan lifecycle (create, freeze/unfreeze, notes)
- Installment payment and unpay flows with transaction history
- Dashboard KPIs: net cash flow, receivables, overdue summaries
- Activity log pagination
