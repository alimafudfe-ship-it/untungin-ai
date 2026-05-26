import { chromium } from 'playwright';

const proxies=(process.env.PROXY_POOL||'').split(',').filter(Boolean);

function pickProxy(){
 return proxies.length? proxies[Math.floor(Math.random()*proxies.length)] : undefined;
}

export async function scrapeShopee(keyword:string){
 const browser=await chromium.launch({
   headless:true,
   proxy: pickProxy()? {server: pickProxy()!}: undefined
 });

 try{
  const ctx=await browser.newContext({
    userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136 Safari/537.36'
  });

  const page=await ctx.newPage();
  await page.goto(`https://shopee.co.id/search?keyword=${encodeURIComponent(keyword)}`,{
    waitUntil:'networkidle',
    timeout:45000
  });

  await page.waitForTimeout(2500);

  return await page.evaluate(()=>Array.from(document.querySelectorAll('[data-sqe="item"]')).slice(0,20).map((el:any)=>({
    product_name: el.innerText?.split('\n')[0] || 'unknown'
  })));
 } finally{
   await browser.close();
 }
}
