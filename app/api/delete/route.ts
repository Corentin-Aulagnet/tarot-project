/**
 * POST /api/delete
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Deletes a Tarot game record from the database.
 * Called from /games/[gid]/posts.tsx (game detail page) when user clicks Delete.
 * 
 * REQUEST BODY:
 * ─────────────
 * {
 *   "id": "abc-123-uuid"  // UUID of the game record to delete
 * }
 * 
 * RESPONSE:
 * ─────────
 * Success (200):
 *   { "message": "Success", "data": null }
 * 
 * Server Error (500):
 *   { "error": "Foreign key constraint violation" or other error }
 * 
 * After deletion, scores on home page are automatically recalculated on next fetch.
 * 
 * ════════════════════════════════════════════════════════════════════════════
 */

// app/api/delete/route.ts
import { supabase } from '@/utils/supabase/client';

export async function POST(req: Request) {
  const body = await req.json();
    const { id } = body;
    console.log("Deleting row with ID:", id);
  const { data, error } = await supabase.from('Games').delete().eq('id', id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ message: 'Success', data }), { status: 200 });
}