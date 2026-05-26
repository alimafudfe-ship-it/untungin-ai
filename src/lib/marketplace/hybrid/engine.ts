
export type MarketplaceMode = "official" | "cookie" | "scraping";

export interface MarketplaceConfig {
  name: string;
  mode: MarketplaceMode;
  enabled: boolean;
}

export const MARKETPLACE_CONFIG: MarketplaceConfig[] = [
  { name: "Shopee", mode: "cookie", enabled: true },
  { name: "TikTok Shop", mode: "cookie", enabled: true },
  { name: "Tokopedia", mode: "scraping", enabled: true },
  { name: "Blibli", mode: "official", enabled: false },
];

export async function getHybridMarketplaceStatus() {
  return MARKETPLACE_CONFIG.map((item) => ({
    ...item,
    status: item.enabled ? "ready" : "disabled",
  }));
}
