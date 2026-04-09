/**
 * POST /api/insert
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Creates a new Tarot game record in the database.
 * Called from /games/new/page.tsx after form submission.
 * 
 * REQUEST BODY (JSON):
 * ────────────────────
 * {
 *   "taker_id": "uuid",              // Player attacking; receives 2x score
 *   "call_id": "uuid",               // Player joining attack (can equal taker_id for 4x mult)
 *   "players_uid": ["uuid", ...],    // All players in this game
 *   "contract": "Garde",             // Bid level: Petite | Garde | Garde-Sans | Garde-Contre
 *   "n_bouts": 2,                    // Count of special cards (1, 21, Jack) in attack tricks: 0-3
 *   "points_att": 65,                // Total pip points scored by attack team: 0-91
 *   "petit_au_bout": "Won",          // Did attack win Fool in final trick? "Won" | "Lost"
 *   "petit_au_bout_player_id": "uuid", // Which player had the Fool?
 *   "poignee_type": "Double",        // Hand bonus: Simple | Double | Triple | null
 *   "poignee_player_id": "uuid",    // Which player has the hand bonus? | null
 *   "chelem": "AnnoucedSucceeded",   // Grand slam result: Announced/Unannounced/Failed | null
 *   "chelem_player_id": "uuid",      // Who declared slam attempt? | null
 *   "misere_type": "Atout",          // Special penalty: Tête | Atout | null
 *   "misere_player_id": "uuid"       // Player incurring penalty | null
 * }
 * 
 * See CONTRIBUTING.md > Tarot Rules for field explanations.
 * 
 * RESPONSE:
 * ─────────
 * Success (200):
 *   { "message": "Success", "data": { ...game record } }
 * 
 * Error (500):
 *   { "error": "Unique violation" or other database error }
 * 
 * ════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/utils/supabase/client';
import { TablesInsert } from '../../../utils/supabase/supabase';

export async function POST(req: Request) {
  const body = await req.json();

  const row: TablesInsert<'Games'> = body;
    console.log("Inserting row:", row);
  const { data, error } = await supabase.from('Games').insert(row);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ message: 'Success', data }), { status: 200 });
}