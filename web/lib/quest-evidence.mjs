const own=(o,k)=>Object.prototype.hasOwnProperty.call(o??{},k);
const number=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;
export const QUEST_API='https://maplestory.io/api/MCW/1/quest/';
export const QUEST_WZ='https://maplestory.io/api/wz/MCW/1/Quest/QuestData/';
export const CURRENT_JOB_CODES=Object.freeze({0:'beginner',100:'warrior',110:'fighter',120:'page',130:'spearman',200:'magician',210:'firePoison',220:'iceLightning',230:'cleric',300:'bowman',310:'hunter',320:'crossbowman',400:'thief',410:'assassin',420:'bandit'});
const checkFields=new Set(['job','lvmin','lvmax','npc','quest','item','mob','fieldEnter','start','end','interval','dayByDay','normalAutoStart']);
export const CLIENT_CHECK_FIELDS=Object.freeze([...checkFields]);
const actionFields=new Set(['exp','money','pop','item','nextQuest','transferField','message']);
const parsedCheckFields={job:'jobs',lvmin:'levelMinimum',lvmax:'levelMaximum',npc:'npcId',quest:'quests',item:'items',mob:'mobs',fieldEnter:'requiredFieldsEntered',start:'startTime',end:'endTime',interval:'repeatInterval',dayByDay:'dayByDay',normalAutoStart:'normalAutoStart'};
// WZ type 0 is a missing-property response with an empty children array, not an
// observed empty container. Only actual property containers (type 13) count.
function observedNode(evidence,path){const entry=evidence.nodes?.[path];return entry?.raw?.type===13&&Array.isArray(entry.raw.children)?entry:null;}
export function questEvidenceSignature(raw){return JSON.stringify({start:raw?.requirementToStart,complete:raw?.requirementToComplete,reward:raw?.rewardOnComplete,initial:raw?.rewardOnStart});}
export function normalizeQuestEvidence(raw,index={},data={},evidence={}){
 if(!raw||String(raw.id)!==String(index.id??raw.id)||!raw.requirementToStart||!raw.requirementToComplete)throw new Error('Quest response identity/conditions missing');
 const start=raw.requirementToStart,complete=raw.requirementToComplete,reward=raw.rewardOnComplete??{},initial=raw.rewardOnStart??{};
 const sourceUrl=evidence.sourceUrl??QUEST_API+raw.id,fetchedAt=evidence.fetchedAt??null;
 const items=new Map((data.items??[]).map(i=>[String(i.id),i])),mobs=new Map((data.monsters??[]).map(i=>[String(i.id),i])),npcs=new Map((data.npcs??[]).map(i=>[String(i.id),i]));
 const stack=i=>({itemId:String(i.id),name:items.get(String(i.id))?.name??String(i.id),quantity:number(i.count)});
 const requirements=(complete.items??[]).filter(i=>number(i.count)>0).map(stack),startRequirements=(start.items??[]).filter(i=>number(i.count)>0).map(stack);
 const killRequirements=(complete.mobs??[]).map(i=>({monsterId:String(i.id),name:mobs.get(String(i.id))?.name??String(i.id),quantity:number(i.count)}));
 const states=[...(start.quests??[]).map(q=>({...q,stage:'start'})),...(complete.quests??[]).map(q=>({...q,stage:'complete'}))];
 const jobCodes=Array.isArray(start.jobs)?start.jobs.map(number).filter(v=>v!==null):null;
 const mappedJobs=jobCodes?.filter(c=>CURRENT_JOB_CODES[c]).map(c=>CURRENT_JOB_CODES[c]);
 const rawRewards=(reward.items??[]).map((i,position)=>({...stack(i),position,job:own(i,'job')?i.job:null,gender:own(i,'gender')?i.gender:null,potentialGrade:i.potentialGrade??null,mode:'unverified',sourceUrl}));
 const clientStartItems=(initial.items??[]).filter(i=>number(i.count)>0).map((i,position)=>({...stack(i),position,job:own(i,'job')?i.job:null,gender:own(i,'gender')?i.gender:null,mode:'unverified',sourceUrl}));
 const clientMesoActions=[['start',initial],['complete',reward]].filter(([,r])=>own(r,'meso')&&number(r.meso)!==null).map(([stage,r])=>({stage,amount:number(r.meso),sourceUrl}));
 const consumedItems=[['start',initial],['complete',reward]].flatMap(([stage,r])=>(r.items??[]).filter(i=>number(i.count)<0).map(i=>({...stack(i),quantity:Math.abs(number(i.count)),stage,sourceUrl})));
 const startNode=observedNode(evidence,'Check/0'),endNode=observedNode(evidence,'Check/1'),action=observedNode(evidence,'Act/1');
 const additionalChecks=(evidence.additionalChecks??[]).map(c=>({stage:c.stage,key:c.key,sourceUrl:c.sourceUrl,fetchedAt:c.fetchedAt,type:c.raw?.type,value:own(c.raw,'value')?c.raw.value:null,children:c.raw?.children??null}));
 const extraValue=key=>additionalChecks.find(c=>c.key===key&&c.value!==null)?.value;
 const clientCitizenshipTownCode=number(extraValue('citizenshipTown'));
 // Numeric town codes corroborated against named Wiki quests: Henesys506018
 // and Kerning City506101. Keep the raw code and its own WZ field source.
 const citizenshipTown=({1:'Henesys',2:'Kerning City'})[clientCitizenshipTownCode]??index.citizenshipTown??null;
 const citizenshipGrade=number(extraValue('citizenshipGrade')??index.citizenshipGrade);
 const requiredFame=number(extraValue('pop')??index.requiredFame);
 const repeatPeriod=number(extraValue('weeklyRepeat'))===1?'weekly':index.repeatPeriod;
 const handledExtra=key=>additionalChecks.some(c=>c.key===key&&number(c.value)!==null)&&(['citizenshipGrade','pop','weeklyRepeat'].includes(key)||(key==='citizenshipTown'&&[1,2].includes(clientCitizenshipTownCode)));
 const unhandledCheckFields=[...new Set([...(startNode?.raw.children??[]),...(endNode?.raw.children??[])].filter(k=>!checkFields.has(k)&&!handledExtra(k)))];
 const additionalStateChecks=states.filter(q=>number(q.state)!==2);
 const missingParsedFields=[['start',startNode,start],['complete',endNode,complete]].flatMap(([stage,node,parsed])=>(node?.raw.children??[]).filter(k=>parsedCheckFields[k]&&(!own(parsed,parsedCheckFields[k])||parsed[parsedCheckFields[k]]===null)).map(k=>stage+'.'+k));
 const unknownJobCodes=[...(start.jobs??[]),...(complete.jobs??[])].filter(code=>!own(CURRENT_JOB_CODES,code));
 const clientRequirementsComplete=!!startNode&&!!endNode&&!unhandledCheckFields.length&&!additionalStateChecks.length&&!missingParsedFields.length&&!unknownJobCodes.length;
 const explicitScript=unhandledCheckFields.some(k=>['startscript','endscript','failscript'].includes(k));
 const externalUnknowns=[];
 if(index.rotationPool)externalUnknowns.push('현재 회차 의뢰 선정');
 if(citizenshipTown||citizenshipGrade!==null)externalUnknowns.push('시민권 조건');
 if(index.profession)externalUnknowns.push('전문기술 조건');
 if(['daily','weekly'].includes(repeatPeriod)||number(start.repeatInterval)>0||start.dayByDay)externalUnknowns.push('반복 주기와 수락 이력');
 if(start.startTime||start.endTime||complete.startTime||complete.endTime)externalUnknowns.push('클라이언트 기간의 서버 시간대');
 if(start.requiredFieldsEntered?.length||complete.requiredFieldsEntered?.length)externalUnknowns.push('방문한 맵 이력');
 const clientConditionsComplete=clientRequirementsComplete&&!externalUnknowns.length;
 const serverScriptUnknown=!startNode||!endNode||explicitScript;
 const rawRewardItems=rawRewards.map(row=>{
  // WZ child names are often lexically ordered (0,1,10,11,...,2). API array
  // indexes therefore differ from the numeric property name; retain both.
  const observed=(evidence.rewardItems??[]).find((x,apiPosition)=>String(x.fields?.id)===row.itemId&&(x.apiPosition??apiPosition)===row.position);
  if(!observed)return row;
  return {...row,rawPosition:observed.position,rawFields:observed.fields,rawFieldNames:observed.fieldNames,rawSourceUrl:observed.sourceUrl,rawProp:number(observed.fields?.prop),probabilityMeaning:'원시 prop 값 · 퍼센트/가중치 의미는 확인되지 않음',job:own(observed.fields,'job')?observed.fields.job:row.job,gender:own(observed.fields,'gender')?observed.fields.gender:row.gender};
 });
 const fixed=(index.rewardItems??[]).filter(i=>rawRewardItems.some(r=>r.itemId===String(i.itemId)&&r.quantity===number(i.quantity)));
 const fixedIds=new Set(fixed.map(i=>String(i.itemId)+':'+i.quantity));
 const ambiguous=rawRewardItems.filter(i=>i.quantity>0&&!fixedIds.has(i.itemId+':'+i.quantity)).map(i=>({...i,choiceGroup:'클라이언트 보상 지급 방식 미확인',chancePercent:null}));
 const rewardChoices=index.rewardChoices?.length?index.rewardChoices:ambiguous;
 const unknownActionFields=(action?.raw.children??[]).filter(k=>!actionFields.has(k));
 const fixedCorroborated=rawRewardItems.filter(i=>i.quantity>0).every(i=>fixedIds.has(i.itemId+':'+i.quantity)&&i.rawFieldNames?.every(k=>['id','count','potentialGrade'].includes(k)));
 const clientRewardsComplete=!!action&&!unknownActionFields.length&&fixedCorroborated&&!rewardChoices.length;
 const npcId=start.npcId==null?null:String(start.npcId),turnInNpcId=complete.npcId==null?null:String(complete.npcId);
 const clientEvidence={nodes:Object.fromEntries(Object.entries(evidence.nodes??{}).filter(([,v])=>v.raw?.type===13&&Array.isArray(v.raw.children)).map(([k,v])=>[k,{raw:{type:13,children:v.raw.children},sourceUrl:v.sourceUrl,fetchedAt:v.fetchedAt}])),rewardItems:evidence.rewardItems??[],additionalChecks:evidence.additionalChecks??[],sourceUrl,fetchedAt};
 return {...index,id:String(raw.id),name:index.name??raw.name,en:raw.name??index.en,minLevel:number(start.levelMinimum??index.minLevel),maxLevel:number(start.levelMaximum??index.maxLevel),completeLevel:number(complete.levelMinimum??index.completeLevel),requiredFame,citizenshipTown,citizenshipGrade,clientCitizenshipTownCode,repeatPeriod,exp:number(reward.exp??index.exp),mesos:number(reward.meso??index.mesos),fame:number(reward.fame??index.fame),requirements,startRequirements,killRequirements,prerequisiteIds:[...new Set(states.filter(q=>number(q.state)===2).map(q=>String(q.id)))],questStateConditions:states,clientJobCodes:jobCodes,clientCompletionJobCodes:complete.jobs??null,jobs:mappedJobs?.length?mappedJobs:(index.jobs??['all']),npcId,turnInNpcId,npc:npcs.get(npcId)?.name??index.npc,turnIn:npcs.get(turnInNpcId)?.name??index.turnIn,region:raw.areaName??index.region,clientRawConditions:{start,complete},clientReceivedItems:rawRewardItems.filter(i=>i.quantity>0),rawRewardItems,clientStartItems,clientMesoActions,consumedItems,requirementsCostMeaning:'보유 조건 · 실제 소비 액션은 consumedItems에서 별도 확인',rewardItems:fixed,rewardChoices,clientRequirementsComplete,clientRewardsComplete,requirementsComplete:clientRequirementsComplete,rewardsComplete:clientRewardsComplete&&!explicitScript,conditionsComplete:clientConditionsComplete,clientConditionsComplete,sourceConfidence:"client-reference",clientNoMinimumLevel:!!startNode&&!startNode.raw.children.includes("lvmin"),clientEvidence,metadataInputSignature:questEvidenceSignature(raw),conditionEvidence:{scope:'public-client-checks-only',sourceUrl,fetchedAt,checkedFields:[...(startNode?.raw.children??[]),...(endNode?.raw.children??[])],unknownFields:unhandledCheckFields,additionalStateChecks,additionalChecks,missingParsedFields,unknownJobCodes,externalUnknowns,explicitScript,serverScriptUnknown,serverBehaviorVerified:false},rewardEvidence:{scope:'public-client-completion-actions-only',sourceUrl,rawSourceUrl:action?.sourceUrl??null,checkedFields:action?.raw.children??[],unknownFields:unknownActionFields,rawMoneyActionPresent:action? action.raw.children.includes('money'):null,serverScriptUnknown,serverBehaviorVerified:false,absentMoneyDoesNotBecomeZero:true},metadataSourceUrl:sourceUrl,metadataFetchedAt:fetchedAt,metadataVersion:'MCW/1',metadataNote:'공개 클라이언트의 시작·완료 검사와 완료 보상입니다. 원시 WZ와 교차 확인한 범위만 완전성에 반영합니다. 누락 메소를 0으로 바꾸지 않으며 명시된 스크립트·해석되지 않은 추가 조건과 회차는 별도 표시합니다. 현재 게임 패치와 다를 수 있습니다.'};
}
