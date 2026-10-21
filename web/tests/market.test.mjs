import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuote, dedupeQuotes, comparableDeals, evaluateWatches, filterMarketQuotes, mergePriceHistory, parseMarketImport, quotesFromPosts, summarizeMarket,toPriceRecord } from '../lib/market-core.mjs';
import { createMarketConnector, feedConfig, parseRetryAfter } from '../lib/market-provider.mjs';
const NOW=Date.parse('2026-10-21T12:00:00Z');
const raw=(overrides={})=>({id:'one',itemId:'1000001',itemName:'모자',type:'sell',price:100,quantity:1,at:'2026-10-21T11:59:00Z',options:{attack:1,slots:5},...overrides});
const q=(overrides={})=>normalizeQuote(raw(overrides),{},NOW);
test('prices require real observation time, positive units and a valid evidence type',()=>{
 for(const overrides of [{price:0},{price:-1},{price:'NaN'},{quantity:1.5},{quantity:0},{type:'npc'},{at:null},{at:'not-a-date'},{at:'2026-10-22T00:00:00Z'}])assert.equal(q(overrides),null);
 assert.equal(q({options:{attack:'',slots:0}}).options.attack,undefined);
 assert.equal(q({options:{attack:'',slots:0}}).options.slots,0);
});
test('bundled prices require explicit basis and are normalized by quantity',()=>{
 assert.equal(q({price:500,quantity:5,priceBasis:'bundle'}).unitPrice,100);
 const bundle=q({price:500,quantity:5,priceBasis:'bundle'}),stored=toPriceRecord(bundle),restored=normalizeQuote(stored,{},NOW);
 assert.equal(stored.price,100);assert.equal(stored.originalPriceBasis,'bundle');assert.equal(stored.bundlePrice,500);assert.equal(stored.minimumPurchaseQuantity,5);assert.equal(stored.minimumPurchaseTotal,500);
 assert.equal(restored.unitPrice,100,'stored unit price is not divided again');assert.equal(restored.minimumPurchaseTotal,500);assert.equal(restored.minimumPurchaseQuantity,5);
 assert.equal(q({price:500,quantity:5}).unitPrice,500);
 assert.equal(q({price:500,quantity:5}).minimumPurchaseQuantity,1);
 assert.equal(q({priceBasis:'mystery'}),null);
});
test('repeated polling of same source record does not inflate sample counts',()=>{
 const rows=dedupeQuotes([q(),q(),q({at:'2026-10-21T11:59:30Z',price:110})]);
 assert.equal(rows.length,1);assert.equal(rows[0].price,110);
 assert.equal(dedupeQuotes([q(),normalizeQuote(raw(),{id:'other'},NOW)]).length,2);
});
test('price comparison separates attack and remaining upgrades',()=>{
 const deals=comparableDeals([q({optionsComplete:true}),q({id:'two',price:200,optionsComplete:true}),q({id:'different',price:50,options:{attack:1,slots:1},optionsComplete:true})],NOW);
 assert.equal(deals.length,2);assert.equal(deals[0].quote.price,100);assert.equal(deals[0].discount,.5);
 assert.equal(deals[1].comparisonPrice,null);
});
test('a lone ask cannot create an implied transaction price or discount',()=>{
 const stats=summarizeMarket([q()],NOW);assert.equal(stats.reference,null);assert.equal(stats.referenceType,'unknown');
 assert.equal(comparableDeals([q()],NOW)[0].discount,null);
});
test('reported completed trades and bid/ask midpoint stay distinguishable',()=>{
 const rows=[q(),q({id:'bid',type:'buy',price:80})];
 assert.equal(summarizeMarket(rows,NOW).reference,90);assert.equal(summarizeMarket(rows,NOW).referenceType,'midpoint');
 const stats=summarizeMarket([...rows,q({id:'sold',type:'sold',price:85})],NOW);assert.equal(stats.reference,85);assert.equal(stats.referenceType,'sold');
});
test('missing equipment options cannot satisfy a minimum options filter',()=>{
 const rows=[q(),q({id:'no-options',options:{},price:50}),q({id:'older',at:'2026-10-20T00:00:00Z'})];
 assert.deepEqual(filterMarketQuotes(rows,{minAttack:1,maxAgeHours:1},NOW).map(r=>r.id),['one']);
});
test('price watches trigger once per quote and changed price, excluding stale evidence',()=>{
 const watches=[{id:'watch',itemId:'1000001',maxPrice:100,maxAgeHours:1}];
 const first=evaluateWatches(watches,[q()],{},NOW);assert.equal(first.alerts.length,1);
 assert.equal(evaluateWatches(watches,[q()],first.seen,NOW).alerts.length,0);
 assert.equal(evaluateWatches(watches,[q({price:90})],first.seen,NOW).alerts.length,1);
 assert.equal(evaluateWatches(watches,[q({at:'2026-10-20T00:00:00Z'})],{},NOW).alerts.length,0);
});
test('own community prices skip closed and mixed-item shop bundles',()=>{
 const posts=[{id:'a',room:'r',kind:'sell',active:1,createdAt:'2026-10-21T11:59:00Z',payload:{title:'모자',itemId:'1000001',price:100,quantity:1,attack:1,slots:5}},{id:'b',kind:'shop',active:1,payload:{title:'혼합묶음',price:1}},{id:'c',kind:'buy',active:0,payload:{price:1}}];
 const rows=quotesFromPosts(posts,'우리',NOW);assert.equal(rows.length,1);assert.equal(rows[0].sourceId,'community:r');assert.equal(rows[0].options.attack,1);
 const shop=quotesFromPosts([{id:'shop',room:'r',kind:'shop',active:1,createdAt:'2026-10-21T11:59:00Z',payload:{title:'혼합 상점',price:9999,items:[{id:'x',itemId:'2000000',name:'빨간 포션',price:15,quantity:20},{id:'y',name:'파란 포션',price:30,quantity:0}]}}],'우리',NOW);assert.equal(shop.length,1);assert.equal(shop[0].price,15);assert.equal(shop[0].id,'shop:x');
});
test('import preserves past timestamps and rejects missing timestamp instead of fabricating fresh data',()=>{
 const rows=parseMarketImport('itemId,price,type,source,at,quantity\n2000000,5,sell,직접,2026-10-20T00:00:00Z,2',NOW);
 assert.equal(rows[0].at,'2026-10-20T00:00:00.000Z');assert.equal(rows[0].quantity,2);
 assert.throws(()=>parseMarketImport('2000000,5,sell,직접',NOW),/확인 시각/);
 assert.throws(()=>parseMarketImport('2000000,-1,sell,직접,2026-10-20T00:00:00Z',NOW));
});
test('history keeps price changes without counting repeated unchanged observations',()=>{
 const history=mergePriceHistory([q()],[q(),q({price:110,at:'2026-10-21T11:59:30Z'})],2000,NOW);assert.equal(history.length,2);
 assert.equal(mergePriceHistory([q()],[q({at:'2026-10-21T12:00:00Z'})],300,NOW).length,1,'same ad with unchanged price is not a new price history point');
});
test('configured feed accepts only explicitly allowed public HTTPS hosts with reuse confirmed',()=>{
 const env={MARKET_FEED_URL:'https://data.example.org/prices',MARKET_FEED_REUSE_ALLOWED:'true',MARKET_FEED_ALLOWED_HOSTS:'data.example.org'};
 assert.equal(feedConfig(env).enabled,true);
 for(const url of ['http://data.example.org/prices','https://localhost/data','https://127.0.0.1/data','https://169.254.169.254/data','https://10.0.0.1/data','https://[::1]/data','https://user:pass@data.example.org/data','https://other.example.org/data'])assert.equal(feedConfig({...env,MARKET_FEED_URL:url}).enabled,false);
 assert.equal(feedConfig({...env,MARKET_FEED_REUSE_ALLOWED:'false'}).enabled,false);
 assert.equal(feedConfig({...env,MARKET_FEED_MIN_INTERVAL_SECONDS:1}).intervalSeconds,30);
});
const config={enabled:true,id:'licensed-feed',url:'https://data.example.org/prices',name:'Test provider',token:'secret-in-memory',intervalSeconds:60};
test('connector coalesces concurrent refreshes and caches to provider interval',async()=>{
 let count=0,now=NOW;const requests=[];
 const read=createMarketConnector({clock:()=>now,fetchFn:async(url,options)=>{count++;requests.push(options);await new Promise(resolve=>setTimeout(resolve,5));return Response.json({quotes:[raw()],updatedAt:'2026-10-21T11:59:00Z'},{headers:{etag:'v1'}});}});
 const result=await Promise.all([read(config),read(config)]);assert.equal(count,1);assert.equal(result[0].quotes.length,1);assert.equal(result[1].quotes.length,1);
 await read(config);assert.equal(count,1);now+=61_000;await read(config);assert.equal(count,2);assert.equal(requests[1].headers['If-None-Match'],'v1');assert.equal(requests[0].redirect,'manual');
 assert.equal(JSON.stringify(result).includes('secret-in-memory'),false);assert.equal(JSON.stringify(result).includes(config.url),false);
});
test('connector respects 429 retry-after and keeps last good evidence marked stale',async()=>{
 let count=0,now=NOW;
 const read=createMarketConnector({clock:()=>now,fetchFn:async()=>{count++;return count===1?Response.json({quotes:[raw()]}):new Response(null,{status:429,headers:{'retry-after':'300'}});}});
 await read(config);now+=61_000;let result=await read(config);assert.equal(result.provider.status,'backoff');assert.equal(result.quotes.length,1);
 now+=200_000;result=await read(config);assert.equal(count,2);assert.equal(result.stale,true);assert.equal(result.provider.status,'backoff');
 now+=101_000;await read(config);assert.equal(count,3);
});
test('conditional 304 updates check time without fabricating new source observation time',async()=>{
 let count=0,now=NOW;const read=createMarketConnector({clock:()=>now,fetchFn:async()=>++count===1?Response.json({quotes:[raw()]},{headers:{etag:'v1'}}):new Response(null,{status:304})});
 const first=await read(config);now+=61_000;const second=await read(config);assert.equal(second.provider.status,'unchanged');assert.equal(first.quotes[0].at,second.quotes[0].at);assert.equal(first.sourceUpdatedAt,second.sourceUpdatedAt);
});
test('redirect, invalid row and oversized payload failures never expose secrets',async()=>{
 for(const response of [new Response(null,{status:302,headers:{location:'http://127.0.0.1'}}),Response.json({quotes:[{price:100}]}),new Response('x',{headers:{'content-length':'2000001'}})]){
  const result=await createMarketConnector({clock:()=>NOW,fetchFn:async()=>response})(config);assert.equal(result.provider.status,'backoff');assert.equal(result.quotes.length,0);assert.equal(JSON.stringify(result).includes(config.token),false);
 }
});
test('unconfigured provider is explicit and does not make a network call',async()=>{
 let calls=0;const result=await createMarketConnector({clock:()=>NOW,fetchFn:async()=>{calls++;throw new Error('never');}})(feedConfig({}));assert.equal(calls,0);assert.equal(result.provider.configured,false);assert.equal(result.stale,true);assert.equal(result.quotes.length,0);
});
test('retry-after accepts HTTP date and seconds',()=>{
 assert.equal(parseRetryAfter('120',NOW),120);assert.equal(parseRetryAfter('Wed, 21 Oct 2026 12:02:00 GMT',NOW),120);assert.equal(parseRetryAfter('invalid',NOW),0);
});

test('unknown equipment options never imply equivalent gear or a discount',()=>{
 const deals=comparableDeals([q({options:{},price:100}),q({id:'other',options:{},price:500}),q({id:'sold',options:{},type:'sold',price:900})],NOW);
 assert.equal(deals.length,2);assert.ok(deals.every(d=>d.discount===null&&d.comparisonCount===0));
});

test('saved option watches preserve stat requirements and reject unknown values',()=>{
 const rows=[q({id:'str',options:{str:3,dex:2}}),q({id:'low',options:{str:2,dex:2}}),q({id:'unknown',options:{}})];
 assert.deepEqual(filterMarketQuotes(rows,{minOptions:{str:3,dex:1}},NOW).map(q=>q.id),['str']);
});
