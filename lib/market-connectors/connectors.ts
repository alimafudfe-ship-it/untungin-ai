export type MarketItem = {
  id: string;
  marketplace: string;
  product_name: string;
  price: number;
  sales: number;
  revenue: number;
  competition_score: number;
  trend_score: number;
  snapshot_date: string;
};

const random = (min:number,max:number)=> Math.floor(Math.random()*(max-min+1))+min;

function createItems(marketplace:string): MarketItem[] {
  return [1,2,3,4,5].map((i)=>{
    const sales = random(50,500);
    const price = random(20000,250000);
    return {
      id: `${marketplace.toLowerCase()}-${i}`,
      marketplace,
      product_name: `${marketplace} Trending Product ${i}`,
      price,
      sales,
      revenue: sales * price,
      competition_score: random(20,90),
      trend_score: random(40,100),
      snapshot_date: new Date().toISOString()
    }
  })
}

export async function shopeeConnector(){
  return createItems('Shopee')
}

export async function tokopediaConnector(){
  return createItems('Tokopedia')
}

export async function lazadaConnector(){
  return createItems('Lazada')
}

export async function tiktokConnector(){
  return createItems('TikTok Shop')
}

export async function collectAllMarketplaceData(){
  const [shopee, tokopedia, lazada, tiktok] = await Promise.all([
    shopeeConnector(),
    tokopediaConnector(),
    lazadaConnector(),
    tiktokConnector()
  ]);

  return [...shopee, ...tokopedia, ...lazada, ...tiktok]
}

export function unifiedParser(items: MarketItem[]){
  return items.map((item)=>({
    product_id: item.id,
    marketplace: item.marketplace,
    product_name: item.product_name,
    price: Number(item.price || 0),
    sales: Number(item.sales || 0),
    revenue: Number(item.revenue || 0),
    competition_score: Number(item.competition_score || 0),
    trend_score: Number(item.trend_score || 0),
    snapshot_date: item.snapshot_date
  }))
}
