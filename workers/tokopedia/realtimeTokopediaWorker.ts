// File: ./workers/tokopedia/realtimeTokopediaWorker.ts
import { chromium } from 'playwright';

export async function realtimeTokopediaWorker(keyword: string) {
  console.log(`[Tokopedia Worker] Memulai live crawling untuk kata kunci: ${keyword}`);
  
  let browser: any = null;

  try {
    // 1. Inisialisasi browser dengan argument anti-deteksi otomatisasi
    browser = await chromium.launch({
      headless: true, // Ubah ke false jika Anda ingin melihat prosesnya saat proses debug/development
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1366,768'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta'
    });

    const page = await context.newPage();

    // 2. Navigasi ke URL pencarian Tokopedia
    const searchUrl = `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(keyword)}`;
    
    // Menggunakan 'domcontentloaded' agar cepat dan tidak terhambat oleh pemuatan gambar/banner yang berat
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Jeda acak singkat meniru jeda waktu baca manusia asli (anti-bot trigger)
    await page.waitForTimeout(Math.random() * 1500 + 1000);

    // 3. Deteksi Tantangan Keamanan (Cloudflare / Shield Tokopedia)
    const isBlocked = await page.evaluate(() => {
      return document.title.includes('Just a moment...') || !!document.querySelector('#challenge-running') || document.title.includes('Attention Required!');
    });

    if (isBlocked) {
      console.warn(`[Tokopedia Worker] Terdeteksi sistem proteksi Cloudflare/Bot Shield. Beralih ke sistem fallback.`);
      return []; // Langsung keluar dengan array kosong demi mengamankan performa backend
    }

    // 4. Tunggu hingga container produk Tokopedia muncul di layar (maksimal 5 detik)
    await page.waitForSelector('[data-testid="lstCL2ProductList"]', { timeout: 5000 }).catch(() => {});

    // 5. Ekstraksi data produk dari DOM Tokopedia
    const products = await page.evaluate(() => {
      const items = document.querySelectorAll('[data-testid="master-product-card"]');
      const data: any[] = [];
      
      // Ambil maksimal 10 produk teratas demi efisiensi memori heap Node.js
      const limit = Math.min(items.length, 10); 

      for (let i = 0; i < limit; i++) {
        const item = items[i];
        
        const nameEl = item.querySelector('[data-testid="spnSRPProdName"]');
        const priceEl = item.querySelector('[data-testid="spnSRPProdPrice"]');
        const ratingEl = item.querySelector('[data-testid="lblSRPProdRating"]');
        const statsEl = item.querySelector('[data-testid="lblSRPProdSoldCounter"]');

        if (nameEl && priceEl) {
          data.push({
            product_name: nameEl.textContent?.trim() || 'Produk Tokopedia',
            price: priceEl.textContent?.trim() || '0',
            rating: ratingEl ? parseFloat(ratingEl.textContent || '4.7') : 4.7,
            sales: statsEl ? statsEl.textContent?.trim() || '0' : '0'
          });
        }
      }
      return data;
    });

    // 6. Normalisasi format data mentah agar kompatibel dengan sistem crawler Untungin AI
    return products.map((p: any) => {
      // Bersihkan string harga (Contoh: "Rp 150.000" -> 150000)
      const cleanPrice = Number(p.price.replace(/[^0-9]/g, '')) || 0;
      
      // Bersihkan string penjualan (Contoh: "Terjual 1,2rb+" -> 1200)
      let cleanSales = Number(p.sales.replace(/[^0-9]/g, '')) || 0;
      if (p.sales.toLowerCase().includes('rb')) cleanSales *= 1000;

      return {
        product_name: p.product_name,
        sales: cleanSales || 10, // Beri fallback minimal penjualan jika toko baru
        price: cleanPrice,
        rating: p.rating,
        marketplace: 'Tokopedia'
      };
    });

  } catch (error) {
    console.error("[Tokopedia Worker] Terjadi kesalahan saat proses scraping:", error);
    return []; // Amankan alur data agar backend tidak crash / gantung
    
  } finally {
    // 7. SEKAT PROTEKSI RAM ABSOLUT
    if (browser) {
      await browser.close();
      console.log("[Tokopedia Worker] Browser Tokopedia berhasil ditutup. Memori RAM dibersihkan.");
    }
  }
}