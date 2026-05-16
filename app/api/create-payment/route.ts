import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPaymentProvider, getPlanAmount, getPlanName } from "@/lib/billing/providers";

function basicAuth(key: string) {
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const plan = String(body.plan || "monthly");
    const amount = Number(body.amount || getPlanAmount(plan));
    const provider = getPaymentProvider();
    const workspaceId = String(body.workspaceId || "");
    const userId = String(body.userId || "");

    if (!email || !plan || !amount) {
      return NextResponse.json({ error: "Data tidak lengkap (email, plan, amount wajib)" }, { status: 400 });
    }

    const orderId = `UNT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    if (provider === "manual") {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey && workspaceId) {
        const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
        await db.from("billing_requests").insert({
          workspace_id: workspaceId,
          user_id: userId || null,
          plan_code: plan,
          provider: "manual",
          status: "pending",
          amount,
          admin_notes: `Order ${orderId} dibuat dari v9 First Customer Ready`,
        });
      }
      return NextResponse.json({
        provider: "manual",
        order_id: orderId,
        manual: true,
        amount,
        message: "Manual transfer aktif. Request upgrade sudah dicatat. Admin bisa approve workspace menjadi PRO setelah pembayaran diterima.",
      });
    }

    if (provider === "xendit") {
      const secretKey = process.env.XENDIT_SECRET_KEY;
      if (!secretKey) {
        return NextResponse.json({ error: "XENDIT_SECRET_KEY belum di-set. Isi ENV atau set PAYMENT_PROVIDER=manual untuk sementara." }, { status: 500 });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
      const payload = {
        external_id: orderId,
        amount,
        payer_email: email,
        description: getPlanName(plan),
        currency: "IDR",
        success_redirect_url: `${baseUrl}/?payment=success&provider=xendit&order_id=${orderId}`,
        failure_redirect_url: `${baseUrl}/?payment=failed&provider=xendit&order_id=${orderId}`,
        metadata: { email, plan, source: "untungin-ai" },
      };

      const res = await fetch("https://api.xendit.co/v2/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: basicAuth(secretKey) },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return NextResponse.json({ error: data?.message || data?.error_code || JSON.stringify(data) || "Xendit invoice gagal dibuat" }, { status: res.status });
      }
      return NextResponse.json({ provider: "xendit", invoice_url: data.invoice_url, order_id: orderId, raw: data });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json({ error: "MIDTRANS_SERVER_KEY belum di-set. Karena Midtrans ditolak, gunakan PAYMENT_PROVIDER=xendit atau manual." }, { status: 500 });
    }

    const payload = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      customer_details: { email },
      custom_field1: email,
      custom_field2: plan,
    };

    const res = await fetch("https://app.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: basicAuth(serverKey) },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) return NextResponse.json({ error: data?.status_message || JSON.stringify(data) || "Midtrans gagal" }, { status: res.status });
    return NextResponse.json({ provider: "midtrans", token: data.token, order_id: orderId });
  } catch (err) {
    console.error("CREATE PAYMENT ERROR:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : JSON.stringify(err) }, { status: 500 });
  }
}
