import test from 'node:test';import assert from 'node:assert/strict';import {damageRange,baseAccuracy,physicalHitRate,accuracyForRate,oneCastProbability,validateSkillPlan} from '../lib/combat.mjs';
test('accuracy model uses level gap and verified stats floor',()=>{assert.equal(baseAccuracy(5,5),6);const same=physicalHitRate({accuracy:89,level:60,monsterLevel:60,avoid:34}),higher=physicalHitRate({accuracy:89,level:50,monsterLevel:60,avoid:34});assert.ok(higher<same);assert.ok(higher>.1&&higher<.2);assert.equal(physicalHitRate({magic:true}),1);});
test('required accuracy reaches requested rate with least integer',()=>{const input={level:30,monsterLevel:40,avoid:15},v=accuracyForRate(input,.95);assert.ok(physicalHitRate({...input,accuracy:v})>=.95);assert.ok(physicalHitRate({...input,accuracy:v-1})<.95);});
test('mastery raises floor without raising ceiling',()=>{const input={primary:100,secondary:20,attack:50,weapon:'sword1',skillPercent:100,level:30,monsterLevel:30};const a=damageRange({...input,mastery:0}),b=damageRange({...input,mastery:10});assert.equal(a.max,b.max);assert.ok(a.min<b.min);});
test('magic immunity remains zero and level penalty never buffs low targets',()=>{assert.equal(damageRange({magic:true,primary:100,attack:100,basicAttack:40,elementMultiplier:0}).max,0);assert.equal(damageRange({primary:100,attack:50,level:50,monsterLevel:1}).levelPenalty,1);});
test('one-cast chance accounts for misses, independent lines and certainty',()=>{assert.equal(oneCastProbability({min:100,max:100,hits:2,hp:200,accuracy:.5}),.25);assert.equal(oneCastProbability({min:10,max:20,hits:1,hp:15}),.5);assert.equal(oneCastProbability({min:10,max:20,hits:2,hp:20}),1);assert.equal(oneCastProbability({min:0,max:0,hp:1}),0);});
test('higher-tier SP may fill lower skills but cannot fund upper excess',()=>{const skills=[{id:'a',name:'a',tier:1,max:20},{id:'b',name:'b',tier:2,max:20,requires:{id:'a',level:3}}];assert.deepEqual(validateSkillPlan(skills,{a:10,b:5},{1:5,2:10}),[]);assert.ok(validateSkillPlan(skills,{a:10,b:6},{1:10,2:5}).length>0);assert.ok(validateSkillPlan(skills,{a:2,b:1},{1:5,2:5}).length>0);});
test('zero requested hit rate needs zero accuracy and invalid values remain unknown',()=>{
 const input={level:30,monsterLevel:40,avoid:15};
 assert.equal(accuracyForRate(input,0),0);
 assert.equal(accuracyForRate({...input,avoid:0},1),0);
 assert.equal(accuracyForRate(input,1.1),null);
 assert.equal(physicalHitRate({accuracy:null,level:1,monsterLevel:1,avoid:1}),null);
 assert.equal(physicalHitRate({accuracy:10,level:1,monsterLevel:1,avoid:-1}),null);
 assert.equal(physicalHitRate({accuracy:10,level:1.5,monsterLevel:1,avoid:1}),null);
 assert.equal(baseAccuracy(null,4),null);
 assert.equal(baseAccuracy(-1,4),null);
});
test('integer accuracy search is minimal across target rates and level gaps',()=>{
 for(const avoid of [0,1,15,34,100])for(const gap of [0,5,10,30])for(const target of [0,.1,.5,.95,1]){
  const input={level:30,monsterLevel:30+gap,avoid},value=accuracyForRate(input,target);
  assert.ok(Number.isInteger(value));
  assert.ok(physicalHitRate({...input,accuracy:value})>=target);
  if(value>0)assert.ok(physicalHitRate({...input,accuracy:value-1})<target);
 }
});
test('mixed animations preserve both actual ranges and their probability mixture',()=>{
 const input={primary:100,secondary:0,attack:100,weapon:'axe2',mastery:0,skillPercent:100,level:30,monsterLevel:30};
 const swing=damageRange({...input,animation:'swing'}),stab=damageRange({...input,animation:'stab'}),mixed=damageRange({...input,animation:'mixed'});
 assert.equal(mixed.min,Math.min(swing.min,stab.min));assert.equal(mixed.max,Math.max(swing.max,stab.max));
 assert.ok(Math.abs(mixed.average-(swing.average*.6+stab.average*.4))<1e-10);
 const actual=oneCastProbability({...mixed,hp:380});
 const expected=.6*oneCastProbability({...swing,hp:380})+.4*oneCastProbability({...stab,hp:380});
 assert.ok(actual>0);assert.ok(Math.abs(actual-expected)<1e-10);
});
test('invalid damage or probability inputs cannot become a plausible zero or certainty',()=>{
 assert.equal(damageRange({primary:null,attack:20}).valid,false);
 assert.equal(damageRange({primary:100,attack:20,mastery:11}).valid,false);
 assert.equal(damageRange({primary:100,attack:20,weapon:'unknown'}).valid,false);
 assert.equal(damageRange({primary:100,attack:20,defenseMultiplier:-1}).valid,false);
 assert.equal(oneCastProbability({min:20,max:10,hp:10}),null);
 assert.equal(oneCastProbability({min:10,max:20,hp:0}),null);
 assert.equal(oneCastProbability({min:10,max:20,hp:10,hits:1.5}),null);
 assert.equal(oneCastProbability({min:10,max:20,hp:10,hits:7}),null);
 assert.equal(oneCastProbability({min:10,max:20,hp:10,accuracy:null}),null);
});
test('uniform damage convolution and critical mixtures have analytical probabilities',()=>{
 assert.ok(Math.abs(oneCastProbability({min:0,max:1,hp:1.5,hits:2})-.125)<1e-12);
 assert.ok(Math.abs(oneCastProbability({min:0,max:1,hp:3,hits:6})-.5)<1e-10);
 assert.ok(Math.abs(oneCastProbability({min:1e200,max:2e200,hp:1.5e200})-.5)<1e-12);
 assert.equal(oneCastProbability({min:100,max:100,hits:2,hp:300,accuracy:.5,critChance:25,critBonus:100}),.109375);
 assert.equal(oneCastProbability({min:100,max:100,hits:2,hp:200,accuracy:.5,hitMode:'shared'}),.5);
 assert.equal(oneCastProbability({min:100,max:100,hits:2,hp:200,accuracy:.5,hitMode:'independent'}),.25);
});
test('skill validation rejects corrupt values, unknown skill points and negative budgets',()=>{
 const skills=[{id:'a',name:'A',tier:1,max:20}];
 for(const bad of [NaN,Infinity,-1,1.5,'wrong',null,''])assert.ok(validateSkillPlan(skills,{a:bad},{1:20}).length);
 assert.ok(validateSkillPlan(skills,{unrelated:10},{1:20}).some(e=>e.includes('없는 스킬')));
 assert.ok(validateSkillPlan(skills,{a:1},{1:-1}).length);
 assert.deepEqual(validateSkillPlan(skills,{a:'3'},{1:3}),[]);
});
test('downward-only SP constraints hold for every tier suffix, including future tiers',()=>{
 const skills=[{id:'a',name:'A',tier:1,max:100},{id:'b',name:'B',tier:2,max:100},{id:'c',name:'C',tier:3,max:100}];
 assert.deepEqual(validateSkillPlan(skills,{a:10,b:10,c:10},{1:5,2:10,3:15}),[]);
 assert.ok(validateSkillPlan(skills,{a:0,b:10,c:11},{1:100,2:10,3:10}).some(e=>e.includes('3차')));
 assert.ok(validateSkillPlan(skills,{a:0,b:20,c:1},{1:100,2:10,3:10}).some(e=>e.includes('2차')));
});
test('SP prerequisites reject impossible cycles and missing source skills',()=>{
 const skills=[{id:'a',name:'A',tier:1,max:20,requires:{id:'b',level:1}},{id:'b',name:'B',tier:1,max:20,requires:{id:'a',level:1}}];
 assert.ok(validateSkillPlan(skills,{a:1,b:1},{1:10}).some(e=>e.includes('순환')));
 assert.ok(validateSkillPlan([{id:'a',name:'A',tier:1,max:20,requires:{id:'missing',level:1}}],{a:1,missing:1},{1:10}).some(e=>e.includes('정보 없음')));
});
