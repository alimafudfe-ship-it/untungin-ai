
export async function runMarketScanner(connectors, cache){
 const rows=[];
 for(const c of connectors){ rows.push(...await c.scan()); }
 cache.set('market:last',rows);
 return rows;
}
