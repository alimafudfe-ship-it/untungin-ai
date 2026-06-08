import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { generateAIResponse } from "@/lib/aiChatEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, user_id } = body;

    if (!question || !user_id) {
      return NextResponse.json(
        { error: "Missing question or user_id" },
        { status: 400 }
      );
    }

    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user_id);

    const { data: affiliates } = await supabase
      .from("affiliates")
      .select("*");

    const affiliatesMap: Record<string, any[]> = {};

    affiliates?.forEach((a: any) => {
      if (!affiliatesMap[a.product_id]) {
        affiliatesMap[a.product_id] = [];
      }
      affiliatesMap[a.product_id].push(a);
    });

    const response = generateAIResponse(
      question,
      products || [],
      affiliatesMap
    );

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}