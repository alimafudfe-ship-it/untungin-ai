import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return NextResponse.json({ status: "env_missing", message: "MIDTRANS_SERVER_KEY belum diset." }, { status: 400 });
    const auth = Buffer.from(`${serverKey}:`).toString("base64");
    const plan = body.plan || "monthly";
    const amount = Number(body.amount || (plan === "lifetime" ? 99000 : 29000));
    const payload = {
      transaction_details: { order_id: `UNTUNGIN-SUB-${Date.now()}`, gross_amount: amount },
      customer_details: { email: body.email, first_name: body.name || "Untungin User" },
      item_details: [{ id: plan, price: amount, quantity: 1, name: `Untungin.ai PRO ${plan}` }],
      callbacks: { finish: process.env.NEXT_PUBLIC_APP_URL || "https://untungin-ai-pmd1.vercel.app" },
    };
    const res = await fetch("https://app.midtrans.com/snap/v1/transactions", { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, plan, ...data }, { status: res.ok ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Midtrans subscription error" }, { status: 500 });
  }
}
