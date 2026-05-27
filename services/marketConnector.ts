
export type MarketRow = {
  marketplace:string;
  product_name:string;
  price:number;
  sales:number;
  rating:number;
  image?:string;
  url?:string;
  source:"live"|"fallback";
};

async function safeFetch(url:string, headers:Record<string,string>={}){
  try{
    const res = await fetch(url,{
      headers:{
        "accept":"application/json",
        "user-agent":"Mozilla/5.0",
        ...headers
      },
      cache:"no-store",
      next:{revalidate:0}
    });

    if(!res.ok) return null;
    return await res.json();
  }catch{
    return null;
  }
}

function normalizePrice(value:any){
  if(typeof value === "number") return value;
  const parsed = Number(String(value || "0").replace(/[^0-9]/g,""));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function scanShopee(keyword:string):Promise<MarketRow[]>{
  const data = await safeFetch(`https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(keyword)}&limit=10&newest=0`,{
    referer:"https://shopee.co.id/"
  });

  const items = data?.items || [];

  return items.map((item:any)=>({
    marketplace:"Shopee",
    product_name:item?.item_basic?.name || "Produk Shopee",
    price:Math.round((item?.item_basic?.price || 0)/100000),
    sales:item?.item_basic?.historical_sold || 0,
    rating:Number(item?.item_basic?.item_rating?.rating_star || 0),
    image:item?.item_basic?.image,
    url:`https://shopee.co.id/product/${item?.item_basic?.shopid}/${item?.item_basic?.itemid}`,
    source:"live"
  }));
}

async function scanTokopedia(keyword:string):Promise<MarketRow[]>{
  const data = await safeFetch(`https://ace.tokopedia.com/search/v2.5/product?q=${encodeURIComponent(keyword)}&rows=10&start=0`);
  const items = data?.data || [];

  return items.map((item:any)=>({
    marketplace:"Tokopedia",
    product_name:item?.name || "Produk Tokopedia",
    price:normalizePrice(item?.price),
    sales:item?.countReview || 0,
    rating:Number(item?.rating || 0),
    image:item?.image_uri,
    url:item?.url,
    source:"live"
  }));
}

async function scanTikTok(keyword:string):Promise<MarketRow[]>{
  return [{
    marketplace:"TikTok Shop",
    product_name:`${keyword} trending di TikTok Shop`,
    price:0,
    sales:0,
    rating:0,
    source:"fallback"
  }];
}

async function scanLazada(keyword:string):Promise<MarketRow[]>{
  return [{
    marketplace:"Lazada",
    product_name:`${keyword} live discovery`,
    price:0,
    sales:0,
    rating:0,
    source:"fallback"
  }];
}

async function scanBlibli(keyword:string):Promise<MarketRow[]>{
  return [{
    marketplace:"Blibli",
    product_name:`${keyword} live discovery`,
    price:0,
    sales:0,
    rating:0,
    source:"fallback"
  }];
}

export async function scanMarketplace(keyword:string){
  const [shopee,tokopedia,tiktok,lazada,blibli] = await Promise.all([
    scanShopee(keyword),
    scanTokopedia(keyword),
    scanTikTok(keyword),
    scanLazada(keyword),
    scanBlibli(keyword)
  ]);

  return [...shopee,...tokopedia,...tiktok,...lazada,...blibli];
}
