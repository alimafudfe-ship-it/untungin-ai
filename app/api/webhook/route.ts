import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing Supabase ENV");
      return NextResponse.json(
        { error: "Supabase ENV belum lengkap" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const status = body.transaction_status;
    const fraudStatus = body.fraud_status;
    const orderId = body.order_id;

    const email = String(
      body.custom_field1 || body.customer_details?.email || ""
    )
      .trim()
      .toLowerCase();

    const plan = body.custom_field2 === "monthly" ? "monthly" : "lifetime";

    console.log("MIDTRANS WEBHOOK:", {
      orderId,
      status,
      fraudStatus,
      email,
      plan,
    });

    if (!email) {
      return NextResponse.json({ error: "Email kosong" }, { status: 400 });
    }

    const paid =
      status === "settlement" ||
      (status === "capture" && fraudStatus !== "deny");

    if (!paid) {
      return NextResponse.json({
        ok: true,
        message: "Payment belum sukses, profile tidak diubah",
        status,
      });
    }

    const proUntil = plan === "monthly" ? addDays(30) : "2099-12-31";

    const { error } = await supabase
      .from("profiles")
      .update({
        plan: "pro",
        pro_until: proUntil,
      })
      .eq("email", email);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: "Gagal update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "User upgraded to PRO",
      email,
      plan,
      pro_until: proUntil,
    });
  } catch (error) {
    console.error("webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
