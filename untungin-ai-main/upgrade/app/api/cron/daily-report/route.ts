import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, message: "Daily report cron ready. Sambungkan email/WhatsApp provider untuk pengiriman otomatis.", runAt: new Date().toISOString() });
}
