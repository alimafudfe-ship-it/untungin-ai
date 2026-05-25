"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [marketplace, setMarketplace] = useState("All");
  const [days, setDays] = useState(7);
  const [trend, setTrend] = useState<any[]>([]);

  const scanMarket = async () => {
    await fetch(`/api/market-intelligence?marketplace=${marketplace}`);
    loadTrend();
    alert("Market berhasil di-refresh realtime");
  };

  const loadTrend = async () => {
    const res = await fetch(`/api/market-intelligence/trend-chart?days=${days}&marketplace=${marketplace}`);
    const json = await res.json();
    setTrend(json.data || []);
  };

  useEffect(() => {
    loadTrend();
  }, [marketplace, days]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Market Intelligence V3</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)}>
          <option value="All">All Marketplace</option>
          <option value="Shopee">Shopee</option>
          <option value="TikTok Shop">TikTok Shop</option>
          <option value="Tokopedia">Tokopedia</option>
          <option value="Lazada">Lazada</option>
        </select>

        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Trend 7 Hari</option>
          <option value={30}>Trend 30 Hari</option>
        </select>

        <button onClick={scanMarket}>Scan Market</button>
      </div>

      <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 12 }}>
        <h3>Trend Data</h3>
        <pre style={{ overflow: "auto", fontSize: 12 }}>
          {JSON.stringify(trend, null, 2)}
        </pre>
      </div>
    </main>
  );
}
