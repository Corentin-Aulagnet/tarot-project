/**
 * POST /api/update
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Updates an existing Tarot game record in the database.
 * Called from /games/[gid]/posts.tsx (game detail page) when editing a game.
 * 
 * REQUIRED REQUEST BODY:
 * ──────────────────────
 * The request must include an "id" field (game UUID) to identify which game to update.
 * All other fields are optional; only provided fields will be updated.
 * 
 * Example:
 * {
 *   "id": "abc-123-uuid",         // REQUIRED: Which game to update
 *   "points_att": 68,             // Optional: Change attack points
 *   "contract": "Garde-Sans",     // Optional: Change contract bid
 *   "poignee_type": "Triple",     // Optional: Record hand bonus
 * }
 * 
 * See /api/insert for full Tarot field documentation.
 * 
 * RESPONSE:
 * ─────────
 * Success (200):
 *   { "message": "Success", "data": { ...updated game record } }
 * 
 * Bad Request (400):
 *   { "error": "ID is required for update" }
 * 
 * Server Error (500):
 *   { "error": "Database error message" }
 * 
 * ════════════════════════════════════════════════════════════════════════════
 */

// app/api/update/route.ts
import { supabase } from '@/utils/supabase/client';
import { TablesInsert } from '../../../utils/supabase/supabase';

export async function POST(req: Request) {
  const body = await req.json();

  const row: TablesInsert<'Games'> = body;

    console.log("Updating row:", row);
  if(row.id){
    const { data, error } = await supabase.from('Games').update(row).eq('id', row.id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ message: 'Success', data }), { status: 200 });
  }else{
    const error = new Error("ID is required for update");
     return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
}