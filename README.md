# DIGITAL HEROES — Full-Stack Web Application

> **Play Your Game. Give With Purpose. Win Something Back.**
> An enterprise-grade, full-stack golf performance, charity contribution, and monthly reward-draw platform.

---

## Overview

**Digital Heroes** transforms authentic 18-hole Stableford golf scores into recurring charitable funding while entering players into mathematically governed monthly reward draws. Built as a high-trust impact and fintech ecosystem, the platform unites passionate golfers under a transparent pledge model where every subscription dollar directly supports verified non-profits.

---

## Features

### 1. Stableford Score Management (PRD Section 8)
- **Strict Scoring Boundaries**: Supports integer Stableford scores from **1 to 45 points**.
- **Calendar Constraint**: Enforces one score per player per date with duplicate-date rejection.
- **Rolling 5-Score Window**: Maintains exactly the 5 latest chronological scores. Upon logging a 6th round, the oldest round is automatically and atomically archived.
- **Instant Combination Generation**: The latest 5 scores automatically compose the subscriber's monthly draw ticket.

### 2. Dual-Mode Draw Engine & Rollover Jackpot (PRD Sections 12–15)
- **Two Draw Modes**:
  - **RANDOM**: Deterministic PRNG using Mulberry32 seeded algorithms for 100% reproducible auditing.
  - **ALGORITHMIC**: Frequency-weighted draw sampling participant score distributions with Laplace smoothing (+1) to guarantee non-zero selection probability across all numbers 1–45.
- **Prize Allocation**:
  - **5-Number Match (Jackpot)**: **40%** of net prize pool. If unclaimed, **rolls over 100%** into the subsequent monthly draw jackpot!
  - **4-Number Match**: **35%** of net prize pool. Divided equally among winners (does not roll over).
  - **3-Number Match**: **25%** of net prize pool. Divided equally among winners (does not roll over).
- **Non-Destructive Simulation Sandbox**: Administrators can simulate any draw, inspect projected winners per tier, payouts, and rollovers without mutating the production database.

### 3. Centralized Financial & Charity Calculation Service (PRD Sections 10–11)
- **Integer Minor-Unit Math**: Calculates all fees in cents/pence to prevent floating-point rounding errors.
- **Minimum 10% Charity Guarantee**: Enforced by database schema and Zod validations.
- **Live Allocation Breakdown**:
  $$\text{Charity Amount} = \text{round}(\text{Plan Amount} \times \text{Pledge } \%)$$
  $$\text{Prize Pool} = \text{round}(\text{Plan Amount} \times 40\%)$$
  $$\text{Platform Operations} = \text{Plan Amount} - \text{Charity Amount} - \text{Prize Pool}$$

### 4. Certified Winner Verification State Machine (PRD Section 17 & 23)
- **Lifecycle Stages**:
  $$\text{PENDING\_PROOF} \longrightarrow \text{PROOF\_SUBMITTED} \longrightarrow \text{APPROVED / REJECTED} \longrightarrow \text{PAID}$$
- **Scorecard Validation**: Validates file MIME types (JPEG, PNG, WebP, PDF) and max 5MB size limit.
- **Compliance Audit**: Admin approval triggers automated pending payouts; rejection requires mandatory review rationale.

### 5. Dual-Role Architecture & Admin Suite (PRD Sections 19–24)
- **Subscriber Portal**: Overview metrics, rolling 5-score manager, charity switcher with slider, active draw ticket matcher, and winnings claim manager.
- **Admin Governance Suite**:
  - Executive Overview with live Recharts visual analytics.
  - Draw Creator & Sandbox Simulator.
  - Winner verification & ACH payout authorization.
  - Charity CRUD management with featured partner pinning.
  - Paginated user directory & handicap auditor.
  - Immutable audit logging tracking every sensitive admin mutation.

---

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript (Strict Mode), Tailwind CSS, Lucide React Icons, Framer Motion
- **Data Visualization**: Recharts (MRR run-rates, subscriber trajectories, charity distributions)
- **Forms & Validation**: React Hook Form + Zod
- **Backend**: Next.js Route Handlers, Server Actions, `@supabase/ssr`, `@supabase/supabase-js`
- **Database**: PostgreSQL (Supabase) with Row Level Security (RLS) policies and UUID primary keys
- **Payments**: Stripe Checkout & raw webhook signature verification
- **Testing**: Vitest automated unit test suite

---

## Architecture

```
DigitalHeroes-Assignment/
├── supabase/
│   ├── migrations/
│   │   └── 20240101000000_init_schema.sql  # Complete 13-table PostgreSQL schema with RLS
│   └── seed.sql                            # Production database seed records
├── tests/
│   ├── draw-engine.test.ts                 # Vitest tests: RNG, Laplace, 40/35/25, rollover
│   ├── financial-service.test.ts           # Vitest tests: Cents math, min 10% pledge
│   ├── score-service.test.ts               # Vitest tests: 1-45 range, rolling 5 limit, dates
│   └── winner-service.test.ts              # Vitest tests: Verification state machine
├── src/
│   ├── app/
│   │   ├── page.tsx                        # 11-section editorial landing page
│   │   ├── about/page.tsx                  # Philosophy & governance
│   │   ├── charities/                      # Directory + [id] detail page + direct donation
│   │   ├── draws/page.tsx                  # Public mechanics & past draw results
│   │   ├── pricing/page.tsx                # Monthly vs Yearly with live breakdown slider
│   │   ├── login/page.tsx & signup/page.tsx# Authentication with role fill & min 10% pledge
│   │   ├── dashboard/                      # Subscriber portal (overview, scores, charity, draws, winnings, subscription, settings)
│   │   ├── admin/                          # Admin console (overview, draws, winners, charities, users, subscriptions, scores, reports, settings)
│   │   └── api/stripe/                     # Checkout sessions & webhook signature verifier
│   ├── components/
│   │   ├── navigation/                     # Navbar with Evaluator persona switcher, Footer
│   │   └── ui/                             # Buttons, Cards, Badges, Modals, Inputs
│   ├── lib/
│   │   ├── services/                       # Pure domain services (scores, draw-engine, financials, winner)
│   │   ├── data/                           # In-memory store & seed repository
│   │   ├── stripe/                         # Stripe SDK client
│   │   └── supabase/                       # Supabase client, server, and middleware
│   └── types/                              # Strict TypeScript interfaces
```

