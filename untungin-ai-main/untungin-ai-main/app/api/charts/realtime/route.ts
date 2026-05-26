import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  const products = Array.isArray(payload.products) ? payload.products : [];
  const expenses = Array.isArray(payload.expenses) ? payload.expenses : [];
  const days = Array.from({ length: 14 }, (_, i) => {
    const factor = (i + 1) / 14;
    const revenue = products.reduce((a: number, p: any) => a + Number(p.sellingPrice || 0) * Number(p.quantitySold || 0), 0) * factor;
    const profit = products.reduce((a: number, p: any) => a + Number(p.profit || 0), 0) * factor;
    const expense = expenses.reduce((a: number, e: any) => a + Number(e.amount || 0), 0) * factor;
    return { date: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(5, 10), revenue: Math.round(revenue), profit: Math.round(profit), expense: Math.round(expense), net: Math.round(profit - expense) };
  });
  return NextResponse.json({ points: days, realtime: true, channel: "products,expenses,cashflow" });
}
