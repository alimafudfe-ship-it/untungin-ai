import { NextResponse } from "next/server";

function getAmount(plan: string) {
  return plan === "monthly" ? 29000 : 99000;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body.email || "").trim().toLowerCase();
    const plan = body.plan === "monthly" ? "monthly" : "lifetime";
    const amount = getAmount(plan);

    if (!email) {
      return NextResponse.json({ error: "Email wajib ada." }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      return NextResponse.json(
        { error: "MIDTRANS_SERVER_KEY belum di-set." },
        { status: 500 }
      );
    }

    const orderId = `UNTUNGIN-${plan.toUpperCase()}-${Date.now()}`;

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const snapUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const response = await fetch(snapUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + Buffer.from(`${serverKey}:`).toString("base64"),
      },
      body: JSON.stringify({
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
            name:
              plan === "monthly"
                ? "Untungin.ai PRO Bulanan"
                : "Untungin.ai PRO Lifetime",
          },
        ],
        custom_field1: email,
        custom_field2: plan,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Midtrans error:", data);
      return NextResponse.json(
        { error: "Gagal membuat transaksi Midtrans.", detail: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: data.token,
      redirect_url: data.redirect_url,
      order_id: orderId,
    });
  } catch (error) {
    console.error("create-payment error:", error);
    return NextResponse.json(
      { error: "Gagal membuat payment." },
      { status: 500 }
    );
  }
}
