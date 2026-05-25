import { chromium, BrowserContext } from 'playwright';

export abstract class BaseCrawler {
  async createContext(): Promise<BrowserContext> {
    const browser = await chromium.launch({ headless: true });
    return browser.newContext({
      userAgent: this.randomUserAgent(),
      viewport: { width: 1366, height: 768 },
    });
  }

  randomUserAgent() {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123 Safari/537.36',
    ];

    return agents[Math.floor(Math.random() * agents.length)];
  }
}
