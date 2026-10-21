import test from 'node:test';import assert from 'node:assert/strict';import {confirmHuntSetup,createHuntDraft,experienceGain,huntCombatSnapshot,itemizeHuntRecord,isHuntActivity,ocrNumberCandidates,recordedLootValue,validateHuntFinish,validateHuntStart,validateLootItems} from '../lib/hunt-session.mjs';
test('session EXP survives level-up and refuses guessed high-level totals',()=>{assert.equal(experienceGain(1,10,2,20),25);assert.equal(experienceGain(49,10,50,5),655195);assert.equal(experienceGain(50,10,51,5),null);assert.equal(experienceGain(10,100,10,50),null);assert.equal(experienceGain(1,15,2,0),null);});
test('OCR candidates exclude percentages and never silently assume which number is EXP',()=>{assert.deepEqual(ocrNumberCandidates('EXP 1,234 (12.34%) HP 500/500'),[1234,500]);});
const now=Date.parse('2026-10-21T12:00:00Z'),session={profileId:'one',map:'A',level:10,exp:100,startedAt:new Date(now-600000).toISOString(),activityId:'activity-one'};
const finish={session,endLevel:10,endExp:200,manualExp:'',gross:100,potions:20,travel:5,loot:30,now};
test('start validates level, EXP cap, map and existing active locks',()=>{
 assert.deepEqual(validateHuntStart({level:1,exp:14,map:'A',now}),[]);
 assert.ok(validateHuntStart({level:1,exp:15,map:'A',now}).length);
 assert.ok(validateHuntStart({level:1.5,exp:0,map:'A',now}).length);
 assert.ok(validateHuntStart({level:10,exp:0,map:' ',now}).length);
 assert.ok(validateHuntStart({level:10,exp:0,map:'A',running:session,now}).length);
 const activity={mode:'quests',name:'Quest',endsAt:new Date(now+60000).toISOString()};
 assert.ok(validateHuntStart({level:10,exp:0,map:'A',activity,now}).length);
 assert.deepEqual(validateHuntStart({level:10,exp:0,map:'A',activity:{...activity,mode:'training',name:'A'},now}),[]);
});
test('finish keeps gross income separate and returns exact elapsed time and EXP',()=>{
 const result=validateHuntFinish(finish);assert.deepEqual(result.errors,[]);assert.equal(result.gain,100);assert.equal(result.elapsedMs,600000);assert.equal(result.endingExp,200);
});
test('negative, empty, fractional and nonfinite income or cost cannot be saved',()=>{
 for(const field of ['gross','potions','travel','loot'])for(const bad of [-1,NaN,Infinity,'',null,.5])assert.ok(validateHuntFinish({...finish,[field]:bad}).errors.length,`${field}: ${bad}`);
 for(const bad of [-1,NaN,Infinity,'wrong',.5])assert.ok(validateHuntFinish({...finish,manualExp:bad}).errors.length);
 assert.ok(validateHuntFinish({...finish,endLevel:10.5}).errors.length);
 assert.ok(validateHuntFinish({...finish,now:Date.parse(session.startedAt)+999}).errors.length);
 assert.ok(validateHuntFinish({...finish,session:{...session,startedAt:'invalid'}}).errors.length);
});
test('manual EXP works above unknown curves but cannot contradict a confirmed level range',()=>{
 const unknown={...session,level:50,exp:100};
 const result=validateHuntFinish({...finish,session:unknown,endLevel:51,manualExp:5000});assert.deepEqual(result.errors,[]);assert.equal(result.gain,5000);assert.equal(result.endingExp,null);
 assert.ok(validateHuntFinish({...finish,endLevel:10,manualExp:5000}).errors.some(e=>e.includes('일치')));
 const known=validateHuntFinish({...finish,endLevel:11,manualExp:1700});assert.deepEqual(known.errors,[]);assert.equal(known.endingExp,84);
});
test('drafts begin with valid profile EXP and activity cleanup only matches its own session',()=>{
 assert.equal(createHuntDraft({level:1,exp:12}).startExp,12);
 assert.equal(createHuntDraft({level:1,exp:999}).startExp,0);
 assert.equal(isHuntActivity({id:'activity-one',name:'A',mode:'training'},session),true);
 assert.equal(isHuntActivity({id:'other',name:'A',mode:'training'},session),false);
 assert.equal(isHuntActivity({id:'legacy',name:'A',mode:'training'},{...session,activityId:undefined}),true);
});
test('itemized quantities and fractional unit references are preserved, never added to an old aggregate',()=>{
 const old={id:'old',mesoDelta:100,potions:20,travel:5,loot:999};
 const rows=[{itemId:'ore',name:'Ore',quantity:'3',recordedUnitPrice:.3,recordedPriceBasis:'observed-sale'}];
 const result=itemizeHuntRecord(old,rows,now);assert.deepEqual(result.errors,[]);assert.equal(result.record.lootMode,'itemized');
 assert.ok(Math.abs(result.record.loot-.9)<1e-10);assert.equal(result.record.previousAggregateLoot,999);assert.equal(result.record.lootItems[0].quantity,3);
 assert.equal(old.loot,999);assert.equal(rows[0].quantity,'3');
 const unknown=itemizeHuntRecord(old,[{itemId:'ore',quantity:3,recordedUnitPrice:null}],now);assert.equal(unknown.record.loot,null);
});
test('itemized loot rejects duplicate, fractional and nonfinite quantities while unknown prices stay unknown',()=>{
 for(const bad of [0,-1,1.5,Infinity,NaN,'',null])assert.ok(validateLootItems([{itemId:'ore',quantity:bad}]).length);
 assert.ok(validateLootItems([{itemId:'ore',quantity:1},{itemId:'ore',quantity:2}]).length);
 assert.ok(validateLootItems([{itemId:'ore',quantity:1,recordedUnitPrice:-1}]).length);
 assert.equal(recordedLootValue([{itemId:'ore',quantity:1,recordedUnitPrice:null}]),null);
 assert.equal(recordedLootValue([{itemId:'ore',quantity:2,recordedUnitPrice:0}]),0);
 assert.equal(recordedLootValue([]),0);
});
test('EXP-only sessions can preserve unknown cash, but never silently assume no drops',()=>{
 const value={...finish,lootMode:'itemized',lootItems:[],allowUnknownCash:true,gross:'',potions:'',travel:''};
 assert.ok(validateHuntFinish(value).errors.some(e=>e.includes('전리품')));
 assert.deepEqual(validateHuntFinish({...value,noLootConfirmed:true}).errors,[]);
 assert.ok(validateHuntFinish({...value,noLootConfirmed:true,potions:-1}).errors.length);
 assert.deepEqual(validateHuntFinish({...value,lootItems:[{itemId:'ore',quantity:1,recordedUnitPrice:null}]}).errors,[]);
 assert.equal(createHuntDraft({level:1,exp:0}).gross,'');
 const snapshot=huntCombatSnapshot({job:'fighter',level:10,str:40,attack:20});assert.equal(snapshot.str,40);assert.equal(snapshot.magicAttack,null);
});
test('backfill confirmation can add missing conditions but never erase known different conditions',()=>{
 const profile={job:'fighter',level:30,str:100,attack:50};
 assert.deepEqual(confirmHuntSetup({},profile).errors,[]);
 assert.ok(confirmHuntSetup({job:'cleric'},profile).errors.length);
 assert.ok(confirmHuntSetup({level:10},profile).errors.length);
 assert.ok(confirmHuntSetup({combatSnapshot:{attack:40}},profile).errors.length);
});
