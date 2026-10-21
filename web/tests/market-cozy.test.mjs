import test from 'node:test';
import assert from 'node:assert/strict';
import {cozyCatalog,normalizeCozyPrices,normalizeCozySightings,createCozyReader,cozySightingQuery,normalizeCozyHistory}from'../lib/market-cozy.mjs';
import {normalizeQuote,toPriceRecord}from'../lib/market-core.mjs';
const NOW=Date.parse('2026-10-21T12:00:00Z'),sec=(ago=0)=>(NOW-ago)/1000;
const rawCatalog={items:[{id:414,name:'Iron Ore',info:{iconKey:'4010001',type:'Etc'}},{id:1368,name:'Squishy Shoes',info:{iconKey:'1072128',type:'Armor'}},{id:3,name:'Cape',info:{iconKey:'1102000',type:'Accessory'}},{id:4,name:'Sword',info:{iconKey:'1302000',type:'Equip'}}]};
const catalog=cozyCatalog(rawCatalog),item=catalog[0];
const price=(extra={})=>({item_id:414,usual:449,basis:'sold',sold_median:449,last_sold:359,last_sold_at:sec(60_000),low:99,low_at:sec(20*3600_000),low_stock:30,sales:23,listings:319,...extra});
const sighting=(extra={})=>({at:sec(30_000),qty:5,stock:300,price:1000,unit_price:200,confirmed:true,sold:false,stats:null,shop:'TestShop',channel:18,fm_room:3,map_name:'Free Market <3>',...extra});
test('provider local IDs map through WZ IDs, including armor and accessories',()=>{
 assert.equal(item.itemId,'4010001');assert.equal(item.isEquipment,false);
 assert.ok(catalog.slice(1).every(i=>i.isEquipment));
});
test('aggregate median and old lowest ask cannot become a fresh individual sale',()=>{
 const result=normalizeCozyPrices({cozy:[price()]},catalog,NOW);
 assert.equal(result.quotes.length,1);const q=result.quotes[0];
 assert.equal(q.itemId,'4010001');assert.equal(q.price,359);assert.equal(q.at,new Date(NOW-60_000).toISOString());
 assert.equal(q.quantityKnown,false);assert.equal(q.observationMethod,'screen-ocr-sold-row');
 assert.equal(result.summaries[0].usual,449);assert.equal(result.summaries[0].lowestAskAt,new Date(NOW-20*3600_000).toISOString());
 assert.equal(result.sourceUpdatedAt,q.at);
});
test('only the own Cozy feed is accepted and untimed or future prices stay out of recommendations',()=>{
 assert.throws(()=>normalizeCozyPrices({fm:[price()]},catalog,NOW));
 const r=normalizeCozyPrices({cozy:[price({last_sold_at:null}),price({last_sold_at:sec(-3600_000)}),price({item_id:9999})]},catalog,NOW);
 assert.equal(r.quotes.length,0);assert.equal(r.summaries.length,2);assert.equal(r.sourceUpdatedAt,null);
});
test('sightings preserve bundle minimum, stock and original observation time after storage',()=>{
 const q=normalizeCozySightings({rows:[sighting()]},item,NOW)[0],stored=toPriceRecord(q),restored=normalizeQuote(stored,{},NOW);
 assert.equal(q.price,1000);assert.equal(q.unitPrice,200);assert.equal(q.minimumPurchaseQuantity,5);assert.equal(q.minimumPurchaseTotal,1000);assert.equal(q.stock,300);
 assert.equal(restored.unitPrice,200);assert.equal(restored.minimumPurchaseTotal,1000);assert.equal(restored.quantityKnown,true);
 assert.equal(q.at,new Date(NOW-30_000).toISOString());
});
test('unconfirmed or inconsistent rows are rejected and rescans do not generate new identities',()=>{
 assert.equal(normalizeCozySightings({rows:[sighting({confirmed:false}),sighting({unit_price:123}),sighting({qty:0})]},item,NOW).length,0);
 const a=normalizeCozySightings({rows:[sighting()]},item,NOW)[0],b=normalizeCozySightings({rows:[sighting({at:sec(1000)})]},item,NOW)[0];
 assert.equal(a.id,b.id);
 const gear=normalizeCozySightings({rows:[sighting({qty:1,price:1000,unit_price:1000})]},catalog[1],NOW)[0];
 assert.equal(gear.isEquipment,true);assert.deepEqual(gear.options,{});assert.equal(gear.optionsComplete,false);
});
test('reader caches 60 seconds, coalesces callers and backs off on actual rate limits',async()=>{
 let now=NOW,calls=[],limited=false;
 const fetchFn=async url=>{calls.push(new URL(url).pathname);if(limited)return new Response('{}',{status:429,headers:{'retry-after':'300'}});return Response.json(url.endsWith('/api/catalog')?rawCatalog:url.includes('/sightings?')?{rows:[sighting()],page:1,pages:1,total:1,size:30}:{cozy:[price()]});};
 const reader=createCozyReader({fetchFn,clock:()=>now});
 const [a,b]=await Promise.all([reader.read(),reader.read()]);assert.equal(a.quotes.length,1);assert.equal(b.quotes.length,1);assert.deepEqual(calls,['/api/catalog','/api/cozy-prices']);
 await reader.read();assert.equal(calls.length,2);
 await reader.sightings('4010001');await reader.sightings('4010001');assert.equal(calls.length,3);
 now+=61_000;limited=true;const stale=await reader.read();assert.equal(stale.provider.status,'backoff');assert.equal(stale.quotes[0].at,a.quotes[0].at);assert.equal(stale.intervalSeconds,60);
 const n=calls.length;await reader.read();await reader.sightings('4010001');assert.equal(calls.length,n,'rate-limited source is not requested again');
 now+=301_000;limited=false;const recovered=await reader.read();assert.equal(recovered.provider.status,'connected');assert.equal(calls.filter(p=>p==='/api/catalog').length,1,'catalog retained for 24 hours');
});

