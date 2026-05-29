export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/integrations/whatsapp";

export async function POST(req: Request) {
  const { phone, products = [] } = await req.json().catch(() => ({}));
  if (!phone) return NextResponse.json({ error: "phone wajib diisi" }, { status: 400 });
  const low = Array.isArray(products) ? products.filter((p: any) => Number(p.stockRemaining || 0) <= Math.max(5, Number(p.stockInitial || 0) * 0.15)) : [];
  const message = low.length
    ? `Untungin.ai Alert: ${low.length} produk stok menipis. ${low.slice(0, 5).map((p: any) => `${p.name}: ${p.stockRemaining}`).join(", ")}.`
    : "Untungin.ai: semua stok masih aman hari ini.";
  const result = await sendWhatsAppMessage(phone, message);
  return NextResponse.json({ ...result, message });
}
