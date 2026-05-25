import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const products = Array.isArray(body?.products) ? body.products : [];
  const expenses = Array.isArray(body?.expenses) ? body.expenses : [];
  const question = String(body?.question || "Buat ringkasan bisnis hari ini.");

  const totalRevenue = products.reduce((a: number, p: any) => a + Number(p.sellingPrice || 0) * Number(p.quantitySold || 0), 0);
  const totalProfit = products.reduce((a: number, p: any) => a + Number(p.profit || 0), 0);
  const totalExpenses = expenses.reduce((a: number, e: any) => a + Number(e.amount || 0), 0);
  const inventoryValue = products.reduce((a: number, p: any) => a + Number(p.stockRemaining || 0) * Number(p.costPrice || 0), 0);
  const lowStock = products.filter((p: any) => Number(p.stockRemaining || 0) <= 5 || Number(p.stockRemaining || 0) <= Number(p.stockInitial || 0) * 0.15);
  const loss = products.filter((p: any) => Number(p.profit || 0) < 0);

  const insight = {
    question,
    summary: {
      totalRevenue,
      totalProfit,
      totalExpenses,
      netCashflow: totalProfit - totalExpenses,
      inventoryValue,
      lowStockCount: lowStock.length,
      lossProductCount: loss.length,
    },
    actions: [
      loss[0] ? `Stop restock ${loss[0].name} sampai harga dan biaya aman.` : null,
      lowStock[0] ? `Siapkan restock ${lowStock[0].name}.` : null,
      products[0] ? `Scale bertahap produk profit terbaik: ${products.sort((a: any,b: any) => Number(b.profit||0)-Number(a.profit||0))[0].name}.` : null,
    ].filter(Boolean),
  };

  return NextResponse.json(insight);
}
