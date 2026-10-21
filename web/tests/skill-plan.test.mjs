import test from'node:test';import assert from'node:assert/strict';
import{JOBS,SKILLS}from'../lib/job-data.mjs';import{validateSkillPlan}from'../lib/combat.mjs';
import{skillWeaponChoices,skillWeapon,skillPlanSkills,defaultSkillBudgets,skillBudgets,buildSkillDraft}from'../lib/skill-plan.mjs';
test('weapon-specific drafts never invest in the alternate fighter/page/spearman branch',()=>{
 for(const [jobId,weapon,excluded]of [['fighter','sword','axe-mastery'],['fighter','axe','mastery'],['page','blunt','mastery'],['spearman','polearm','spear-mastery'],['spearman','spear','polearm-mastery']]){
  const d=buildSkillDraft({jobId,weapon,level:70});assert.equal(d.points[excluded]??0,0);assert.ok(d.excluded.some(s=>s.id===excluded));assert.deepEqual(d.errors,[]);
 }
 assert.equal(skillWeapon(SKILLS.magician.find(s=>s.id==='magic-claw')),null,'Magic Claw is a spell, not a claw-weapon branch');
});
test('all available jobs and weapon choices obey maxima, prerequisites and tier SP at every level',()=>{
 for(const jobId of Object.keys(JOBS))for(const weapon of skillWeaponChoices(jobId))for(const level of [9,30,45]){
  const d=buildSkillDraft({jobId,weapon:weapon.id,level});assert.deepEqual(d.errors,[],jobId+weapon.id);for(const row of d.rows)assert.deepEqual(validateSkillPlan(SKILLS[jobId],row.points,row.budgets),[],jobId+' Lv'+row.level);
  assert.ok(Object.values(d.points).every(Number.isInteger));
 }
});
test('second-tier SP stays separate by default and downward use requires an explicit rule',()=>{
 const low=buildSkillDraft({jobId:'fighter',weapon:'sword',level:29,overrides:{firstBudget:0,secondBudget:100}});assert.equal(low.budgets[2],0);assert.deepEqual(low.points,{});
 const advanced=buildSkillDraft({jobId:'fighter',weapon:'sword',level:30,overrides:{firstBudget:0,secondBudget:6},priority:['power','mastery'],spRule:'downward'});assert.equal(advanced.points.power,6);assert.deepEqual(advanced.errors,[]);
 const strict=buildSkillDraft({jobId:'fighter',weapon:'sword',level:30,overrides:{firstBudget:0,secondBudget:6},priority:['power','mastery']});assert.equal(strict.points.power??0,0);assert.ok(strict.points.mastery>0);
 const firstOnly=buildSkillDraft({jobId:'fighter',weapon:'sword',level:30,overrides:{firstBudget:20,secondBudget:0},priority:['mastery']});assert.equal(firstOnly.points.mastery??0,0);
});
test('custom totals are respected and unknown extra SP timing is marked at the target level',()=>{
 const d=buildSkillDraft({jobId:'fighter',weapon:'axe',level:35,overrides:{firstBudget:10,secondBudget:40}});assert.equal(d.budgets[1],10);assert.equal(d.budgets[2],40);assert.equal(Object.values(d.points).reduce((a,b)=>a+b,0),50);assert.equal(d.rows.at(-1).adjustment,24);assert.ok(d.rows.slice(0,-1).every(r=>r.adjustment===0));
 assert.deepEqual(skillBudgets('fighter',30,{firstBudget:0,secondBudget:0}),{1:0,2:0});assert.deepEqual(defaultSkillBudgets('fighter',30),{1:61,2:1});
});
test('user priorities still allocate prerequisites first and keep the input priority unchanged',()=>{
 const priority=['axe-booster','slash'];const before=[...priority],d=buildSkillDraft({jobId:'fighter',weapon:'axe',level:35,priority});assert.deepEqual(priority,before);assert.ok(d.points['axe-mastery']>=5);const firstAxe=d.rows.flatMap(r=>r.allocations).filter(a=>a.id.includes('axe'));assert.equal(firstAxe[0].id,'axe-mastery');assert.deepEqual(d.errors,[]);
});
test('unspendable SP stays unused rather than entering excluded weapons or invented skills',()=>{
 const d=buildSkillDraft({jobId:'fighter',weapon:'sword',level:200,overrides:{firstBudget:1000,secondBudget:1000}});assert.ok(d.unused>0);assert.ok(d.excluded.every(s=>!d.points[s.id]));assert.deepEqual(d.errors,[]);assert.ok(skillPlanSkills('assassin','claw').every(s=>s.id!=='double'));
});
