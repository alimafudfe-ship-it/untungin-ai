import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      return NextResponse.json(
        { error: "Server key tidak ada" },
        { status: 500 }
      );
    }

    const orderId = "order-" + Date.now();

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: body.amount,
      },
      customer_details: {
        email: body.email,
      },
      custom_field1: body.email,
      custom_field2: body.plan,
    };

    const res = await fetch(
      "https://app.sandbox.midtrans.com/snap/v1/transactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " + Buffer.from(serverKey + ":").toString("base64"),
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("MIDTRANS ERROR:", data);
      return NextResponse.json({ error: data }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("CREATE PAYMENT ERROR:", error);
    return NextResponse.json(
      { error: "Gagal create payment" },
      { status: 500 }
    );
  }
}
