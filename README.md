# Rejuvenessence — Production Booking + Gift Cards Platform (Next.js + Supabase)

A live, production web app for a private wellness studio: marketing site + appointment booking + gift card purchase, with an internal admin workflow.

**Live**
- Production: https://rejuvenessence.org
- Preview/Staging: https://r-spa-site.vercel.app

---

## What this app does (high level)

### Customer-facing
- Multi-page marketing site (services, therapies, policies, FAQ)
- Booking flow (service/date/time + customer info → confirmation)
- Email notifications (owner + client) with calendar invite (.ics)
- Gift card purchase flow (Stripe Checkout)

### Admin / internal tools (authenticated)
- View & manage bookings (status, notes, customer details)
- Send deposit request emails (payment link / instructions)
- Client list (visit history / notes)
- Gift card management (track purchases / issuance)

---

## Tech stack
- **Frontend:** Next.js (App Router), React, TypeScript, TailwindCSS, Framer Motion
- **Backend:** Supabase (Postgres + Auth + RLS policies)
- **Payments:** Stripe (gift cards / checkout)
- **Email:** Resend (transactional email + .ics)
- **Deploy:** Vercel (web) + Supabase (DB)

---

## Key engineering highlights (what I want reviewers to notice)
- **Booking conflict prevention:** validates time-slot overlap before confirming a booking
- **Role-based access (RLS):** public booking writes vs admin read/manage separated by policies
- **Reliable transactional emails:** owner/client notifications with calendar attachment
- **Admin workflow:** operational tools built into the same codebase (no external admin panel)

---

## Local setup

### 1) Install
```bash
npm install
cp .env.example .env.local
npm run dev
