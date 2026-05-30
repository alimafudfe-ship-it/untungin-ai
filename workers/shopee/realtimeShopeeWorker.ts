import { chromium } from 'playwright';

export async function realtimeShopeeWorker(keyword: string) {
  console.log('[Shopee Worker] Memulai pencarian untuk kata kunci:', keyword);

  let browser;
  try {
    // 1. Inisialisasi Browser dengan proteksi anti-bot dasar
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      locale: 'id-ID'
    });

    const page = await context.newPage();

    // 2. Buka URL Pencarian Shopee
    const searchUrl = `https://shopee.co.id/search?keyword=${encodeURIComponent(keyword)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // 3. Simulasi Scroll Perlahan (Crucial untuk memicu lazy-load data & gambar Shopee)
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          // Berhenti jika sudah mencapai bawah halaman atau batas 3500px
          if (totalHeight >= scrollHeight || totalHeight > 3500) {
            clearInterval(timer);
            resolve(true);
          }
        }, 150);
      });
    });

    // Tunggu selektor container produk muncul di halaman web
    try {
      await page.waitForSelector('[data-sqe="item"]', { timeout: 5000 });
    } catch (e) {
      console.warn('[Shopee Worker] Selektor produk tidak ditemukan. Kemungkinan diblokir anti-bot/Captcha.');
      return []; // Kembalikan array kosong agar mengaktifkan fallback cerdas backend
    }

    // 4. Ekstraksi Data dari DOM Shopee
    const products = await page.evaluate((key) => {
      const items = document.querySelectorAll('[data-sqe="item"]');
      const results: any[] = [];

      items.forEach((item) => {
        // Ekstrak Nama Produk
        const nameEl = item.querySelector('[data-sqe="name"]');
        const product_name = nameEl ? nameEl.textContent?.trim() : '';

        // Ekstrak Harga (Mencari elemen teks harga terupdate)
        const priceEl = item.querySelector('.X6beSg, ._10g9w-, ._3cbg9e');
        const rawPrice = priceEl ? priceEl.textContent?.replace(/[^0-9]/g, '') : '0';
        const price = parseInt(rawPrice || '0', 10);

        // Ekstrak Jumlah Penjualan Bulanan (Menangani teks "terjual", "rb", dsb)
        const salesEl = item.querySelector('.r6Slb9, ._2tcKc7, ._229rld');
        let sales = 0;
        if (salesEl && salesEl.textContent) {
          const salesText = salesEl.textContent.toLowerCase();
          if (salesText.includes('rb') || salesText.includes('k')) {
            const parsedNum = parseFloat(salesText.replace(',', '.').replace(/[^0-9.]/g, ''));
            sales = Math.round(parsedNum * 1000);
          } else {
            sales = parseInt(salesText.replace(/[^0-9]/g, ''), 10) || 0;
          }
        }

        // Ekstrak Rating Bintang
        const activeStars = item.querySelectorAll('.shopee-rating-stars__lit, .icon-rating-solid');
        const rating = activeStars.length > 0 ? +(activeStars.length).toFixed(1) : 4.7;

        if (product_name && price > 0) {
          results.push({
            product_name,
            price,
            sales,
            rating
          });
        }
      });

      return results;
    }, keyword);

    console.log(`[Shopee Worker] Berhasil mendapatkan ${products.length} produk riil untuk kata kunci: ${keyword}`);
    
    // TODO: Implementasi Proxy Rotation & Supabase Save di sini kelak jika data sudah stabil
    
    return products;

  } catch (error) {
    console.error('[Shopee Worker Error] Kegagalan runtime Playwright:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}