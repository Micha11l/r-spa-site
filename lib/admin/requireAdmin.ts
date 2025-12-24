// lib/admin/requireAdmin.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_AUTH_COOKIE,
  verifyAdminToken,
} from "@/lib/admin/adminAuth";

type AdminCheckResult =
  | { ok: true }
  | { ok: false; res: NextResponse };

export function requireAdmin(req: NextRequest): AdminCheckResult {
  const cookie = req.cookies.get(ADMIN_AUTH_COOKIE)?.value;
  const verified = verifyAdminToken(cookie);

  if (!verified.ok) {
    return {
      ok: false,
      res: NextResponse.json(
        {
          error: "unauthorized",
          message: "Unauthorized. Please sign in to the admin panel.",
        },
        { status: 401 },
      ),
    };
  }

  return { ok: true };
}
