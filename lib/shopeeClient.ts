export async function fetchShopeeClient(keyword: string) {
  const res = await fetch(
    `/api/shopee-proxy?q=${encodeURIComponent(keyword)}`
  );

  if (!res.ok) throw new Error("Gagal fetch");

  return res.json();
}
