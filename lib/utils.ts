export function toISOInTZ(date: Date, tz: string) {
  // Basic ISO — rely on server TZ config (Vercel uses UTC). Accept as simple for MVP.
  return date.toISOString();
}
