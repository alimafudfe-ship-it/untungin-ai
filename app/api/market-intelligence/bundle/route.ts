import { NextRequest, NextResponse } from "next/server";

import { realtimeTokopediaWorker } from "@/workers/tokopedia/realtimeTokopediaWorker";
import { realtimeTikTokWorker } from "@/workers/tiktok/realtimeTikTokWorker";
import { realtimeShopeeWorker } from "@/workers/shopee/realtimeShopeeWorker";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");

    if (!keyword) {
      return NextResponse.json({
        ok: false,
        error: "Keyword wajib diisi"
      });
    }

    const [tokopedia, tiktok, shopee] = await Promise.allSettled([
      realtimeTokopediaWorker(keyword),
      realtimeTikTokWorker(keyword),
      realtimeShopeeWorker(keyword),
    ]);

    const products = [
      ...(tokopedia.status === "fulfilled" ? tokopedia.value : []),
      ...(tiktok.status === "fulfilled" ? tiktok.value : []),
      ...(shopee.status === "fulfilled" ? shopee.value : []),
    ];

    return NextResponse.json({
      ok: true,
      keyword,
      total: products.length,
      products
    });

  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message
    });
  }
}