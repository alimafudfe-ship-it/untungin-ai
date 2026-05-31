// File: ./services/crawlers/tokopediaCrawler.ts
import { BaseCrawler } from './baseCrawler';
import { chromium } from 'playwright';

export class TokopediaCrawler extends BaseCrawler {
  async scan(keyword: string) {
    console.log(`[Tokopedia Scraper] Memulai crawling untuk: ${keyword}`);
    
    let browser: any = null;

    try {
      // 1. Inisialisasi browser headless
      browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      const page = await context.newPage();

      // 2. Navigasi ke URL pencarian Tokopedia
      // Gunakan encodeURIComponent agar karakter spasi/khusus pada keyword aman di URL
      const searchUrl = `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(keyword)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

      // 3. Logika Selector Ekstraksi Data (Sesuai DOM Tokopedia terbaru)
      // Menunggu container produk muncul di halaman
      await page.waitForSelector('[data-testid="lstCL2ProductList"]', { timeout: 5000 }).catch(() => {});

      const products = await page.evaluate(() => {
        // Ambil semua elemen kartu produk Tokopedia
        const items = document.querySelectorAll('[data-testid="master-product-card"]');
        const data: any[] = [];

        // Ambil sampel 5-10 produk teratas saja demi kecepatan serverless/lokal
        const limit = Math.min(items.length, 10); 

        for (let i = 0; i < limit; i++) {
          const item = items[i];
          
          // Ambil nama produk
          const nameEl = item.querySelector('[data-testid="spnSRPProdName"]');
          // Ambil harga produk
          const priceEl = item.querySelector('[data-testid="spnSRPProdPrice"]');
          // Ambil rating produk
          const ratingEl = item.querySelector('[data-testid="lblSRPProdRating"]');
          // Ambil total penjualan (misal: "Terjual 100+")
          const statsEl = item.querySelector('[data-testid="lblSRPProdSoldCounter"]');

          if (nameEl && priceEl) {
            data.push({
              product_name: nameEl.textContent?.trim() || 'Produk Tokopedia',
              price: priceEl.textContent?.trim() || '0',
              rating: ratingEl ? parseFloat(ratingEl.textContent || '0') : 4.7,
              sales: statsEl ? statsEl.textContent?.trim() || '0' : '0'
            });
          }
        }
        return data;
      });

      // 4. Mapping data mentah ke format standar Untungin AI
      return products.map((p: any) => {
        // Bersihkan string harga (Contoh: "Rp 99.000" -> 99000)
        const cleanPrice = Number(p.price.replace(/[^0-9]/g, '')) || 0;
        
        // Bersihkan string penjualan (Contoh: "Terjual 500+" -> 500)
        let cleanSales = Number(p.sales.replace(/[^0-9]/g, '')) || 0;
        if (p.sales.includes('rb')) cleanSales *= 1000; // Mengatasi text "1,5rb terjual"

        return {
          marketplace: 'Tokopedia',
          keyword,
          product_name: p.product_name,
          sales: cleanSales || 10, // Beri fallback jika toko baru/belum ada penjualan terdeteksi
          price: cleanPrice,
          rating: p.rating || 4.7,
          source: 'playwright'
        };
      });

    } catch (error) {
      console.error("[Tokopedia Scraper] Gagal mengambil data live:", error);
      // Jika anti-bot memblokir atau timeout, kembalikan array kosong agar system beralih ke Fallback Otomatis
      return []; 
      
    } finally {
      // 5. BLOK ABSOLUT: Browser wajib ditutup agar RAM tidak Out Of Memory lagi!
      if (browser) {
        console.log("[Tokopedia Scraper] Menutup Chromium instance. Memori dibersihkan.");
        await browser.close();
      }
    }
  }
}