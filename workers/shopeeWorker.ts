import { chromium } from "playwright";

export async function scrapeShopee(keyword) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`https://shopee.co.id/search?keyword=${keyword}`, {
    waitUntil: "domcontentloaded"
  });

  await page.waitForTimeout(3000);

  const data = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-sqe="item"]'))
      .slice(0, 20)
      .map(el => ({
        text: el.innerText
      }));
  });

  await browser.close();
  return data;
}
