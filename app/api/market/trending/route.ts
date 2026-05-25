export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { calculateTrendScore } from "@/services/trendEngine";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("quantity_sold", { ascending: false })
      .limit(100);

    if (error) throw error;

    const products = (data || []).map((p:any) => ({
      id: p.id,
      title: p.title || p.name,
      price: Number(p.price || p.selling_price || 0),
      sold: Number(p.sold || p.quantity_sold || 0),
      rating: Number(p.rating || 4.5),
      reviews: Number(p.reviews || p.quantity_sold || 0),
      image: p.image || "/placeholder-product.png",
      platform: p.platform || p.marketplace,
      created_at: p.created_at,
    }))
    .map((p)=>({...p,score:calculateTrendScore(p)}))
    .sort((a,b)=>b.score-a.score)
    .slice(0,20);

    return Response.json({success:true,products});
  } catch (e:any) {
    return Response.json({success:false,products:[],error:e?.message},{status:200});
  }
}
