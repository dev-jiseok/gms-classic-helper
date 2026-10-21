import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildQuestItinerary, questClosure, questNpcLocation, sharedKillObjectives } from '../lib/quest-planner.mjs';
import { recommendQuests } from '../lib/recommendations.mjs';
const now=Date.parse('2026-10-21T12:00:00Z'),at=new Date(now-60000).toISOString();
const profile={id:'p',job:'fighter',level:30,mesos:100000};
const quest=(id,extra={})=>({id,name:id,minLevel:1,jobs:['all'],prerequisiteIds:[],requirements:[],consumedItems:[],requirementsComplete:true,costsConfirmed:true,rewardsComplete:true,conditionsComplete:true,mesos:100,mesoCost:0,exp:10,npc:'N1',turnIn:'N2',sourceUrl:'https://example.org/q/'+id,...extra});
const ore={id:'ore',name:'Ore',category:'etc',npcSell:50};
const offer=(price,extra={})=>({itemId:'ore',price,type:'sell',at,...extra});
const build=(extra={})=>buildQuestItinerary({profile,now,travelMinutes:0,travelMesos:0,...extra});
test('two selected quests share their prerequisite once, with a unique material union and minimum cash outlay',()=>{
 const quests=[quest('a',{requirements:[{itemId:'ore',quantity:2}],consumedItems:[{itemId:'ore',quantity:2}],mesoCost:10}),quest('b',{prerequisiteIds:['a'],requirements:[{itemId:'ore',quantity:3}],consumedItems:[{itemId:'ore',quantity:3}],mesos:1000}),quest('c',{prerequisiteIds:['a'],requirements:[{itemId:'ore',quantity:4}],consumedItems:[{itemId:'ore',quantity:4}],mesos:500})];
 const result=build({selectedIds:['b','c','b'],quests,items:[ore],inventory:{ore:1},prices:[offer(100,{minimumPurchaseQuantity:5,minimumPurchaseTotal:500}),offer(120)],durations:{a:1,b:2,c:3}});
 assert.deepEqual(result.steps.map(q=>q.id),['a','b','c']);assert.equal(result.prerequisitesAdded,1);
 assert.equal(result.materials[0].requirementSum,9);assert.equal(result.materials[0].preparationQuantity,9);assert.equal(result.materials[0].confirmedConsumedQuantity,9);
 assert.equal(result.preparationPurchaseCost,970);assert.equal(result.consumptionCost,1020);assert.equal(result.guaranteedRewardValue,1600);assert.equal(result.netValue,580);assert.equal(result.minutes,6);
 const complete=build({selectedIds:['b','c'],quests,completed:{a:true},items:[ore],inventory:{ore:0},prices:[offer(1)]});
 assert.deepEqual(complete.steps.map(q=>q.id),['b','c']);assert.equal(complete.materials[0].preparationQuantity,7);
});
test('held-only material is reusable and start-consumed items must be replenished before completion checks',()=>{
 const held=quest('held',{requirements:[{itemId:'ore',quantity:5}],consumedItems:[]});
 const spent=quest('spent',{prerequisiteIds:['held'],requirements:[{itemId:'ore',quantity:3}],consumedItems:[{itemId:'ore',quantity:3}]});
 const result=build({selectedIds:['spent'],quests:[held,spent],items:[ore],inventory:{ore:0},prices:[offer(10)]});
 assert.equal(result.materials[0].requirementSum,8);assert.equal(result.materials[0].preparationQuantity,5);assert.equal(result.materials[0].confirmedConsumedQuantity,3);assert.equal(result.consumptionCost,30);
 const staged=quest('staged',{startRequirements:[{itemId:'ore',quantity:2}],requirements:[{itemId:'ore',quantity:5}],consumedItems:[{itemId:'ore',quantity:2,stage:'start'},{itemId:'ore',quantity:3,stage:'complete'}]});
 const plan=build({selectedIds:['staged'],quests:[staged],items:[ore],inventory:{ore:0},prices:[offer(10)]});
 assert.equal(plan.materials[0].preparationQuantity,7);assert.equal(plan.materials[0].confirmedConsumedQuantity,5);assert.equal(plan.consumptionCost,50);
 const card=recommendQuests({profile,quests:[staged],items:[ore],prices:[offer(10)],now})[0];
 assert.equal(card.materials[0].quantity,7);assert.equal(card.materials[0].consumedQuantity,5);assert.equal(card.purchaseCost,70);assert.equal(card.cost,50);
});
test('unknown server consumption cannot turn client possession checks into asserted profit',()=>{
 const q=quest('client',{requirements:[{itemId:'ore',quantity:3}],consumedItems:[],costsConfirmed:false,clientConsumptionComplete:true,conditionEvidence:{serverScriptUnknown:true}});
 const result=build({selectedIds:['client'],quests:[q],items:[ore],inventory:{ore:0},prices:[offer(10)],durations:{client:5}});
 assert.equal(result.preparationPurchaseCost,30);assert.equal(result.netValue,null);assert.equal(result.valuePerMinute,null);assert.equal(result.materials[0].consumptionKnown,false);
 const card=recommendQuests({profile,quests:[q],items:[ore],prices:[offer(10)],now})[0];assert.equal(card.purchaseCost,30);assert.equal(card.cost,null);assert.equal(card.net,null);
});
test('unknown inventory, reward facts or time stay unknown; choices never sum as guaranteed loot',()=>{
 const q=quest('q',{requirements:[{itemId:'ore',quantity:1}],consumedItems:[{itemId:'ore',quantity:1}],rewardItems:[{itemId:'ore',quantity:999,choiceGroup:'random'}],rewardChoices:[{itemId:'ore',quantity:888}]});
 const unknown=build({selectedIds:['q'],quests:[q],items:[ore],prices:[offer(1)],durations:{q:5}});assert.equal(unknown.preparationPurchaseCost,null);assert.equal(unknown.netValue,null);assert.equal(unknown.choices.length,2);assert.equal(unknown.guaranteedRewardValue,100);
 const confirmed=build({selectedIds:['q'],quests:[q],items:[ore],prices:[offer(1)],durations:{q:5},inventoryVerifiedFor:unknown.inventoryKey});assert.equal(confirmed.preparationPurchaseCost,1);assert.equal(confirmed.netValue,99);
 const noTime=build({selectedIds:['q'],quests:[q],items:[ore],prices:[offer(1)],inventory:{ore:0}});assert.equal(noTime.minutes,null);assert.equal(noTime.valuePerMinute,null);
 const incomplete=build({selectedIds:['q'],quests:[{...q,rewardsComplete:false}],items:[ore],inventory:{ore:0},prices:[offer(1)]});assert.equal(incomplete.guaranteedRewardValue,null);assert.equal(incomplete.netValue,null);
});
test('NPC purchase can beat a bundled market minimum and bundle leftovers prevent exact profit',()=>{
 const q=quest('q',{requirements:[{itemId:'ore',quantity:1}],consumedItems:[{itemId:'ore',quantity:1}]});
 const common={selectedIds:['q'],quests:[q],items:[ore],inventory:{ore:0},prices:[offer(1,{minimumPurchaseQuantity:100,minimumPurchaseTotal:100})]};
 const bundle=build(common);assert.equal(bundle.preparationPurchaseCost,100);assert.equal(bundle.netValue,null);
 const npc=build({...common,shops:[{itemId:'ore',price:5,currency:'mesos',npcName:'Shop',sourceUrl:'https://example.org/shop'}]});assert.equal(npc.preparationPurchaseCost,5);assert.equal(npc.consumptionCost,5);assert.equal(npc.netValue,95);
});
test('shared kill savings respect dependencies and remain explicitly unverified bounds',()=>{
 const chain=[quest('a',{killRequirements:[{monsterId:'mob',name:'Mob',quantity:2}]}),quest('b',{prerequisiteIds:['a'],killRequirements:[{monsterId:'mob',quantity:5}]}),quest('c',{prerequisiteIds:['a'],killRequirements:[{monsterId:'mob',quantity:7}]})];
 const row=sharedKillObjectives(chain)[0];assert.equal(row.separateKills,14);assert.equal(row.bestCaseKillsLowerBound,9);assert.equal(row.possibleSavingsUpperBound,5);assert.equal(row.serverSharingVerified,false);
 const independent=sharedKillObjectives(chain.slice(1).map(q=>({...q,prerequisiteIds:[]})))[0];assert.equal(independent.bestCaseKillsLowerBound,7);
});
test('exact job codes use staged current job and explicit actual-job overrides',()=>{
 const q=quest('first-job-only',{jobs:['warrior'],clientJobCodes:[100]});
 assert.equal(build({profile:{...profile,level:20},selectedIds:[q.id],quests:[q]}).steps[0].readyNow,true);
 assert.equal(build({selectedIds:[q.id],quests:[q]}).steps[0].readyNow,false);
 assert.equal(build({profile:{...profile,currentJob:'warrior'},selectedIds:[q.id],quests:[q]}).steps[0].readyNow,true);
 assert.equal(recommendQuests({profile,quests:[q],now})[0].available,false);
});
test('an observed absence of minimum-level restriction is distinct from an unknown level',()=>{
 const unknown=quest('unknown',{minLevel:null});
 assert.equal(build({selectedIds:['unknown'],quests:[unknown]}).steps[0].readyNow,false);
 const noMinimum={...unknown,clientNoMinimumLevel:true,sourceConfidence:'client-reference'};
 assert.equal(build({selectedIds:['unknown'],quests:[noMinimum]}).steps[0].readyNow,true);
 assert.equal(recommendQuests({profile,quests:[noMinimum],now})[0].available,true);
});
test('script-free client condition evidence does not invent full economic cost confirmation',()=>{
 const client=quest('client',{costsConfirmed:false,conditionEvidence:{serverScriptUnknown:false},clientConsumptionComplete:true});
 const result=build({selectedIds:['client'],quests:[client],durations:{client:1}});
 assert.equal(result.steps[0].readyNow,true);assert.equal(result.netValue,null);
 assert.equal(recommendQuests({profile,quests:[client],now})[0].net,null);
});
test('explicit game-verified zero rewards and costs resolve unknowns without counting possession as consumption',()=>{
 const unknown=quest('verified',{mesos:null,mesoCost:null,conditionsComplete:false,requirementsComplete:false,rewardsComplete:false,costsConfirmed:false,conditionEvidence:{serverScriptUnknown:true},requirements:[{itemId:'ore',quantity:3}],consumedItems:[{itemId:'ore',quantity:2,stage:'complete'}]});
 const common={selectedIds:['verified'],items:[ore],inventory:{ore:3},durations:{verified:2}};
 assert.equal(build({...common,quests:[unknown]}).netValue,null);
 const verified={...unknown,conditionsVerifiedAt:new Date(now).toISOString(),requirementsComplete:true,rewardsComplete:true,costsConfirmed:true,mesos:0,mesoCost:0};
 const result=build({...common,quests:[verified]});
 assert.equal(result.netValue,-100);assert.equal(result.valuePerMinute,-50);assert.equal(result.materials[0].confirmedConsumedQuantity,2);
 const card=recommendQuests({profile,quests:[verified],items:[ore],inventory:{ore:3},durations:{verified:2},now})[0];assert.equal(card.net,-100);
 for(const value of [null,'',-1,NaN]){
  const missing={...verified,mesoCost:value};assert.equal(build({...common,quests:[missing]}).netValue,null);assert.equal(build({...common,quests:[missing]}).preparationPurchaseCost,null);assert.equal(recommendQuests({profile,quests:[missing],now})[0].net,null);
 }
 assert.equal(build({selectedIds:['free'],quests:[quest('free',{mesos:0,mesoCost:0})]}).netValue,0);
});
test('current catalog client-reference conditions are usable while script and economic gaps remain separate',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../content/public-catalog.json',import.meta.url),'utf8'));
 const training=catalog.quests.find(q=>q.id==='1009'),olaf=catalog.quests.find(q=>q.id==='10000'),script=catalog.quests.find(q=>q.id==='1002');
 assert.equal(training.sourceConfidence,'client-reference');assert.equal(training.conditionEvidence.scope,'public-client-checks-only');
 assert.equal(build({profile:{...profile,level:3,currentJob:'beginner'},selectedIds:['1009'],quests:[training],completed:{1006:true}}).steps[0].readyNow,true);
 assert.equal(build({profile:{...profile,level:8},selectedIds:['10000'],quests:[olaf]}).steps[0].readyNow,true);
 const blocked=build({profile:{...profile,level:1,currentJob:'beginner'},selectedIds:['1002'],quests:[script]});assert.equal(blocked.steps[0].readyNow,false);assert.equal(blocked.netValue,null);
 assert.equal(build({selectedIds:['10000'],quests:[olaf]}).netValue,null);
});
test('NPC locations require explicit facts and routes never invent reverse or conditional portals',()=>{
 const maps=[{id:'m1',name:'One'},{id:'m2',name:'Two'}],npcs=[{id:'n1',name:'N1',en:'N1',mapIds:['m1'],sourceUrl:'https://example.org/n1'},{id:'n2',name:'N2',en:'N2',mapIds:['m2'],sourceUrl:'https://example.org/n2'}],q=quest('q');
 const result=build({selectedIds:['q'],quests:[q],maps,npcs,startMapId:'m1',portals:[{fromId:'m1',toId:'m2',sourceUrl:'https://example.org/portal'}]});assert.deepEqual(result.route[1].path.map(map=>map.id),['m1','m2']);
 const reverse=build({selectedIds:['q'],quests:[q],maps,npcs,startMapId:'m1',portals:[{fromId:'m2',toId:'m1',sourceUrl:'https://example.org/portal'}]});assert.equal(reverse.route[1].path.length,0);
 const conditional=build({selectedIds:['q'],quests:[q],maps,npcs,startMapId:'m1',portals:[{fromId:'m1',toId:'m2',requiresQuest:'gate',sourceUrl:'https://example.org/portal'}]});assert.equal(conditional.route[1].path.length,0);
 assert.equal(questNpcLocation({...q,turnIn:null},'turnIn',npcs,maps).mapId,null);
 assert.equal(questNpcLocation(q,'pickup',[...npcs,{id:'duplicate',en:'N1',mapIds:['m2']}],maps).mapId,null);
});
test('missing and cyclic prerequisites stop asserted value and legacy completion removes ancestors',()=>{
 const a=quest('a',{legacyId:'old-a',prerequisiteIds:['b']}),b=quest('b',{prerequisiteIds:['a','missing']});
 const plan=build({selectedIds:['a'],quests:[a,b]});assert.ok(plan.errors.some(error=>error.includes('순환')));assert.ok(plan.errors.some(error=>error.includes('missing')));assert.equal(plan.netValue,null);assert.equal(new Set(plan.steps.map(q=>q.id)).size,plan.steps.length);
 const closure=questClosure(['b'],[quest('a',{legacyId:'old-a'}),quest('b',{prerequisiteIds:['a']})],{'old-a':true});assert.deepEqual(closure.ordered.map(q=>q.id),['b']);
});
