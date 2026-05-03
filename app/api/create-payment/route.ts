import midtransClient from "midtrans-client";
import { NextResponse } from "next/server";

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
});

function getAmount(plan: string) {
  return plan === "monthly" ? 29000 : 99000;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const plan = body.plan === "monthly" ? "monthly" : "lifetime";
    const amount = Number(body.amount || getAmount(plan));

    if (!email) {
      return NextResponse.json({ error: "Email wajib ada." }, { status: 400 });
    }

    if (!process.env.MIDTRANS_SERVER_KEY) {
      return NextResponse.json({ error: "MIDTRANS_SERVER_KEY belum di-set." }, { status: 500 });
    }

    const orderId = `UNTUNGIN-${plan.toUpperCase()}-${Date.now()}`;

    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        email,
      },
      item_details: [
        {
          id: `pro-${plan}`,
          price: amount,
          quantity: 1,
          name: plan === "monthly" ? "Untungin.ai PRO Bulanan" : "Untungin.ai PRO Lifetime",
        },
      ],
      custom_field1: email,
      custom_field2: plan,
    });

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: orderId,
    });
  } catch (error) {
    console.error("create-payment error:", error);
    return NextResponse.json({ error: "Gagal membuat payment." }, { status: 500 });
  }
}
