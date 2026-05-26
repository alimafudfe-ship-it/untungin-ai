export function rupiah(value: number) {
  return `Rp${Math.round(value || 0).toLocaleString("id-ID")}`;
}

export function buildReportSummary(payload: any = {}) {
  const metrics = payload?.metrics || {};
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const expenses = Array.isArray(payload?.expenses) ? payload.expenses : [];
  const top = [...products].sort((a, b) => Number(b.profit || 0) - Number(a.profit || 0)).slice(0, 5);
  const expenseTotal = expenses.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
  const revenue = Number(metrics.totalRevenue || metrics.revenue || products.reduce((acc: number, item: any) => acc + Number(item.sellingPrice || item.selling_price || 0) * Number(item.quantitySold || item.quantity_sold || 0), 0));
  const profit = Number(metrics.totalProfit || metrics.profit || products.reduce((acc: number, item: any) => acc + Number(item.profit || 0), 0));
  const netCashflow = Number(metrics.netCash || metrics.netCashflow || profit - expenseTotal);
  return { metrics, products, expenses, top, expenseTotal, revenue, profit, netCashflow };
}
