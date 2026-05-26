import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, plan, amount } = body;

    if (!email || !plan || !amount) {
      return NextResponse.json(
        { error: "Data tidak lengkap (email, plan, amount wajib)" },
        { status: 400 }
      );
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      return NextResponse.json(
        { error: "MIDTRANS_SERVER_KEY belum di-set di environment" },
        { status: 500 }
      );
    }

    const orderId = `ORDER-${Date.now()}`;

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        email,
      },
    };

    const res = await fetch("https://app.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(serverKey + ":").toString("base64")}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            typeof data === "object"
              ? data.status_message || JSON.stringify(data)
              : data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({
      token: data.token,
    });
  } catch (err) {
    console.error("CREATE PAYMENT ERROR:", err);

    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : JSON.stringify(err),
      },
      { status: 500 }
    );
  }
}
