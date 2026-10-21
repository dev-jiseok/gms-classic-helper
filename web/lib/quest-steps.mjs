import { mapRoute } from './public-catalog.mjs';
const id=value=>value===null||value===undefined||value===''?null:String(value);
const present=value=>value!==null&&value!==undefined&&value!=='';
export function questSourceUrl(value){
 if(typeof value!=='string'||!value.trim())return null;
 try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null;}
}
/** Display source descriptions as text. Never execute Cargo HTML or wiki markup. */
export function questStepText(value){
 if(value===null||value===undefined)return '';
 const decode=text=>text.replace(/&#(x[0-9a-f]+|\d+);/gi,(_,code)=>{const n=code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):Number(code);return n>=32&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):'';}).replace(/&(nbsp|amp|lt|gt|quot|apos);/g,(_,key)=>({nbsp:' ',amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[key]));
 return decode(decode(String(value))).replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'')
  .replace(/<!--[^]*?-->/g,'').replace(/<\s*br\s*\/?\s*>/gi,'\n').replace(/<\/(?:p|div|li|h[1-6])\s*>/gi,'\n').replace(/<[^>]*>/g,'')
  .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_,target,label)=>label??target).replace(/\[(https?:\/\/\S+)\s+([^\]]+)\]/g,'$2')
  .replace(/\r\n?/g,'\n').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
/** Only explicit step references and factual NPC map relationships resolve a location. */
export function questStepPlan(quest,{maps=[],npcs=[],monsters=[],items=[],portals=[],startMapId=null,mapChoices={},level}={}){
 const mapById=new Map(maps.map(row=>[id(row.id),row])),npcById=new Map(npcs.map(row=>[id(row.id),row]));
 const steps=(Array.isArray(quest?.steps)?quest.steps:[]).filter(row=>row&&typeof row==='object'&&!Array.isArray(row)).map((row,index)=>{
  const number=present(row.step)&&Number.isSafeInteger(Number(row.step))&&Number(row.step)>=0?Number(row.step):null;
  return {...row,key:`${id(quest?.id)??'quest'}:${index}`,sourceIndex:index,number,title:questStepText(row.title)||questStepText(row.titleEn),description:questStepText(row.description)||questStepText(row.descriptionEn),titleEn:questStepText(row.titleEn),descriptionEn:questStepText(row.descriptionEn),sourceUrl:questSourceUrl(row.sourceUrl)??questSourceUrl(quest?.sourceUrl),destinationMapId:id(row.destinationMapId),targetNpcId:id(row.targetNpcId),destinationMapName:questStepText(row.destinationMapName),targetNpcName:questStepText(row.targetNpcName)};
 }).sort((a,b)=>(a.number??Infinity)-(b.number??Infinity)||a.sourceIndex-b.sourceIndex);
 let from=mapById.has(id(startMapId))?id(startMapId):null;
 return steps.map(step=>{
  const npc=npcById.get(step.targetNpcId)??null,explicitMap=mapById.get(step.destinationMapId)??null;
  const npcMaps=[...new Set((npc?.mapIds??[]).map(id))].map(key=>mapById.get(key)).filter(Boolean);
  // A named-but-unresolved destination must not be replaced by a guessed NPC location.
  const canUseNpc=!step.destinationMapId&&!step.destinationMapName;
  const candidates=canUseNpc?npcMaps:explicitMap?[explicitMap]:[];
  const choice=mapChoices[step.key],destination=explicitMap??(canUseNpc?candidates.find(row=>id(row.id)===id(choice))??(candidates.length===1?candidates[0]:null):null);
  const locationBasis=explicitMap?'step-destination':destination?'npc-catalog-location':null;
  const route=from&&destination?mapRoute({maps,portals:portals.filter(edge=>(edge.sourceUrl||edge.sourceId)&&(!edge.requiresLevel||present(level)&&Number.isFinite(Number(level))&&Number(level)>=Number(edge.requiresLevel)))},from,destination.id,{level,allowConditional:false,allowTransport:false}):{path:[],edges:[],reason:!destination?'진행 단계의 목적 위치 확인 필요':'이 단계까지의 실제 출발 맵 선택 필요'};
  const reference=(rows,key,name)=>id(key)?rows.find(row=>id(row.id)===id(key))??{id:id(key),name:questStepText(name)||'#'+id(key)}:null;
  const result={...step,npc,destination,monster:reference(monsters,step.targetMonsterId,step.targetMonsterName),item:reference(items,step.requiredItemId,step.requiredItemName),targetMonsterName:questStepText(step.targetMonsterName),requiredItemName:questStepText(step.requiredItemName),notes:questStepText(step.notes),gameVersion:questStepText(step.gameVersion??step.sourceFields?.game_version),candidateMaps:candidates,locationBasis,fromMapId:from,route,missing:[!step.title&&!step.description?'진행 설명 미등록':null,step.targetNpcId&&!npc?'목적 NPC의 도감 연결 미확인':null,!destination?'목적 맵 미확인':null].filter(Boolean)};
  // Unknown intermediate movement breaks continuity; never jump across it silently.
  from=destination?id(destination.id):null;
  return result;
 });
}
