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