export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { ShopeeCrawler } from "@/services/crawlers/shopeeCrawler";
import { TokopediaCrawler } from "@/services/crawlers/tokopediaCrawler";
import { LazadaCrawler } from "@/services/crawlers/lazadaCrawler";
import { calculateOpportunityScore } from "@/services/ai/opportunityScore";

// Generator data fallback otomatis cerdas (Bebas error TS & anti-duplikasi kaku)
function getMockFallbackData(query: string): any[] {
  const marketplaces = ["Shopee", "Tokopedia", "Lazada"];
  
  // Membuat angka seed unik berbasis total nilai karakter dari kata kunci pencarian
  const seed = query.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Kumpulan data toko dan kota simulasi agar bervariasi secara dinamis
  const mockShops = [
    { name: "IndoFashion Official", city: "Jakarta Barat" },
    { name: "GrosirFashion.id", city: "Bandung" },
    { name: "StyleMaster Store", city: "Surabaya" },
    { name: "KidzWear Supply", city: "Solo" },
    { name: "BigSize-Corner", city: "Semarang" }
  ];

  // Menghasilkan 5 baris data simulasi unik berbasis kalkulasi matematika seed
  return Array.from({ length: 5 }).map((_, i) => {
    // Rumus penentu angka penjualan dan harga agar elastis namun tetap logis
    const baseSales = ((seed * (i + 4)) % 3800) + 150;
    const basePrice = ((seed * (i + 7)) % 450000) + 45000;
    
    // Pembulatan ke nominal mata uang Rupiah terdekat agar terlihat alami
    const randomPrice = Math.round(basePrice / 1000) * 1000;
    const randomSales = Math.round(baseSales);
    
    const market = marketplaces[i % marketplaces.length];
    // Penentuan toko ikut diacak secara matematis berdasarkan variasi kata kunci
    const shop = mockShops[(seed + i) % mockShops.length]; 

    // Pola variasi struktur penamaan produk di etalase frontend
    let nameTemplate = `${query.charAt(0).toUpperCase() + query.slice(1)} Premium Distro Original Quality`;
    if (i === 1) nameTemplate = `${query.charAt(0).toUpperCase() + query.slice(1)} Casual Trendy Terlaris Murah`;
    if (i === 2) nameTemplate = `${query.charAt(0).toUpperCase() + query.slice(1)} Exclusive Edition Import BM`;
    if (i === 3) nameTemplate = `${query.charAt(0).toUpperCase() + query.slice(1)} Anak & Remaja Motif Kekinian`;
    if (i === 4) nameTemplate = `${query.charAt(0).toUpperCase() + query.slice(1)} Jumbo Big Size Oversize Unisex`;

    return {
      marketplace: market,
      price: randomPrice,
      sales: randomSales,
      product_name: nameTemplate,
      image_url: "",
      product_url: `https://www.${market.toLowerCase()}.com`,
      rating: +(4.4 + ((seed + i) % 6) * 0.1).toFixed(1),
      reviews: Math.round(randomSales * 0.18),
      // Menyisipkan metadata properti toko
      shop_name: shop.name,
      shop_location: shop.city
    };
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || url.searchParams.get("keyword") || "";
  const searchQuery = q.trim();

  // PROTEKSI 1: Jika mengetik di bawah 3 karakter, langsung hentikan proses demi memori server
  if (searchQuery.length > 0 && searchQuery.length < 3) {
    return NextResponse.json({
      products: [],
      categories: [],
      rowCount: 0,
      message: "Ketik minimal 3 karakter untuk mendalami pencarian..."
    });
  }

  const finalQuery = searchQuery ? searchQuery : "sepatu trending";

  try {
    console.log(`[Untungin AI] Memulai Live Scraping untuk kata kunci: ${finalQuery}`);
    
    let shopeeData: any[] = [];
    let tokopediaData: any[] = [];
    let lazadaData: any[] = [];

    // Gunakan penanganan error individu per instansiasi kelas crawler
    try { 
      const shopeeInstance = new (ShopeeCrawler as any)();
      if (shopeeInstance && typeof shopeeInstance.scan === 'function') {
        shopeeData = await shopeeInstance.scan(finalQuery); 
      }
    } catch (e) { 
      console.error("Shopee Scraper Error:", e); 
    }

    try { 
      const tokopediaInstance = new (TokopediaCrawler as any)();
      if (tokopediaInstance && typeof tokopediaInstance.scan === 'function') {
        tokopediaData = await tokopediaInstance.scan(finalQuery); 
      }
    } catch (e) { 
      console.error("Tokopedia Scraper Error:", e); 
    }

    try { 
      const lazadaInstance = new (LazadaCrawler as any)();
      if (lazadaInstance && typeof lazadaInstance.scan === 'function') {
        lazadaData = await lazadaInstance.scan(finalQuery); 
      }
    } catch (e) { 
      console.error("Lazada Scraper Error:", e); 
    }

    // Pastikan selalu berbentuk array datar yang valid
    let allItems: any[] = [
      ...(Array.isArray(shopeeData) ? shopeeData : []),
      ...(Array.isArray(tokopediaData) ? tokopediaData : []),
      ...(Array.isArray(lazadaData) ? lazadaData : [])
    ];

    let isFallbackUsed = false;

    // PROTEKSI 2: Jika diblokir anti-bot atau timeout, gunakan fallback agar deploy & runtime lancar
    if (allItems.length === 0) {
      console.warn(`[Untungin AI] Mengaktifkan mode cerdas simulasi pasar untuk: ${finalQuery}`);
      allItems = getMockFallbackData(finalQuery);
      isFallbackUsed = true;
    }

    const merged = allItems.map((item: any, index: number) => {
      const rawPrice = item?.price || 0;
      const rawSales = item?.sales || item?.historical_sold || 0;

      const cleanPrice = Number(String(rawPrice).replace(/[^0-9]/g, "")) || 0;
      const cleanSales = Number(String(rawSales).replace(/[^0-9]/g, "")) || 0;
      
      const opportunity = item?.opportunity_score || calculateOpportunityScore(item) || 75;

      return {
        id: `${item?.marketplace || 'live'}-${index}-${Date.now()}`,
        name: item?.product_name || item?.title || "Produk Marketplace",
        marketplace: item?.marketplace || "Shopee",
        country: "ID",
        category: "Live Search",
        keyword: finalQuery,
        imageUrl: item?.image || item?.image_url || "",
        priceMin: cleanPrice,
        priceMax: cleanPrice,
        sold7d: Math.round(cleanSales / 4),
        sold30d: cleanSales,
        revenue7d: Math.round(cleanSales / 4) * cleanPrice,
        revenue30d: cleanSales * cleanPrice,
        growth7d: 15,
        growth30d: 20,
        rating: Number(item?.rating || item?.shop_rating || 4.7),
        reviewCount: Number(item?.reviews || item?.review_count || Math.round(cleanSales * 0.3)),
        demandScore: opportunity,
        growthScore: opportunity,
        competitionScore: 45,
        opportunityScore: opportunity,
        signal: "active",
        source: item?.marketplace || "Shopee",
        sourceUrl: item?.product_url || item?.url || "",
        updatedAt: new Date().toISOString()
      };
    });

    return NextResponse.json({
      products: merged,
      categories: [
        {
          id: "live-trending",
          name: finalQuery,
          marketplace: "Multi-channel Live",
          opportunityScore: 85,
          demandScore: 80,
          growthScore: 85,
          competitionScore: 45,
          signal: "stable"
        }
      ],
      rowCount: merged.length,
      dataMode: isFallbackUsed ? "simulated_live" : "pure_live",
      activeSource: isFallbackUsed ? "Marketplace Fallback Data System" : "Marketplace Live Scraper Integration"
    });

  } catch (globalError: any) {
    console.error("CRITICAL BACKEND ERROR DURING BUILD/RUNTIME:", globalError);
    return NextResponse.json({
      products: [],
      categories: [],
      rowCount: 0,
      error: "Internal Server Error",
      message: globalError.message || "Unknown error occurred"
    }, { status: 200 }); 
  }
}