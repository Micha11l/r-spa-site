# Rejuvenessence — Production Booking + Gift Cards Platform (Next.js + Supabase)

A live, production web app for a private wellness studio: marketing site + appointment booking + gift card purchase, with an internal admin workflow.

**Live**
- Production: https://rejuvenessence.org
- Preview/Staging: https://r-spa-site.vercel.app

---

## What this app does

### Customer-facing
- Multi-page marketing site (services, policies, FAQ)
- Booking flow (service/date/time + customer info → confirmation / cancellation / updates)
- Email notifications (owner + client) with calendar invite (.ics)
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
- **Reliable transactional emails:** confirmations/reminders + calendar attachment
- **Admin workflow:** operational tools built into the same codebase (no external admin panel)

---

## Local development

### Install
    npm install
    cp .env.example .env.local
    npm run dev

### Database (Supabase)
1. Create a Supabase project
2. Run SQL schema in `supabase/schema.sql` (Supabase SQL editor)
3. Fill `.env.local` with Supabase keys

### Environment variables
Configure from `.env.example` / `.env.production.example`:
- Supabase public + server keys
- Resend email keys
- Stripe keys (and webhook secrets if enabled)

> Never expose Supabase **service role** keys to the client. Keep them server-side only.

---

## Screenshots (recommended)
Add screenshots to `docs/screenshots/` (redact any personal info). Then embed them here:
- Customer booking flow
- Gift card checkout
- Admin dashboard (bookings / clients / gift cards)

---

## Roadmap
- Deposit payment automation + webhook reconciliation
- Availability UI fully driven by DB resources
- Multi-language content
- Automated tests (unit + e2e)
