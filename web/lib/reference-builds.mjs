import {JOBS,SKILLS} from './job-data.mjs';
import {defaultSkillBudgets,skillWeaponChoices} from './skill-plan.mjs';
import {validateSkillPlan} from './combat.mjs';
// Factual SP allocations read from NiaMeowDB's current class guides on2026-10-21.
// These are attributed community examples, not measured global optima.
const base='https://meowdb.com/msclassic/ko/guides/';
const rows=(from,to,alloc)=>Array.from({length:to-from+1},(_,i)=>[from+i,alloc]);
const first={
 warrior:[[10,{'Power Strike':1}],[11,{'Power Strike':2,'Slash Blast':1}],[12,{'Power Strike':1,'Slash Blast':2}],[13,{'Slash Blast':1,'Precise Strikes':2}],[14,{'Precise Strikes':3}],...rows(15,19,{'Power Strike':3}),[20,{'Power Strike':1,'Slash Blast':2}],...rows(21,24,{'Slash Blast':3}),[25,{'Slash Blast':2,'Precise Strikes':1}],...rows(26,28,{'Precise Strikes':3}),[29,{'Improved HP Recovery':3}],[30,{'Max HP Increase':3}]],
 thief:[[10,{'Lucky Seven':1}],[11,{'Nimble Body':3}],[12,{'Keen Eyes':1,'Lucky Seven':2}],...rows(13,17,{'Lucky Seven':3}),[18,{'Lucky Seven':2,'Keen Eyes':1}],...rows(19,22,{'Keen Eyes':3}),[23,{'Keen Eyes':1,'Nimble Body':2}],...rows(24,26,{'Nimble Body':3}),[27,{'Nimble Body':1,Disorder:2}],[28,{Disorder:1,'Dark Sight':2}],...rows(29,30,{'Dark Sight':3})],
 bowman:[[10,{'Arrow Blow':1}],[11,{'Arrow Blow':3}],[12,{'Arrow Blow':2,'The Eye of Amazon':1}],...rows(13,14,{'Arrow Blow':3}),[15,{'Arrow Blow':1,'The Eye of Amazon':2}],...rows(16,17,{'Arrow Blow':3}),[18,{'Arrow Blow':1,'Critical Shot':2}],...rows(19,22,{'Critical Shot':3}),[23,{'Critical Shot':1,'The Eye of Amazon':2}],...rows(24,26,{'The Eye of Amazon':3}),[27,{'The Eye of Amazon':1,Focus:2}],...rows(28,29,{Focus:3}),[30,{Focus:2,'Power Knockback':1}]]
};
const second={
 fighter:[[30,{Rush:1}],[31,{Rage:1,'{M}':2}],[32,{'{M}':3}],[33,{'{B}':1,'{F}':1,'{M}':1}],...rows(34,37,{'{M}':3}),[38,{'{M}':2,'{F}':1}],...rows(39,47,{Rage:3}),[48,{Rage:2,'{F}':1}],...rows(49,57,{'{F}':3}),...rows(58,63,{'{B}':3}),[64,{'{B}':1,Rush:2}],...rows(65,69,{Rush:3}),[70,{Rush:2}]],
 assassin:[[30,{Haste:1}],[31,{'Claw Mastery':3}],[32,{'Claw Mastery':2,'Claw Booster':1}],...rows(33,37,{'Claw Mastery':3}),...rows(38,47,{'Critical Throw':3}),...rows(48,53,{Haste:3}),[54,{Haste:1,'Claw Booster':2}],...rows(55,56,{'Claw Booster':3}),...rows(57,62,{'Critical Recovery':3}),[63,{'Critical Recovery':2,'Claw Booster':1}],...rows(64,66,{'Claw Booster':3}),[67,{'Claw Booster':1,Drain:2}],...rows(68,70,{Drain:3})],
 hunter:[[30,{'Arrow Bomb: Bow':1}],[31,{'Bow Mastery':3}],[32,{'Bow Mastery':2,'Bow Booster':1}],[33,{'Bow Booster':3}],[34,{'Bow Booster':1,'Soul Arrow: Bow':1,'Bow Mastery':1}],...rows(35,38,{'Bow Mastery':3}),[39,{'Bow Mastery':2,'Final Attack: Bow':1}],...rows(40,48,{'Arrow Bomb: Bow':3}),[49,{'Arrow Bomb: Bow':2,'Final Attack: Bow':1}],...rows(50,58,{'Final Attack: Bow':3}),[59,{'Final Attack: Bow':1,"Amazon's Judgement":1,'Bow Booster':1}],...rows(60,63,{'Bow Booster':3}),[64,{'Bow Booster':2,'Soul Arrow: Bow':1}],...rows(65,70,{'Soul Arrow: Bow':3})]
};
export function referenceBuildAvailable(jobId,weapon){return !!first[jobId]&&(jobId!=='thief'||weapon==='claw')||!!second[jobId];}
export function buildReferenceDraft({jobId,weapon,level}){
 if(!referenceBuildAvailable(jobId,weapon)||!skillWeaponChoices(jobId).some(w=>w.id===weapon))return null;
 const job=JOBS[jobId],target=Math.min(200,Math.max(1,Math.floor(Number(level)||1))),skills=SKILLS[jobId],family=job.family,stages=[{tier:1,jobId:family,rows:first[family]??[]},...(second[jobId]?[{tier:2,jobId,rows:second[jobId]}]:[])],points={},timeline=[],errors=[];
 const weaponName=weapon==='axe'?'Axe':'Sword',substitute=name=>name.replace('{M}',weaponName+' Mastery').replace('{B}',weaponName+' Booster').replace('{F}','Final Attack: '+weaponName);
 for(let at=10;at<=Math.min(target,second[jobId]?70:30);at++){
  const allocations=[];
  for(const stage of stages)for(const [,entries] of stage.rows.filter(([l])=>l===at))for(const [raw,amount] of Object.entries(entries)){
   const en=substitute(raw),skill=skills.find(s=>s.en===en&&s.tier===stage.tier);if(!skill){errors.push('출처 스킬 연결 확인 필요: '+en);continue;}points[skill.id]=(points[skill.id]??0)+amount;allocations.push({id:skill.id,name:skill.name,tier:skill.tier,amount});
  }
  const budgets=defaultSkillBudgets(jobId,at),used=Object.values(points).reduce((a,b)=>a+b,0);errors.push(...validateSkillPlan(skills,points,budgets,{tierOnly:true}));timeline.push({level:at,allocations,points:{...points},budgets,used,remaining:budgets[1]+budgets[2]-used,adjustment:0});
 }
 const budgets=defaultSkillBudgets(jobId,target),used=Object.values(points).reduce((a,b)=>a+b,0);
 return {jobId,weapon,level:target,points,rows:timeline,budgets,unused:budgets[1]+budgets[2]-used,errors:[...new Set(errors)],spRule:'tier-only',reference:true,sources:stages.map(s=>({name:'NiaMeowDB · '+JOBS[s.jobId].name+' 공략',url:base+s.jobId+'-class-guide'})),checkedAt:'2026-10-21',assumption:'커뮤니티 공략의 배분 예시를 스킬 ID·최대치·선행·차수별 SP와 대조했습니다. 실제 최적성 검증은 아닙니다. 70레벨 이후와 파이터 마지막 여유1SP는 임의 배분하지 않습니다.'};
}
