export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    // Sisa logika fetching crawler Shopee Anda di bawah...
    return Response.json({ message: "Proxy aktif", query: q });
  } catch (error) {
    return Response.json({ error: "Gagal memproses proxy shopee" }, { status: 500 });
  }
}
