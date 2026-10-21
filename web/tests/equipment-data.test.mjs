import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeEquipmentMetadata,jobsFromEquipmentMask,equipmentMetadataCoverage} from '../lib/equipment-data.mjs';
const fetchedAt='2026-10-21T06:18:13.000Z';
const sabre={id:1302002,description:{name:'Sabre'},typeInfo:{overallCategory:'Equip',category:'One-Handed Weapon',subCategory:'One-Handed Sword'},metaInfo:{cash:false,reqSTR:30,reqDEX:10,reqINT:0,reqLUK:0,reqJob:1,reqLevelEquip:15,tuc:7,attack:1,attackSpeed:4}};
const index={id:'1302002',name:'사브르',category:'equip',isCash:false,stats:{attack:32},statRequirements:{str:999,dex:999,int:null,luk:null},requiredJobs:['all']};
test('actual MCW explicit zero requirements override stale Wiki facts without inventing omitted conditions',()=>{
 const item=normalizeEquipmentMetadata(sabre,index,{fetchedAt});
 assert.deepEqual(item.statRequirements,{str:30,dex:10,int:0,luk:0});assert.equal(item.requiredLevel,15);assert.deepEqual(item.requiredJobs,['warrior']);assert.equal(item.slots,7);
 assert.equal(item.coreRequirementsComplete,true);assert.equal(item.wearingRequirementsComplete,false);assert.deepEqual(item.extraRequirementUnknowns,['fame','secondaryJob','specialJob']);
 assert.equal(item.metadataSourceUrl,'https://maplestory.io/api/MCW/1/item/1302002');assert.equal(item.metadataFetchedAt,fetchedAt);
});
test('attack animation flag cannot replace real weapon attack; WZ incWAT value can',()=>{
 assert.equal(normalizeEquipmentMetadata(sabre,index,{fetchedAt}).stats.attack,32);
 const empty=normalizeEquipmentMetadata(sabre,{...index,stats:{}},{fetchedAt});assert.equal(empty.stats.attack,undefined);
 const item=normalizeEquipmentMetadata(sabre,index,{fetchedAt,wzStats:{attack:{value:32,field:'incWAT',sourceUrl:'https://maplestory.io/api/wz/MCW/1/Character/Weapon/01302002.img/info/incWAT',fetchedAt}}});
 assert.equal(item.stats.attack,32);assert.equal(item.statSources.attack.field,'incWAT');
});
test('missing requirement remains null and prevents complete-core eligibility',()=>{
 const raw=structuredClone(sabre);delete raw.metaInfo.reqLUK;
 const item=normalizeEquipmentMetadata(raw,index,{fetchedAt});assert.equal(item.statRequirements.luk,null);assert.equal(item.coreRequirementsComplete,false);assert.ok(item.requirementUnknowns.includes('luk'));
 raw.metaInfo.reqJob=null;assert.equal(normalizeEquipmentMetadata(raw,index).jobsComplete,false);
});
test('current Iron Dagger is Thief, DEX20 LUK40 STR0 rather than prelaunch mixed requirement',()=>{
 const raw={...sabre,id:1332007,metaInfo:{...sabre.metaInfo,reqSTR:0,reqDEX:20,reqLUK:40,reqJob:8,reqLevelEquip:25}};
 const item=normalizeEquipmentMetadata(raw,{...index,id:'1332007',requiredJobs:['Warrior/Thief'],statRequirements:{str:20,dex:null,int:null,luk:40}});
 assert.deepEqual(item.requiredJobs,['thief']);assert.equal(item.statRequirements.str,0);assert.equal(item.statRequirements.dex,20);
});
test('job masks keep explicit unrestricted/beginner/multifamily meanings and reject unknown bits',()=>{
 assert.deepEqual(jobsFromEquipmentMask(0),{jobs:['all'],complete:true});assert.deepEqual(jobsFromEquipmentMask(-1),{jobs:['beginner'],complete:true});assert.deepEqual(jobsFromEquipmentMask(9).jobs,['warrior','thief']);assert.equal(jobsFromEquipmentMask(32).complete,false);assert.equal(jobsFromEquipmentMask(undefined).complete,false);
});
test('response identity/type mismatches cannot enrich an unrelated catalog entry',()=>{
 assert.throws(()=>normalizeEquipmentMetadata({...sabre,id:1302000},index),/mismatch/);
 assert.throws(()=>normalizeEquipmentMetadata({...sabre,typeInfo:{overallCategory:'Use'}},index),/mismatch/);
 const item={...index,...normalizeEquipmentMetadata(sabre,index,{fetchedAt})};assert.equal(equipmentMetadataCoverage([item]).coreRequirementsComplete,1);
});
test('public WZ scalar fallback retains its own provenance and actual fame condition',()=>{
 const item=normalizeEquipmentMetadata({...sabre,id:1062001,metaInfo:{...sabre.metaInfo,reqPOP:20}},{...index,id:'1062001'},{fetchedAt,sourceUrl:'https://maplestory.io/api/wz/MCW/1/Character/Pants/01062001.img/info',rawSourceFormat:'scalar-properties-reassembled'});
 assert.equal(item.extraRequirements.fame,20);assert.equal(item.metadataFormat,'scalar-properties-reassembled');assert.match(item.metadataSourceUrl,/api\/wz\//);assert.ok(!item.extraRequirementUnknowns.includes('fame'));
});
test('bundled ordinary equipment has explicit core requirements except the actual unknown GM hat',async()=>{
 const data=JSON.parse(await readFile(new URL('../content/public-catalog.json',import.meta.url)));
 const normal=data.items.filter(i=>String(i.category).toLowerCase()==='equip'&&i.isCash===false&&!['Face','Hair','Head'].includes(i.subCategory));
 assert.equal(normal.length,1203);assert.equal(normal.filter(i=>i.coreRequirementsComplete).length,1202);
 const missing=normal.filter(i=>!i.coreRequirementsComplete);assert.deepEqual(missing.map(i=>i.id),['1002998']);assert.equal(missing[0].statRequirements.str,null);
 const coat=normal.find(i=>i.id==='1040046');assert.equal(coat.metadataFormat,'scalar-properties-reassembled');assert.deepEqual(coat.statRequirements,{str:0,dex:20,int:0,luk:50});
 const dagger=normal.find(i=>i.id==='1332007');assert.deepEqual(dagger.requiredJobs,['thief']);assert.equal(dagger.stats.attack,40);
 const wand=normal.find(i=>i.id==='1372000');assert.equal(wand.stats.attack,18);assert.equal(wand.stats.magicAttack,27);
 assert.equal(normal.filter(i=>i.extraRequirements?.fame>0).length,15);
});
