import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from("products")
      .select("*")
      .order("quantity_sold", { ascending: false })
      .limit(100);

    if (keyword) {
      query = query.ilike("name", `%${keyword}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

const products = (data || []).map((p: any) => ({
  id: p.id,
  product_name: p.name,
  marketplace: p.marketplace,
  price: Number(p.selling_price || 0),
  sales: Number(p.quantity_sold || 0),
  profit: Number(p.profit || 0),
  margin: Number(p.margin || 0),
  created_at: p.created_at
}));    

return NextResponse.json({
  ok: true,
  keyword,
  totalProducts: products.length,
  products
});

  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}