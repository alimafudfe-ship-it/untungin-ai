import { NextRequest, NextResponse } from "next/server";

import { realtimeShopeeWorker } from "@/workers/shopee/realtimeShopeeWorker";
import { realtimeTikTokWorker } from "@/workers/tiktok/realtimeTikTokWorker";
import { realtimeTokopediaWorker } from "@/workers/tokopedia/realtimeTokopediaWorker";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");

    if (!keyword || keyword.trim() === "") {
      return NextResponse.json(
        {
          ok: false,
          error: "Kata kunci pencarian wajib diisi."
        },
        { status: 400 }
      );
    }

    console.log(
      `[Market Intelligence] Menjalankan live crawling untuk keyword: ${keyword}`
    );

    const results = await Promise.allSettled([
      realtimeShopeeWorker(keyword),
      realtimeTokopediaWorker(keyword),
      realtimeTikTokWorker(keyword)
    ]);

    const shopeeData =
      results[0].status === "fulfilled"
        ? results[0].value
        : [];

    const tokopediaData =
      results[1].status === "fulfilled"
        ? results[1].value
        : [];

    const tiktokData =
      results[2].status === "fulfilled"
        ? results[2].value
        : [];

    const products = [
      ...shopeeData,
      ...tokopediaData,
      ...tiktokData
    ];

    const normalizedProducts = products.map(
      (item: any, index: number) => ({
        id:
          item.id ||
          `${item.marketplace || "unknown"}-${index}`,

        product_name:
          item.product_name ||
          item.name ||
          "Unknown Product",

        marketplace:
          item.marketplace || "Unknown",

        price:
          Number(item.price) || 0,

        sales:
          Number(item.sales) || 0,

        rating:
          Number(item.rating) || 0,

        source:
          "live-crawler"
      })
    );

    return NextResponse.json({
      ok: true,
      keyword,
      generatedAt: new Date().toISOString(),
      totalProducts: normalizedProducts.length,
      products: normalizedProducts,
      stats: {
        shopee: shopeeData.length,
        tokopedia: tokopediaData.length,
        tiktok: tiktokData.length
      }
    });
  } catch (error: any) {
    console.error(
      "[Market Intelligence Bundle Error]",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Gagal mengambil data market intelligence"
      },
      { status: 500 }
    );
  }
}