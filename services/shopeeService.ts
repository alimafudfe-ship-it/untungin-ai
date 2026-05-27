export async function fetchShopee(data: any) {
  // TODO: ganti dengan scraping/API asli
  return [
    {
      name: "Produk Viral Shopee",
      price: 50000,
      sold: Math.floor(Math.random() * 1000),
      platform: "shopee",
    },
  ];
}
