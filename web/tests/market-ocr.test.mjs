import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmOcrCandidate,mergeOcrCandidates,parseTradeLine,parseTradePrice,parseTradeText}from'../lib/market-ocr.mjs';
import {normalizeQuote}from'../lib/market-core.mjs';
const NOW=Date.parse('2026-10-21T12:00:00Z'),meta={observedAt:new Date(NOW).toISOString(),confidence:92,source:'screen'};
test('trade price units are numeric and positive without treating an equipment option as a price',()=>{
 assert.equal(parseTradePrice('1.5m'),1_500_000);assert.equal(parseTradePrice('500k'),500_000);assert.equal(parseTradePrice('1,500 mesos'),1500);assert.equal(parseTradePrice('1500메소'),1500);assert.equal(parseTradePrice('5atk'),null);assert.equal(parseTradePrice('0m'),null);assert.equal(parseTradePrice('abc'),null);
});
test('OCR extracts seller, direction, item and equipment options with original observation time',()=>{
 const row=parseTradeLine('PlayerA: S> Work Glove 5atk 1.5m each',meta);assert.equal(row.type,'sell');assert.equal(row.price,1_500_000);assert.equal(row.itemName,'Work Glove');assert.equal(row.options.attack,5);assert.equal(row.seller,'PlayerA');assert.equal(row.observedAt,meta.observedAt);assert.equal(row.reviewed,false);assert.equal(row.priceBasis,'unknown');
 const bid=parseTradeLine('PlayerB: WTB Red Potion 15 mesos each',meta);assert.equal(bid.type,'buy');assert.equal(bid.price,15);
 const ko=parseTradeLine('팝니다 장갑 1500메소',meta);assert.equal(ko.price,1500);assert.equal(ko.type,'sell');
});
test('multiple prices, bundles and low confidence require explicit review instead of picking an easy number',()=>{
 const multi=parseTradeLine('S> Work Glove c/o 1m a/w 2m',meta);assert.equal(multi.price,null);assert.ok(multi.issues.length>=2);
 const bundle=parseTradeLine('WTS potions bundle total 50k',meta);assert.ok(bundle.issues.some(i=>i.includes('묶음')));
 const low=parseTradeLine('S> Work Glove 1.5m',{...meta,confidence:40});assert.ok(low.issues.some(i=>i.includes('신뢰도')));
 assert.equal(parseTradeLine('Hello friends',meta),null);
});
test('the same screen line is deduplicated without replacing its first observation timestamp',()=>{
 const first=parseTradeText('S> Work Glove 1m\nS> Work Glove 1m',meta);assert.equal(first.length,1);
 const later=parseTradeText('S> Work Glove 1m',{...meta,observedAt:new Date(NOW+60_000).toISOString()});const merged=mergeOcrCandidates(first,later);assert.equal(merged.length,1);assert.equal(merged[0].observedAt,meta.observedAt);
});
test('no OCR candidate becomes a recommendation price until user confirms both content and unit basis',()=>{
 const row=parseTradeLine('S> Work Glove 5atk 1.5m each',meta);assert.throws(()=>confirmOcrCandidate(row,{now:NOW}),/검토/);assert.throws(()=>confirmOcrCandidate({...row,reviewed:true},{now:NOW}),/개당/);
 const quote=confirmOcrCandidate({...row,reviewed:true,priceBasis:'unit',itemId:'1082002'},{now:NOW});assert.equal(quote.itemId,'1082002');assert.equal(quote.price,1_500_000);assert.equal(quote.verification,'user');assert.equal(quote.evidence.raw,row.raw);assert.equal(quote.evidence.confidence,92);assert.equal(quote.at,meta.observedAt);
 assert.equal(normalizeQuote(quote,{},NOW).evidence.raw,row.raw,'provenance survives the next price sync');
});
