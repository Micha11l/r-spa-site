# Rejuvenessence — Production Booking + Gift Cards Platform (Next.js + Supabase)

A live, production web app for a private wellness studio: marketing site + appointment booking + gift card purchase, with an internal admin workflow.

## Live
- Production: https://rejuvenessence.org  
- Preview/Staging: https://r-spa-site.vercel.app

---

## Overview

### Customer-facing
- Multi-page marketing site (services, policies, FAQ)
- Booking flow (service/date/time + customer info → confirmation / cancellation / updates)
- Automated email notifications (owner + client) with calendar invite (.ics)
- Gift card purchase flow (Stripe Checkout)

### Admin / internal tools (authenticated)
- View & manage bookings (status, notes, customer details)
- Send deposit request emails (payment link / instructions)
- Client list (visit history / notes)
- Gift card management (track purchases / issuance)

---

## Tech stack
- **Frontend:** Next.js (App Router), React, TypeScript, TailwindCSS
- **Backend:** Supabase (Postgres + Auth + RLS policies)
- **Payments:** Stripe (Gift Cards / Checkout)
- **Email:** Resend (transactional email + .ics)
- **Deploy:** Vercel + Supabase

---

## Key engineering highlights
- **Booking conflict prevention:** validates time-slot overlap before confirming a booking
- **Access control (RLS):** public booking vs admin read/manage separated by policies
- **Transactional email reliability:** confirmations + operational emails (with calendar attachment)
- **Single codebase admin workflow:** operations built into the app (no external admin panel)

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

### Install
```bash
npm install
cp .env.example .env.local
npm run dev
```

### Database (Supabase)
1. Create a Supabase project
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Configure `.env.local` with Supabase credentials

For detailed setup / troubleshooting, see: `supabase/README_DATABASE_SETUP.md`

### Environment variables
Use `.env.example` / `.env.production.example` as references:
- Supabase public + server keys
- Resend email keys
- Stripe keys (and webhook secrets if enabled)

> Never expose Supabase **service role** keys to the client. Keep them server-side only.

### Roadmap
- Deposit payment automation + webhook reconciliation
- Availability UI fully driven by DB resources
- Multi-language content
- Automated tests (unit + e2e)
