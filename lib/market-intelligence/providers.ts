import { MI_SAMPLE_BUNDLE } from "./sampleData";
import { filterBundle } from "./scoring";
import type { MIBundle, MIProviderStatus, MIQuery, MISourceKind } from "./types";

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function mergeBundle(base: MIBundle, extra: Partial<MIBundle>, sourceName: string, kind: MISourceKind): MIBundle {
  const stamp = new Date().toISOString();
  const tag = (row: any) => ({ ...row, source: row.source || sourceName, sourceKind: row.sourceKind || row.source_kind || kind, collectedAt: row.collectedAt || row.collected_at || stamp });
  return {
    ...base,
    products: [...base.products, ...toArray(extra.products).map(tag)],
    categories: [...base.categories, ...toArray(extra.categories).map(tag)],
    shops: [...base.shops, ...toArray(extra.shops).map(tag)],
    creators: [...base.creators, ...toArray(extra.creators).map(tag)],
    videos: [...base.videos, ...toArray(extra.videos).map(tag)],
    lives: [...base.lives, ...toArray(extra.lives).map(tag)],
    providers: base.providers,
    generatedAt: stamp,
  };
}

async function readBundleFeed(url: string, sourceName: string, kind: MISourceKind) {
  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) throw new Error(`${sourceName} gagal dibaca: ${response.status}`);
  const payload = await response.json();
  return { payload: payload as Partial<MIBundle>, sourceName, kind };
}

const FEEDS = [
  { env: "MARKET_INTELLIGENCE_FEED_URL", id: "market-intelligence-feed", name: "Market Intelligence partner/manual feed", sourceName: "Market Intelligence Feed", kind: "partner_feed" as MISourceKind },
  { env: "KALODATA_LIKE_FEED_URL", id: "kalodata-like-v2", name: "Kalodata-like V2 feed", sourceName: "Kalodata-like V2 Feed", kind: "manual_upload" as MISourceKind },
];

export function getMarketIntelligenceProviders(): MIProviderStatus[] {
  const providers: MIProviderStatus[] = [...MI_SAMPLE_BUNDLE.providers];
  for (const feed of FEEDS) {
    const enabled = Boolean(process.env[feed.env]);
    providers.push({
      id: feed.id,
      name: feed.name,
      kind: feed.kind,
      enabled,
      status: enabled ? "ready" : "config_missing",
      message: enabled ? `${feed.env} aktif.` : `Isi ${feed.env} untuk mengganti/menambah data demo dengan feed legal.`,
    });
  }
  return providers;
}

export async function collectMarketIntelligence(query: MIQuery = {}) {
  const errors: string[] = [];
  let bundle: MIBundle = {
    ...MI_SAMPLE_BUNDLE,
    products: [...MI_SAMPLE_BUNDLE.products],
    categories: [...MI_SAMPLE_BUNDLE.categories],
    shops: [...MI_SAMPLE_BUNDLE.shops],
    creators: [...MI_SAMPLE_BUNDLE.creators],
    videos: [...MI_SAMPLE_BUNDLE.videos],
    lives: [...MI_SAMPLE_BUNDLE.lives],
    providers: getMarketIntelligenceProviders(),
    errors,
    generatedAt: new Date().toISOString(),
  };

  for (const feed of FEEDS) {
    const url = process.env[feed.env];
    if (!url) continue;
    try {
      const result = await readBundleFeed(url, feed.sourceName, feed.kind);
      bundle = mergeBundle(bundle, result.payload, result.sourceName, result.kind);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${feed.env} gagal dibaca.`);
    }
  }

  return { ...filterBundle(bundle, query), errors, providers: getMarketIntelligenceProviders(), generatedAt: new Date().toISOString() };
}
