import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {recommendQuests} from '../lib/recommendations.mjs';
const profile={id:'p',job:'fighter',level:40,mesos:100000},now=Date.parse('2026-10-21T12:00:00Z');
const q=(id,mesos,extra={})=>({id,name:id,minLevel:1,mesos,mesoCost:0,exp:10,requirements:[],rewardItems:[],requirementsComplete:true,rewardsComplete:true,costsConfirmed:true,conditionsComplete:true,estimatedMinutes:10,...extra});
const rank=(quests,extra={})=>recommendQuests({profile,quests,goal:'money',now,...extra});
test('money default ranks monetary reward before advancement, urgency, readiness and proximity to current level',()=>{
 const quests=[q('near-level-advancement',100,{minLevel:40,mandatory:true,deadline:new Date(now+3600000).toISOString()}),q('older-profitable',9000,{minLevel:10}),q('chain-parent',0),q('profitable-chain',20000,{prerequisiteIds:['chain-parent']}),q('future',900000,{minLevel:41})];
 assert.deepEqual(rank(quests).map(r=>r.id),['profitable-chain','older-profitable','near-level-advancement','chain-parent','future']);
 assert.ok(rank(quests).find(r=>r.id==='profitable-chain').prerequisites.length>0);
 assert.ok(!rank(quests).at(-1).available);
});
test('reward, net and hourly are distinct selectable money objectives',()=>{
 const quests=[q('high-reward',10000,{mesoCost:9000,estimatedMinutes:1}),q('high-net',9000,{mesoCost:100,estimatedMinutes:60}),q('fast-net',4000,{estimatedMinutes:1})];
 assert.equal(rank(quests)[0].id,'high-reward');assert.equal(rank(quests,{moneySort:'net'})[0].id,'high-net');assert.equal(rank(quests,{moneySort:'hourly'})[0].id,'fast-net');
});
test('unknown costs do not hide a known reward, and partial values stay explicit instead of becoming full profit',()=>{
 const rows=rank([q('partial-high',5000,{rewardsComplete:false,rewardChoices:[{itemId:'random',quantity:1}],costsConfirmed:false,mesoCost:null}),q('complete-low',1000),q('unpriced',null,{rewardsComplete:false,rewardItems:[{itemId:'unknown',quantity:1}]}),q('confirmed-zero',0)]);
 assert.deepEqual(rows.map(r=>r.id),['partial-high','complete-low','confirmed-zero','unpriced']);assert.equal(rows[0].reward,null);assert.equal(rows[0].knownPartialReward,5000);assert.equal(rows[0].net,null);assert.equal(rows[3].reward,null);
 const net=rank(rows.map(r=>r.quest),{moneySort:'net'});assert.equal(net[0].id,'complete-low');
});
test('valued reward items and unfinished prerequisites count, completed prerequisites never double count',()=>{
 const quests=[q('parent',100),q('valuable-item',1,{rewardItems:[{itemId:'scroll',quantity:2}],prerequisiteIds:['parent']}),q('cash',3000)];
 const result=rank(quests,{items:[{id:'scroll',npcSell:2500}]});assert.equal(result[0].id,'valuable-item');assert.equal(result[0].reward,5101);assert.equal(result[0].commonReward.value,5001);
 const done=rank(quests,{items:[{id:'scroll',npcSell:2500}],completed:{parent:true}});assert.equal(done[0].reward,5001);assert.equal(done[0].commonReward.value,5001);assert.equal(done[0].prerequisites.length,0);
});
test('real catalog available quests are ordered by valued reward, without silently replacing unknown costs with zero',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../content/public-catalog.json',import.meta.url),'utf8'));const rows=rank(catalog.quests,{items:catalog.items}).filter(r=>r.available);
 const value=r=>r.commonReward.value;assert.ok(rows.length>50);
 for(let i=1;i<rows.length;i++){if(value(rows[i])!==null){assert.notEqual(value(rows[i-1]),null);assert.ok(value(rows[i-1])>=value(rows[i]));}}
 assert.ok(rows.some(r=>r.knownPartialReward>0&&r.net===null));assert.ok(rows.some(r=>r.quest.minLevel<30));
});

test('common reward value is identical for different careers, inventories and completed ancestors',()=>{
 const quests=[q('parent',100000),q('same-common-quest',9000,{prerequisiteIds:['parent'],consumedItems:[{itemId:'ore',quantity:2}],requirements:[{itemId:'ore',quantity:2}]}),q('other-common-quest',10000)];
 const inputs=[{...profile,job:'fighter'},{...profile,job:'assassin'},{...profile,job:'hunter'}];
 const values=inputs.map((p,i)=>rank(quests,{profile:p,items:[{id:'ore',npcSell:100}],inventory:{ore:i*2},completed:i?{parent:true}:{}}).find(r=>r.id==='same-common-quest').commonReward.value);
 assert.deepEqual(values,[9000,9000,9000]);
 for(const p of inputs){const rows=rank(quests,{profile:p,items:[{id:'ore',npcSell:100}],completed:{parent:true}});assert.equal(rows[0].id,'other-common-quest','ancestor rewards must not inflate the common quest priority');}
});
