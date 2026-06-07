import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getBusinessSummary } from "@/lib/metricsEngine";

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

    // Fetch data dari tabel kamu (SUDAH SESUAI PROJECT)
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user_id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const summary = getBusinessSummary(data || []);

    return NextResponse.json({
      success: true,
      data: summary,
    });

  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}