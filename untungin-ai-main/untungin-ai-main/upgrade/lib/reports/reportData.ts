export function rupiah(value: number) {
  return `Rp${Math.round(value || 0).toLocaleString("id-ID")}`;
}

export function buildReportSummary(payload: any) {
  const metrics = payload?.metrics || {};
  const products = Array.isArray(payload?.products) ? payload.products : [];
  const expenses = Array.isArray(payload?.expenses) ? payload.expenses : [];
  const top = [...products].sort((a, b) => Number(b.profit || 0) - Number(a.profit || 0)).slice(0, 5);
  const expenseTotal = expenses.reduce((acc: number, e: any) => acc + Number(e.amount || 0), 0);
  return { metrics, products, expenses, top, expenseTotal };
}
