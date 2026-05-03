import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const status = body.transaction_status;
    const email = String(
      body.custom_field1 || body.customer_details?.email || ""
    )
      .trim()
      .toLowerCase();

    const plan = body.custom_field2 === "monthly" ? "monthly" : "lifetime";

    if (!email) {
      return NextResponse.json({ error: "Email kosong" }, { status: 400 });
    }

    if (status === "settlement" || status === "capture") {
      await supabase
        .from("profiles")
        .update({
          plan: "pro",
          pro_until:
            plan === "monthly"
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : "2099-12-31",
        })
        .eq("email", email);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
