import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req) {
  const items = await req.json()

  const products = items.map((item) => ({
    id: item.itemid,
    title: item.name,
    price: item.price / 100000,
    sold: item.historical_sold,
    rating: item.item_rating?.rating_star || 0,
    reviews: item.item_rating?.rating_count?.[0] || 0,
    image: `https://cf.shopee.co.id/file/${item.image}`,
    platform: "shopee"
  }))

  await supabase.from("products").upsert(products)

  return Response.json({ success: true })
}
