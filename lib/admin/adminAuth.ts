import crypto from "crypto";

const ADMIN_AUTH_COOKIE = "admin_auth";
const ADMIN_AUTH_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

type VerifyOk = { ok: true };
type VerifyFail = { ok: false; reason: string };

type AdminTokenPayload = {
  iat: number;
  exp: number;
};

function getSecret() {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) {
    throw new Error("ADMIN_AUTH_SECRET is not configured.");
  }
  return secret;
}

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
  return Buffer.from(normalized + "=".repeat(pad), "base64");
}

function hmac(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest();
}

export function signAdminToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminTokenPayload = {
    iat: now,
    exp: now + ADMIN_AUTH_MAX_AGE,
  };

  const payloadSegment = base64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const signatureSegment = base64UrlEncode(hmac(payloadSegment));

  return `${payloadSegment}.${signatureSegment}`;
}

export function verifyAdminToken(token: string | undefined | null): VerifyOk | VerifyFail {
  if (!token) {
    return { ok: false, reason: "missing" };
  }

  const [payloadSegment, signatureSegment] = token.split(".");
  if (!payloadSegment || !signatureSegment) {
    return { ok: false, reason: "malformed" };
  }

  let payloadBuffer: Buffer;
  let providedSig: Buffer;

  try {
    payloadBuffer = base64UrlDecode(payloadSegment);
    providedSig = base64UrlDecode(signatureSegment);
  } catch (err) {
    return { ok: false, reason: "invalid_base64" };
  }

  const expectedSig = hmac(payloadSegment);
  if (
    providedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(providedSig, expectedSig)
  ) {
    return { ok: false, reason: "invalid_signature" };
  }

  let payload: AdminTokenPayload;
  try {
    payload = JSON.parse(payloadBuffer.toString("utf8"));
  } catch (error) {
    return { ok: false, reason: "invalid_payload" };
  }

  if (
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number"
  ) {
    return { ok: false, reason: "missing_claims" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true };
}

export { ADMIN_AUTH_COOKIE, ADMIN_AUTH_MAX_AGE };
