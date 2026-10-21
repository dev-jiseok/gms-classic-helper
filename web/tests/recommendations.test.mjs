import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { currentJobForProfile, equipmentCandidatesFromQuotes, expectedDropValue, huntComparability, jobMatches, observedDropScenario, optimizeEquipment, priceEvidence, questGateEvidence, recommendHunting, recommendQuests, repriceEquipmentCandidates, snapshotStatus, valueHuntRecord } from '../lib/recommendations.mjs';
import {huntCombatSnapshot,huntProfileSignature,itemizeHuntRecord} from '../lib/hunt-session.mjs';

const now = Date.parse('2026-10-21T12:00:00Z');
const at = new Date(now - 60000).toISOString();
const profile = { id: 'self', job: 'fighter', level: 30, attack: 20, accuracy: 10, str: 100, dex: 20, int: 4, luk: 4 };
const offer = (itemId, price, type = 'sell', extra = {}) => ({ itemId, price, type, at, ...extra });
const item = (id, slot, price, attack, extra = {}) => ({ id, name: id, slot, price, stats: { attack }, requirements: { level: 1 }, requirementsKnown: true, at, ...extra });
test('known PQ and advancement-test variants never become ordinary reference hunting, while actual records remain',()=>{
 const base={level:30,hp:100,exp:10},monsters=[{...base,id:'normal',name:'Normal',mapIds:['field','pq']},{...base,id:'test',variant:'Magician',variantLabel:'Magician 2nd job test'},{...base,id:'pq',variant:'KPQ'},{...base,id:'unknown',variant:'Winter'},{...base,id:'boss',mapIds:['pq']}],maps=[{id:'field',name:'Field'},{id:'pq',en:'1st Accompaniment (Last Stage)'}];
 const record={id:'run',profileId:profile.id,job:profile.job,level:profile.level,combatSnapshot:huntCombatSnapshot(profile),mapId:'pq',map:'PQ measured',minutes:10,exp:100,mesoDelta:10,potions:0,travel:0,loot:0,at};
 const result=recommendHunting({profile,monsters,maps,records:[record],now});assert.deepEqual(result.candidates.map(m=>m.id).sort(),['normal','unknown']);assert.deepEqual(result.candidates.find(m=>m.id==='normal').maps.map(m=>m.id),['field']);assert.match(result.candidates.find(m=>m.id==='unknown').missing.join(' '),/변형 용도 미확인/);assert.equal(result.measured.length,1);assert.ok(Math.abs(result.measured[0].expPerHour-600)<1e-9);
 const catalog=JSON.parse(readFileSync(new URL('../content/public-catalog.json',import.meta.url),'utf8'));
 const actual=recommendHunting({profile:{...profile,level:25},...catalog,now});assert.ok(actual.candidates.some(m=>m.id==='18'));assert.ok(!actual.candidates.some(m=>m.id==='800003'));for(const mob of catalog.monsters.filter(instance=>['KPQ','Warrior','Magician','Bowman','Thief'].includes(instance.variant)))assert.ok(!actual.candidates.some(row=>row.id===mob.id));
});
test('unmatched source references never become actionable hunting or quest plans, but actual hunt records survive',()=>{
 const base={level:30,hp:100,exp:10},monsters=[{...base,id:'normal',mapIds:['field','reference-map']},{...base,id:'reference-monster',referenceOnly:true},{...base,id:'availability-only',availability:'community-reference-only'},{...base,id:'reference-location-only',mapIds:['reference-map']}],maps=[{id:'field',name:'Field'},{id:'reference-map',name:'Unmatched map',referenceOnly:true}];
 const record={id:'actual',profileId:profile.id,mapId:'reference-map',map:'Actual measured location',minutes:10,exp:100,mesoDelta:10,potions:0,travel:0,loot:0,at,combatSnapshot:huntCombatSnapshot(profile)};
 const hunt=recommendHunting({profile,monsters,maps,records:[record],now});
 assert.deepEqual(hunt.candidates.map(row=>row.id),['normal']);assert.deepEqual(hunt.candidates[0].maps.map(row=>row.id),['field']);assert.equal(hunt.measured.length,1);assert.equal(hunt.measured[0].mapId,'reference-map');assert.ok(Math.abs(hunt.measured[0].expPerHour-600)<1e-9);
 const baseQuest={minLevel:1,mesos:100,exp:10,mesoCost:0,costsConfirmed:true,rewardsComplete:true,requirementsComplete:true,conditionsComplete:true,estimatedMinutes:1};
 const quests=[{...baseQuest,id:'ordinary',name:'Ordinary'},{...baseQuest,id:'reference',name:'Reference',referenceOnly:true,conditionsVerifiedAt:at},{...baseQuest,id:'availability',name:'Availability reference',availability:'community-reference-only'},{...baseQuest,id:'child',name:'Reference prerequisite',prerequisiteIds:['reference']}];
 const rows=recommendQuests({profile,quests,now});assert.equal(rows.find(row=>row.id==='ordinary').ready,true);
 for(const key of ['reference','availability','child']){const row=rows.find(row=>row.id===key);assert.equal(row.available,false);assert.equal(row.conditionsKnown,false);assert.equal(row.net,null);assert.match(row.gates.join(' '),/참고 전용 자료/);}
 const catalog=JSON.parse(readFileSync(new URL('../content/public-catalog.json',import.meta.url),'utf8')),referenceMonsters=catalog.monsters.filter(row=>row.referenceOnly),referenceQuests=catalog.quests.filter(row=>row.referenceOnly);
 assert.ok(referenceMonsters.length);assert.ok(referenceQuests.length);
 for(const monster of referenceMonsters){const result=recommendHunting({profile:{...profile,level:monster.level??30},monsters:[monster],maps:catalog.maps,now});assert.equal(result.candidates.length,0);}
 for(const quest of referenceQuests){const gate=questGateEvidence({...quest,conditionsVerifiedAt:at},profile,{now});assert.equal(gate.blocked,true);assert.equal(gate.confidence,'partial');assert.match(gate.reasons.join(' '),/참고 전용 자료/);}
});
test('positive sourced fame requirements cannot silently pass with an unknown or low profile fame',()=>{
 const candidate=item('fame-hat','모자',10,100,{requirements:{level:1,fame:10}});
 assert.equal(optimizeEquipment({profile,candidates:[candidate],budget:10,now}).best.utility,0);
 assert.equal(optimizeEquipment({profile:{...profile,fame:9},candidates:[candidate],budget:10,now}).best.utility,0);
 assert.equal(optimizeEquipment({profile:{...profile,fame:10},candidates:[candidate],budget:10,now}).best.utility,100);
 const catalog={id:'hat',name:'Hat',category:'equip',subCategory:'Hat',requiredLevel:1,requiredGender:2,requiredJobs:['all'],statRequirements:{str:0,dex:0,int:0,luk:0},extraRequirements:{fame:10}};
 const quote=offer('hat',10,'sell',{optionsComplete:true,options:{attack:0,magicAttack:0,str:1,dex:0,int:0,luk:0,accuracy:0,slots:0}});
 assert.equal(equipmentCandidatesFromQuotes({profile,items:[catalog],prices:[quote],now}).candidates.length,0);
 const accepted=equipmentCandidatesFromQuotes({profile:{...profile,fame:10},items:[catalog],prices:[quote],now}).candidates[0];assert.equal(accepted.requirements.fame,10);
});
test('core-complete catalog gear with unknown extra conditions stays unconfirmed until explicit user review',()=>{
 const catalog={id:'hat',name:'Hat',category:'equip',subCategory:'Hat',requiredLevel:1,requiredGender:2,requiredJobs:['all'],statRequirements:{str:0,dex:0,int:0,luk:0},wearingRequirementsComplete:false,extraRequirementUnknowns:['fame','secondaryJob']};
 const quote=offer('hat',10,'sell',{optionsComplete:true,options:{attack:1,magicAttack:0,str:0,dex:0,int:0,luk:0,accuracy:0,slots:0}});
 const candidate=equipmentCandidatesFromQuotes({profile,items:[catalog],prices:[quote],now}).candidates[0];
 assert.equal(candidate.requirementsKnown,false);assert.deepEqual(candidate.wearingUnknowns,['fame','secondaryJob']);
 assert.equal(optimizeEquipment({profile,candidates:[candidate],budget:10,now}).best.utility,0);
 const confirmed={...candidate,requirementsKnown:true,userConfirmedExtraConditions:true};
 assert.equal(optimizeEquipment({profile,candidates:[confirmed],budget:10,now}).best.utility,1);
});
test('saved itemized hunt valuations separate recorded and current prices without changing quantities or double counting',()=>{
 const source={id:'run',profileId:profile.id,map:'A',minutes:60,exp:1000,mesoDelta:100,potions:20,travel:5,loot:999,at,combatSnapshot:huntCombatSnapshot(profile)};
 const record=itemizeHuntRecord(source,[{itemId:'ore',quantity:3,recordedUnitPrice:10,recordedPriceBasis:'manual'}],now).record;
 const first=valueHuntRecord(record,[{id:'ore',category:'etc'}],[offer('ore',20,'sold')],now);
 const second=valueHuntRecord(record,[{id:'ore',category:'etc'}],[offer('ore',40,'sold')],now);
 assert.equal(first.recordedNet,105);assert.equal(first.currentNet,135);assert.equal(second.currentNet,195);assert.equal(second.recordedNet,105);
 assert.equal(record.loot,30);assert.equal(record.previousAggregateLoot,999);assert.equal(record.lootItems[0].quantity,3);assert.equal(record.lootItems[0].recordedUnitPrice,10);
 const rows=recommendHunting({profile,records:[record],items:[{id:'ore',category:'etc'}],prices:[offer('ore',40,'sold')],now}).measured;
 assert.equal(rows.length,1);assert.equal(rows[0].recordedNetPerHour,105);assert.equal(rows[0].currentNetPerHour,195);assert.equal(rows[0].repricedSessions,1);
});
test('unknown or stale itemized values stay unknown, and equipment aggregates cannot value a rolled drop',()=>{
 const record={lootMode:'itemized',lootItems:[{itemId:'sword',quantity:1,recordedUnitPrice:50}],loot:50,mesoDelta:100,potions:10,travel:0};
 const gear=valueHuntRecord(record,[{id:'sword',category:'equip'}],[offer('sword',999999,'sold',{isEquipment:true,optionsComplete:false})],now);
 assert.equal(gear.recordedNet,140);assert.equal(gear.currentNet,null);assert.equal(gear.rows[0].currentUnitPrice,null);
 const npc=valueHuntRecord(record,[{id:'sword',category:'equip',npcSell:5}],[],now);assert.equal(npc.currentNet,95);
 const unknown=valueHuntRecord({...record,lootItems:[{itemId:'sword',quantity:1,recordedUnitPrice:null}],loot:999},[],[],now);
 assert.equal(unknown.recordedNet,null);assert.equal(unknown.currentNet,null);
 const stale=valueHuntRecord({...record,lootItems:[{itemId:'ore',quantity:3,recordedUnitPrice:1}]},[{id:'ore'}],[offer('ore',20,'sold',{at:new Date(now-25*3600000).toISOString()})],now);
 assert.equal(stale.currentNet,null);
 const cashUnknown=valueHuntRecord({...record,mesoDelta:null},[{id:'sword',category:'equip',npcSell:5}],[],now);assert.equal(cashUnknown.currentNet,null);
});
test('legacy aggregate values retain their recorded net but require backfill for current repricing',()=>{
 const record={map:'A',minutes:60,exp:100,mesoDelta:100,potions:20,travel:5,loot:30,at,combatSnapshot:huntCombatSnapshot(profile)};
 const value=valueHuntRecord(record,[],[],now);assert.equal(value.recordedNet,105);assert.equal(value.currentNet,null);
 const row=recommendHunting({profile,records:[record],now}).measured[0];assert.equal(row.netPerHour,105);assert.equal(row.pricingBasis,'recorded');assert.equal(row.currentNetPerHour,null);
});
test('ranking defaults to comparable current profiles and keeps different or unknown setups separate',()=>{
 const base={map:'A',minutes:60,exp:100,mesoDelta:10,potions:0,travel:0,loot:0,at};
 const rows=[{...base,id:'same',combatSnapshot:huntCombatSnapshot(profile)},{...base,id:'unknown',exp:999999},{...base,id:'changed',exp:888888,combatSnapshot:huntCombatSnapshot({...profile,attack:21})}];
 const result=recommendHunting({profile,records:rows,now});assert.equal(result.measured.length,1);assert.equal(result.measured[0].sessions,1);assert.equal(result.measured[0].expPerHour,100);assert.equal(result.historical.length,2);
 assert.equal(huntComparability(rows[2],profile).status,'different');
 assert.equal(huntComparability(rows[0],{...profile,level:40}).status,'different');
 assert.equal(huntComparability({...rows[0],combatSnapshot:{...rows[0].combatSnapshot,magicAttack:null}},profile).status,'comparable');
});
test('missing income cannot inflate a balanced recommendation into fully verified coverage',()=>{
 const record={map:'A',minutes:10,exp:100,lootMode:'itemized',lootItems:[],mesoDelta:null,potions:null,travel:null,at,combatSnapshot:huntCombatSnapshot(profile)};
 const row=recommendHunting({profile,records:[record],now}).measured[0];
 assert.equal(row.netPerHour,null);assert.equal(row.scoreCoverage,.55);assert.ok(Math.abs(row.score-55)<1e-9);
});
test('map calibration only yields hourly scenarios for its own monster and matching profile',()=>{
 const monster={id:'mob',name:'Mob',level:30,hp:101,exp:50,mapIds:['map']},maps=[{id:'map',name:'Map',mobIds:['mob']}];
 const calibration={averageDamage:100,hitRate:100,attackSeconds:1,uptimePercent:50,maxKillsPerHour:1000,monsterId:'mob',profileSignature:huntProfileSignature(profile)};
 const input={profile,monsters:[monster],maps,mapCalibrations:{map:calibration},now};
 const row=recommendHunting(input).candidates[0];assert.equal(row.expPerHour,45000);assert.equal(row.calibratedMap.id,'map');assert.equal(row.netPerHour,null);
 assert.equal(recommendHunting({...input,profile:{...profile,attack:21}}).candidates[0].expPerHour,null);
 assert.equal(recommendHunting({...input,profile:{...profile,level:31}}).candidates[0].expPerHour,null);
 assert.equal(recommendHunting({...input,mapCalibrations:{map:{...calibration,monsterId:'other'}}}).candidates[0].expPerHour,null);
 assert.equal(recommendHunting({...input,mapCalibrations:{},calibration}).candidates[0].expPerHour,null);
});

