import test from'node:test';
import assert from'node:assert/strict';
import{DatabaseSync}from'node:sqlite';
import{readFileSync}from'node:fs';
import{createMarketStore,marketObservationRows,mergeMarketHistory,readStoredCozy}from'../lib/market-store.mjs';
import{normalizeQuote}from'../lib/market-core.mjs';
import{selectWatchBatch}from'../lib/market-watch.mjs';
import{collectPublicMarket,publicMarketCollectionStatus}from'../lib/market-collection.mjs';
const NOW=Date.parse('2026-10-21T12:00:00Z');
function database(){
 const sql=new DatabaseSync(':memory:');
 sql.exec(readFileSync(new URL('../drizzle/0003_faulty_cammi.sql',import.meta.url),'utf8'));
 const db={prepare(query){
  const statement=sql.prepare(query);
  return {bind(...args){return {
   async first(){return statement.get(...args);},
   async all(){return {results:statement.all(...args)};},
   async run(){return {meta:statement.run(...args)};}
  };}};
 }};
 return {sql,db};
}
const quote=(extra={})=>normalizeQuote({id:'sale',itemId:'4010001',type:'sold',price:0.3,at:new Date(NOW-30_000).toISOString(),sourceId:'cozy',quantityKnown:false,...extra},{},NOW);
test('watch batches fairly cover every unique enabled ID beyond six',()=>{
 const watches=Array.from({length:15},(_,i)=>({id:String(i),itemId:String(4000000+i)}));watches.push({...watches[0]},{query:'ore'},{itemId:'999',enabled:false});
 let cursor=0,seen=new Set();for(let i=0;i<3;i++){const batch=selectWatchBatch(watches,cursor);assert.equal(batch.ids.length,6);assert.equal(batch.totalItems,15);assert.equal(batch.queryOnly,1);batch.ids.forEach(id=>seen.add(id));cursor=batch.nextCursor;}
 assert.equal(seen.size,15);assert.deepEqual(selectWatchBatch([],0).ids,[]);
});
test('durable snapshot lease excludes concurrent collectors and survives fresh reader instances',async()=>{
 const {db}=database();let now=NOW;const a=createMarketStore(db,{clock:()=>now}),b=createMarketStore(db,{clock:()=>now});
 assert.equal(await a.claim(),true);assert.equal(await b.claim(),false);
 const payload={provider:{id:'cozy',configured:true,status:'connected'},quotes:[quote()],summaries:[],fetchedAt:new Date(NOW).toISOString(),sourceUpdatedAt:quote().at,nextPollAt:new Date(NOW+60_000).toISOString()};
 await a.saveSnapshot(payload);const recovered=await readStoredCozy({read(){throw Error('should use durable cache');}},b,now);assert.equal(recovered.quotes[0].price,.3);assert.equal(recovered.storageStatus,'connected');
 now+=61_000;const offline=await readStoredCozy({async read(){return {provider:{status:'backoff'},quotes:[],fetchedAt:null,nextPollAt:new Date(now+120_000).toISOString()};}},createMarketStore(db,{clock:()=>now}),now);
 assert.equal(offline.provider.status,'backoff');assert.equal(offline.quotes[0].at,quote().at);assert.equal(offline.stale,true);
});
test('JSON_each ingestion deduplicates exact observations and retains units, bundle and unknown quantity',async()=>{
 const {db,sql}=database(),store=createMarketStore(db,{clock:()=>NOW});
 const bundle=quote({id:'ask',sourceId:'cozy-listings',type:'sell',price:1000,quantity:5,priceBasis:'bundle',quantityKnown:true,seller:'must not be stored'});
 const rows=marketObservationRows([quote(),bundle]);assert.ok(rows.every(r=>!('seller'in r)&&!('ownerId'in r)));
 await store.record([quote(),bundle]);await store.record([quote(),bundle]);assert.equal(sql.prepare('SELECT count(*) n FROM market_observations').get().n,2);
 const history=await store.history('4010001',7),sale=history.find(q=>q.type==='sold'),ask=history.find(q=>q.type==='sell');assert.equal(sale.unitPrice,.3);assert.equal(sale.quantityKnown,false);assert.equal(ask.unitPrice,200);assert.equal(ask.minimumPurchaseQuantity,5);assert.equal(ask.minimumPurchaseTotal,1000);
 const old=quote({id:'old',at:new Date(NOW-31*86400_000).toISOString()});await createMarketStore(db,{clock:()=>NOW}).record([old]);assert.equal(sql.prepare('SELECT count(*) n FROM market_observations').get().n,2);
});
test('source chart and durable duplicates form one point while asks and sales remain separate',()=>{
 const a=quote(),copy={...a,id:'chart-different',sourceId:'cozy-chart'},ask={...a,type:'sell'};
 assert.equal(mergeMarketHistory([a],[copy,ask]).length,2);
});
test('unattended collection persists and reads back evidence without a signed-in profile',async()=>{
 const {db}=database(),now=Date.now();let calls=0;
 const observation=quote({at:new Date(now-1000).toISOString()});
 const payload={provider:{status:'connected'},quotes:[observation],fetchedAt:new Date(now).toISOString(),sourceUpdatedAt:observation.at,nextPollAt:new Date(now+60000).toISOString()};
 const reader={async read(){calls++;return payload;}};
 const first=await collectPublicMarket(reader,db),second=await collectPublicMarket(reader,db),readback=await publicMarketCollectionStatus(db);
 assert.equal(first.history.rows,1);assert.equal(second.history.rows,1);assert.equal(calls,1);
 assert.equal(readback.fetchedAt,payload.fetchedAt);assert.equal(readback.sourceUpdatedAt,observation.at);
 assert.equal(readback.storageStatus,'connected');assert.equal(readback.history.rows,1);
});

test('simultaneous cold collectors honor the SQLite lease without duplicate upstream calls',async()=>{
 const {db}=database(),storeA=createMarketStore(db,{clock:()=>NOW}),storeB=createMarketStore(db,{clock:()=>NOW});
 let release,calls=0;const gate=new Promise(resolve=>{release=resolve;});
 const payload={provider:{id:'cozy',status:'connected'},quotes:[quote()],summaries:[],fetchedAt:new Date(NOW).toISOString(),sourceUpdatedAt:quote().at,nextPollAt:new Date(NOW+60_000).toISOString()};
 const reader={async read(){calls++;await gate;return payload;}};
 const a=readStoredCozy(reader,storeA,NOW),b=readStoredCozy(reader,storeB,NOW),waiting=await Promise.race([a,b]);
 assert.equal(calls,1);assert.equal(waiting.provider.status,'loading');assert.deepEqual(waiting.quotes,[]);assert.equal(waiting.fetchedAt,null);assert.equal(waiting.sourceUpdatedAt,null);assert.equal(waiting.cached,false);assert.equal(waiting.nextPollAt,new Date(NOW+5000).toISOString());
 release();const completed=await Promise.all([a,b]);assert.equal(calls,1);assert.equal(completed.filter(r=>r.fetchedAt===payload.fetchedAt).length,1);assert.equal((await storeA.snapshot()).payload.quotes.length,1);
});
