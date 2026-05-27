import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function realtimeMarketplaceSearch(keyword: string) {
  if (!keyword?.trim()) return [];

  const { data, error } = await supabase
    .from('market_intelligence_products')
    .select('*')
    .or(`title.ilike.%${keyword}%,product_name.ilike.%${keyword}%`)
    .limit(50);

  if (error) {
    console.error('Realtime search error:', error.message);
    return [];
  }

  return data || [];
}