test('all job paths match their own family without widening restricted jobs', () => {
  assert.equal(jobMatches(['warrior'], 'spearman'), true);
  assert.equal(jobMatches(['all'], 'cleric'), true);
  assert.equal(jobMatches(['assassin'], 'bandit'), false);
  assert.equal(jobMatches(['magician'], 'iceLightning'), true);
  assert.equal(jobMatches(['Warrior/Thief'], 'bandit'), true);
  assert.equal(currentJobForProfile({ job: 'fighter', level: 1 }), 'beginner');
  assert.equal(currentJobForProfile({ job: 'cleric', level: 8 }), 'beginner');
  assert.equal(currentJobForProfile({ job: 'cleric', level: 10 }), 'magician');
  assert.equal(currentJobForProfile({ job: 'cleric', level: 29 }), 'magician');
  assert.equal(currentJobForProfile({ job: 'cleric', level: 30 }), 'cleric');
  assert.equal(currentJobForProfile({ job: 'fighter', level: 30, currentJob: 'warrior' }), 'warrior');
  const quests = [{ id: 'tutorial', name: 'Tutorial', minLevel: 1, jobs: ['beginner'], mesos: 0 }];
  assert.equal(recommendQuests({ profile: { ...profile, level: 1 }, quests }).length, 1);
  assert.equal(recommendQuests({ profile, quests }).length, 0);
});

