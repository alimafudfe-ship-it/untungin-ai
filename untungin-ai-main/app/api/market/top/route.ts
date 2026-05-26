import { createClient } from '@supabase/supabase-js'
export async function GET(){const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);const {data}=await s.from('products').select('*').order('quantity_sold',{ascending:false}).limit(20);return Response.json({success:true,products:data||[]})}
