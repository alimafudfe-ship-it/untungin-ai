export default function MarketIntelligencePage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Market Intelligence AI</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="border p-4 rounded-xl">Live GMV</div>
        <div className="border p-4 rounded-xl">Top Seller</div>
        <div className="border p-4 rounded-xl">Keyword Trend</div>
        <div className="border p-4 rounded-xl">Viral Products</div>
      </div>
    </div>
  );
}