test('prices preserve sale evidence and reject expired or future observations', () => {
  const quotes = [offer('ore', 500), offer('ore', 20, 'sold')];
  assert.equal(priceEvidence(quotes, 'ore', { now }).price, 20);
  assert.equal(priceEvidence(quotes, 'ore', { now }).basis, 'observed-sale');
  assert.equal(priceEvidence(quotes, 'ore', { now, purpose: 'cost' }).price, 500);
  assert.equal(priceEvidence([offer('ore', 99, 'sold', { at: '2026-10-01' })], 'ore', { now }).price, null);
  assert.equal(priceEvidence([offer('ore', 99, 'sold', { at: '2027-10-01' })], 'ore', { now }).price, null);
  assert.equal(priceEvidence([offer('ore', 999)], 'ore', { now, npcSell: 5 }).basis, 'npc');
});
test('quest material costs use minimum bundle cash outlay rather than impossible single-unit purchases', () => {
  const quotes = [offer('ore', 1, 'sell', { originalPriceBasis: 'bundle', quantity: 100, minimumPurchaseQuantity: 100, minimumPurchaseTotal: 100 }), offer('ore', 2)];
  assert.equal(priceEvidence(quotes, 'ore', { now, purpose: 'cost', quantity: 1 }).purchaseCost, 2);
  const row = recommendQuests({ profile, now, prices: [quotes[0]], quests: [{ id: 'q', name: 'Q', minLevel: 1, mesos: 200, mesoCost:0, costsConfirmed:true, consumedItems:[{itemId:'ore',quantity:1}], requirements: [{ itemId: 'ore', quantity: 1 }] }] })[0];
  assert.equal(row.purchaseCost, 100); assert.equal(row.net, 100);
});

