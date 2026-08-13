# Goribmanush API

Personal expense tracker backend — auth, transactions, budgets, loans, goals, pay-cycle tracking, and monthly insights.

Built with **Express 5**, **TypeScript**, **Prisma 7**, and **PostgreSQL**.

---

## Features

- **Auth** — Email/password register & login, Google OAuth, JWT access + refresh tokens (cookie or Bearer)
- **Transactions** — CRUD, duplicate, search, type filter, pay-cycle scope
- **Categories & budgets** — Default seeds, per-category limits, spent / remaining / % used
- **Loans** — Borrowed & lent tracking, repayments, status (paid, partial, unpaid, overdue)
- **Goals** — Savings targets with deposits and progress
- **Quick-add presets** — One-tap expense shortcuts
- **Dashboard** — Pay-cycle metrics, carry-over balance, safe daily spend limit
- **Insights** — Monthly summaries for history; live stats for the current month
- **Notifications** — Budget alerts, goal milestones, debt due reminders
- **Retention** — Auto-archives transactions older than ~2 months into summaries

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js |
| Framework | Express 5 |
| Language | TypeScript |
| ORM | Prisma 7 (PostgreSQL driver adapter) |
| Auth | JWT + bcrypt, Google OAuth |
| Dev | tsx (watch mode) |

