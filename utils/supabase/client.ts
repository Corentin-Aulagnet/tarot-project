/**
 * Browser Supabase Client (utils/supabase/client.ts)
 * 
 * Instantiates Supabase client for CLIENT-SIDE code only.
 * Runs in user's browser; uses public API key (safe for client code).
 * 
 * WHY CLIENT VS SERVER:
 * - Client: \"use client\" React components; public anon key; cookie-based auth
 * - Server: Server Components & API routes; server-side session; full DB access
 * 
 * USAGE:
 * import { supabase } from '@/utils/supabase/client';
 * In \"use client\" component: const { data } = await supabase.from('Games').insert(newGame);
 */

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient= () =>
  createBrowserClient<Database>(
    supabaseUrl!,
    supabaseKey!,
  );
export const supabase = createClient();