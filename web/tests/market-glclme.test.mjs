import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeGlclmeSummary,normalizeGlclmeDetail,normalizeGlclmeStats,glclmeTime,glclmeOptionLabel,createGlclmeReader} from '../lib/market-glclme.mjs';
const fixture=JSON.parse(await readFile(new URL('./fixtures/glclme-contract.json',import.meta.url),'utf8'));
const catalog=[{id:'4010001',name:'강철의 원석',en:'Iron Ore'},{id:'1082002',name:'작업용 장갑',en:'Work Gloves',category:'Equip'}];
test('public parser six-value statistics preserve every field rather than coercing arrays to null',()=>{
 const d=normalizeGlclmeSummary(fixture.summary,catalog),r=d.rows[0];
 assert.equal(r.sell,450);assert.equal(r.buy,350);assert.deepEqual(r.sellStats,{median:450,q1:425,q3:475,low:400,high:499,sampleCount:3});assert.equal(r.buyStats.sampleCount,6);assert.equal(r.reference,400);assert.equal(r.sampleCount,9);
 assert.deepEqual(r.history[0],{date:'2026-10-20',sellMedian:400,sellCount:2,buyMedian:300,buyCount:4});
});
test('option variant statistics and reported-completed counts stay separate',()=>{
 const r=normalizeGlclmeSummary(fixture.summary,catalog).rows[1];assert.equal(r.sourceKind,'board');assert.equal(r.equipment,true);assert.equal(r.optionKind,'c');assert.equal(r.optionLabel,'노작');assert.equal(r.variants.length,2);assert.equal(r.variants[1].key,'u1|a2');assert.equal(r.variants[1].label,'+1 · 공 2');assert.equal(r.variants[1].sellStats.median,250000);assert.equal(r.variants[1].soldCount,2);assert.equal(glclmeOptionLabel('future-format'),'future-format');
});
test('unknown provider IDs never become arbitrary game items; absent times remain absent',()=>{
 const d=normalizeGlclmeSummary(fixture.summary,catalog);assert.equal(d.rows[2].itemId,null);assert.equal(d.unmapped,1);assert.equal(d.rows[2].lastObservedAt,null);assert.equal(d.rows[2].sell,null);
});
test('source milliseconds preserve exact event time, and supported seconds are not double-multiplied',()=>{
 const expected=new Date(1792572623900).toISOString();assert.equal(glclmeTime(1792572623900),expected);assert.equal(glclmeTime(1792572623.9),expected);assert.equal(glclmeTime(expected),expected);assert.equal(glclmeTime(null),null);assert.equal(glclmeTime([]),null);assert.equal(glclmeTime(true),null);
});
test('malformed stats and numeric coercion traps never manufacture prices',()=>{
 for(const v of [450,[450],true,{},[450,425,475,400,499],[0,0,0,0,0,3],[450,425,475,400,499,-1]])assert.equal(normalizeGlclmeStats(v),null);
 const d=normalizeGlclmeSummary({items:[{id:'1',s:[450],b:true,t:[],n:{}}]});assert.equal(d.rows[0].sell,null);assert.equal(d.rows[0].buy,null);assert.equal(d.rows[0].reference,null);assert.equal(d.rows[0].sampleCount,null);
});
test('detail keeps source option/completed flags and exact timestamps without inventing quantity',()=>{
 const d=normalizeGlclmeDetail(fixture.detail,'1082002');assert.equal(d.quotes.length,2);assert.equal(d.quotes[0].optionKey,'u1|a2');assert.equal(d.quotes[0].sold,true);assert.equal(d.quotes[0].quantityKnown,false);assert.equal(d.quotes[0].at,new Date(1792570000000).toISOString());assert.equal(d.row.variants[0].soldCount,2);
});
test('detail identity mismatch and unknown quote sides cannot enter a price series',()=>{
 assert.throws(()=>normalizeGlclmeDetail({row:{id:'2'},quotes:[]},'1'));
 const d=normalizeGlclmeDetail({row:{id:'1'},quotes:[{side:'s',price:5,at:1792560000},{side:'other',price:4,at:1792560000},{side:'buy',price:4,at:null}]},'1');assert.equal(d.quotes.length,1);assert.equal(d.quotes[0].type,'sell');
});
test('403 prevents repeated requests for 15 minutes and never manufactures data',async()=>{
 let calls=0,now=1792560000000;const read=createGlclmeReader({clock:()=>now,fetchFn:async()=>{calls++;return new Response('Forbidden',{status:403});}});
 const first=await read();assert.equal(first.provider.httpStatus,403);assert.equal(first.data,null);assert.equal(first.stale,true);now+=60_000;await read();assert.equal(calls,1);now+=15*60_000;await read();assert.equal(calls,2);
});
test('403 and network failure retain last good source data and original fetch time',async()=>{
 for(const forbidden of [true,false]){let now=1792560000000,calls=0;const read=createGlclmeReader({clock:()=>now,fetchFn:async()=>{if(calls++){if(forbidden)return new Response('Forbidden',{status:403});throw Error('network');}return Response.json(fixture.summary);}});
 const first=await read();now+=61_000;const next=await read();assert.deepEqual(next.data,first.data);assert.equal(next.fetchedAt,first.fetchedAt);assert.equal(next.stale,true);}
});
test('source stale/ready flags survive connected, cached and 304 envelopes',async()=>{
 for(const flags of [{stale:true,ready:true},{stale:false,ready:false}]){let now=1792560000000,calls=0;const read=createGlclmeReader({clock:()=>now,fetchFn:async()=>calls++?new Response(null,{status:304}):Response.json({...fixture.summary,...flags},{headers:{etag:'test'}})});
 const first=await read(),cached=await read();now+=61_000;const unchanged=await read();for(const v of [first,cached,unchanged]){assert.equal(v.stale,true);assert.equal(v.ready,flags.ready);assert.equal(v.data.ready,flags.ready);assert.equal(v.data.stale,flags.stale);assert.equal(v.fetchedAt,first.fetchedAt);}}
});
test('60 second cache uses fixed item endpoint and ETag, respecting Retry-After',async()=>{
 let calls=0,now=1792560000000;const seen=[];const read=createGlclmeReader({clock:()=>now,fetchFn:async(url,options)=>{seen.push({url,options});calls++;return calls===1?Response.json(fixture.detail,{headers:{etag:'detail-v1'}}):new Response(null,{status:429,headers:{'Retry-After':'180'}});}});
 await read('1082002');now+=59_000;await read('1082002');assert.equal(calls,1);now+=2000;const failed=await read('1082002');assert.equal(seen[1].options.headers['If-None-Match'],'detail-v1');assert.equal(seen[0].url,'https://xn--bj0bv7uo4la196f.com/api/prices?item=1082002');assert.equal(Date.parse(failed.nextPollAt),now+180_000);await assert.rejects(()=>read('https://elsewhere'));
});
test('concurrent requests never borrow a pending Worker request Promise',async()=>{
 let release,calls=0;const gate=new Promise(resolve=>release=resolve);
 const read=createGlclmeReader({fetchFn:async()=>{calls++;await gate;return Response.json({items:[]});}});
 const first=read(),second=await read();assert.equal(second.provider.status,'waiting');assert.equal(second.data,null);assert.equal(calls,1);
 release();assert.equal((await first).provider.status,'connected');assert.equal((await read()).provider.status,'cached');
});
