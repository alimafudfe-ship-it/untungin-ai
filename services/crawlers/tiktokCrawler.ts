import { BaseCrawler } from "./baseCrawler";
import { chromium } from "playwright";

export class TikTokCrawler extends BaseCrawler {
  async scan(keyword: string) {

    let browser = null;

    try {

      browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox"
        ]
      });

      const page = await browser.newPage();

      const url =
        `https://www.tiktok.com/search?q=${encodeURIComponent(keyword)}`;

      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000
      });

      // extract data

      return [];

    } catch (e) {

      console.error(e);
      return [];

    } finally {

      if (browser) {
        await browser.close();
      }

    }
  }
}