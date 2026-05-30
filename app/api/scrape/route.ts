import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json({ error: "Kata kunci harus diisi" }, { status: 400 });
  }

  try {
    // Membikin nama produk tiruan yang dinamis berdasarkan kata kunci yang diketik user
    const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    
    // Generator data kompetitor dinamis (mengikuti apa pun yang Anda cari)
    const products = [
      {
        id: 1,
        name: `${capitalizedKeyword} Premium Distro Original Quality`,
        price: 89000,
        monthlySales: 4200,
        revenue: 89000 * 4200,
        shop: "IndoFashion Official",
        location: "Jakarta Barat"
      },
      {
        id: 2,
        name: `${capitalizedKeyword} Casual Trendy Terlaris Murah`,
        price: 55000,
        monthlySales: 3100,
        revenue: 55000 * 3100,
        shop: "GrosirFashion.id",
        location: "Bandung"
      },
      {
        id: 3,
        name: `${capitalizedKeyword} Exclusive Edition Import BM`,
        price: 249000,
        monthlySales: 1500,
        revenue: 249000 * 1500,
        shop: "StyleMaster Store",
        location: "Surabaya"
      },
      {
        id: 4,
        name: `${capitalizedKeyword} Anak & Remaja Motif Kekinian`,
        price: 45000,
        monthlySales: 2100,
        revenue: 45000 * 2100,
        shop: "KidzWear Supply",
        location: "Solo"
      },
      {
        id: 5,
        name: `${capitalizedKeyword} Jumbo Big Size Oversize Unisex`,
        price: 75000,
        monthlySales: 1800,
        revenue: 75000 * 1800,
        shop: "BigSize-Corner",
        location: "Semarang"
      }
    ];

    // Mengirimkan data kembali ke front-end
    return NextResponse.json({ products });

  } catch (error: any) {
    console.error("Scrape Error:", error);
    return NextResponse.json({ error: "Gagal memata-matai pasar" }, { status: 500 });
  }
}