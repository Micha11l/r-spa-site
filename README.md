# Rejuvenessence — Production Booking + Gift Cards Platform (Next.js + Supabase)

A production web application for a private wellness studio, combining a marketing site, appointment booking, and Stripe-based gift card purchases, with an authenticated internal admin workflow.

## Live
- Production: https://rejuvenessence.org  
- Preview/Staging: https://r-spa-site.vercel.app  

---

## Resume-style highlights
- Built a full-stack booking and gift card platform with Next.js App Router + Supabase (Postgres/Auth/RLS) deployed on Vercel.
- Implemented booking conflict prevention to avoid time-slot overlaps before confirming reservations.
- Designed role-based access using Supabase RLS to separate public booking capabilities from admin operations.
- Delivered transactional email flows (client + owner) including calendar invite (.ics) attachments.
- Shipped internal admin tooling in the same codebase: bookings management, clients/notes, gift card tracking.

---

## What it does

### Customer-facing
- Multi-page marketing site (services, policies, FAQ)
- Booking flow: service/date/time → customer details → confirmation / cancellation / updates
- Transactional email notifications (client + owner) with calendar invite (.ics)
- Gift card purchase via Stripe Checkout

### Admin (authenticated)
- Booking management: status, notes, customer details
- Deposit request workflow (email-based)
- Client list with visit history / internal notes
- Gift card management (purchase tracking / issuance)

---

## Tech stack
- **Frontend:** Next.js (App Router), React, TypeScript, TailwindCSS  
- **Backend:** Supabase (Postgres + Auth + RLS + RPC), Next.js API Routes, Zod validation
- **Payments:** Stripe Checkout + Webhook (with idempotency handling)
- **Email:** Zoho SMTP + Resend fallback, outbox audit trail, .ics attachments
- **Deploy:** Vercel

---

## Architecture (high-level)
- **Web app (Next.js):** marketing pages + booking UI + admin UI
- **API routes / server actions:** booking creation/updates, admin operations, email sending
- **Database (Supabase Postgres):** bookings, clients, gift cards, audit/metadata
- **Auth + RLS:** authenticated admin workflows with policy-enforced data access
- **Payments (Stripe):** gift card checkout flow + post-checkout handling
- **Email (Resend):** confirmation/operational emails + .ics calendar attachment generation

---

## Engineering highlights
- **Booking conflict prevention:** SQL overlap query blocks conflicting time slots before confirmation
- **Row-level security (RLS):** user data isolation + server-side privileged operations with audit
- **Payment idempotency:** webhook handlers use idempotency keys to prevent duplicate processing
- **Auditable email system:** dual-channel delivery (Zoho + Resend), all sends logged to outbox for troubleshooting
- **Gift card state machine:** secure redemption flow (unique code + temp token + 2-step verify/execute)
- **Single codebase:** admin tooling built-in (calendar, booking management, gift card ops)

---

## Screenshots

### Booking flow
![Booking flow](docs/screenshots/booking-flow.png)

### Gift card checkout
![Gift card checkout](docs/screenshots/giftcard-checkout.png)

### Admin dashboard (bookings)
![Admin dashboard](docs/screenshots/admin-dashboard.png)

### Admin clients
![Admin clients](docs/screenshots/admin-clients.png)

### Admin gift cards
![Admin gift cards](docs/screenshots/admin-giftcards.png)

---

## Local development

### Install & run
```bash
npm install
cp .env.example .env.local
npm run dev
```
### Environment variables
Use `.env.example` / `.env.production.example` as references.

- Keep server-only secrets (e.g., Supabase service role key, Stripe secret key) on the server only
- Do not expose server secrets to the client (avoid `NEXT_PUBLIC_` for sensitive values)

### Security & privacy notes
	•	No production secrets are stored in this repository.
	•	Operational/internal documentation and database migration assets are intentionally excluded from the public repo.
	•	Screenshots should be redacted if they contain personal or sensitive information.
### Roadmap
	•	Deposit payment automation + webhook reconciliation
	•	Availability UI fully driven by database resources
	•	Multi-language content
	•	Automated tests (unit + e2e)
