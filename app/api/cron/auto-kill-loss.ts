import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: Request) {
  try {
    // 1. Ambil produk yang performanya minus (merugi)
    const { data: badProducts, error } = await supabase
      .from("products")
      .select("*")
      .lt("profit", 0); // Profit < 0

    if (error) throw error;

    const stoppedProducts = [];

    for (const product of badProducts) {
      // 2. HIT TIKTOK SHOP API untuk mendelisting / menonaktifkan produk
      // const tiktokRes = await deactivateProductOnTikTok(product.tiktok_product_id);
      
      // 3. Update status di database internal Untungin.ai
      await supabase
        .from("products")
        .update({ status: "inactive" })
        .eq("id", product.id);

      // 4. Masukkan log ke AI COO Decisions
      await supabase.from("ai_decisions").insert({
        user_id: product.user_id,
        product_id: product.id,
        type: "stop",
        reason: `Produk mendulang rugi bersih sebesar Rp ${Math.abs(product.profit).toLocaleString()} akibat beban biaya operasional tinggi.`,
        action: "Sistem otomatis menonaktifkan produk di marketplace (Delisted) untuk menghentikan kerugian."
      });

      stoppedProducts.push(product.name);
    }

    return NextResponse.json({ success: true, stopped: stoppedProducts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}