test('unknown drop probabilities never become expected profit', () => {
  const unknown = expectedDropValue({ dropItemIds: ['rare'] }, [{ id: 'rare' }], [offer('rare', 1000000, 'sold')], { now });
  assert.equal(unknown.expectedValuePerKill, null);
  assert.equal(unknown.knownPartialValue, 0);
  const observedOnly = expectedDropValue({ dropsComplete: true, drops: [{ itemId: 'rare', probability: .001, sourceUrl: 'https://example.org' }] }, [], [offer('rare', 1000000, 'sold')], { now });
  assert.equal(observedOnly.expectedValuePerKill, null);
  const verified = expectedDropValue({ dropsComplete: true, drops: [{ itemId: 'rare', quantity: 1, probability: .001, probabilityVerified: true, sourceUrl: 'https://example.org' }] }, [], [offer('rare', 1000000, 'sold')], { now });
  assert.equal(verified.expectedValuePerKill, 1000);
});

test('verified probabilities still require known quantities before contributing expected value', () => {
  const unknownQuantity = expectedDropValue({ dropsComplete: true, drops: [
    { itemId: 'rare', probability: .5, probabilityVerified: true, sourceUrl: 'https://example.org' },
    { itemId: 'ore', quantity: 2, probability: .25, probabilityVerified: true, sourceUrl: 'https://example.org' },
  ] }, [], [offer('rare', 1000000, 'sold'), offer('ore', 100, 'sold')], { now });
  assert.equal(unknownQuantity.expectedValuePerKill, null);
  assert.equal(unknownQuantity.complete, false);
  assert.equal(unknownQuantity.knownPartialValue, 50);
  assert.equal(unknownQuantity.verifiedCount, 1);
  assert.ok(unknownQuantity.missing.some(reason => reason.includes('드롭 수량 미확인')));
});

