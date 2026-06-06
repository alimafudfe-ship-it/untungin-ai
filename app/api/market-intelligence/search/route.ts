import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio"; // Pastikan sudah install: npm install cheerio

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "";
  const cleanKeyword = keyword.trim();

  if (!cleanKeyword) {
    return NextResponse.json({ error: "Keyword kosong" }, { status: 400 });
  }

  try {
    const scrapingBeeApiKey = process.env.SCRAPINGBEE_API_KEY;

    if (!scrapingBeeApiKey) {
      return NextResponse.json({ 
        error: "Konfigurasi Belum Lengkap", 
        message: "Silakan masukkan SCRAPINGBEE_API_KEY di file .env server Anda." 
      }, { status: 400 });
    }

    // Targetkan ke halaman pencarian pasar TikTok web resmi
    const targetUrl = `https://www.tiktok.com/search/product?q=${encodeURIComponent(cleanKeyword)}`;
    
    // Panggil proxy ScrapingBee dengan mengeksekusi Javascript (premium proxy)
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeApiKey}&url=${encodeURIComponent(targetUrl)}&render_js=true&premium_proxy=true&country_code=id`;

    const response = await fetch(scrapingBeeUrl, { cache: "no-store" });
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: `ScrapingBee Error (${response.status})`, 
        message: "Gagal menembus sistem keamanan TikTok Web secara real-time." 
      }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const realProducts: any[] = [];

    // 💡 Ekstraksi Data Murni langsung dari struktur HTML TikTok
    // Selektor di bawah ini disesuaikan dengan elemen kartu produk TikTok Web
    $("div[data-e2e='search-product-item'], div.product-item-card").each((index, element) => {
      if (index >= 15) return; // Batasi maksimal 15 produk demi kecepatan load

      const productName = $(element).find("[data-e2e='product-title'], h2, h3").text().trim();
      const priceText = $(element).find("[data-e2e='product-price'], .price").text().replace(/[^0-9]/g, "");
      const soldText = $(element).find("[data-e2e='product-sold'], .sold-count").text().trim();

      const price = priceText ? Number(priceText) : 0;
      
      // Mengubah string "1.2k terjual" menjadi angka murni 1200
      let sold30d = 0;
      if (soldText) {
        if (soldText.toLowerCase().includes('k')) {
          sold30d = parseFloat(soldText) * 1000;
        } else {
          sold30d = parseInt(soldText.replace(/[^0-9]/g, "")) || 0;
        }
      }

      if (productName) {
        realProducts.push({
          id: `tt-scrape-${index}-${Date.now()}`,
          productName: productName,
          marketplace: "TikTok Shop",
          country: "ID",
          category: "Hasil Riset Live",
          keyword: cleanKeyword,
          period: "month",
          priceMin: price,
          priceMax: price,
          sold7d: Math.round(sold30d / 4),
          sold30d: sold30d,
          revenue7d: Math.round((price * sold30d) / 4),
          revenue30d: price * sold30d,
          growth30d: 0,
          sellerCount: 1,
          creatorCount: 0,
          videoCount: 0,
          adCount: 0,
          avgRating: 4.5,
          reviewCount: 0,
          demandScore: sold30d > 1000 ? 85 : 50,
          growthScore: 50,
          competitionScore: 50,
          marginSignal: 70,
          saturationScore: 30,
          signal: "rising",
          source: "ScrapingBee Live Engine"
        });
      }
    });

    return NextResponse.json({
      keyword: cleanKeyword,
      generatedAt: new Date().toISOString(),
      products: realProducts
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}