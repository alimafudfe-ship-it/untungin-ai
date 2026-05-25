import { NextResponse } from 'next/server';
import { ShopeeCrawler } from '@/services/crawlers/shopeeCrawler';
import { TokopediaCrawler } from '@/services/crawlers/tokopediaCrawler';
import { LazadaCrawler } from '@/services/crawlers/lazadaCrawler';
import { calculateOpportunityScore } from '@/services/ai/opportunityScore';

export async function GET() {
  const keyword = 'trending';

  const shopee = await new ShopeeCrawler().scan(keyword);
  const tokopedia = await new TokopediaCrawler().scan(keyword);
  const lazada = await new LazadaCrawler().scan(keyword);

  const merged = [...shopee, ...tokopedia, ...lazada].map((item) => ({
    ...item,
    opportunity_score: calculateOpportunityScore(item),
  }));

  return NextResponse.json({
    ok: true,
    data: merged,
  });
}
