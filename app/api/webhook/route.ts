import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // WAJIB service role
  );

  const email = body.customer_details?.email;
  const status = body.transaction_status;

  if (status === "settlement" || status === "capture") {
    await supabase
      .from("profiles")
      .update({
        plan: "pro",
        pro_until: "2099-12-31",
      })
      .eq("email", email);
  }

  return NextResponse.json({ ok: true });
}
