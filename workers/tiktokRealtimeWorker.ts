export async function runTikTokRealtimeWorker(keyword: string) {
  return {
    status: 'crawler-ready',
    keyword,
    note: 'Attach Playwright stealth crawler or TikTok Shop partner API.'
  };
}
