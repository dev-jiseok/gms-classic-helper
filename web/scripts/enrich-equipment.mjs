import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {EQUIPMENT_API,normalizeEquipmentMetadata,equipmentMetadataCoverage} from '../lib/equipment-data.mjs';
import {equipmentSlot} from '../lib/recommendations.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),catalogPath=resolve(root,'content/public-catalog.json'),args=process.argv.slice(2);
const limit=Number(args.find(x=>x.startsWith('--limit='))?.split('=')[1]??Infinity),cacheOnly=args.includes('--cache-only'),refresh=args.includes('--refresh'),write=args.includes('--write'),cacheDir=resolve(root,'work/equipment-cache/MCW-1');
const ids=args.find(x=>x.startsWith('--ids='))?.slice(6).split(','),data=JSON.parse(await readFile(catalogPath,'utf8'));
const rows=data.items.filter(i=>String(i.category).toLowerCase()==='equip'&&i.isCash===false&&/^\d+$/.test(String(i.id))&&(!ids||ids.includes(String(i.id)))).sort((a,b)=>Number(!!equipmentSlot(b))-Number(!!equipmentSlot(a))||Number(a.id)-Number(b.id)).slice(0,limit);
await mkdir(cacheDir,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let lastStart=0,blockedUntil=0,gate=Promise.resolve(),done=0;
function throttle(){gate=gate.then(async()=>{await sleep(Math.max(0,250-(Date.now()-lastStart),blockedUntil-Date.now()));lastStart=Date.now();});return gate;}
async function get(url){
 for(let attempt=0;attempt<3;attempt++){
  await throttle();const response=await fetch(url,{headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(25000)});
  if(response.status===429||response.status>=500){if(attempt===2)throw new Error('HTTP '+response.status);const rawRetry=response.headers.get('retry-after'),retry=Number(rawRetry),delay=rawRetry&&Number.isFinite(retry)?Math.max(0,retry*1000):rawRetry&&Number.isFinite(Date.parse(rawRetry))?Math.max(0,Date.parse(rawRetry)-Date.now()):1000*2**attempt;if(response.status===429)blockedUntil=Math.max(blockedUntil,Date.now()+delay);await sleep(delay);continue;}
  if(!response.ok)return {status:response.status};
  const text=await response.text();if(text.length>5_000_000)throw new Error('Equipment response too large');
  return {status:response.status,raw:JSON.parse(text),fetchedAt:new Date().toISOString(),etag:response.headers.get('etag')};
 }
}
const wzFolders={100:'Cap',101:'Accessory',102:'Accessory',103:'Accessory',104:'Coat',105:'Longcoat',106:'Pants',107:'Shoes',108:'Glove',109:'Shield',110:'Cape',111:'Ring',112:'Accessory',113:'Accessory',114:'Accessory',115:'Accessory',116:'Accessory',117:'Accessory',118:'Accessory',119:'Accessory'};
async function wzFallback(item){
 const prefix=Math.floor(Number(item.id)/10000),folder=wzFolders[prefix]??(prefix>=130&&prefix<=159?'Weapon':null);if(!folder)return null;
 const base='https://maplestory.io/api/wz/MCW/1/Character/'+folder+'/'+String(item.id).padStart(8,'0')+'.img/info',info=await get(base);
 if(!Array.isArray(info.raw?.children))return null;
 const fields=info.raw.children.filter(k=>/^(?:req[A-Z]|inc[A-Z])/.test(k)||['tuc','cash','attackSpeed','price','islot','vslot'].includes(k)),metaInfo={},fieldEvidence={};
 await Promise.all(fields.map(async field=>{const result=await get(base+'/'+field);if(result.raw&&Object.hasOwn(result.raw,'value')){metaInfo[field]=result.raw.value;fieldEvidence[field]={sourceUrl:base+'/'+field,fetchedAt:result.fetchedAt};}}));
 if(metaInfo.cash===0||metaInfo.cash===1)metaInfo.cash=metaInfo.cash===1;
 for(const [from,to] of [['islot','islots'],['vslot','vslots']])if(typeof metaInfo[from]==='string')metaInfo[to]=metaInfo[from].match(/.{1,2}/g)??[];
 return {sourceUrl:base,fetchedAt:new Date().toISOString(),rawSourceFormat:'scalar-properties-reassembled',fieldEvidence,raw:{id:Number(item.id),description:{name:item.en},typeInfo:{overallCategory:'Equip',subCategory:item.subCategory},metaInfo},wzStats:{}};
}
async function collect(item){
 const path=resolve(cacheDir,item.id+'.json');let snapshot;
 try{snapshot=JSON.parse(await readFile(path,'utf8'));}catch{}
 if(refresh&&!cacheOnly)snapshot=null;
 if(!snapshot&&!cacheOnly){
  try{
   const result=await get(EQUIPMENT_API+item.id);
   if(result.raw?.id!=item.id||!result.raw?.metaInfo){snapshot=await wzFallback(item);if(!snapshot)throw new Error('No matching equipment metadata (HTTP '+result.status+')');}
   else{const {metaInfo,...other}=result.raw;const compact=Object.fromEntries(Object.entries(metaInfo).filter(([k])=>!k.startsWith('icon')));
   snapshot={sourceUrl:EQUIPMENT_API+item.id,status:result.status,fetchedAt:result.fetchedAt,etag:result.etag,raw:{id:other.id,description:other.description,typeInfo:other.typeInfo,metaInfo:compact},wzStats:{}};}
  }catch(error){return {id:item.id,error:String(error.message)};}
 }
 if(!snapshot)return {id:item.id,error:'No cached metadata'};
 if(!cacheOnly&&snapshot.raw.typeInfo?.category?.includes('Weapon')){
  const dir='Weapon',base='https://maplestory.io/api/wz/MCW/1/Character/'+dir+'/'+String(item.id).padStart(8,'0')+'.img/info/';
  for(const [key,field] of [['attack','incWAT'],['magicAttack','incMAT']]){
   const m=snapshot.raw.metaInfo;if(key==='attack'&&(m.incWAT!=null||m.incPAD!=null)||key==='magicAttack'&&(m.incMAD!=null||m.incMAT!=null||!['Wand','Staff'].includes(snapshot.raw.typeInfo.subCategory)))continue;
   if(Object.hasOwn(snapshot.wzStats??{},key))continue;
   try{const result=await get(base+field);snapshot.wzStats??={};snapshot.wzStats[key]=result.raw&&Object.hasOwn(result.raw,'value')?{value:result.raw.value,field,sourceUrl:base+field,fetchedAt:result.fetchedAt}:{value:null,field,sourceUrl:base+field,status:result.status};}catch{ /* Preserve unknown and retry on a later run. */ }
  }
 }
 const tmp=path+'.tmp';await writeFile(tmp,JSON.stringify(snapshot));await rename(tmp,path);
 try{return {id:item.id,patch:normalizeEquipmentMetadata(snapshot.raw,item,snapshot)};}catch(error){return {id:item.id,error:String(error.message)};}
}
const results=[];let cursor=0;
await Promise.all(Array.from({length:3},async()=>{while(cursor<rows.length){const item=rows[cursor++];results.push(await collect(item));done++;if(done%100===0)console.log(JSON.stringify({done,total:rows.length,errors:results.filter(r=>r.error).length}));}}));
const patches=results.filter(r=>r.patch).map(r=>r.patch),errors=results.filter(r=>r.error);
if(write){
 // Read again just before merging: simultaneous quest/guide edits stay intact.
 const latest=JSON.parse(await readFile(catalogPath,'utf8')),byId=new Map(patches.map(p=>[p.id,p]));latest.items=latest.items.map(i=>byId.has(String(i.id))?{...i,...byId.get(String(i.id))}:i);
 const optimizerItems=latest.items.filter(i=>String(i.category).toLowerCase()==='equip'&&i.isCash===false&&equipmentSlot(i));
 latest.meta.equipmentMetadata={...equipmentMetadataCoverage(latest.items),optimizerSlotItems:optimizerItems.length,optimizerSlotCoreComplete:optimizerItems.filter(i=>i.coreRequirementsComplete===true).length,sourceUrl:'https://maplestory.io/swagger/V3/swagger.json',checkedAt:new Date().toISOString(),note:'소스에 명시된 조건만 보강. 누락값을 0으로 채우지 않음.'};
 await writeFile(catalogPath+'.tmp',JSON.stringify(latest)+'\n');await rename(catalogPath+'.tmp',catalogPath);
 const storedPath=resolve(root,'content/equipment-metadata.json');let previous={items:[]};try{previous=JSON.parse(await readFile(storedPath,'utf8'));}catch{}
 const combined=new Map(previous.items.map(p=>[p.id,p]));for(const p of patches)combined.set(p.id,p);
 await writeFile(storedPath+'.tmp',JSON.stringify({source:'MapleStory.IO public MCW/1 client API',verifiedAt:new Date().toISOString(),items:[...combined.values()],failures:errors})+'\n');await rename(storedPath+'.tmp',storedPath);
}
console.log(JSON.stringify({requested:rows.length,normalized:patches.length,errors,write,coverage:equipmentMetadataCoverage(write?JSON.parse(await readFile(catalogPath,'utf8')).items:data.items)},null,2));
