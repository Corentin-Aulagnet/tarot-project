/**
 * Server Supabase Client (utils/supabase/server.ts)
 * 
 * Instantiates Supabase client for SERVER-SIDE code only.
 * Runs on Next.js server; manages user session via cookies.
 * 
 * USAGE:
 * - Server Components: Direct import, pass cookies
 * - API routes: (/api/insert, /update, /delete) use this client
 * 
 * WHY?
 * - Manages authentication via cookies
 * - Has full database access (subject to RLS policies)
 * - Safer than client version (no secrets exposed to browser)
 * 
 * EXAMPLE:
 * import { createClient } from '@/utils/supabase/server';
 * import { cookies } from 'next/headers';
 * 
 * export async function getGames() {
 *   const cookieStore = await cookies();
 *   const supabase = createClient(cookieStore);
 *   return await supabase.from('Games').select('*');
 * }
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./supabase";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient<Database>(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
export const supabase = createClient(await cookies());