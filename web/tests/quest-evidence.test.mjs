import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {normalizeQuestEvidence,questEvidenceSignature} from '../lib/quest-evidence.mjs';
import {normalizeQuestDetail} from '../lib/public-catalog.mjs';

// Real MCW/1 responses collected 2026-10-21, with narrative messages omitted.
const fixtures=JSON.parse(await readFile(new URL('./fixtures/quest-evidence-mcw1.json',import.meta.url),'utf8'));
const fixture=id=>structuredClone(fixtures.find(e=>String(e.raw.id)===id));
const data={items:[{id:'2010002',name:'달걀'},{id:'4000016',name:'버섯의 포자'},{id:'4000019',name:'돼지의 리본'}],npcs:[{id:'11',name:'마이'}]};
const maiIndex={id:'1009',name:'마이의 훈련',rewardItems:[{itemId:'2010002',quantity:10}],rewardChoices:[]};

test('actual Mai source resolves exact jobs, NPC, kills and no invented mesos',()=>{
  const e=fixture('1009'),row=normalizeQuestEvidence(e.raw,maiIndex,data,e);
  assert.deepEqual(row.clientJobCodes,[0]);assert.deepEqual(row.jobs,['beginner']);
  assert.equal(row.npcId,'11');assert.equal(row.turnInNpcId,'11');assert.equal(row.npc,'마이');
  assert.deepEqual(row.prerequisiteIds,['1006']);assert.deepEqual(row.killRequirements.map(r=>r.quantity),[10,10,5]);
  assert.equal(row.exp,80);assert.equal(row.mesos,null);
  assert.equal(row.clientRequirementsComplete,true);assert.equal(row.clientConditionsComplete,true);
  assert.equal(row.conditionsComplete,true);assert.equal(row.sourceConfidence,'client-reference');
  assert.equal(row.conditionEvidence.serverBehaviorVerified,false);
  assert.equal(row.rewardEvidence.rawMoneyActionPresent,false);
});

test('Jane random raw prop is not a percentage and lexical WZ positions survive',()=>{
  const e=fixture('10002'),row=normalizeQuestEvidence(e.raw,{id:'10002'},data,e);
  assert.equal(row.rewardItems.length,0);assert.equal(row.rewardChoices.length,14);
  assert.equal(row.rewardsComplete,false);assert.equal(row.mesos,658);
  assert.equal(row.requirements.length,2);assert.deepEqual(row.consumedItems.map(i=>i.quantity),[15,15]);
  assert.ok(row.consumedItems.every(i=>i.stage==='complete'));
  const source10=row.rawRewardItems.find(r=>r.itemId==='2044401');
  assert.equal(source10.position,2);assert.equal(source10.rawPosition,10);assert.equal(source10.rawProp,1);
  assert.equal(source10.probability,undefined);assert.equal(row.rewardChoices[0].chancePercent,null);
  assert.ok(row.clientReceivedItems.every(i=>i.quantity>0));
});

test('explicit scripts and unknown raw fields stay unresolved',()=>{
  const e=fixture('1002'),row=normalizeQuestEvidence(e.raw,{id:'1002'},data,e);
  assert.equal(row.clientRequirementsComplete,false);assert.equal(row.conditionsComplete,false);
  assert.equal(row.conditionEvidence.explicitScript,true);assert.equal(row.conditionEvidence.serverScriptUnknown,true);
  assert.ok(row.conditionEvidence.unknownFields.includes('startscript'));
  const ordinary=fixture('1009');ordinary.nodes['Check/0'].raw.children.push('unknownCondition');
  assert.equal(normalizeQuestEvidence(ordinary.raw,maiIndex,data,ordinary).conditionsComplete,false);
});

test('missing WZ nodes and unresolved source conditions cannot assert completeness',()=>{
  const e=fixture('1009');e.nodes['Check/0'].raw={type:0,children:[]};
  assert.equal(normalizeQuestEvidence(e.raw,maiIndex,data,e).conditionsComplete,false);
  const f=fixture('1009');f.raw.requirementToStart.jobs=[999];
  assert.equal(normalizeQuestEvidence(f.raw,maiIndex,data,f).conditionsComplete,false);
  assert.equal(normalizeQuestEvidence(fixture('1009').raw,{...maiIndex,rotationPool:true},data,fixture('1009')).conditionsComplete,false);
  assert.throws(()=>normalizeQuestEvidence(null));
  assert.throws(()=>normalizeQuestEvidence(f.raw,{id:'different'}));
});

test('fresh detail only reuses raw WZ evidence for an unchanged API payload',()=>{
  const e=fixture('1009'),snapshot=normalizeQuestEvidence(e.raw,maiIndex,data,e);
  assert.equal(snapshot.metadataInputSignature,questEvidenceSignature(e.raw));
  assert.equal(normalizeQuestDetail(e.raw,snapshot,data).conditionsComplete,true);
  e.raw.requirementToStart.levelMinimum++;
  assert.equal(normalizeQuestDetail(e.raw,snapshot,data).conditionsComplete,false);
});

test('actual citizenship gates preserve grade5 instead of generic resident eligibility',()=>{
  const e=fixture('506018'),row=normalizeQuestEvidence(e.raw,{id:'506018',citizenshipTown:'Henesys',rotationPool:true},data,e);
  assert.equal(row.clientCitizenshipTownCode,1);assert.equal(row.citizenshipTown,'Henesys');
  assert.equal(row.citizenshipGrade,5);assert.equal(row.conditionsComplete,false);
  assert.ok(row.conditionEvidence.additionalChecks.some(c=>c.key==='citizenshipGrade'&&c.value===5&&c.sourceUrl.endsWith('/citizenshipGrade')));
});

test('zero successful rows never overwrite an existing enrichment manifest',async()=>{
  const path=new URL('../content/quest-metadata.json',import.meta.url),before=await readFile(path,'utf8');
  const result=spawnSync(process.execPath,['scripts/enrich-quests.mjs','--ids=not-a-quest','--cache-only','--write'],{cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:15000});
  assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/"normalized": 0/);
  assert.equal(await readFile(path,'utf8'),before);
});
