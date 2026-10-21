import{JOBS,SKILLS}from'./job-data.mjs';
import{validateSkillPlan}from'./combat.mjs';
const WEAPONS={sword:'검',axe:'도끼',blunt:'둔기',spear:'창',polearm:'폴암',wand:'완드',staff:'스태프',bow:'활',crossbow:'석궁',claw:'아대·표창',dagger:'단검',any:'별도 무기 분기 없음'};
const JOB_WEAPONS={fighter:['sword','axe'],page:['sword','blunt'],spearman:['spear','polearm'],warrior:['sword','axe','blunt','spear','polearm'],bowman:['bow','crossbow'],hunter:['bow'],crossbowman:['crossbow'],thief:['claw','dagger'],assassin:['claw'],bandit:['dagger']};
export function skillWeaponChoices(jobId){const job=JOBS[jobId];return (JOB_WEAPONS[jobId]??(job?.family==='magician'?['wand','staff']:['any'])).map(id=>({id,name:WEAPONS[id]}));}
export function skillWeapon(skill){const en=skill.en??'';if(/Crossbow/.test(en))return'crossbow';if(/\bBow\b/.test(en))return'bow';if(/Sword/.test(en))return'sword';if(/Axe/.test(en))return'axe';if(/Blunt Weapon/.test(en))return'blunt';if(/Pole\s?arm/i.test(en))return'polearm';if(/Spear/.test(en))return'spear';if(/^(Claw (Mastery|Booster)|Lucky Seven|Keen Eyes)$/.test(en))return'claw';if(/^(Dagger (Mastery|Booster)|Double Stab)$/.test(en))return'dagger';return null;}
export function skillPlanSkills(jobId,weapon){return (SKILLS[jobId]??[]).filter(s=>!skillWeapon(s)||skillWeapon(s)===weapon);}
const integer=(value,fallback)=>Number.isSafeInteger(Number(value))&&value!==''&&value!=null&&Number(value)>=0?Number(value):fallback;
export function defaultSkillBudgets(jobId,level){const job=JOBS[jobId],l=Math.max(1,Math.min(200,Math.floor(Number(level)||1)));if(!job||job.tier===0)return{1:0,2:0};const first=job.firstAdvancementLevel,second=job.secondAdvancementLevel;return{1:l>=first?(Math.min(l,second)-first)*3+1:0,2:job.tier>=2&&l>=second?(l-second)*3+1:0};}
export function skillBudgets(jobId,level,overrides={}){const base=defaultSkillBudgets(jobId,level),job=JOBS[jobId];return{1:job?.tier>0&&level>=job.firstAdvancementLevel?Math.min(1000,integer(overrides.firstBudget,base[1])):0,2:job?.tier>=2&&level>=job.secondAdvancementLevel?Math.min(1000,integer(overrides.secondBudget,base[2])):0};}
export function defaultSkillPriority(skills,order='starter'){return [...skills].filter(s=>s.tier>0).sort((a,b)=>{if(order==='source')return 0;const score=s=>/Mastery/.test(s.en)?50:/Booster/.test(s.en)?40:s.effects?.damagePercent!=null?30:/Critical/.test(s.en)?25:10;return score(b)-score(a);}).map(s=>s.id);}
/** A constraint-checked planning aid; priority is user policy, not a proven guide.
 * @param {{jobId:string,weapon:string,level:number,overrides?:any,priority?:Array<string>}} options
 */
export function buildSkillDraft({jobId,weapon,level,overrides={},priority=[]}){
 const target=Math.max(1,Math.min(200,Math.floor(Number(level)||1))),all=SKILLS[jobId]??[],job=JOBS[jobId],choices=skillWeaponChoices(jobId);
 if(!job||!choices.some(w=>w.id===weapon))return{points:{},rows:[],errors:['직업과 사용할 무기를 확인하세요.'],budgets:{1:0,2:0}};
 const allowed=skillPlanSkills(jobId,weapon).filter(s=>s.tier>0),byId=new Map(allowed.map(s=>[s.id,s])),ordered=[...new Set([...priority,...defaultSkillPriority(allowed)])].filter(id=>byId.has(id)),budgets=skillBudgets(jobId,target,overrides),points={},rows=[];
 const extra={1:Math.max(0,budgets[1]-defaultSkillBudgets(jobId,target)[1]),2:Math.max(0,budgets[2]-defaultSkillBudgets(jobId,target)[2])};
 function need(skill,atLevel,seen=new Set()){
  if(!skill||seen.has(skill.id)||Number(points[skill.id]??0)>=skill.max||atLevel<(skill.tier===2?job.secondAdvancementLevel:job.firstAdvancementLevel))return null;
  seen.add(skill.id);
  for(const req of skill.prerequisites??(skill.requires?[skill.requires]:[]))if(Number(points[req.id]??0)<req.level){const prerequisite=byId.get(req.id);if(!prerequisite)return null;return need(prerequisite,atLevel,seen);}
  return skill;
 }
 for(let atLevel=1;atLevel<=target;atLevel++){
  const earned=defaultSkillBudgets(jobId,atLevel),available={1:Math.min(budgets[1],earned[1]),2:Math.min(budgets[2],earned[2])};if(atLevel===target){available[1]=budgets[1];available[2]=budgets[2];}
  const allocations=[];let changed=true;
  while(changed){changed=false;for(const id of ordered){const skill=need(byId.get(id),atLevel);if(!skill)continue;const candidate={...points,[skill.id]:Number(points[skill.id]??0)+1};if(validateSkillPlan(all,candidate,available).length)continue;points[skill.id]=candidate[skill.id];const previous=allocations.find(a=>a.id===skill.id);if(previous)previous.amount++;else allocations.push({id:skill.id,name:skill.name,tier:skill.tier,amount:1});changed=true;break;}}
  if(atLevel>=job.firstAdvancementLevel&&job.tier>0){const used=Object.values(points).reduce((a,b)=>a+Number(b),0);rows.push({level:atLevel,allocations,points:{...points},budgets:available,used,remaining:available[1]+available[2]-used,adjustment:atLevel===target?extra[1]+extra[2]:0});}
 }
 const used=Object.values(points).reduce((a,b)=>a+Number(b),0);
 return{jobId,weapon,level:target,points,rows,budgets,priority:ordered,excluded:all.filter(s=>s.tier>0&&!byId.has(s.id)).map(s=>({id:s.id,name:s.name})),unused:budgets[1]+budgets[2]-used,adjustments:extra,errors:validateSkillPlan(all,points,budgets),assumption:'기본 전직 레벨·SP 가정과 사용자 우선순위로 만든 계획 보조이며 검증된 최적 공략이 아닙니다.'};
}