---

## Database

The PostgreSQL schema (`supabase/migrations/20240101000000_init_schema.sql`) implements all 13 relational tables required by the PRD:
1. `profiles`: Extends authentication with roles (`user`, `admin`) and golf handicap.
2. `charities`: Vetted non-profit entities with categories, locations, and events.
3. `user_charities`: User pledge records enforcing `contribution_percentage >= 10`.
4. `subscriptions`: Stripe recurring memberships with period start/end tracking.
5. `scores`: Stableford records with unique constraint `(user_id, played_date)`.
6. `draws`: Monthly draw cycles with modes (`RANDOM`, `ALGORITHMIC`), rollover amounts, and seed audit.
7. `draw_entries`: Participant 5-number combinations with unique constraint `(draw_id, user_id)`.
8. `prize_pools`: Audit table capturing the exact tier allocations (40% / 35% / 25%).
9. `winners`: Verification records with status machine (`PENDING_PROOF` to `PAID`).
10. `winner_proofs`: Scorecard image metadata, size, and URLs.
11. `payouts`: Electronic transfer disbursement records.
12. `audit_logs`: Immutable ledger of administrative operations.
13. `notifications`: Player communication alerts.

---

## Authentication

- Real session persistence and route protection via Next.js middleware (`src/middleware.ts`).
- Server-side authorization verifying subscriber status and admin roles.
- Evaluator persona switcher integrated directly into the top bar for instant toggling between **Subscriber Persona** (Marcus Vance) and **Admin Persona** (Victoria Sterling).

---

## Draw Engine & Mathematical Specification

1. **Deterministic Random Draw**:
   - Generates 5 distinct integers in range $[1, 45]$ sorted in ascending order.
   - Seeded using a 32-bit linear congruential Mulberry32 algorithm.
2. **Algorithmic Score-Frequency Weighted Draw**:
   - Collects all participant scores for the active cycle.
   - Calculates empirical counts for numbers 1 to 45: $\text{count}(n)$.
   - Applies Laplace smoothing: $\text{Weight}(n) = \text{count}(n) + 1$.
   - Executes roulette wheel sampling without replacement to pick 5 numbers.
3. **Prize Pool Distribution**:
   - Tier 5 (5-match Jackpot): $40\%$ of pool + prior rollover. Unclaimed pool rolls over 100%.
   - Tier 4 (4-match): $35\%$ of pool (does not roll over).
   - Tier 3 (3-match): $25\%$ of pool (does not roll over).

---

## Demo Credentials (PRD Section 36)

The application comes pre-loaded with comprehensive seed data and test accounts:

### Subscriber Account
- **Email**: `user@digitalheroes.golf`
- **Password**: `UserPassword123!`
- **Role**: Registered Subscriber (Marcus Vance)
- **Pre-seeded State**: 5 rolling scores, 20% pledge to *Veterans on Course*, active winning ticket in Draw #102.

### Administrator Account
- **Email**: `admin@digitalheroes.golf`
- **Password**: `AdminPassword123!`
- **Role**: Platform Administrator (Victoria Sterling)
- **Capabilities**: Sandbox draw simulator, scorecard proof inspector, charity CRUD, payout authorizer, and audit viewer.

---

## Local Setup

1. **Clone & Install**:
   ```bash
   git clone <repo-url>
   cd digitalheroes
   npm install
   ```

2. **Environment Variables**:
   ```bash
   cp .env.example .env.local
   ```
   *(The application runs fully functional out-of-the-box in development mode even prior to inserting live external API keys).*

3. **Run Automated Test Suite**:
   ```bash
   npm test
   ```
   *(Executes 21 unit tests across all domain services).*

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

5. **Production Build Verification**:
   ```bash
   npm run build
   ```

---

## Stripe Setup

1. Add your Stripe test API keys in `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
2. For webhook synchronization, forward events using the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

---

## Deployment to Vercel

The application is fully compatible with Vercel deployment:
1. Push repository to GitHub.
2. Import project in Vercel.
3. Configure environment variables matching `.env.example`.
4. Deploy with build command `npm run build`.

---

## QA & Testing Verification Checklist

- [x] **Auth**: Login, signup, role-based protection, demo credentials.
- [x] **Scores**: 1–45 score range validation, 1-per-date constraint, rolling 5-score limit, oldest-round ejection.
- [x] **Charity**: Directory search, category filters, >=10% pledge validation, independent non-gameplay donation modal.
- [x] **Draw Engine**: Random seeded determinism, algorithmic frequency weighting with Laplace smoothing, 40/35/25 prize pool splits, 5-match rollover guarantee.
- [x] **Simulation**: Non-destructive sandbox simulation prior to two-step draw publication.
- [x] **Winners**: Scorecard proof upload (size & MIME type check), admin approval/rejection state machine, payout tracking.
- [x] **Admin Suite**: User directory pagination, charity CRUD, global scores audit, financial reports, and audit trail.
- [x] **UI/UX**: Dark fintech aesthetic (no golf clichés or plaid patterns), responsive on mobile (320px), tablet (768px), and desktop (1440px).
