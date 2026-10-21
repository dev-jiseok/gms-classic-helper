// Prices are evidence, not a guaranteed transaction price. Preserve type, time,
// source and equipment options through every aggregation and recommendation.
export const MARKET_INTERVAL_SECONDS = 60;
export const RECOMMENDATION_INTERVAL_SECONDS = 3600;
export const MARKET_TYPES = ['sell', 'buy', 'sold'];
export const OPTION_KEYS = ['attack', 'magicAttack', 'str', 'dex', 'int', 'luk', 'accuracy', 'slots'];
const clean = (v, max = 160) => String(v ?? '').trim().slice(0, max);
const finite = v => v !== '' && v != null && Number.isFinite(Number(v));
export function normalizeOptions(input = {}) {
  const out = {};
  for (const key of OPTION_KEYS) if (finite(input[key])) out[key] = Number(input[key]);
  return out;
}
export function normalizeQuote(input, source = {}, now = Date.now()) {
  if (!input || typeof input !== 'object') return null;
  const price = Number(input.price), quantity = input.quantity == null ? 1 : Number(input.quantity);
  const at = input.observedAt ?? input.at;
  const time = Date.parse(at);
  const itemId = clean(input.itemId, 60), itemName = clean(input.itemName ?? input.name, 160);
  if ((!itemId && !itemName) || !MARKET_TYPES.includes(input.type) || !finite(input.price) || price <= 0 || price > Number.MAX_SAFE_INTEGER || !Number.isSafeInteger(quantity) || quantity < 1 || !Number.isFinite(time) || time > now + 300_000) return null;
  if (input.priceBasis && !['unit', 'bundle'].includes(input.priceBasis)) return null;
  const options = normalizeOptions(input.options ?? input);
  const sourceId = clean(source.id ?? input.sourceId ?? 'manual', 80);
  const sourceName = clean(source.name ?? input.source ?? '직접 확인', 120);
  let sourceUrl = '';
  try { const u = new URL(input.sourceUrl ?? ''); if (['https:', 'http:'].includes(u.protocol) && !u.username && !u.password) sourceUrl = u.href; } catch {}
  const basis = input.priceBasis ?? 'unit';
  const unitPrice=basis==='bundle'?price/quantity:price;
  const originalPriceBasis=basis==='bundle'||input.originalPriceBasis==='bundle'?'bundle':'unit';
  const requestedMinimum=originalPriceBasis==='bundle'?quantity:Number(input.minimumPurchaseQuantity??1);
  if(!Number.isSafeInteger(requestedMinimum)||requestedMinimum<1||requestedMinimum>quantity)return null;
  const bundlePrice=originalPriceBasis==='bundle'?(basis==='bundle'?price:finite(input.bundlePrice)?Number(input.bundlePrice):unitPrice*requestedMinimum):null;
  const evidence=input.evidence&&['pasted-game-text','screen-ocr'].includes(input.evidence.kind)?{kind:input.evidence.kind,raw:clean(input.evidence.raw,1500),confidence:finite(input.evidence.confidence)?Math.min(100,Math.max(0,Number(input.evidence.confidence))):null,observedAt:Number.isFinite(Date.parse(input.evidence.observedAt))?new Date(input.evidence.observedAt).toISOString():null,userReviewed:input.evidence.userReviewed===true}:undefined;
  return {
    id: clean(input.id, 120) || `q-${stableHash([sourceId, itemId || itemName, input.type, price, quantity, at, input.seller, options])}`,
    itemId, itemName, type: input.type, price, quantity, priceBasis: basis,
    unitPrice,originalPriceBasis,bundlePrice,minimumPurchaseQuantity:requestedMinimum,minimumPurchaseTotal:unitPrice*requestedMinimum,
    options, optionsComplete: input.optionsComplete === true,
    sourceId, source: sourceName, sourceUrl, at: new Date(time).toISOString(),
    lastSeenAt: input.lastSeenAt && Number.isFinite(Date.parse(input.lastSeenAt)) ? new Date(input.lastSeenAt).toISOString() : new Date(now).toISOString(),
    seller: clean(input.seller ?? input.author, 80), channel: clean(input.channel, 30), location: clean(input.location, 160), contact: clean(input.contact, 180),
    verification: ['provider', 'user', 'reported'].includes(input.verification) ? input.verification : sourceId === 'manual' ? 'user' : 'reported',
    active: input.active !== false && input.active !== 0,...(evidence?{evidence}:{}),
    isEquipment:input.isEquipment===true||(/^\d+$/.test(itemId)&&Number(itemId)>=1_000_000&&Number(itemId)<2_000_000),catalogCategory:clean(input.catalogCategory,50),providerItemId:clean(input.providerItemId,60),observationMethod:clean(input.observationMethod,70),quantityKnown:input.quantityKnown!==false,stock:finite(input.stock)?Math.max(0,Number(input.stock)):null,
  };
}
export function stableHash(value) { let h = 2166136261; for (const c of JSON.stringify(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(36); }
export function quoteKey(q) { return `${q.sourceId}:${q.id}`; }
export function optionSignature(options = {}) { return OPTION_KEYS.filter(k => finite(options[k])).map(k => `${k}:${Number(options[k])}`).join('|'); }
export function comparisonKey(q) { return `${q.itemId || q.itemName.toLowerCase()}/${optionSignature(q.options)}/${q.optionsComplete ? 'complete' : q.isEquipment ? `unverified:${quoteKey(q)}` : 'partial'}`; }
export function dedupeQuotes(quotes) {
  const map = new Map();
  for (const q of quotes) { if (!q) continue; const key = quoteKey(q), previous = map.get(key); if (!previous || q.at >= previous.at) map.set(key, q); }
  return [...map.values()].sort((a, b) => b.at.localeCompare(a.at));
}
export function quoteFreshness(q, now = Date.now(), freshnessSeconds = 300) {
  const seconds = Math.max(0, (now - Date.parse(q.at)) / 1000);
  return { ageSeconds: seconds, fresh: Number.isFinite(seconds) && seconds <= freshnessSeconds, stale: !Number.isFinite(seconds) || seconds > freshnessSeconds };
}
export function quotesFromPosts(posts, sourceName = '우리 공간', now = Date.now()) {
  return posts.filter(p => p.active !== 0).flatMap(p => {
    const source={ id: `community:${p.room ?? 'our-party'}`, name: sourceName };
    const common={at:p.updatedAt||p.createdAt,seller:p.author,verification:'reported',channel:p.payload?.channel,location:p.payload?.location,contact:p.payload?.contact};
    if(['sell','buy'].includes(p.kind))return [normalizeQuote({ ...p.payload,...common,id:p.id,itemName:p.payload?.itemName??p.payload?.title,type:p.kind,options:p.payload?.options??{attack:p.payload?.attack,slots:p.payload?.slots}},source,now)];
    // Each explicitly priced shop product is a quote. Never divide the price of
    // a mixed-item shop/bundle across its goods.
    if(p.kind==='shop'&&Array.isArray(p.payload?.items))return p.payload.items.filter(item=>Number(item.quantity)>0).map((item,index)=>normalizeQuote({...item,...common,id:`${p.id}:${item.id||index}`,itemName:item.name,type:'sell',options:item.options??{}},source,now));
    return [];
  }).filter(Boolean);
}
export function filterMarketQuotes(quotes, filter = {}, now = Date.now()) {
  const query = clean(filter.query).toLowerCase().replace(/\s/g, '');
  const maxAge = finite(filter.maxAgeHours) ? Number(filter.maxAgeHours) * 3600_000 : Infinity;
  return quotes.filter(q => q.active && (!filter.itemId || String(q.itemId) === String(filter.itemId)) && (!filter.type || filter.type === 'all' || q.type === filter.type) && (!query || `${q.itemId} ${q.itemName} ${q.seller} ${q.source}`.toLowerCase().replace(/\s/g, '').includes(query)) && now - Date.parse(q.at) <= maxAge && (!finite(filter.maxPrice) || q.unitPrice <= Number(filter.maxPrice)) && (!finite(filter.minAttack) || (q.options.attack != null && q.options.attack >= Number(filter.minAttack))) && (!finite(filter.minMagicAttack) || (q.options.magicAttack != null && q.options.magicAttack >= Number(filter.minMagicAttack))) && (!finite(filter.minSlots) || (q.options.slots != null && q.options.slots >= Number(filter.minSlots))) && OPTION_KEYS.every(k=>!finite(filter.minOptions?.[k])||(q.options[k]!=null&&q.options[k]>=Number(filter.minOptions[k]))));
}
export function median(values) { const a = values.filter(Number.isFinite).sort((a, b) => a - b); return a.length ? a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2 : null; }
export function summarizeMarket(quotes, now = Date.now(), maxAgeHours = 24) {
  const rows = quotes.filter(q => q.active && now - Date.parse(q.at) <= maxAgeHours * 3600_000);
  const sell = rows.filter(q => q.type === 'sell'), buy = rows.filter(q => q.type === 'buy'), sold = rows.filter(q => q.type === 'sold');
  const soldMedian = median(sold.map(q => q.unitPrice)), sellMedian = median(sell.map(q => q.unitPrice)), buyMedian = median(buy.map(q => q.unitPrice));
  const reference = soldMedian ?? (sellMedian != null && buyMedian != null ? (sellMedian + buyMedian) / 2 : null);
  return { sellCount: sell.length, buyCount: buy.length, soldCount: sold.length, count: rows.length, lowestAsk: sell.length ? Math.min(...sell.map(q => q.unitPrice)) : null, highestBid: buy.length ? Math.max(...buy.map(q => q.unitPrice)) : null, soldMedian, sellMedian, buyMedian, reference, referenceType: soldMedian != null ? 'sold' : reference != null ? 'midpoint' : 'unknown', newestAt: rows[0]?.at ?? null };
}
export function comparableDeals(quotes, now = Date.now(), maxAgeHours = 24) {
  const groups = new Map();
  for (const q of quotes.filter(q => q.active && now - Date.parse(q.at) <= maxAgeHours * 3600_000)) { const key = comparisonKey(q); const a = groups.get(key) ?? []; a.push(q); groups.set(key, a); }
  const out = [];
  for (const rows of groups.values()) {
    const sells = rows.filter(q => q.type === 'sell').sort((a, b) => a.unitPrice - b.unitPrice), stats = summarizeMarket(rows, now, maxAgeHours);
    if (!sells.length) continue;
    const q = sells[0], otherAsks = sells.slice(1), comparisonPrice = stats.soldMedian ?? median(otherAsks.map(q => q.unitPrice));
    out.push({ quote: q, ...stats, comparisonPrice, comparisonCount: stats.soldCount || otherAsks.length, discount: comparisonPrice > 0 ? 1 - q.unitPrice / comparisonPrice : null, limitedOptions: !q.optionsComplete });
  }
  return out.sort((a, b) => (b.discount ?? -Infinity) - (a.discount ?? -Infinity));
}
export function evaluateWatches(watches, quotes, seen = {}, now = Date.now()) {
  const alerts = [], nextSeen = { ...seen };
  for (const watch of watches.filter(w => w.enabled !== false)) {
    const candidates = filterMarketQuotes(quotes, { ...watch, type: watch.type ?? 'sell', maxAgeHours: watch.maxAgeHours ?? 1 }, now).filter(q => q.unitPrice <= Number(watch.maxPrice));
    for (const q of candidates) {
      const key = `${watch.id}:${quoteKey(q)}:${q.unitPrice}`;
      if (nextSeen[key]) continue;
      nextSeen[key] = new Date(now).toISOString();
      alerts.push({ id: `alert-${stableHash(key)}`, watchId: watch.id, watchName: watch.name || watch.query || watch.itemId, quote: q, at: new Date(now).toISOString(), read: false });
    }
  }
  const limited = Object.entries(nextSeen).sort((a, b) => String(b[1]).localeCompare(String(a[1]))).slice(0, 3000);
  return { alerts, seen: Object.fromEntries(limited) };
}
export function mergePriceHistory(existing, incoming, limit = 300, now = Date.now()) {
  const rows = new Map();
  for (const q of existing) { const normalized=normalizeQuote(q,{},now);if(normalized)rows.set(`${quoteKey(normalized)}:${normalized.at}:${normalized.price}`,normalized); }
  const latest=new Map();for(const q of [...rows.values()].sort((a,b)=>a.at.localeCompare(b.at)))latest.set(quoteKey(q),q);
  for (const q of incoming) { const normalized = normalizeQuote(q, {}, now); if (!normalized) continue; const previous=latest.get(quoteKey(normalized));if(previous&&previous.price===normalized.price&&previous.type===normalized.type&&optionSignature(previous.options)===optionSignature(normalized.options))continue;rows.set(`${quoteKey(normalized)}:${normalized.at}:${normalized.price}`, normalized);if(!previous||previous.at<=normalized.at)latest.set(quoteKey(normalized),normalized); }
  return [...rows.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
export function toPriceRecord(q) { return { ...q, price: q.unitPrice, priceBasis: 'unit',originalPriceBasis:q.originalPriceBasis??q.priceBasis??'unit',bundlePrice:q.originalPriceBasis==='bundle'||q.priceBasis==='bundle'?(q.bundlePrice??q.price):null,minimumPurchaseQuantity:q.minimumPurchaseQuantity??(q.priceBasis==='bundle'?q.quantity:1),minimumPurchaseTotal:q.unitPrice*(q.minimumPurchaseQuantity??(q.priceBasis==='bundle'?q.quantity:1)) }; }
export function parseMarketImport(text, now = Date.now()) {
  const value = String(text ?? '').trim();
  if (!value) throw new Error('가져올 가격 기록을 입력해 주세요.');
  if (value.length > 1_000_000) throw new Error('한 번에 1MB까지 가져올 수 있어요.');
  let input;
  if (value.startsWith('[') || value.startsWith('{')) { const json = JSON.parse(value); input = Array.isArray(json) ? json : json.quotes; }
  else {
    const rows = value.split(/\r?\n/).filter(Boolean);
    input = rows.map((line, i) => { const c = line.split(/[\t,]/).map(x => x.trim()); if (i === 0 && /item|아이템/i.test(c[0])) return null; if (c.length < 2) throw new Error(`${i + 1}행의 아이템 ID와 단가를 확인해 주세요.`); return { id: `import-${stableHash(line)}`, itemId: c[0], price: c[1], type: c[2] || 'sell', source: c[3] || 'CSV 가져오기', at: c[4], quantity: c[5] || 1, itemName: c[6], options: { attack: c[7], slots: c[8] } }; }).filter(Boolean);
  }
  if (!Array.isArray(input) || input.length > 1000) throw new Error('quotes 배열 또는 CSV로 최대 1,000행까지 가져올 수 있어요.');
  const rows = input.map((q, i) => { const row = normalizeQuote(q, {}, now); if (!row) throw new Error(`${i + 1}행의 아이템, 가격 종류, 양수 가격·수량, 확인 시각을 확인해 주세요.`); return row; });
  return dedupeQuotes(rows);
}