test('source sorting and age/stat/search filters are bounded and never silently claim combined channel coverage',()=>{
 const {params,localChannel,scope}=cozySightingQuery({page:999,size:999,sort:'price',dir:'asc',seller:'Shop',channel:18,maxAgeHours:1,stats:{watk:5,slots:0,secret:7}},NOW);
 assert.equal(params.get('page'),'100');assert.equal(params.get('size'),'50');assert.equal(params.get('sort'),'price');assert.equal(params.get('q'),'Shop');assert.equal(params.get('since'),String(NOW/1000-3600));assert.equal(params.get('stats'),'watk:5,slots:0');assert.equal(localChannel,18);assert.equal(scope.channelScope,'returned-page');
 assert.equal(cozySightingQuery({channel:18,sort:'unit_price'},NOW).params.get('q'),'ch 18');
});
test('actual source chart keeps unit prices and observation types without importing Nia aggregate fields',()=>{
 const points=normalizeCozyHistory({fm:999,meow:9999,chart:[{at:sec(10_000),unit_price:.3,sold:false},{at:sec(20_000),unit_price:4,sold:true},{at:sec(-86400_000),unit_price:999}]},item,NOW);
 assert.equal(points.length,2);assert.equal(points[0].unitPrice,.3);assert.equal(points[0].type,'sell');assert.equal(points[1].type,'sold');assert.ok(points.every(p=>p.quantityKnown===false));
});
test('paging cap is returned explicitly and failed detail refresh retains last real data',async()=>{
 let now=NOW,fail=false;const reader=createCozyReader({clock:()=>now,fetchFn:async url=>{if(fail)throw Error('offline');return Response.json(url.endsWith('/api/catalog')?rawCatalog:{rows:[sighting()],total:5000,page:100,pages:167,size:30});}});
 const first=await reader.sightings('4010001',{page:999});assert.equal(first.page,100);assert.equal(first.pages,100);assert.equal(first.sourcePages,167);assert.equal(first.pagingLimited,true);
 now+=61_000;fail=true;const stale=await reader.sightings('4010001',{page:999});assert.equal(stale.quotes[0].at,first.quotes[0].at);assert.equal(stale.stale,true);assert.ok(stale.error);
});

test('failed item requests back off the shared source instead of serially timing out every watch',async()=>{
 let calls=0;const reader=createCozyReader({clock:()=>NOW,fetchFn:async url=>{calls++;if(url.endsWith('/api/catalog'))return Response.json(rawCatalog);throw Error('network unavailable');}});
 await assert.rejects(reader.sightings('4010001'));await assert.rejects(reader.sightings('1072128'));assert.equal(calls,2,'one catalog and one failed upstream request');
});
