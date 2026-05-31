// File: ./services/crawlers/baseCrawler.ts
import { chromium, Browser, BrowserContext } from 'playwright';

export abstract class BaseCrawler {
  /**
   * Membuat instansi browser dan konteksnya sekaligus.
   * Mengembalikan tuple [browser, context] agar pemanggil fungsi 
   * wajib menutup browser setelah selesai digunakan demi menghemat RAM.
   */
  async createBrowserAndContext(): Promise<{ browser: Browser; context: BrowserContext }> {
    const browser = await chromium.launch({ 
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const context = await browser.newContext({
      userAgent: this.randomUserAgent(),
      viewport: { width: 1366, height: 768 },
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta'
    });

    return { browser, context };
  }

  randomUserAgent(): string {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    ];

    return agents[Math.floor(Math.random() * agents.length)];
  }
}