test('observed community drops retain uncertainty and cannot count missing quantities as one', () => {
  const drops = [{ itemId: 'ore', itemName: 'Ore', sampleKills: 100, sampleDrops: 10, confidenceLowPercent: 5, confidenceHighPercent: 15, minQuantity: 2, maxQuantity: 4, sourceUrl: 'https://example.org', category: 'etc' }, { itemId: 'mystery', sampleKills: 100, sampleDrops: 1, confidenceLowPercent: 0, confidenceHighPercent: 5, sourceUrl: 'https://example.org' }];
  const result = observedDropScenario({ drops }, [], [offer('ore', 100, 'sold')], { now });
  assert.equal(result.lowPerKill, 10);
  assert.equal(result.highPerKill, 60);
  assert.equal(result.complete, false);
  assert.equal(result.components.length, 1);
  assert.ok(result.missing[0].includes('수량'));
});

test('hunting rates weight duration rather than giving a one-minute run equal weight', () => {
  const { measured } = recommendHunting({ profile, now, comparison:{includeOtherSetups:true}, records: [
    { profileId: 'self', map: 'A', minutes: 1, exp: 1000, mesoDelta: 50, loot: 0, potions: 0, travel: 0, at },
    { profileId: 'self', map: 'A', minutes: 59, exp: 590, mesoDelta: 0, loot: 0, potions: 100, travel: 0, at },
    { profileId: 'someone-else', map: 'B', minutes: 60, exp: 9999999, at },
  ] });
  assert.equal(measured.length, 1);
  assert.ok(Math.abs(measured[0].expPerHour - 1590) < 1e-9);
  assert.ok(Math.abs(measured[0].netPerHour + 50) < 1e-9);
});

test('hunting reprices itemized loot but leaves incomplete revenue unknown', () => {
  const result = recommendHunting({ profile, now, comparison:{includeOtherSetups:true}, items: [{ id: 'ore' }], prices: [offer('ore', 400, 'sold')], records: [
    { map: 'A', minutes: 60, exp: 100, mesoDelta: 100, loot: 1, lootItems: [{ itemId: 'ore', quantity: 2 }], potions: 20, travel: 5, at },
    { map: 'B', minutes: 60, exp: 200, mesoDelta: 100, lootItems: [{ itemId: 'missing', quantity: 1 }], potions: 20, travel: 5, at },
  ] });
  assert.equal(result.measured.find(row => row.name === 'A').netPerHour, 875);
  assert.equal(result.measured.find(row => row.name === 'B').netPerHour, null);
});

test('theoretical kill upper bound remains separate from estimated hourly performance', () => {
  const result = recommendHunting({ profile, now, monsters: [{ id: 'mob', name: 'Mob', level: 30, hp: 101, exp: 50 }], calibration: { averageDamage: 100, hitRate: 100, attackSeconds: 1 } });
  assert.equal(result.candidates[0].hits, 2);
  assert.equal(result.candidates[0].expCeiling, 90000);
  assert.equal(result.candidates[0].expPerHour, null);
  assert.equal(result.candidates[0].netPerHour, null);
});

test('quest chains deduplicate shared prerequisites and charge owned material opportunity cost', () => {
  const quests = [
    { id: 'start', name: 'Start', minLevel: 1, mesos: 100, exp: 10, requirements: [{ itemId: 'ore', quantity: 2 }], estimatedMinutes: 5 },
    { id: 'left', name: 'Left', minLevel: 1, mesos: 10, exp: 10, prerequisiteIds: ['start'], estimatedMinutes: 5 },
    { id: 'right', name: 'Right', minLevel: 1, mesos: 20, exp: 10, prerequisiteIds: ['start'], estimatedMinutes: 5 },
    { id: 'end', name: 'End', minLevel: 1, mesos: 1000, exp: 10, prerequisiteIds: ['left', 'right'], requirements: [{ itemId: 'ore', quantity: 2 }], estimatedMinutes: 5 },
  ];
  const row = recommendQuests({ profile, quests:quests.map(q=>({...q,mesoCost:0,costsConfirmed:true,consumedItems:q.requirements??[]})), prices: [offer('ore', 50, 'sold'), offer('ore', 80)], inventory: { ore: 2 }, now }).find(row => row.id === 'end');
  assert.equal(row.plan.length, 4);
  assert.equal(row.cost, 260);
  assert.equal(row.purchaseCost, 160);
  assert.equal(row.net, 870);
  assert.equal(row.minutes, 20);
  assert.equal(row.netPerHour, 2610);
});

