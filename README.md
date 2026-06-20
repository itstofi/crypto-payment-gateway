# Crypto Payment Gateway

A simple full-stack demo of a crypto payment flow using Binance Pay, built with Next.js and Supabase. Includes a payment page, payment status tracking, and an admin dashboard.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4
- **Payment**: Binance Pay API (falls back to a local mock if credentials aren't set)
- **Hosting**: Vercel

## Features

- Payment form with preset and custom amounts
- Binance Pay integration with HMAC-SHA512 request signing
- Mock checkout flow for local development (no real credentials needed)
- Payment status page with automatic polling
- Admin dashboard with summary stats and a filterable payments table

## Getting Started

### 1. Set up Supabase

Create a project at [supabase.com](https://supabase.com), then run the SQL in `supabase/schema.sql` from the Supabase SQL editor.

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional — app runs in mock mode without these
BINANCE_PAY_API_KEY=
BINANCE_PAY_API_SECRET=
```

### 3. Run locally

```bash
npm install
npm run dev
```

- Payment page: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin

## Mock Payment Flow

When Binance Pay credentials are not configured, the app routes to a local mock checkout page at `/mock-checkout`. From there you can confirm or decline the payment to test both outcomes.

## Project Structure

```
src/
  app/                        # Next.js pages and API routes
    page.tsx                  # Payment form
    admin/page.tsx            # Admin dashboard
    payment/[id]/page.tsx     # Payment status
    mock-checkout/page.tsx    # Simulated checkout
    api/payments/
      create/route.ts
      status/route.ts
      list/route.ts
  components/
    layout/                   # Header, PageContainer
    payment/                  # CryptoPaymentForm, PaymentStatusCard
    admin/                    # AdminStatsCards, PaymentsTable
  lib/
    supabase/                 # client.ts (browser), server.ts (API routes)
    payments/                 # cryptoPayment.ts, mockGateway.ts
    utils/                    # formatCurrency, formatDate
  types/
    payment.ts
supabase/
  schema.sql
```

## Deploying to Vercel

Push the repo to GitHub, import it in Vercel, and add the same environment variables from `.env.local` in the Vercel project settings.
