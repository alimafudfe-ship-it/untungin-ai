import { collectAllMarketplaceData, unifiedParser } from '@/lib/market-connectors/connectors'

export async function GET(){
  const rawData = await collectAllMarketplaceData()
  const snapshots = unifiedParser(rawData)

  return Response.json({
    success:true,
    total:snapshots.length,
    marketplaces:[
      'Shopee',
      'Tokopedia',
      'Lazada',
      'TikTok Shop'
    ],
    data:snapshots
  })
}

export async function POST(){
  const rawData = await collectAllMarketplaceData()
  const snapshots = unifiedParser(rawData)

  return Response.json({
    success:true,
    message:'Realtime market scan completed',
    inserted:snapshots.length,
    data:snapshots
  })
}