test('canonical catalog IDs preserve earlier quest progress and material inventory without double counting', () => {
  const quests = [{ id: '1', legacyId: 'old-start', name: 'Start', minLevel: 1, mesos: 0 }, { id: '2', name: 'Next', minLevel: 1, mesos: 10, prerequisiteIds: ['1'], requirements: [{ itemId: '100', quantity: 2 }] }];
  const result = recommendQuests({ profile, quests, items: [{ id: '100', legacyId: 'old-ore', npcSell: 1 }], completed: { 'old-start': true }, inventory: { 'old-ore': 3, '100': 1 }, prices: [offer('100', 2)], now });
  assert.equal(result.length, 1);
  assert.equal(result[0].prerequisites.length, 0);
  assert.equal(result[0].materials[0].owned, 1);
  assert.equal(result[0].materials[0].buyQuantity, 1);
});

test('quest unknown facts and cyclic or missing prerequisites prevent false actionable profit', () => {
  const quests = [
    { id: 'a', name: 'A', minLevel: 1, mesos: null, rewardsComplete: false, requirementsComplete: false, prerequisiteIds: ['b'] },
    { id: 'b', name: 'B', minLevel: 1, mesos: 100, prerequisiteIds: ['a', 'missing'] },
  ];
  const row = recommendQuests({ profile, quests, now })[0];
  assert.equal(row.available, false);
  assert.equal(row.net, null);
  assert.equal(row.minutes, null);
  assert.ok(row.missing.some(value => value.includes('순환')));
  assert.ok(row.missing.some(value => value.includes('missing')));
});

test('verified progression tasks have explicit priority over profitable optional quests', () => {
  const quests = [{ id: 'money', name: 'Money', minLevel: 1, mesos: 1000000 }, { id: 'advance', name: 'Advance', minLevel: 30, mesos: 0, questType: 'Job advancement' }];
  assert.equal(recommendQuests({ profile, quests, now })[0].id, 'advance');
});

test('unknown quest level is not treated as level zero and random rewards never sum', () => {
  const rows = recommendQuests({ profile, now, quests: [{ id: 'unknown', name: 'Unknown', minLevel: null, mesos: 100 }, { id: 'random', name: 'Random', minLevel: 1, mesos: 100, rewardChoices: [{ itemId: 'ore', quantity: 1 }, { itemId: 'ore', quantity: 100 }] }], prices: [offer('ore', 1000000, 'sold')] });
  assert.equal(rows.find(row => row.id === 'unknown').available, false);
  assert.equal(rows.find(row => row.id === 'random').knownPartialReward, 100);
  assert.equal(rows.find(row => row.id === 'random').net, null);
});

test('citizenship and selected current rotation are required, not all board-pool quests at once', () => {
  const quest = { id: 'daily-a', name: 'Daily', minLevel: 12, mesos: 100, citizenshipTown: 'Henesys', citizenshipGrade: 2, rotationPool: true, repeatPeriod: 'daily' };
  const date = new Date(now).toLocaleDateString('en-CA');
  assert.equal(questGateEvidence(quest, profile, { now }).blocked, true);
  const citizenship = { Henesys: { resident: true, grade: 2, dailyQuestId: 'daily-a', dailySelectedOn: date } };
  assert.equal(questGateEvidence(quest, profile, { citizenship, now }).blocked, false);
  assert.equal(questGateEvidence({ ...quest, id: 'daily-b' }, profile, { citizenship, now }).blocked, true);
  assert.equal(questGateEvidence(quest, profile, { citizenship: { Henesys: { ...citizenship.Henesys, dailySelectedOn: '2000-01-01' } }, now }).blocked, true);
  assert.equal(recommendQuests({ profile, quests: [quest], citizenship, now })[0].available, true);
});

test('quest fame, profession, completion level, fee and event gates cannot silently pass', () => {
  const quest = { id: 'gated', name: 'Gated', minLevel: 1, completeLevel: 40, requiredFame: 10, profession: 'Smithing', professionLevel: 5, mesoCost: 100, mesos: 200 };
  const unknown = questGateEvidence(quest, profile, { now });
  assert.equal(unknown.blocked, true); assert.ok(unknown.reasons.length >= 3);
  const known = { ...profile, level: 40, fame: 10, mesos: 100, professions: { Smithing: 5 } };
  assert.equal(questGateEvidence(quest, known, { now }).blocked, false);
  assert.equal(recommendQuests({ profile: known, quests: [quest], now })[0].net, 100);
  assert.equal(questGateEvidence({ ...quest, availableUntil: '2026-01-01T00:00:00Z' }, known, { now }).blocked, true);
  assert.equal(questGateEvidence({ ...quest, availableFrom: '2027-01-01T00:00:00Z' }, known, { now }).blocked, true);
});

