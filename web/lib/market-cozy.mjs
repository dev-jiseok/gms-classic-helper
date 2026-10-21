import {dedupeQuotes,normalizeQuote,normalizeOptions,stableHash}from'./market-core.mjs';
export const COZY_ORIGIN='https://cozy.markets';
export const COZY_MAX_PAGE=100;
const STATS=['watk','matk','str','dex','int','luk','acc','slots'];
export function cozySightingQuery(input={},now=Date.now()){
 const page=Math.max(1,Math.min(COZY_MAX_PAGE,Math.floor(Number(input.page)||1))),size=Math.max(1,Math.min(50,Math.floor(Number(input.size)||30)));
 const params=new URLSearchParams({page:String(page),size:String(size),sort:['at','price','unit_price'].includes(input.sort)?input.sort:'at',dir:input.dir==='asc'?'asc':'desc',show:input.show==='sold'?'sold':'listed'});
 const seller=String(input.seller??input.q??'').trim().slice(0,100),channel=Number(input.channel),validChannel=Number.isSafeInteger(channel)&&channel>=1&&channel<=20;
 if(seller)params.set('q',seller);else if(validChannel)params.set('q',`ch ${channel}`);
 if(finite(input.maxAgeHours)&&Number(input.maxAgeHours)>0)params.set('since',String(Math.floor(now/60_000)*60-Math.min(720,Number(input.maxAgeHours))*3600));
 const stats=STATS.filter(k=>finite(input.stats?.[k])&&Number.isSafeInteger(Number(input.stats[k]))&&Math.abs(Number(input.stats[k]))<=9999).map(k=>`${k}:${Number(input.stats[k])}`);if(stats.length)params.set('stats',stats.join(','));
 return {params,page,size,localChannel:validChannel?channel:null,scope:{seller:seller||null,channel:validChannel?channel:null,channelScope:validChannel?'returned-page':null,stats:stats.length>0,ageHours:finite(input.maxAgeHours)?Number(input.maxAgeHours):null}};
}
export function normalizeCozyHistory(raw,item,now=Date.now()){
 if(!Array.isArray(raw?.chart))throw new Error('Cozy 가격 이력 형식을 확인하지 못했습니다.');
 return dedupeQuotes(raw.chart.slice(0,5000).flatMap(row=>{const at=epoch(row.at,now);if(!at||!finite(row.unit_price)||Number(row.unit_price)<=0)return [];const q=normalizeQuote({id:`chart-${item.localId}-${stableHash([row.at,row.unit_price,row.sold,row.stats,row.shop,row.channel,row.fm_room])}`,itemId:item.itemId,itemName:item.name,type:row.sold?'sold':'sell',price:Number(row.unit_price),at,quantityKnown:false,options:normalizeOptions({...(row.stats??{}),attack:row.stats?.watk??row.stats?.attack,magicAttack:row.stats?.matk??row.stats?.magicAttack,accuracy:row.stats?.acc??row.stats?.accuracy}),optionsComplete:false,isEquipment:item.isEquipment,sourceUrl:`${COZY_ORIGIN}/items/${item.localId}`,observationMethod:'screen-ocr-chart-row',providerItemId:String(item.localId)}, {id:'cozy-chart',name:'Cozy Market · 상점 관찰 이력'},now);return q?[q]:[];}));
}
const finite=v=>v!==''&&v!=null&&Number.isFinite(Number(v));
const epoch=(v,now=Date.now())=>{if(!finite(v)||Number(v)<=0)return null;const ms=Number(v)*(Number(v)>1e11?1:1000);return Number.isFinite(ms)&&ms<=now+300_000&&ms<8640000000000000?new Date(ms).toISOString():null;};
export function cozyCatalog(raw){
 if(!Array.isArray(raw?.items))throw new Error('Cozy 아이템 목록 형식을 확인하지 못했습니다.');
 return raw.items.filter(i=>Number.isSafeInteger(Number(i.id))&&String(i.info?.iconKey??'').match(/^\d{1,10}$/)&&typeof i.name==='string').map(i=>({localId:Number(i.id),itemId:String(i.info.iconKey),name:i.name.slice(0,160),category:String(i.info.type??''),subCategory:String(i.info.subtype??''),isEquipment:(Number(i.info.iconKey)>=1_000_000&&Number(i.info.iconKey)<2_000_000)||/equip|weapon|armor|accessory/i.test(String(i.info.type??''))}));
}
export function normalizeCozyPrices(raw,catalog,now=Date.now()){
 if(!Array.isArray(raw?.cozy))throw new Error('Cozy 가격 응답 형식을 확인하지 못했습니다.');
 const byId=new Map(catalog.map(i=>[Number(i.localId),i])),quotes=[],summaries=[];let newest=null;
 for(const row of raw.cozy){
  const item=byId.get(Number(row.item_id));if(!item)continue;
  const lastSoldAt=epoch(row.last_sold_at,now),lowAt=epoch(row.low_at,now);
  if(lastSoldAt&&(!newest||lastSoldAt>newest))newest=lastSoldAt;
  const base={...item,sourceUrl:`${COZY_ORIGIN}/items/${item.localId}`,source:'Cozy Market · 직접 화면 관찰',sourceId:'cozy'};
  summaries.push({...base,usual:finite(row.usual)&&Number(row.usual)>0?Number(row.usual):null,basis:['sold','day','week'].includes(row.basis)?row.basis:null,listedMedian:finite(row.listed_median)?Number(row.listed_median):null,soldMedian:finite(row.sold_median)?Number(row.sold_median):null,saleCount:finite(row.sales)?Number(row.sales):0,listingCount:finite(row.listings)?Number(row.listings):0,lastSold:finite(row.last_sold)?Number(row.last_sold):null,lastSoldAt,lowestAsk:finite(row.low)?Number(row.low):null,lowestAskAt:lowAt,lowStock:finite(row.low_stock)?Number(row.low_stock):null,lowSeller:typeof row.low_shop==='string'?row.low_shop.slice(0,80):'',lowChannel:finite(row.low_channel)?Number(row.low_channel):null,lowRoom:finite(row.low_fm_room)?Number(row.low_fm_room):null,lowMap:typeof row.low_map==='string'?row.low_map.slice(0,120):'',trend:typeof row.trend==='string'?row.trend:null,trendPercent:finite(row.trend_pct)?Number(row.trend_pct):null});
  // A median is an aggregate, not an individual sale. Only the explicit last
  // sold row and its observation timestamp enter the recommendation price set.
  if(finite(row.last_sold)&&Number(row.last_sold)>0&&lastSoldAt){
   const quote=normalizeQuote({id:`last-sale-${item.localId}`,itemId:item.itemId,itemName:item.name,type:'sold',price:Number(row.last_sold),quantity:1,at:lastSoldAt,sourceUrl:base.sourceUrl,options:{},optionsComplete:false,verification:'reported',isEquipment:item.isEquipment,catalogCategory:item.category,providerItemId:String(item.localId),observationMethod:'screen-ocr-sold-row',quantityKnown:false}, {id:'cozy',name:'Cozy Market · 마지막 판매 관찰'},now);
   if(quote)quotes.push(quote);
  }
 }
 return {quotes:dedupeQuotes(quotes),summaries,sourceUpdatedAt:newest};
}
export function normalizeCozySightings(raw,item,now=Date.now()){
 if(!Array.isArray(raw?.rows))throw new Error('Cozy 매물 응답 형식을 확인하지 못했습니다.');
 return dedupeQuotes(raw.rows.map(row=>{
  if(row.confirmed!==true)return null;
  const at=epoch(row.at,now),qty=Number(row.qty),price=Number(row.price),unit=Number(row.unit_price);
  if(!at||!Number.isSafeInteger(qty)||qty<1||!finite(row.price)||price<=0||!finite(row.unit_price)||Math.abs(price/qty-unit)>Math.max(.01,unit*.001))return null;
  const stats=row.stats&&typeof row.stats==='object'?row.stats:{};
  const options=normalizeOptions({attack:stats.watk??stats.attack??stats.watt,magicAttack:stats.matk??stats.magicAttack??stats.matt,str:stats.str,dex:stats.dex,int:stats.int,luk:stats.luk,accuracy:stats.acc??stats.accuracy,slots:stats.slots??stats.upgrades});
  const q=normalizeQuote({id:`sighting-${item.localId}-${stableHash([row.shop,row.channel,row.fm_room,price,qty,row.sold,options])}`,itemId:item.itemId,itemName:item.name,type:row.sold?'sold':'sell',price,quantity:qty,priceBasis:qty>1?'bundle':'unit',at,sourceUrl:`${COZY_ORIGIN}/items/${item.localId}`,options,optionsComplete:false,seller:row.shop,channel:row.channel,location:[row.map_name,row.fm_room!=null?`FM ${row.fm_room}`:''].filter(Boolean).join(' · '),verification:'reported',isEquipment:item.isEquipment,catalogCategory:item.category,providerItemId:String(item.localId),observationMethod:'screen-ocr-shop-row',stock:row.stock,quantityKnown:true}, {id:'cozy-listings',name:'Cozy Market · 상점 화면 관찰'},now);
  return q;
 }).filter(Boolean));
}
export function createCozyReader({fetchFn=fetch,clock=Date.now,intervalSeconds=60}={}){
 let catalogCache=null,cache=null,pending=null,retryAt=0,failures=0;const itemCache=new Map(),itemPending=new Map();
 async function json(path){if(clock()<retryAt){const error=new Error('Cozy 요청 재시도 대기 중');error.retryAfter=Math.ceil((retryAt-clock())/1000);throw error;}const response=await fetchFn(COZY_ORIGIN+path,{headers:{Accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(12_000)});if(!response.ok){const error=new Error(`Cozy HTTP ${response.status}`);error.status=response.status;const retryValue=response.headers.get('retry-after');error.retryAfter=Number(retryValue)||Math.max(0,(Date.parse(retryValue)-clock())/1000)||0;if(response.status===429)retryAt=clock()+Math.max(intervalSeconds,error.retryAfter)*1000;throw error;}if(Number(response.headers.get('content-length'))>6_000_000)throw new Error('Cozy 응답 용량 초과');return response.json();}
 async function catalog(){if(catalogCache&&clock()-catalogCache.at<24*3600_000)return catalogCache.items;const items=cozyCatalog(await json('/api/catalog'));catalogCache={items,at:clock()};return items;}
 function result(extra={}){const now=clock();return {provider:{id:'cozy',name:'Cozy Market · 직접 화면 관찰',configured:true,status:cache?'connected':'backoff',message:''},quotes:cache?.quotes??[],summaries:cache?.summaries??[],sourceUpdatedAt:cache?.sourceUpdatedAt??null,fetchedAt:cache?.fetchedAt??null,intervalSeconds,nextPollAt:new Date(Math.max(retryAt,(cache?.checkedAt??now)+intervalSeconds*1000)).toISOString(),stale:!cache||now-cache.checkedAt>intervalSeconds*2000,...extra};}
 async function read(){const now=clock();if(now<retryAt)return result({provider:{id:'cozy',name:'Cozy Market · 직접 화면 관찰',configured:true,status:'backoff',message:'공급원 연결 지연 · 마지막 관찰 시각을 확인해 주세요.'}});if(cache&&now-cache.checkedAt<intervalSeconds*1000)return result({cached:true});if(pending)return pending;
  pending=(async()=>{try{const items=await catalog(),data=normalizeCozyPrices(await json('/api/cozy-prices'),items,clock());cache={...data,fetchedAt:new Date(clock()).toISOString(),checkedAt:clock()};failures=0;retryAt=0;return result();}catch(error){failures++;retryAt=clock()+Math.min(3600,Math.max(intervalSeconds,30*2**Math.min(failures,7),error.retryAfter||0))*1000;return result({provider:{id:'cozy',name:'Cozy Market · 직접 화면 관찰',configured:true,status:'backoff',message:'Cozy 가격을 새로 확인하지 못했습니다. 저장된 관찰 시각을 참고해 주세요.'}});}finally{pending=null;}})();return pending;
 }
 async function findItem(gameId){if(!/^\d{1,10}$/.test(String(gameId)))throw new Error('아이템 ID를 확인해 주세요.');const items=await catalog(),matches=items.filter(i=>i.itemId===String(gameId));if(matches.length!==1)throw new Error('공급원에서 이 아이템의 고유 항목을 찾지 못했습니다.');return matches[0];}
 async function cachedItem(key,load){const hit=itemCache.get(key);if(hit&&(clock()-hit.at<intervalSeconds*1000||clock()<retryAt))return {...hit.value,cached:true,stale:clock()-hit.at>=intervalSeconds*1000};if(itemPending.has(key))return itemPending.get(key);const work=(async()=>{try{const value=await load();itemCache.set(key,{at:clock(),value});while(itemCache.size>60)itemCache.delete(itemCache.keys().next().value);return value;}catch(error){if(!error.status||error.status>=500)retryAt=Math.max(retryAt,clock()+intervalSeconds*1000);if(hit)return {...hit.value,stale:true,error:'공급원 갱신 지연 · 마지막 정상 관찰을 표시합니다.'};throw error;}})();itemPending.set(key,work);try{return await work;}finally{itemPending.delete(key);}}
 async function sightings(gameId,options={}){
  const item=await findItem(gameId),query=cozySightingQuery(options,clock()),key=item.localId+'?'+query.params;
  const value=await cachedItem(key,async()=>{const raw=await json(`/api/items/${item.localId}/sightings?${query.params}`),sourcePages=Math.max(1,Number(raw.pages)||1);return {item,quotes:normalizeCozySightings(raw,item,clock()),total:Number(raw.total)||0,page:query.page,pages:Math.min(COZY_MAX_PAGE,sourcePages),sourcePages,pagingLimited:sourcePages>COZY_MAX_PAGE,maxPage:COZY_MAX_PAGE,size:query.size,fetchedAt:new Date(clock()).toISOString(),sourceUrl:`${COZY_ORIGIN}/items/${item.localId}`};});
  const direction=query.params.get('dir')==='asc'?1:-1,sort=query.params.get('sort');const quotes=value.quotes.filter(q=>(!query.localChannel||Number(q.channel)===query.localChannel)&&(!query.scope.ageHours||clock()-Date.parse(q.at)<=query.scope.ageHours*3600_000)).sort((a,b)=>direction*(sort==='unit_price'?a.unitPrice-b.unitPrice:sort==='price'?a.minimumPurchaseTotal-b.minimumPurchaseTotal:a.at.localeCompare(b.at)));
  return {...value,quotes,scope:query.scope,sourceRows:value.quotes.length};
 }
 async function history(gameId,{days=7}={}){const item=await findItem(gameId),value=await cachedItem(`history:${item.localId}`,async()=>{const raw=await json(`/api/items/${item.localId}`);return {item,quotes:normalizeCozyHistory(raw,item,clock()),fetchedAt:new Date(clock()).toISOString(),sourceCount:raw.chart.length,sourceUrl:`${COZY_ORIGIN}/items/${item.localId}`};});const period=Number(days)===30?30:7,quotes=value.quotes.filter(q=>clock()-Date.parse(q.at)<=period*86400_000).slice(0,2000);return {...value,quotes,coverage:{requestedDays:period,returned:quotes.length,maxPoints:2000,sourceLimited:value.sourceCount>=2000,oldestAt:quotes.at(-1)?.at??null,newestAt:quotes[0]?.at??null}};}

 return {read,sightings,history};
}
export const defaultCozyReader=createCozyReader();
