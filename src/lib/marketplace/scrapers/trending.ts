
export async function getTrendingProducts(marketplace: string) {
  return {
    marketplace,
    status: "scraping-active",
    products: [],
  };
}
