import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return NextResponse.json({ status: "env_missing", message: "Set WHATSAPP_ACCESS_TOKEN dan WHATSAPP_PHONE_NUMBER_ID untuk mengirim alert." }, { status: 400 });
  const to = body.to || process.env.OWNER_WHATSAPP_NUMBER;
  const text = body.text || "Untungin.ai alert: ada stok kritis yang perlu dicek.";
  if (!to) return NextResponse.json({ error: "Nomor tujuan belum diisi." }, { status: 400 });
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
  const data = await res.json().catch(() => null);
  return NextResponse.json({ ok: res.ok, data }, { status: res.ok ? 200 : 400 });
}
