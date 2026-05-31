// File: ./workers/shopee/realtimeShopeeWorker.ts
import { chromium } from 'playwright';

export async function realtimeShopeeWorker(keyword: string) {
  console.log(`[Shopee Worker] Memulai pencarian untuk: ${keyword}`);
  let browser: any = null;

  try {
    browser = await chromium.launch({
      headless: true, // Ubah ke false jika Anda ingin melihat langsung prosesnya saat debug
      args: [
        '--disable-blink-features=AutomationControlled', // Sembunyikan tanda-tanda Playwright
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-size=1280,720'
      ]
    });

    // Gunakan konteks yang menyerupai browser asli manusia
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta'
    });

    const page = await context.newPage();

    // Jalur URL pencarian Shopee Indonesia
    const url = `https://shopee.co.id/search?keyword=${encodeURIComponent(keyword)}`;
    
    // Gunakan 'domcontentloaded' agar tidak menunggu gambar/iklan yang lambat dimuat
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Tambahkan jeda acak singkat (meniru manusia sedang membaca layar)
    await page.waitForTimeout(Math.random() * 2000 + 1000); 

    // ---- LOGIKA EKSTRAKSI SELEKTOR PRODUK ANDA ----
    const hasilScraping: any[] = [];
    // ... jalankan page.evaluate() Anda di sini ...

    return hasilScraping;

  } catch (error) {
    console.error("[Shopee Worker] Terjadi kendala saat membaca data:", error);
    return [];
  } finally {
    // PROTEKSI MEMORI: Browser WAJIB hancur di sini
    if (browser) {
      await browser.close();
      console.log("[Shopee Worker] Browser berhasil dihancurkan, memori dibersihkan.");
    }
  }
}