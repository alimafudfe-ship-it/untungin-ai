import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  rankAffiliates,
  getAffiliateInsights,
  getAffiliateRecommendations,
} from "@/lib/affiliateEngine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const product_id = searchParams.get("product_id");

    if (!product_id) {
      return NextResponse.json(
        { error: "Missing product_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("affiliates")
      .select("*")
      .eq("product_id", product_id);

    if (error) throw error;

    const ranked = rankAffiliates(data || []);
    const insights = getAffiliateInsights(data || []);
    const recommendations = getAffiliateRecommendations(data || []);

    return NextResponse.json({
      success: true,
      data: {
        affiliates: ranked,
        insights,
        recommendations,
      },
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}