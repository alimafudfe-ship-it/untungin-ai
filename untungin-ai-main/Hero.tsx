import { NextResponse } from "next/server";
import OpenAI from "openai";

function fallbackAnswer(payload: any) {
  const metrics = payload?.metrics || {};
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const expenses = Array.isArray(payload?.expenses) ? payload.expenses : [];
  const top = [...products].sort((a, b) => Number(b.profit || 0) - Number(a.profit || 0))[0];
  const expensive = [...expenses].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0];
  return [
    `Ringkasan: omzet Rp${Math.round(metrics.totalRevenue || 0).toLocaleString("id-ID")}, profit Rp${Math.round(metrics.totalProfit || 0).toLocaleString("id-ID")}, expense Rp${Math.round(metrics.totalExpenses || 0).toLocaleString("id-ID")}, net cash Rp${Math.round(metrics.netCash || 0).toLocaleString("id-ID")}.`,
    top ? `Produk prioritas: ${top.name}. Margin ${Number(top.margin || 0).toFixed(1)}%, stok ${top.stockRemaining}. Scale bertahap jika ROAS aman.` : "Tambahkan produk dulu agar AI CFO bisa membaca performa.",
    expensive ? `Expense terbesar: ${expensive.label || expensive.title} sebesar Rp${Math.round(expensive.amount || 0).toLocaleString("id-ID")}. Audit biaya ini sebelum menaikkan budget iklan.` : "Belum ada expense besar yang perlu ditekan.",
    "Action: scale hanya produk margin >20%, tahan restock produk margin rendah, dan aktifkan alert stok untuk produk fast moving.",
  ].join("\n\n");
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ answer: fallbackAnswer(payload), source: "rules-engine" });
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Kamu adalah CFO digital untuk seller marketplace Indonesia. Jawab ringkas, actionable, dan berbasis data. Jangan beri saran umum." },
        { role: "user", content: JSON.stringify(payload).slice(0, 14000) },
      ],
    });
    return NextResponse.json({ answer: completion.choices[0]?.message?.content || fallbackAnswer(payload), source: "openai" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "AI CFO error" }, { status: 500 });
  }
}
