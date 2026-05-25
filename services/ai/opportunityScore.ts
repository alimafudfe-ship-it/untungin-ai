export function calculateOpportunityScore(data: any) {
  const sales = Number(data.sales || 0);
  const rating = Number(data.rating || 0);
  const price = Number(data.price || 0);

  const virality = Math.min(sales / 100, 40);
  const quality = rating * 10;
  const affordability = price < 100000 ? 20 : 10;

  return Math.round(virality + quality + affordability);
}