---

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or [Prisma Postgres](https://www.prisma.io/postgres))
- Google OAuth client ID (optional, for Google login)

---

## Quick start

```bash
# 1. Clone and install
git clone <repo-url>
cd expenses_tracker_GBM_api
npm install

# 2. Environment
cp .env.example .env
# Fill in values (see table below)

# 3. Database
npx prisma generate
npx prisma migrate deploy

# 4. Run
npm run dev
```

Server starts at `http://localhost:5000` (or your `PORT`).

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Server port (default `5000`) |
| `FRONTEND_URL` | Yes | Frontend origin for CORS (e.g. `http://localhost:3000`) |
| `JWT_ACCESS_SECRET` | Yes | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Yes | e.g. `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Yes | e.g. `7d` |
| `BCRYPT_SALT_ROUNDS` | Yes | e.g. `10` |
| `GOOGLE_CLIENT_ID` | Yes* | Google OAuth client ID |

\* Required only if using Google login.

### Migrations tip (Prisma Postgres)

If `migrate deploy` times out on a **pooled** URL (`*.pooled.*`), use the **direct** database URL for migrations, then run the app with the pooled URL.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled production build |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma migrate deploy` | Apply migrations (production) |
| `npx prisma migrate dev` | Create & apply migrations (development) |
| `npx prisma studio` | Open database GUI |

---

## Project structure

```
src/
├── app.ts                 # Express app & route registration
├── server.ts              # Entry point, DB connect, retention job
├── config/                # Environment config
├── middleware/            # Auth middleware
├── jobs/                  # Background jobs (retention)
├── lib/                   # Prisma client, Google auth
├── utils/                 # JWT, dates, response helpers
└── modules/
    ├── auth/
    ├── user/
    ├── transaction/
    ├── category/
    ├── budget/
    ├── loan/
    ├── goal/
    ├── quick-add/
    ├── dashboard/
    ├── insights/
    ├── notification/
    └── cycle/             # Internal pay-cycle & carry-over logic

prisma/
├── schema/                # Prisma models & enums
└── migrations/            # SQL migrations
```

Each module follows the same layout:

```
*.types.ts      → Request/response shapes
*.service.ts    → Business logic & database queries
*.controller.ts → HTTP handlers
*.route.ts      → Route definitions
```

---

## Authentication

Protected routes accept either:

- **Cookie:** `accessToken` (httpOnly, set on login/register)
- **Header:** `Authorization: Bearer <accessToken>`

### Auth endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create account (seeds categories + quick-adds) |
| `POST` | `/api/auth/login` | Email/password login |
| `POST` | `/api/auth/google` | Google sign-in (`{ idToken }`) |
| `POST` | `/api/auth/refresh-token` | Refresh access token |
| `POST` | `/api/auth/logout` | Clear auth cookies |

### Register / login body

```json
{
  "name": "Your Name",
  "email": "you@example.com",
  "password": "secret123"
}
```

---

## API reference

Base URL: `/api`

All protected endpoints require a valid access token.

### Response format

**Success**

```json
{
  "success": true,
  "status": 200,
  "message": "Transactions fetched successfully.",
  "data": [ ... ],
  "meta": { "page": 1, "limit": 10, "total": 42 }
}
```

`meta` is included on paginated list endpoints.

**Error**

```json
{
  "success": false,
  "status": 400,
  "message": "Category not found.",
  "data": null
}
```

---

### Users — `/api/users`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/profile` | Get profile |
| `PATCH` | `/profile` | Update name, salary, payday, currency |
| `PATCH` | `/password` | Change password (credential accounts) |

**Profile fields:** `monthly_salary`, `salary_day` (1–28), `currency_code`, `currency_symbol`

---

### Dashboard — `/api/dashboard`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Pay-cycle overview |

Returns `carry_over`, `cycle_income`, `cycle_expenses`, `available`, `benchmark_salary`, `safe_daily_limit`, and cycle dates.

**Available balance:** `carry_over + cycle_income - cycle_expenses`

---

### Transactions — `/api/transactions`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List (paginated) |
| `POST` | `/` | Create |
| `PATCH` | `/:id` | Update |
| `DELETE` | `/:id` | Delete |
| `POST` | `/:id/duplicate` | Duplicate with current timestamp |

**Query params (GET)**

| Param | Default | Values |
|-------|---------|--------|
| `page` | `1` | Page number |
| `limit` | `10` | Items per page |
| `scope` | `current_cycle` | `current_cycle`, `current_month`, `all` |
| `type` | all | `expense`, `income` |
| `search` | — | Description (case-insensitive) |

---

### Categories — `/api/categories`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List (paginated) |
| `POST` | `/` | Create custom category |
| `POST` | `/seed-defaults` | Seed default categories |
| `PATCH` | `/:id` | Update |
| `DELETE` | `/:id` | Delete (reassigns transactions → `other`) |

**Query params (GET):** `page`, `limit`, `kind` (`expense` / `income` / `all`), `search`

---

### Budgets — `/api/budgets`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List with spent / remaining / % (paginated) |
| `POST` | `/` | Create |
| `PATCH` | `/:id` | Update limit |
| `DELETE` | `/:id` | Delete |

**Query params (GET):** `page`, `limit`, `search`, `category_id`, `status` (`on-track`, `near-limit`, `over`, `all`)

Spent is calculated from **current calendar month** expenses.

---

### Loans — `/api/loans`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List (paginated) |
| `POST` | `/` | Create |
| `PATCH` | `/:id` | Update |
| `POST` | `/:id/repay` | Record repayment |
| `DELETE` | `/:id` | Delete |

**Query params (GET):** `page`, `limit`, `direction` (`borrowed` / `lent`), `status` (`paid`, `partial`, `unpaid`, `overdue`), `search`

---

### Goals — `/api/goals`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List (paginated) |
| `POST` | `/` | Create |
| `PATCH` | `/:id` | Update |
| `POST` | `/:id/deposit` | Add to savings |
| `DELETE` | `/:id` | Delete |

**Query params (GET):** `page`, `limit`, `search`, `status` (`completed`, `in-progress`)

---

### Quick-add presets — `/api/quick-adds`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List presets |
| `POST` | `/` | Create |
| `POST` | `/seed-defaults` | Seed defaults (Coffee, Bus, Lunch, etc.) |
| `PATCH` | `/:id` | Update |
| `DELETE` | `/:id` | Delete |

---

### Insights — `/api/insights`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/summaries` | All archived months + live current month |
| `GET` | `/current` | Current month stats |
| `GET` | `/summaries/:year/:month` | Single month detail |

Each summary includes `total_income`, `total_expenses`, `net_saved`, `top_categories`, and `transaction_count`.

---

### Notifications — `/api/notifications`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List generated alerts (paginated) |
| `POST` | `/read` | Mark read |
| `DELETE` | `/read` | Clear all read state |

**Query params (GET):** `page`, `limit`, `unread_only=true`

**Mark read body:**

```json
{ "notification_key": "budget-warning-<categoryId>" }
```

```json
{ "mark_all": true }
```

**Types:** `BUDGET_LIMIT_WARNING`, `BUDGET_LIMIT_EXCEEDED`, `GOAL_MILESTONE`, `DEBT_DUE_SOON`

---

## Key concepts

### Pay cycle

Budget pacing follows the user's **salary day** (1–28), not the calendar month. Transactions default to `scope=current_cycle`.

### Carry-over

Unused balance from the previous pay cycle rolls into the next automatically when a new cycle starts. Stored on the user as `carry_over_balance`.

### Data retention

A background job runs on startup and every 24 hours:

1. Keeps raw transactions for the **current month + last 2 months**
2. Summarizes older months into `monthly_summaries`
3. Deletes archived raw transactions

Insights reads summaries for old months and live data for recent ones.

---

## Default seeds

**Categories:** Food, Rent, Transport, Personal Care, Other, Salary

**Quick-add presets:** Coffee, Bus, Lunch, Fuel, Groceries

Both are created automatically on user registration.

---

## Enums reference

| Field | Values |
|-------|--------|
| Transaction type | `income`, `expense` |
| Category kind | `income`, `expense` |
| Payment method | `cash`, `bkash`, `nagad`, `rocket`, `card`, `bank`, `other` |
| Mood (expenses) | `necessary`, `happy`, `luxury`, `regret` |
| Loan direction | `borrowed`, `lent` |

API accepts lowercase; database stores uppercase.

---

## Production checklist

- [ ] Set strong `JWT_*_SECRET` values
- [ ] Run `npx prisma migrate deploy` against the **direct** DB URL
- [ ] Set `FRONTEND_URL` to your production frontend origin
- [ ] Use `npm run build && npm start` (not `tsx`) in production
- [ ] Configure HTTPS so httpOnly cookies work correctly

---

## License

Private — GBM / goribmanush project.
