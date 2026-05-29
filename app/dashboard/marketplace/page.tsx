export default function MarketplacePage() {
  const marketplaces = [
    "Shopee",
    "TikTok",
    "Tokopedia",
    "Lazada",
    "Blibli"
  ]

  return (
    <div style={{ padding: 40 }}>
      <h1>Marketplace Connections</h1>

      <div style={{ display: "grid", gap: 20, marginTop: 30 }}>
        {marketplaces.map((item) => (
          <div
            key={item}
            style={{
              border: "1px solid #ccc",
              padding: 20,
              borderRadius: 12
            }}
          >
            <h2>{item}</h2>

            <button
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer"
              }}
            >
              Connect {item}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
