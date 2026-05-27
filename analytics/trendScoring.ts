export function calculateTrendScore(product: any) {
  return Math.round(
    (product.sold * 0.45) +
    (product.rating * 25) +
    ((100000 / Math.max(product.price, 1)) * 0.2)
  );
}

export function calculateOpportunityScore(product: any) {
  return Math.round(
    (product.sold * 0.4) +
    ((5 - Math.min(product.rating,5)) * 10) +
    (100000 / Math.max(product.price,1))
  );
}
