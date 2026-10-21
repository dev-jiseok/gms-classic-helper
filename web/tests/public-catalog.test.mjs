import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOB_IDS, JOBS, SKILLS, JOB_REFERENCE } from '../lib/job-data.mjs';
import { experienceToNext, experienceBetween } from '../lib/experience-data.mjs';
import { catalogMatches, mapRoute, normalizeItemDetail, normalizeMapDetail, normalizeQuestDetail, queryCatalog } from '../lib/public-catalog.mjs';
const data=JSON.parse(readFileSync(new URL('../content/public-catalog.json',import.meta.url),'utf8'));

test('all launch branches and ten second jobs are selectable without inventing future jobs',()=>{
  assert.equal(JOB_IDS.length,15);
  assert.equal(Object.values(JOBS).filter(j=>j.tier===2).length,10);
  assert.equal(Object.values(JOBS).filter(j=>j.tier===1).length,4);
  assert.ok(JOBS.cleric&&JOBS.page&&JOBS.spearman&&JOBS.bandit&&JOBS.crossbowman);
  assert.equal(JOBS.pirate,undefined);
  assert.ok(Object.values(JOBS).every(j=>j.thirdAdvancementAvailable===false));
  assert.equal(JOB_REFERENCE.skillRows,93);
});
test('current Classic caps and prerequisite identities are internally valid',()=>{
  assert.equal(SKILLS.assassin.find(s=>s.en==='Keen Eyes').max,15);
  assert.equal(SKILLS.hunter.find(s=>s.en==='Critical Shot').max,15);
  assert.ok(SKILLS.fighter.some(s=>s.en==='Rush'));
  assert.ok(!SKILLS.fighter.some(s=>s.en==='Power Guard'));
  for(const [job,skills] of Object.entries(SKILLS)){
    assert.equal(new Set(skills.map(s=>s.id)).size,skills.length,job+' skill IDs');
    for(const s of skills)for(const p of s.prerequisites||[]){
      const parent=skills.find(x=>x.id===p.id);
      assert.ok(parent,job+'/'+s.en+' missing prerequisite '+p.id);
      assert.ok(p.level<=parent.max);
    }
  }
});
test('EXP curve remains unknown beyond verified Classic values',()=>{
  assert.equal(experienceToNext(1),15);
  assert.equal(experienceToNext(49),655200);
  assert.equal(experienceToNext(50),null);
  assert.equal(experienceBetween(1,50),6851591);
  assert.equal(experienceBetween(49,51),null);
});
test('catalog retains all public indexes and unique stable IDs',()=>{
  assert.ok(data.items.length>=7432);
  assert.ok(data.monsters.length>=101);
  assert.ok(data.maps.length>=318);
  assert.ok(data.npcs.length>=226);
  assert.ok(data.quests.length>=316);
  for(const kind of ['items','monsters','maps','npcs','quests','recipes'])assert.equal(new Set(data[kind].map(r=>r.id)).size,data[kind].length,kind);
});
test('unpopulated upstream monster levels stay unknown rather than zero',()=>{
  const unknown=data.monsters.filter(m=>m.confidence==='public-client-reference');
  assert.ok(unknown.length>0);
  assert.ok(unknown.every(m=>m.level===null&&m.hp===null));
  const snail=data.monsters.find(m=>m.en==='Snail');assert.equal(snail.hp,45);assert.equal(snail.level,1);
});
test('Korean aliases, English, IDs and Korean initials search the same catalog',()=>{
  const red=data.items.find(i=>i.id==='2000000');
  assert.ok(catalogMatches(red,'빨간'));
  assert.ok(catalogMatches(red,'Red Potion'));
  assert.ok(catalogMatches(red,'ㅃㄱ'));
  assert.ok(catalogMatches(red,'2000000'));
  assert.equal(queryCatalog(data,'items',{q:'2000000'}).rows[0].id,'2000000');
  assert.equal(queryCatalog(data,'items',{limit:10000}).limit,200);
});
test('directed routing respects one-way links, levels and quest gates',()=>{
  const maps=['a','b','c'].map(id=>({id,name:id}));
  const catalog={maps,portals:[{fromId:'a',toId:'b'},{fromId:'b',toId:'c',requiresLevel:20,requiresQuest:'Gate'}]};
  assert.equal(mapRoute(catalog,'a','c',{level:30}).path.length,0);
  assert.equal(mapRoute(catalog,'a','c',{level:10,allowConditional:true}).path.length,0);
  assert.equal(mapRoute(catalog,'a','c',{level:30,allowConditional:true}).path.length,3);
  assert.equal(mapRoute(catalog,'c','a',{allowConditional:true}).path.length,0);
});
test('structured portal, shop and recipe tables retain full captured page counts',()=>{
  assert.equal(data.portals.length,536); // One source portal has no indexed from-map.
  assert.equal(data.shops.length,555);
  assert.equal(data.recipes.length,348);
  assert.ok(data.recipes.every(r=>r.ingredients.length&&r.ingredients.every(i=>i.quantity>0)));
});
test('random quest rewards are not added to guaranteed rewardItems',()=>{
  const jane=data.quests.find(q=>q.id==='10002');
  assert.equal(jane.rewardChoices.length,14);
  assert.equal(jane.rewardItems.length,0);
  assert.ok(jane.rewardChoices.every(r=>r.choiceGroup==='random'));
  assert.equal(jane.requirements.length,2);
  assert.equal(jane.killRequirements.length,2);
});
test('observed drops preserve sample counts and uncertainty instead of game probability',()=>{
  assert.equal(data.drops.length,158);
  const snail=data.monsters.find(m=>m.en==='Snail');
  const shell=snail.drops.find(d=>d.itemId==='4000001');
  assert.equal(shell.sampleKills,103);assert.equal(shell.sampleDrops,53);
  assert.equal(shell.confidence,'community-observed');
  assert.ok(shell.confidenceLowPercent<shell.observedRatePercent&&shell.observedRatePercent<shell.confidenceHighPercent);
  assert.equal(snail.dropChance,null);
  assert.ok(snail.drops.some(d=>d.itemId==='2000000'),'canonical Red Potion ID survives duplicate display names');
});
test('item detail preserves zero requirements without inventing absent stats',()=>{
  const row=normalizeItemDetail({id:1302000,description:{name:'Sword'},metaInfo:{reqLevel:0,price:0,tuc:7,attack:1,reqSTR:0,reqDEX:0}});
  assert.equal(row.requiredLevel,0);assert.equal(row.npcSell,0);assert.equal(row.slots,7);assert.equal(row.stats.attack,undefined);assert.equal(row.stats.magicAttack,undefined);assert.equal(row.statRequirements.int,null);
});
test('client quest detail does not treat flattened alternatives as guaranteed rewards',()=>{
  const row=normalizeQuestDetail({id:1,name:'Q',requirementToStart:{levelMinimum:1,quests:[{id:2,state:2}]},requirementToComplete:{items:[{id:3,count:5}]},rewardOnComplete:{exp:30,items:[{id:4,count:1},{id:5,count:1}]}},{},{items:[]});
  assert.equal(row.rewardItems.length,0);assert.equal(row.rewardChoices.length,2);assert.equal(row.requirements[0].quantity,5);assert.deepEqual(row.prerequisiteIds,['2']);
});
test('actual map API sparse arrays do not break linked map detail',()=>{
  const row=normalizeMapDetail({id:1,portals:[null,{toMap:999999999},{toMap:2,portalName:'east00'}],npcs:[null,{id:3}],mobs:[null,{id:4}]},{},{maps:[{id:'2',name:'Destination'}]});
  assert.equal(row.portals.length,1);assert.equal(row.portals[0].toName,'Destination');assert.deepEqual(row.npcIds,['3']);assert.deepEqual(row.mobIds,['4']);
});
test('quest pagination filters current job, known levels and completed IDs before counting',()=>{
  const q={quests:[{id:'a',minLevel:1,jobs:['beginner']},{id:'b',minLevel:10,jobs:['warrior']},{id:'c',minLevel:null,jobs:['all']},{id:'d',minLevel:1,jobs:['all'],legacyId:'old-d'}]};
  const beginner=queryCatalog(q,'quests',{eligibleLevel:1,job:'beginner',exclude:['old-d'],limit:1});assert.equal(beginner.total,1);assert.equal(beginner.rows[0].id,'a');
  const fighter=queryCatalog(q,'quests',{eligibleLevel:30,job:'fighter'});assert.deepEqual(fighter.rows.map(r=>r.id),['b','d']);
});
test('quest eligibility uses exact observed job codes and explicit absence of a minimum level',()=>{
  const q={quests:[{id:'first',minLevel:10,jobs:['warrior'],clientJobCodes:[100]},{id:'second',minLevel:30,jobs:['fighter'],clientJobCodes:[110]},{id:'unrestricted',minLevel:null,clientNoMinimumLevel:true,jobs:['all']},{id:'unknown',minLevel:null,jobs:['all']}]};
  assert.deepEqual(queryCatalog(q,'quests',{job:'fighter',eligibleLevel:30}).rows.map(r=>r.id),['second','unrestricted']);
  assert.deepEqual(queryCatalog(q,'quests',{job:'warrior',eligibleLevel:10}).rows.map(r=>r.id),['first','unrestricted']);
});
