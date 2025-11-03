// /lib/supabase-browser.ts
"use client";

import { createClient } from "@supabase/supabase-js";

// 🔒 缓存全局唯一实例
let _supabase: ReturnType<typeof createClient> | null = null;

export function supabaseBrowser() {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // ✅ 建议用 localStorage（除非你有强需求让标签页关闭即登出）
  const storage = typeof window !== "undefined" ? window.localStorage : undefined;

  _supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage,
      storageKey: "rejuvenessence.auth", // 避免默认 key 冲突
    },
  });

  return _supabase;
}
