// Public MCW/1 client facts only. Missing fields remain unknown, never implicit 0.
export const EQUIPMENT_API='https://maplestory.io/api/MCW/1/item/';
export const EQUIPMENT_JOB_BITS=Object.freeze({1:'warrior',2:'magician',4:'bowman',8:'thief',16:'pirate'});
const numeric=value=>value===null||value===undefined||value===''?null:Number.isFinite(Number(value))?Number(value):null;
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj??{},key);
export function jobsFromEquipmentMask(value){
 const mask=numeric(value);
 if(mask===0)return {jobs:['all'],complete:true};
 if(mask===-1)return {jobs:['beginner'],complete:true};
 if(mask===null||!Number.isInteger(mask)||mask<0||(mask&~31)!==0)return {jobs:[],complete:false};
 return {jobs:Object.entries(EQUIPMENT_JOB_BITS).filter(([bit])=>(mask&Number(bit))!==0).map(([,name])=>name),complete:true};
}
export function normalizeEquipmentMetadata(raw,index={},evidence={}){
 if(!raw||String(raw.id)!==String(index.id)||!raw.metaInfo||raw.typeInfo?.overallCategory!=='Equip')throw new Error('Equipment response id/type mismatch');
 const m=raw.metaInfo,sourceUrl=evidence.sourceUrl??EQUIPMENT_API+raw.id,at=evidence.fetchedAt??null;
 const level=numeric(own(m,'reqLevelEquip')?m.reqLevelEquip:m.reqLevel),job=jobsFromEquipmentMask(m.reqJob);
 const statRequirements=Object.fromEntries(['str','dex','int','luk'].map(k=>[k,numeric(m['req'+k.toUpperCase()])]));
 const unknowns=[];
 if(level===null)unknowns.push('level');
 for(const [key,value] of Object.entries(statRequirements))if(value===null)unknowns.push(key);
 if(!job.complete)unknowns.push('jobs');
 const stats={...index.stats},statSources={...index.statSources},mapping={str:['incSTR'],dex:['incDEX'],int:['incINT'],luk:['incLUK'],hp:['incMHP','incHP'],mp:['incMMP','incMP'],attack:['incWAT','incPAD'],magicAttack:['incMAT','incMAD'],physicalDefense:['incPDD'],magicDefense:['incMDD'],accuracy:['incACC'],avoidability:['incEVA'],speed:['incSpeed'],jump:['incJump']};
 for(const [key,value] of Object.entries(stats))if(numeric(value)!==null&&!statSources[key]&&index.sourceUrl)statSources[key]={sourceUrl:index.sourceUrl,field:'attributed catalog reference',verifiedAt:index.verifiedAt??null};
 for(const [key,fields] of Object.entries(mapping)){
  const field=fields.find(f=>own(m,f)&&numeric(m[f])!==null);
  if(field){stats[key]=numeric(m[field]);statSources[key]={sourceUrl,field,verifiedAt:at};}
 }
 // MCW weapon attack uses incWAT, magic includes incMAD; attack is animation data.
 for(const [key,leaf] of Object.entries(evidence.wzStats??{})){
  if(!leaf||!own(leaf,'value')||numeric(leaf.value)===null)continue;
  stats[key]=numeric(leaf.value);statSources[key]={sourceUrl:leaf.sourceUrl,field:leaf.field,verifiedAt:leaf.fetchedAt};
 }
 const extraRequirements={fame:numeric(m.reqPOP),secondaryJob:numeric(m.reqJob2),specialJob:numeric(m.reqSpecJob)};
 const extraRequirementUnknowns=Object.entries(extraRequirements).filter(([,v])=>v===null).map(([k])=>k);
 const coreRequirementsComplete=unknowns.length===0&&typeof m.cash==='boolean';
 return {id:String(raw.id),requiredLevel:level,level,requiredJobs:job.jobs,allowedJobs:job.jobs,jobsComplete:job.complete,jobMask:numeric(m.reqJob),statRequirements,slots:numeric(m.tuc),isCash:typeof m.cash==='boolean'?m.cash:index.isCash,stats,statSources,attackSpeed:numeric(m.attackSpeed),vslots:Array.isArray(m.vslots)?m.vslots:[],islots:Array.isArray(m.islots)?m.islots:[],extraRequirements,extraRequirementUnknowns,coreRequirementsComplete,requirementsKnown:coreRequirementsComplete,wearingRequirementsComplete:coreRequirementsComplete&&extraRequirementUnknowns.length===0,requirementUnknowns:unknowns,metadataSourceUrl:sourceUrl,metadataFetchedAt:at,metadataVersion:'MCW/1',metadataFormat:evidence.rawSourceFormat??'item-api',metadataConfidence:'public-client-reference',metadataNote:'레벨·STR/DEX/INT/LUK·직업 조건은 현재 MCW/1 명시값입니다. 명성·특수 직업 등 응답에 없는 조건은 미확인으로 보존합니다. 기본 능력치는 매물의 강화·추가 옵션과 다릅니다.'};
}
export function equipmentMetadataCoverage(items=[]){
 const all=items.filter(i=>String(i.category).toLowerCase()==='equip'&&i.isCash===false),normal=all.filter(i=>!['Face','Hair','Head'].includes(i.subCategory));
 return {nonCashEquipIndexEntries:all.length,appearanceEntries:all.length-normal.length,normalEquipment:normal.length,enriched:normal.filter(i=>i.metadataVersion==='MCW/1').length,coreRequirementsComplete:normal.filter(i=>i.coreRequirementsComplete===true).length,allWearingConditionsComplete:normal.filter(i=>i.wearingRequirementsComplete===true).length,withKnownAttack:normal.filter(i=>numeric(i.stats?.attack)!==null).length,withKnownMagicAttack:normal.filter(i=>numeric(i.stats?.magicAttack)!==null).length};
}
