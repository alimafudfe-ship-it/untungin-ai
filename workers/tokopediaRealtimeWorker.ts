export async function runTokopediaRealtimeWorker(keyword: string) {
  const response = await fetch(`https://ace.tokopedia.com/search/v2.5/product?q=${keyword}`);
  const data = await response.json();
  return data?.data || [];
}
