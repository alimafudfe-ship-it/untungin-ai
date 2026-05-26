import { createClient } from "@supabase/supabase-js"

export async function POST(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error("Missing Supabase environment variables")
    return Response.json(
      { success: false, error: "Supabase environment variables are not configured" },
      { status: 500 }
    )
  }

  const supabase = createClient(url, key)

  const items = await req.json()

  const products = (items || []).map((item) => ({
    id: item.itemid,
    title: item.name,
    price: item.price / 100000,
    sold: item.historical_sold,
    rating: item.item_rating?.rating_star || 0,
    reviews: item.item_rating?.rating_count?.[0] || 0,
    image: item.image ? `https://cf.shopee.co.id/file/${item.image}` : null,
    platform: "shopee"
  }))

  const { error } = await supabase.from("products").upsert(products)

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
