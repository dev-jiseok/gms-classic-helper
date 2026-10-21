import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../lib/engine.mjs';
import {createProfile,switchProfileJob,jobLabel} from '../lib/profiles.mjs';
test('new characters have independent actual job, fame, professions and clean stats',()=>{
 const p=createProfile({id:'new',name:' 새 표도 ',job:'assassin'}),other=createProfile({id:'other',job:'cleric'});
 assert.equal(p.name,'새 표도');assert.equal(p.job,'assassin');assert.equal(p.currentJob,'beginner');assert.equal(p.fame,null);assert.equal(p.level,1);assert.equal(p.mesos,0);assert.equal(p.attack,0);p.professions.alchemy=20;assert.deepEqual(other.professions,{});
 assert.throws(()=>createProfile({id:'x',job:'unknown'}));
});
test('each job restores its SP points and all corresponding plan settings together',()=>{
 let state=initialState();state.profiles[0].currentJob='warrior';state.profiles[0].fame=17;
 state.skills.fighter={a:5};state.skillPlans={fighter:{weapon:'sword',planLevel:45,priority:['a'],firstBudget:61,secondBudget:46}};
 state={...state,...switchProfileJob(state,'fighter','cleric')};assert.deepEqual(state.skills.fighter,{});assert.equal(state.skillPlans.fighter.weapon,undefined);assert.equal(state.skillPlans.fighter.planLevel,undefined);assert.equal(state.profiles[0].level,1);assert.equal(state.profiles[0].currentJob,'warrior');assert.equal(state.profiles[0].fame,17);
 state.skills.fighter={b:3};Object.assign(state.skillPlans.fighter,{weapon:'wand',planLevel:33,priority:['b'],firstBudget:67,secondBudget:10});
 state={...state,...switchProfileJob(state,'fighter','fighter')};assert.deepEqual(state.skills.fighter,{a:5});assert.equal(state.skillPlans.fighter.weapon,'sword');assert.equal(state.skillPlans.fighter.planLevel,45);assert.deepEqual(state.skillPlans.fighter.priority,['a']);assert.equal(state.skillPlans.fighter.secondBudget,46);
 state={...state,...switchProfileJob(state,'fighter','cleric')};assert.deepEqual(state.skills.fighter,{b:3});assert.equal(state.skillPlans.fighter.weapon,'wand');assert.equal(state.skillPlans.fighter.planLevel,33);
});
test('actual job is displayed when advancement has not occurred at the expected level',()=>{
 assert.equal(jobLabel({job:'fighter',currentJob:'warrior',level:35}),'Lv. 35 전사 · 파이터 목표');
 assert.match(jobLabel({job:'assassin',currentJob:'beginner',level:10}),/초보자.*어쌔신 목표/);
});
