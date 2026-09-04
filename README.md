# Goribmanush API

Personal expense tracker backend — auth, transactions, budgets, loans, goals, pay-cycle tracking, and monthly insights.

🚀 **Live App:** [https://gorib-manush.vercel.app](https://gorib-manush.vercel.app)  
📦 **Frontend Repository:** [mehediScriptDev/expenses_tracker_GBM](https://github.com/mehediScriptDev/expenses_tracker_GBM)  
⚙️ **Backend Repository:** [mehediScriptDev/expenses_tracker_GBM_api](https://github.com/mehediScriptDev/expenses_tracker_GBM_api)  
🌐 **Live API Base URL:** `https://expensestrackergbmapi-production.up.railway.app/api`

---

## ✨ Key Features

### 📊 1. Intelligent Dashboard & Pay-Cycle Tracking
- **Custom Pay-Cycle:** Tracks your monthly budget based on your **Salary Day (1–28)** rather than generic calendar months.
- **Safe Daily Spend Limit:** Calculates exactly how much you can safely spend per day to last until your next salary.
- **Carry-Over Balance:** Automatically rolls over unspent funds from the previous cycle into the new cycle.

### 💸 2. Transactions & Quick-Add Presets
- **Fast Expense/Income Logging:** Record amount, category, payment method (bKash, Nagad, Rocket, Cash, Card, Bank), tags, and spending mood (*Necessary, Happy, Luxury, Regret*).
- **⚡ One-Tap Quick Add:** Fast shortcuts for frequent daily expenses (Coffee, Bus, Lunch, Groceries).
- **Search, Filter & Duplicate:** Instantly search transactions, filter by cycle/month/type, or duplicate recurring entries.

### 🎯 3. Category Budgets & Warnings
- **Per-Category Limits:** Set monthly spending thresholds on individual expense categories.
- **Real-Time Progress:** Visual percentage bars and alerts when approaching (85%+) or exceeding 100% of your budget.

### 🤝 4. Debt & Loan Manager
- **Borrowed & Lent Tracking:** Keep track of money you owe or friends who owe you.
- **Repayment Tracking:** Partial and full repayment logs with automatic status calculation (*Paid, Partial, Unpaid, Overdue*).

### 🏆 5. Savings Goals
- **Target Tracking:** Set goals (e.g. Emergency Fund, New Phone, Vacation) with target dates.
- **Progressive Deposits:** Add deposits towards goals and track completion milestones.

### 📈 6. Insights & Analytics
- **Visual Analytics:** Breakdown of top spending categories, monthly income vs. expense ratio, and net savings.
- **Historical Data Archiving:** Automated monthly summaries for long-term financial trends.

### 🔔 7. Notifications & Alerts
- Smart notifications for budget breaches, approaching loan due dates, and achieved savings milestones.

### 🔐 8. Dual Authentication & Security
- **Email/Password & Google OAuth:** Sign in with email or one-tap Google login.
- **Secure Sessions:** JWT Access + Refresh token flow with HTTP-only cookies and protected routes.
- **Customizable Profile:** Change currency (৳ BDT, $ USD, etc.), salary day, and monthly income benchmark anytime.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js / React
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Lucide Icons, Shadcn UI
- **Deployment:** Vercel

### Backend
- **Framework:** Node.js + Express 5
- **Language:** TypeScript
- **ORM:** Prisma 7 (PostgreSQL Adapter)
- **Database:** PostgreSQL (Prisma Postgres / Neon / Supabase)
- **Auth:** Google OAuth SDK, JWT, Bcrypt
- **Deployment:** Railway

---

## 🚀 Getting Started Locally

### 1. Clone Repositories

```bash
# Frontend
git clone https://github.com/mehediScriptDev/expenses_tracker_GBM.git
cd expenses_tracker_GBM
npm install

# Backend
git clone https://github.com/mehediScriptDev/expenses_tracker_GBM_api.git
cd expenses_tracker_GBM_api
npm install
```

---

### 2. Environment Configuration

#### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

#### Backend (`.env`)
```env
PORT=5000
DATABASE_URL="postgres://user:password@host:5432/database?sslmode=require"
FRONTEND_URL=http://localhost:3000
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

### 3. Database Migration & Start

```bash
# In backend folder
npx prisma generate
npx prisma migrate dev
npm run dev

# In frontend folder
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | `POST` | Register user + seed default categories |
| `/api/auth/login` | `POST` | Login with email/password |
| `/api/auth/google` | `POST` | Google OAuth One-Tap sign-in |
| `/api/dashboard` | `GET` | Fetch pay-cycle metrics & safe daily limit |
| `/api/transactions` | `GET`, `POST` | List and create transactions |
| `/api/categories` | `GET`, `POST` | Manage spending & income categories |
| `/api/budgets` | `GET`, `POST` | Category budget tracking & limits |
| `/api/loans` | `GET`, `POST` | Debt & loan records |
| `/api/goals` | `GET`, `POST` | Savings targets and deposits |
| `/api/quick-adds` | `GET`, `POST` | Quick expense presets |
| `/api/insights` | `GET` | Monthly analytics & summaries |
| `/api/notifications` | `GET`, `POST` | Budget & loan alert center |

---

## 👨‍💻 Author

Developed with ❤️ by **Mehedi**  
- GitHub: [@mehediScriptDev](https://github.com/mehediScriptDev)
- Live Project: [Gorib Manush App](https://gorib-manush.vercel.app)
