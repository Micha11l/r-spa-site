// lib/supabase-browser.ts
"use client";

import { createClient } from "@supabase/supabase-js";

export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // ✅ 使用 sessionStorage：关闭页面/标签后即清空登录态
  const storage = typeof window !== "undefined" ? window.sessionStorage : undefined;

  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage,                         // <-- 关键
      // storageKey 可保留默认，或自定义：storageKey: "rejuvenessence.auth"
    },
  });
}