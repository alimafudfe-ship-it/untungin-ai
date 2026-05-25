export async function GET() {
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("sold", { ascending: false })
    .limit(20)

  return Response.json({ products: data })
}