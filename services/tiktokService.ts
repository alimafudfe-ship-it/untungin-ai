export async function fetchTikTok(data: any) {
  return [
    {
      name: "Produk Trending TikTok",
      price: 75000,
      sold: Math.floor(Math.random() * 2000),
      platform: "tiktok",
    },
  ];
}
