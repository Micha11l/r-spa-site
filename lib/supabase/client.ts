// /lib/supabase/client.ts
"use client";

import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase client for Client Components
 * This uses the browser-based auth from @supabase/ssr
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Export a singleton instance for convenience
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}