test('explicit recent game condition checks resolve unknowns, never known unmet gates or forever', () => {
  const quest = { id: 'q', requiredFame: 10, conditionsComplete: false, conditionsVerifiedAt: at };
  assert.equal(questGateEvidence(quest, profile, { now }).blocked, false);
  assert.equal(questGateEvidence(quest, { ...profile, fame: 1 }, { now }).blocked, true);
  assert.equal(questGateEvidence(quest, profile, { now: now + 2 * 3600000 }).blocked, true);
});

test('equipment optimizer beats attack-per-price greedy and chooses the cheaper equal offer', () => {
  const result = optimizeEquipment({ profile, now, budget: 10, candidates: [item('sword', '무기', 6, 9), item('glove', '장갑', 4, 6), item('expensive-sword', '무기', 10, 10), item('same-sword-more', '무기', 8, 9)] });
  assert.equal(result.exact, true);
  assert.equal(result.best.utility, 15);
  assert.equal(result.best.cost, 10);
  assert.deepEqual(new Set(result.best.items.map(row => row.id)), new Set(['sword', 'glove']));
});

test('equipment refresh uses the lowest fresh identical option ask, excluding stronger rolls and closed listings', () => {
  const candidate = { ...item('candidate', '무기', 100, 17), itemId: 'sword', options: { attack: 17, slots: 7 }, optionsComplete: true };
  const quotes = [offer('sword', 40, 'sell', { options: { attack: 17, slots: 7 }, optionsComplete: true }), offer('sword', 1, 'sell', { options: { attack: 19, slots: 7 }, optionsComplete: true }), offer('sword', 10, 'sell', { options: { attack: 17, slots: 7 }, optionsComplete: true, active: false }), offer('sword', 5, 'sell', { options: { attack: 17, slots: 7 }, optionsComplete: true, at: new Date(now - 6 * 60000).toISOString() })];
  const [result] = repriceEquipmentCandidates([candidate], quotes, now);
  assert.equal(result.price, 40);
  assert.equal(result.repriced, true);
  assert.equal(repriceEquipmentCandidates([{ ...candidate, optionsComplete: false }], quotes, now)[0].price, 100);
});

test('bulk gear import requires full actual options and wearing facts, and keeps the cheapest equal roll', () => {
  const item = { id: 'sword', name: 'Sword', category: 'equip', subCategory: 'One-Handed Sword', isCash: false, requiredLevel: 10, requiredJobs: ['all'], requiredGender: 2, statRequirements: { str: 10, dex: 0, int: 0, luk: 0 } };
  const options = { attack: 20, magicAttack: 0, str: 0, dex: 0, int: 0, luk: 0, accuracy: 0, slots: 7 };
  const quotes = [offer('sword', 20, 'sell', { id: 'expensive', options, optionsComplete: true }), offer('sword', 10, 'sell', { id: 'cheap', options, optionsComplete: true }), offer('sword', 1, 'sell', { id: 'partial', options: { attack: 20 }, optionsComplete: true }), offer('sword', 2, 'sell', { id: 'old', at: new Date(now - 600000).toISOString(), options, optionsComplete: true }), offer('sword', 2, 'sell', { id: 'bundle', originalPriceBasis: 'bundle', options, optionsComplete: true })];
  const result = equipmentCandidatesFromQuotes({ items: [item], prices: quotes, profile, now });
  assert.equal(result.candidates.length, 1); assert.equal(result.candidates[0].price, 10); assert.equal(result.excluded.length, 3);
  assert.equal(equipmentCandidatesFromQuotes({ items: [{ ...item, statRequirements: { ...item.statRequirements, luk: null } }], prices: quotes, profile, now }).candidates.length, 0);
  assert.equal(equipmentCandidatesFromQuotes({ items: [{ ...item, isCash: true }], prices: quotes, profile, now }).candidates.length, 0);
  assert.equal(equipmentCandidatesFromQuotes({ items: [{ ...item, requiredJobs: [] }], prices: quotes, profile, now }).candidates.length, 0);
});

