import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState, normalizeState, matches, latestPrice, questValue, huntMetrics, hitEstimate, scrollOdds, shortestPath, parseMarketCsv, simulateScroll, format, mesos, rankHuntRecords} from '../lib/engine.mjs';

test('three separate level-one job profiles are available',()=>{const s=initialState();assert.deepEqual(s.profiles.map(p=>[p.job,p.level]),[['fighter',1],['assassin',1],['hunter',1]]);});
test('Korean initials and English case are searchable',()=>{assert.equal(matches('초록 버섯 Green Mushroom','ㅊㄹㅂㅅ'),true);assert.equal(matches('초록 버섯 Green Mushroom','GREEN'),true);assert.equal(matches('초록 버섯','파이어'),false);});
test('malformed backup cannot replace the app state',()=>{assert.throws(()=>normalizeState({version:1,profiles:[]}));assert.throws(()=>normalizeState({...initialState(),prices:{}}));const state=normalizeState({...initialState(),activeProfile:'missing'});assert.equal(state.activeProfile,'fighter');});
test('a price is per unit and observed-sales are distinct from asks',()=>{const p=[{itemId:'x',price:50,type:'sell',at:'2026-10-21'},{itemId:'x',price:40,type:'sold',at:'2026-10-20'}];assert.equal(latestPrice(p,'x').price,50);assert.equal(latestPrice(p,'x','sold').price,40);});
test('quest cost includes opportunity cost of owned materials',()=>{const q={mesos:100,requirements:[{itemId:'ore',quantity:2}],rewardItems:[{itemId:'scroll',quantity:1}]};const items=[{id:'ore',npcSell:1},{id:'scroll',npcSell:1}];const prices=[{itemId:'ore',price:20,type:'sell',at:'2026-10-21'},{itemId:'scroll',price:100,type:'sold',at:'2026-10-21'}];const v=questValue(q,items,prices,{ore:2},10);assert.equal(v.net,160);assert.equal(v.owned,true);assert.equal(v.perHour,960);});
test('hunting computes net income once from gross gains',()=>{const result=huntMetrics({minutes:30,exp:1000,mesoDelta:500,loot:300,potions:100,travel:50});assert.equal(result.net,650);assert.equal(result.mesosPerHour,1300);assert.equal(result.expPerHour,2000);assert.equal(huntMetrics({minutes:0}),null);});
test('itemized unknown loot and costs preserve EXP without inventing net income',()=>{
 const record={map:'A',minutes:30,exp:1000,mesoDelta:500,potions:100,travel:50,loot:999,lootMode:'itemized',lootItems:[{itemId:'ore',quantity:2,recordedUnitPrice:null}]};
 assert.equal(huntMetrics(record).net,null);assert.equal(huntMetrics(record).expPerHour,2000);
 const priced={...record,lootItems:[{itemId:'ore',quantity:2,recordedUnitPrice:40}]};
 assert.equal(huntMetrics(priced).net,430);assert.equal(huntMetrics({...priced,potions:null}).net,null);
 assert.equal(rankHuntRecords([record],'mesos').length,0);assert.equal(rankHuntRecords([record],'exp')[0].mesosPerHour,null);
});
test('zero accuracy never reports possible kills',()=>{assert.equal(hitEstimate({damage:100,hp:200,accuracy:0}),null);const r=hitEstimate({damage:100,hp:200,accuracy:100,attackSeconds:1,exp:10});assert.equal(r.hits,2);assert.equal(r.expPerHour,18000);});
test('binomial probability counts at least the required successes',()=>{const r=scrollOdds(60,2,1);assert.ok(Math.abs(r.probability-.84)<1e-10);assert.equal(scrollOdds(100,7,7).probability,1);assert.equal(scrollOdds(0,7,1).probability,0);});
test('destruction ends the scroll sequence',()=>{const r=simulateScroll(0,7,100,()=>.5);assert.equal(r.destroyed,true);assert.equal(r.result.length,1);});
test('route can return start and end or no possible connection',()=>{assert.deepEqual(shortestPath([['a','b'],['b','c']],'a','c'),['a','b','c']);assert.deepEqual(shortestPath([],'a','a'),['a']);assert.equal(shortestPath([],'a','b'),null);});
test('CSV import rejects invalid or negative prices',()=>{assert.throws(()=>parseMarketCsv('2000000,-10'));assert.throws(()=>parseMarketCsv('2000000,nope'));const rows=parseMarketCsv('itemId,price,type,source\n2000000,10,sold,my record');assert.equal(rows[0].price,10);assert.equal(rows[0].type,'sold');});

test('missing values are never rendered as verified zero',()=>{assert.equal(format(null),'확인 필요');assert.equal(format(undefined),'확인 필요');assert.equal(format(0),'0');});
test('partial quest rewards cannot claim known net value',()=>{assert.equal(questValue({mesos:null,requirementsComplete:false,rewardsComplete:false},[],[]).marketKnown,false);});
test('recommendations weight repeated sessions by duration',()=>{const rows=rankHuntRecords([{map:'A',minutes:10,exp:100,mesoDelta:100},{map:'A',minutes:50,exp:100,mesoDelta:0},{map:'B',minutes:10,exp:50,mesoDelta:10}],'exp');assert.equal(rows[0].map,'B');assert.equal(rows[1].expPerHour,200);assert.equal(rows[1].sessions,2);});

test('profile identity remains unique across backups and levels are whole numbers',()=>{const s=initialState();assert.throws(()=>normalizeState({...s,profiles:[s.profiles[0],s.profiles[0]]}));assert.throws(()=>normalizeState({...s,profiles:[{...s.profiles[0],id:''}]}));assert.equal(normalizeState({...s,profiles:[{...s.profiles[0],level:22.7,job:'cleric'}]}).profiles[0].level,22);assert.equal(normalizeState({...s,profiles:[{...s.profiles[0],job:'cleric'}]}).profiles[0].job,'cleric');});

test('fractional bundle unit prices never display as free or round to a whole meso',()=>{assert.equal(mesos(.3),'0.3 메소');assert.equal(mesos(1499.5),'1,499.5 메소');assert.equal(mesos(1500),'1,500 메소');assert.equal(mesos(null),'가격 없음');});
