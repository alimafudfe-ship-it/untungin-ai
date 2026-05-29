export const runtime = "nodejs";

import { scanMarketplace } from '@/services/marketConnector';

export async function POST(req:Request){
 const {keyword=''}=await req.json();
 if(!keyword?.trim()){
   return Response.json({success:false,data:[]},{status:400});
 }

 try{
  const rows=await scanMarketplace(keyword);
  return Response.json({
    success:true,
    count:rows.length,
    data:rows
  });
 }catch(e){
  return Response.json({success:false,error:'scan_failed',data:[]},{status:500});
 }
}
