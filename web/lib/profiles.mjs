import {JOBS} from './job-data.mjs';
/** A new character must never inherit another character's eligibility or stats. */
export function createProfile({id,name='새 모험가',job='beginner'}) {
 if(!id||!JOBS[job])throw new Error('캐릭터 ID와 직업을 확인하세요.');
 return {id,name:name.trim()||'새 모험가',role:'모험가',job,currentJob:'beginner',level:1,str:4,dex:4,int:4,luk:4,attack:0,magicAttack:0,accuracy:0,mesos:0,exp:0,fame:null,professions:{},goal:'balance',location:'메이플 아일랜드',note:''};
}
const planKeys=['planLevel','weapon','priority','firstBudget','secondBudget','spRule','referenceSources'];
export function switchProfileJob(state,profileId,job){
 if(!JOBS[job])throw new Error('지원하지 않는 직업입니다.');
 const p=state.profiles.find(p=>p.id===profileId);if(!p||p.job===job)return {};
 const record=state.skillPlans?.[profileId]??{},jobs={...record.jobs,[p.job]:state.skills?.[profileId]??{}},saved=Object.fromEntries(planKeys.filter(k=>record[k]!==undefined).map(k=>[k,record[k]])),jobSettings={...record.jobSettings,[p.job]:saved};
 // Skill points and their weapon, level and SP assumptions travel together.
 const next={...record};for(const key of planKeys)delete next[key];
 return {profiles:state.profiles.map(v=>v.id===profileId?{...v,job}:v),skills:{...state.skills,[profileId]:jobs[job]??{}},skillPlans:{...state.skillPlans,[profileId]:{...next,...jobSettings[job],jobs,jobSettings}}};
}
export function jobLabel(profile){const job=JOBS[profile.job]??JOBS.beginner;const actual=JOBS[profile.currentJob];if(actual)return `Lv. ${profile.level} ${actual.name}${profile.currentJob!==profile.job?' · '+job.name+' 목표':''}`;const family={warrior:'전사',magician:'마법사',bowman:'궁수',thief:'도적',beginner:'초보자'}[job.family];return `Lv. ${profile.level} ${profile.level<job.firstAdvancementLevel?'초보자 · '+job.name+' 목표':profile.level<30&&job.tier===2?family+' · '+job.name+' 목표':job.name}`;}
