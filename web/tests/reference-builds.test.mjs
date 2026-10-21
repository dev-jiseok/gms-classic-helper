import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SKILLS} from '../lib/job-data.mjs';import {validateSkillPlan} from '../lib/combat.mjs';import {buildReferenceDraft} from '../lib/reference-builds.mjs';
const sum=d=>Object.values(d.points).reduce((a,b)=>a+b,0);
test('community reference builds obey prerequisites and separate SP budgets at each intermediate level',()=>{
 for(const [jobId,weapon] of [['warrior','sword'],['thief','claw'],['bowman','bow'],['fighter','sword'],['fighter','axe'],['assassin','claw'],['hunter','bow']]){
  const d=buildReferenceDraft({jobId,weapon,level:70});assert.deepEqual(d.errors,[],jobId);assert.equal(d.reference,true);assert.equal(d.spRule,'tier-only');for(const row of d.rows)assert.deepEqual(validateSkillPlan(SKILLS[jobId],row.points,row.budgets,{tierOnly:true}),[],jobId+row.level);
  assert.ok(d.sources.every(s=>s.url.startsWith('https://meowdb.com/msclassic/ko/guides/')));
 }
});
test('published level30 and70 endpoints are preserved instead of silently re-optimized',()=>{
 const level30={warrior:{'Power Strike':20,'Slash Blast':20,'Precise Strikes':15,'Improved HP Recovery':3,'Max HP Increase':3},thief:{'Lucky Seven':20,'Nimble Body':15,'Keen Eyes':15,Disorder:3,'Dark Sight':8},bowman:{'Arrow Blow':20,'Critical Shot':15,'The Eye of Amazon':15,Focus:10,'Power Knockback':1}};
 for(const [jobId,expected] of Object.entries(level30)){const d=buildReferenceDraft({jobId,weapon:{thief:'claw',bowman:'bow'}[jobId]??'sword',level:30});assert.equal(sum(d),61);for(const [en,amount] of Object.entries(expected))assert.equal(d.points[SKILLS[jobId].find(s=>s.en===en).id],amount);}
 const fighter=buildReferenceDraft({jobId:'fighter',weapon:'axe',level:70});assert.equal(sum(fighter),181);assert.equal(fighter.unused,1);assert.equal(fighter.points['mastery']??0,0,'the source spare point in the alternate weapon is deliberately left unused');
 for(const [jobId,weapon] of [['assassin','claw'],['hunter','bow']])assert.equal(sum(buildReferenceDraft({jobId,weapon,level:70})),182);
});
test('unknown class or weapon never receives a fabricated source build and70+ stays unallocated',()=>{
 assert.equal(buildReferenceDraft({jobId:'cleric',weapon:'wand',level:70}),null);assert.equal(buildReferenceDraft({jobId:'fighter',weapon:'bow',level:70}),null);
 const d=buildReferenceDraft({jobId:'fighter',weapon:'sword',level:100});assert.equal(d.rows.at(-1).level,70);assert.equal(sum(d),181);assert.equal(d.unused,91);
});
test('every published guide distinguishes its sources, review scope and advisory steps',async()=>{
 const {guides}=JSON.parse(await readFile(new URL('../content/seed-data.json',import.meta.url),'utf8'));assert.equal(guides.length,23);for(const g of guides){assert.ok(g.review.sources.length,g.id);assert.ok(g.review.scope,g.id);assert.equal(g.review.checkedAt,'2026-10-21');for(const step of g.steps){assert.equal(typeof step.text,'string');assert.ok(step.basis);assert.ok(step.sourceUrls.length);}}
 assert.equal(guides.filter(g=>g.review.status==='official-source-checked').length,4);assert.ok(guides.find(g=>g.id==='fighter-30').review.issues.some(s=>s.includes('相衝')||s.includes('상충')));
});
