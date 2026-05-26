
export function calculateTrendScore(p) {
  return (p.sold * 0.5) + (p.rating * 20 * 0.2) + (p.reviews * 0.1 * 0.3);
}
