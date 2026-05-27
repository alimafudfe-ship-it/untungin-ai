
export function calculateTrendScore(data: any) {
  return (
    (data.salesVelocity || 0) * 0.4 +
    (data.searchGrowth || 0) * 0.3 +
    (data.engagementGrowth || 0) * 0.3
  )
}
