// app/api/submit/route.ts
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