import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { generateDailyDecisions } from "@/lib/decisionEngine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id" },
        { status: 400 }
      );
    }

    // ambil produk
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user_id);

    // ambil affiliate
    const { data: affiliates } = await supabase
      .from("affiliates")
      .select("*");

    // mapping affiliate per product
    const affiliatesMap: Record<string, any[]> = {};

    affiliates?.forEach((a: any) => {
      if (!affiliatesMap[a.product_id]) {
        affiliatesMap[a.product_id] = [];
      }
      affiliatesMap[a.product_id].push(a);
    });

    const decisions = generateDailyDecisions(
      products || [],
      affiliatesMap
    );

    return NextResponse.json({
      success: true,
      data: decisions,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}