// /app/auth/callback/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Handles Supabase authentication callback
 * This route is called when users click the magic link in their email
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  console.log('🔐 Auth callback received');
  console.log('  - Code:', code ? '✓' : '✗');
  console.log('  - Next:', next);
  console.log('  - Error:', error);

  // Handle auth error
  if (error) {
    console.error('❌ Auth error:', error_description);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${error_description}`, request.url)
    );
  }

  // Handle successful auth
  if (code) {
    const supabase = await createClient();

    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('❌ Exchange code error:', exchangeError);
        return NextResponse.redirect(
          new URL('/auth/error?error=Failed to authenticate', request.url)
        );
      }

      console.log('✅ Session established for:', data.user?.email);

      // Redirect to the original page or default
      const redirectUrl = next || '/';
      console.log('🔄 Redirecting to:', redirectUrl);
      
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      return NextResponse.redirect(
        new URL('/auth/error', request.url)
      );
    }
  }

  // No code provided, redirect to home
  console.log('⚠️ No auth code provided, redirecting to home');
  return NextResponse.redirect(new URL('/', request.url));
}
