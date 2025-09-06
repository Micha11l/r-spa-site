# R Spa – Next.js + Supabase Starter

Black & white minimalist private spa website with booking flow.

## Stack
- Next.js (App Router) + Tailwind + Framer Motion
- Supabase (Postgres) for bookings
- Resend for email notifications (+ ICS calendar attachment)
- Optional Twilio for SMS
- Deploy: Vercel (front-end) + Supabase (DB)
- Monitoring: UptimeRobot/BetterStack, Sentry, GA4 (instructions below)

## Quick Start

1) **Create Supabase project** → copy the SQL from `supabase/schema.sql` into SQL editor and run.
2) **Create Resend API key** (verify sending domain) and note `RESEND_API_KEY`.
3) **(Optional) Twilio**: get `TWILIO_*` creds if you plan to send SMS.
4) **Clone & install**
```bash
npm i
cp .env.example .env.local
# fill env vars
npm run dev
```
5) **Deploy**: push to GitHub and import into Vercel. Set environment variables in Vercel settings. Set `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_ANON_KEY` from Supabase project settings, and `SUPABASE_SERVICE_ROLE` (Server-side only).

### Environment Variables

See `.env.example` and set:
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_OWNER_EMAIL`
- `SITE_*` details
- (Optional) Twilio variables

### Booking Flow
- POST `/api/book` with { service, date, time, name, email, phone, notes? }
- Checks overlap; inserts `bookings` row as `pending`
- Sends emails to owner and client (with `.ics` attachment)

> For advanced rules (deposits, multi-resource, cancellations), extend the DB and API route.

### Styling & Pages
- Black & white minimalist theme in `app/globals.css`
- Pages: Home, Services (with your provided price list), Booking, FAQ, Policies
- `components/` holds UI building blocks

### Analytics & Monitoring
- **GA4**: set `NEXT_PUBLIC_GA_MEASUREMENT_ID` and add gtag script in `app/layout.tsx` (or Vercel Analytics).
- **Sentry**: add `@sentry/nextjs`, run `npx @sentry/wizard -i nextjs`, and commit config.
- **UptimeRobot/BetterStack**: monitor the site URL + `/api/book` POST health with a heartbeat (optionally add a GET `/api/health`).

### Security Notes
- The API uses Supabase Service Role key server-side only (never expose in client). Vercel server environment is safe.
- Add rate limiting (e.g., middleware + IP-based limits) and captcha for production.
- Validate inputs (we use zod).

### Roadmap
- Add deposit & Stripe payments
- Owner confirmation endpoint (flip booking from pending → confirmed)
- Availability UI (fetch from Supabase instead of free text time)
- Multi-language & image gallery

---
© R Spa
