import test from 'node:test';
import assert from 'node:assert/strict';
import {questSourceUrl,questStepText,questStepPlan} from '../lib/quest-steps.mjs';
const maps=[{id:'a',name:'Start'},{id:'b',name:'Middle'},{id:'c',name:'End'}],sourceUrl='https://mapleclassic.wiki/wiki/Test';
const edge=(fromId,toId,extra={})=>({fromId,toId,sourceUrl,...extra});
test('source order is stable, preserves duplicate steps, unknown order and zero, and never mutates source',()=>{
 const quest={id:'q',steps:[{step:2,title:'Second'},{step:'0',title:'Zero'},{step:2,title:'Another second'},{step:null,title:'Unknown'},{step:'',title:'Empty'},null]};const before=JSON.stringify(quest);
 const rows=questStepPlan(quest);assert.deepEqual(rows.map(s=>s.title),['Zero','Second','Another second','Unknown','Empty']);assert.deepEqual(rows.map(s=>s.number),[0,2,2,null,null]);assert.equal(new Set(rows.map(s=>s.key)).size,5);assert.equal(JSON.stringify(quest),before);
});
test('Cargo text remains plain text with readable links and line breaks, never active HTML or URL schemes',()=>{
 assert.equal(questStepText('<p>Talk to [[Sera|세라]] &amp; return.<br>Bring &#50; ores.</p><script>bad()</script>'),'Talk to 세라 & return.\nBring 2 ores.');
 assert.equal(questStepText('Accept the quest from [[Jane|&lt;span title=&quot;Jane&quot;&gt;Jane&lt;/span&gt;]] in [[Lith Harbor|&lt;span title=&quot;Lith Harbor&quot;&gt;Lith Harbor&lt;/span&gt;]].'),'Accept the quest from Jane in Lith Harbor.');
 assert.equal(questSourceUrl('javascript:alert(1)'),null);assert.equal(questSourceUrl('data:text/html,foo'),null);assert.equal(questSourceUrl('/wiki/Test'),null);assert.equal(questSourceUrl(sourceUrl),sourceUrl);
});
test('a location is resolved only from an explicit ID or a uniquely confirmed NPC position, never a text guess',()=>{
 const npcs=[{id:'n',name:'Known',mapIds:['b']},{id:'mobile',name:'Mobile',mapIds:['b','c']}];
 const quest={id:'q',steps:[{step:1,destinationMapName:'Middle'},{step:2,targetNpcId:'n'},{step:3,targetNpcId:'mobile'},{step:4,destinationMapId:'missing',targetNpcId:'n'}]};
 const rows=questStepPlan(quest,{maps,npcs,startMapId:'a',portals:[edge('a','b')]});
 assert.equal(rows[0].destination,null);assert.equal(rows[1].destination.id,'b');assert.equal(rows[1].locationBasis,'npc-catalog-location');assert.equal(rows[1].fromMapId,null);assert.equal(rows[2].destination,null);assert.equal(rows[3].destination,null);
 const choice=questStepPlan(quest,{maps,npcs,mapChoices:{'q:2':'c'}});assert.equal(choice[2].destination.id,'c');assert.equal(questStepPlan(quest,{maps,npcs,mapChoices:{'q:2':'a'}})[2].destination,null);
});
test('step routes retain direction, source and level gates, and never bridge an unknown intermediate location',()=>{
 const quest={id:'q',sourceUrl,steps:[{step:1,destinationMapId:'b'},{step:2},{step:3,destinationMapId:'c'}]},portals=[edge('a','b'),edge('b','c')];
 const rows=questStepPlan(quest,{maps,portals,startMapId:'a',level:10});assert.deepEqual(rows[0].route.path.map(m=>m.id),['a','b']);assert.equal(rows[2].fromMapId,null);assert.equal(rows[2].route.path.length,0);
 for(const bad of [[edge('b','a')],[{fromId:'a',toId:'b'}],[edge('a','b',{requiresLevel:20})],[edge('a','b',{requiresQuest:'g'})],[edge('a','b',{portalType:'transport'})]])assert.equal(questStepPlan(quest,{maps,portals:bad,startMapId:'a',level:10})[0].route.path.length,0);
 assert.equal(questStepPlan(quest,{maps,portals:[edge('a','b',{requiresLevel:2})],startMapId:'a'})[0].route.path.length,0);
 assert.equal(rows[0].sourceUrl,sourceUrl);assert.equal(rows[0].phase,undefined);
});
test('optional monster and material references use explicit IDs without guessing IDs or quantities from prose',()=>{
 const quest={id:'q',steps:[{step:1,title:'Collect 15 Ore',requiredItemName:'Ore',targetMonsterName:'Mob'},{step:2,requiredItemId:'ore',requiredItemName:'Ore',targetMonsterId:'mob',targetMonsterName:'Mob',notes:'<b>Check first.</b>',phase:null}]};
 const rows=questStepPlan(quest,{items:[{id:'other',name:'Ore'}],monsters:[{id:'different',name:'Mob'}]});assert.equal(rows[0].item,null);assert.equal(rows[0].monster,null);assert.equal(rows[1].item.id,'ore');assert.equal(rows[1].monster.id,'mob');assert.equal(rows[1].item.quantity,undefined);assert.equal(rows[1].phase,null);assert.equal(rows[1].notes,'Check first.');
});
