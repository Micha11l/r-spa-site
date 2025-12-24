import Stripe from "stripe";

type StripeMode = "test" | "live";

function resolveMode(): StripeMode {
  return process.env.STRIPE_MODE === "live" ? "live" : "test";
}

function getSecretKey(mode: StripeMode) {
  let key =
    mode === "live"
      ? process.env.STRIPE_SECRET_KEY_LIVE
      : process.env.STRIPE_SECRET_KEY_TEST;
  if (!key && mode === "test") {
    key = process.env.STRIPE_SECRET_KEY;
  }
  if (!key) {
    throw new Error(
      `Missing Stripe secret key for mode "${mode}". Set ${
        mode === "live" ? "STRIPE_SECRET_KEY_LIVE" : "STRIPE_SECRET_KEY_TEST"
      }.`,
    );
  }
  return key;
}

function getWebhookSecretForMode(mode: StripeMode) {
  let secret =
    mode === "live"
      ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
      : process.env.STRIPE_WEBHOOK_SECRET_TEST;
  if (!secret && mode === "test") {
    secret = process.env.STRIPE_WEBHOOK_SECRET;
  }
  if (!secret) {
    throw new Error(
      `Missing Stripe webhook secret for mode "${mode}". Set ${
        mode === "live"
          ? "STRIPE_WEBHOOK_SECRET_LIVE"
          : "STRIPE_WEBHOOK_SECRET_TEST"
      }.`,
    );
  }
  return secret;
}

export const stripeMode = resolveMode();
let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getSecretKey(stripeMode));
  }
  return stripeClient;
}

export function getStripeWebhookSecret() {
  return getWebhookSecretForMode(stripeMode);
}

export function getLiveTestAmountCents(): number | null {
  const raw = process.env.STRIPE_LIVE_TEST_AMOUNT_CENTS;
  if (!raw) return null;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value <= 0) return null;
  return value;
}

export function getLiveTestEmails(): string[] {
  const raw = process.env.STRIPE_LIVE_TEST_EMAILS || "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