test('bounded optimizer matches exhaustive search across small budgets and accuracy constraints', () => {
  for (let seed = 1; seed <= 25; seed++) {
    let randomState = seed;
    const random = max => (randomState = Math.imul(randomState, 1664525) + 1013904223 >>> 0) % max;
    const candidates = ['무기', '모자', '장갑'].flatMap((slot, i) => Array.from({ length: 3 }, (_, k) => item(`${i}-${k}`, slot, random(10), random(12), { stats: { attack: random(12), accuracy: random(5) } })));
    const budget = random(20), minimum = 10 + random(8);
    let expected = null;
    const groups = ['무기', '모자', '장갑'].map(slot => [null, ...candidates.filter(row => row.slot === slot)]);
    for (const first of groups[0]) for (const second of groups[1]) for (const third of groups[2]) {
      const selected = [first, second, third].filter(Boolean);
      const cost = selected.reduce((sum, row) => sum + row.price, 0), attack = selected.reduce((sum, row) => sum + row.stats.attack, 0), accuracy = 10 + selected.reduce((sum, row) => sum + row.stats.accuracy, 0);
      if (cost > budget || accuracy < minimum) continue;
      if (!expected || attack > expected.attack || attack === expected.attack && cost < expected.cost) expected = { attack, cost };
    }
    const result = optimizeEquipment({ profile, candidates, budget, minAccuracy: minimum, now });
    assert.equal(result.exact, true);
    assert.deepEqual(result.best && { attack: result.best.utility, cost: result.best.cost }, expected, `seed ${seed}`);
  }
});

test('equipment respects job, level, minimum accuracy, locks and existing zero-cost equipment', () => {
  const old = item('old', '무기', 99, 5, { stats: { attack: 5, accuracy: 2 } });
  const result = optimizeEquipment({ profile: { ...profile, attack: 25, accuracy: 12 }, now, equipped: { 무기: old }, locked: { 무기: 'old' }, budget: 10, minAccuracy: 20, candidates: [
    item('new', '무기', 1, 100), item('glove', '장갑', 10, 3, { stats: { attack: 3, accuracy: 8 } }),
    item('wrong-job', '모자', 1, 100, { requirements: { jobs: ['cleric'] } }),
    item('too-high', '망토', 1, 100, { requirements: { level: 31 } }),
  ] });
  assert.equal(result.best.cost, 10);
  assert.equal(result.best.stats.accuracy, 20);
  assert.equal(result.best.stats.attack, 28);
  assert.ok(result.best.items.some(row => row.id === 'old'));
  assert.equal(result.excluded.length, 2);
});

test('equipment prevents circular stat support and incompatible overall or two-handed gear', () => {
  const result = optimizeEquipment({ profile: { ...profile, str: 10, dex: 10 }, now, budget: 100, candidates: [
    item('cyclicA', '모자', 1, 100, { stats: { attack: 100, str: 10 }, requirements: { dex: 20 } }),
    item('cyclicB', '신발', 1, 100, { stats: { attack: 100, dex: 10 }, requirements: { str: 20 } }),
    item('twohand', '무기', 1, 20, { twoHanded: true }), item('shield', '방패', 1, 10),
    item('overall', '한벌옷', 1, 15), item('top', '상의', 1, 10), item('bottom', '하의', 1, 10),
  ] });
  assert.equal(result.best.utility, 40);
  assert.ok(!result.best.items.some(row => row.id.startsWith('cyclic')));
  assert.ok(!result.best.items.some(row => row.id === 'shield'));
  assert.ok(!result.best.items.some(row => row.id === 'overall'));
});

test('equipment target mode minimizes real cost and reports bounded searches honestly', () => {
  const candidates = [item('cheap', '무기', 5, 10), item('best', '무기', 20, 100), item('glove', '장갑', 2, 1)];
  const result = optimizeEquipment({ profile, now, budget: 30, targetUtility: 10, candidates });
  assert.equal(result.best.cost, 5);
  assert.equal(result.best.utility, 10);
  assert.equal(optimizeEquipment({ profile, now, budget: 30, candidates, maxNodes: 1 }).exact, false);
});

test('damage breakpoints use supplied calibration and avoid inventing a damage formula', () => {
  const candidates = [item('upgrade', '무기', 10, 2)];
  const result = optimizeEquipment({ profile, now, budget: 10, candidates, calibration: { averageDamage: 95, monsterHp: 100, damagePerAttack: 3, damagePerStat: 0 } });
  assert.equal(result.best.impact.beforeHits, 2);
  assert.equal(result.best.impact.afterHits, 1);
  assert.equal(optimizeEquipment({ profile, now, budget: 10, candidates }).best.impact, null);
});

test('an active one-hour hunt holds an old recommendation until the activity ends', () => {
  const snapshot = { generatedAt: new Date(now - 90 * 60000).toISOString() };
  const session = { endsAt: new Date(now + 30 * 60000).toISOString() };
  assert.deepEqual(snapshotStatus(snapshot, session, now), { ageMs: 90 * 60000, locked: true, stale: true, refreshAllowed: false, shouldRefresh: false, lockUntil: session.endsAt });
  assert.equal(snapshotStatus(snapshot, session, now + 31 * 60000).shouldRefresh, true);
});
