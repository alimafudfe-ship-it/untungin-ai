
import { ShopeeCrawler } from '../../../services/crawlers/shopeeCrawler';

export async function POST(req: Request){
 const body=await req.json().catch(()=>({}));
 const keyword=(body.keyword||'').trim();
 if(!keyword){
   return Response.json({success:false,error:'keyword required'},{status:400});
 }
 const shopee=new ShopeeCrawler();
 const rows=await shopee.scan(keyword);

 return Response.json({
   success:true,
   keyword,
   count:rows.length,
   data:rows,
   generatedAt:new Date().toISOString()
 });
}
