import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email } = await req.json();

  const midtransServerKey = process.env.MIDTRANS_SERVER_KEY;

  const transaction = {
    transaction_details: {
      order_id: "ORDER-" + Date.now(),
      gross_amount: 99000,
    },
    customer_details: {
      email,
    },
  };

  const res = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(midtransServerKey + ":").toString("base64"),
    },
    body: JSON.stringify(transaction),
  });

  const data = await res.json();

  return NextResponse.json(data);
}