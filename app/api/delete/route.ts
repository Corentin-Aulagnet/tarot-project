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