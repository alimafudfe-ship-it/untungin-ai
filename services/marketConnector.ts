
export type MarketRow={
 marketplace:string; product_name:string; price:number; sales:number; rating:number;
};

export async function scanMarketplace(keyword:string){
 const endpoints=[
   {marketplace:'Shopee'},
   {marketplace:'Tokopedia'},
   {marketplace:'TikTok'},
   {marketplace:'Lazada'}
 ];

 return endpoints.map((m,i)=>({
   marketplace:m.marketplace,
   product_name:`${keyword} sample ${i+1}`,
   price:0,
   sales:0,
   rating:0
 }));
}
