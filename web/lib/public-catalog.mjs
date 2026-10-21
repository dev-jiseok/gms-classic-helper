/** Pure catalog operations. Public upstream data is normalized before UI use. */
import {CURRENT_JOB_CODES,normalizeQuestEvidence,questEvidenceSignature} from "./quest-evidence.mjs";
const JOB_CODE_BY_ID=Object.fromEntries(Object.entries(CURRENT_JOB_CODES).map(([code,id])=>[id,Number(code)]));
export const CATALOG_KINDS = ['items','monsters','maps','npcs','quests','shops','recipes','drops','portals'];
const initials = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
export function searchKey(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase().replace(/[\s\-_'’:/·().]/g,'');
}
export function koreanInitials(value) {
  return [...String(value ?? '')].map(c => {
    const n = c.charCodeAt(0) - 0xac00;
    return n >= 0 && n <= 11171 ? initials[Math.floor(n / 588)] : c;
  }).join('');
}
export function catalogMatches(row, query) {
  const terms=String(query ?? '').trim().split(/\s+/).filter(Boolean).map(searchKey);
  const text=searchKey([row.id,row.name,row.en,row.region,row.category,row.subCategory,row.profession,row.itemName,row.npcName,row.role].filter(Boolean).join(' '));
  const chosung=searchKey(koreanInitials(row.name));
  return terms.every(term=>text.includes(term)||chosung.includes(term));
}
export function queryCatalog(data, kind, options={}) {
  if (!CATALOG_KINDS.includes(kind)) throw new Error('지원하지 않는 도감 종류입니다.');
  let rows=data[kind] || [];
  if (options.id !== undefined) return rows.find(r=>String(r.id)===String(options.id)) || null;
  const minLevel=Number(options.minLevel),maxLevel=Number(options.maxLevel);
  if (options.q) rows=rows.filter(r=>catalogMatches(r,options.q));
  if (options.exclude?.length) {const excluded=new Set(options.exclude.map(String));rows=rows.filter(r=>!excluded.has(String(r.id))&&!excluded.has(String(r.legacyId)));}
  if (options.category) rows=rows.filter(r=>searchKey(r.category)===searchKey(options.category)||searchKey(r.subCategory)===searchKey(options.category));
  if (options.equipment) rows=rows.filter(r=>['equip','equipment','장비'].includes(searchKey(r.category)));
  if (options.hideCash) rows=rows.filter(r=>!r.isCash);
  if (options.minLevel!==undefined && Number.isFinite(minLevel)) rows=rows.filter(r=>(r.level??r.requiredLevel??r.minLevel)!==null && Number(r.level??r.requiredLevel??r.minLevel)>=minLevel);
  if (options.maxLevel!==undefined && Number.isFinite(maxLevel)) rows=rows.filter(r=>(r.level??r.requiredLevel??r.minLevel)!==null && Number(r.level??r.requiredLevel??r.minLevel)<=maxLevel);
  if (options.eligibleLevel!==undefined&&Number.isFinite(Number(options.eligibleLevel))) rows=rows.filter(r=>((r.minLevel!==null&&r.minLevel!==undefined&&Number(r.minLevel)<=Number(options.eligibleLevel))||((r.minLevel===null||r.minLevel===undefined)&&r.clientNoMinimumLevel===true))&&(r.maxLevel===null||r.maxLevel===undefined||Number(r.maxLevel)>=Number(options.eligibleLevel)));
  if (options.job) {
    if(kind==='quests') {
      const family={fighter:'warrior',page:'warrior',spearman:'warrior',firePoison:'magician',iceLightning:'magician',cleric:'magician',hunter:'bowman',crossbowman:'bowman',assassin:'thief',bandit:'thief'}[options.job]||options.job;
      rows=rows.filter(r=>Array.isArray(r.clientJobCodes)&&r.clientJobCodes.length&&JOB_CODE_BY_ID[options.job]!==undefined?r.clientJobCodes.map(Number).includes(JOB_CODE_BY_ID[options.job]):!r.jobs?.length||r.jobs.some(j=>['all',searchKey(options.job),searchKey(family)].includes(searchKey(j))));
    } else rows=rows.filter(r=>!r.requiredJobs?.length||r.requiredJobs.some(j=>searchKey(j)===searchKey(options.job)||['all','beginner'].includes(searchKey(j))));
  }
  const offset=Math.max(0,Math.floor(Number(options.offset)||0));
  const limit=Math.max(1,Math.min(200,Math.floor(Number(options.limit)||50)));
  return {rows:rows.slice(offset,offset+limit),total:rows.length,offset,limit};
}
export function mapRoute(data, fromId, toId, options={}) {
  const maps=new Map((data.maps||[]).map(m=>[String(m.id),m]));
  const start=String(fromId),end=String(toId);
  if (!maps.has(start)||!maps.has(end)) return {path:[],edges:[],reason:'출발지와 도착지를 도감에서 선택해 주세요.'};
  if (start===end) return {path:[maps.get(start)],edges:[],reason:null};
  const byFrom=new Map();
  for (const edge of data.portals||[]) {
    if (!edge.toId || !maps.has(String(edge.toId))) continue;
    // Direction is retained. Never invent a reverse portal.
    if (options.level!==undefined && edge.requiresLevel && Number(options.level)<edge.requiresLevel) continue;
    if (!options.allowConditional && (edge.requiresQuest||edge.requiresItem||['quest','instance'].includes(edge.portalType))) continue;
    if (!options.allowTransport && edge.portalType==='transport') continue;
    const list=byFrom.get(String(edge.fromId))||[];list.push(edge);byFrom.set(String(edge.fromId),list);
  }
  const queue=[start],previous=new Map([[start,null]]);
  for(let i=0;i<queue.length;i++) {
    const at=queue[i];
    for(const edge of byFrom.get(at)||[]) {
      const next=String(edge.toId);
      if(previous.has(next))continue;
      previous.set(next,{from:at,edge});
      if(next===end) {
        const ids=[end],edges=[];
        for(let cur=end;cur!==start;) {const p=previous.get(cur);edges.push(p.edge);cur=p.from;ids.push(cur);}
        return {path:ids.reverse().map(id=>maps.get(id)),edges:edges.reverse(),reason:null,metric:'확인된 포털 수 최소 · 이동시간 최적화 아님'};
      }
      queue.push(next);
    }
  }
  return {path:[],edges:[],reason:'현재 확인된 포털과 조건으로 연결되는 경로가 없습니다. 배·택시·퀘스트 이동은 별도 확인해 주세요.'};
}
const finite=value=>value===null||value===undefined||value===''?null:Number.isFinite(Number(value))?Number(value):null;
export function normalizeItemDetail(raw, index={}) {
  const m=raw?.metaInfo||{};
  const statKeys={str:['incSTR','str'],dex:['incDEX','dex'],int:['incINT','int'],luk:['incLUK','luk'],hp:['incMHP','hp'],mp:['incMMP','mp'],attack:['incWAT','incPAD'],magicAttack:['incMAT','incMAD'],accuracy:['incACC','accuracy'],avoidability:['incEVA','avoidability'],speed:['incSpeed','speed'],jump:['incJump','jump'],physicalDefense:['incPDD','defense'],magicDefense:['incMDD','magicDefense']};
  const stats={...index.stats};
  for (const [key,aliases] of Object.entries(statKeys)) {const source=aliases.find(a=>m[a]!==undefined);if(source)stats[key]=finite(m[source]);}
  return {...index,id:String(raw.id ?? index.id),en:raw.description?.name||index.en,name:index.name||raw.description?.name,requiredLevel:finite(m.reqLevelEquip??m.reqLevel??index.requiredLevel),npcPrice:finite(m.price??index.npcPrice),npcSell:finite(m.price??index.npcSell),slots:finite(m.tuc??index.slots),attackSpeed:finite(m.attackSpeed),stats,statRequirements:{str:finite(m.reqSTR),dex:finite(m.reqDEX),int:finite(m.reqINT),luk:finite(m.reqLUK)},vslots:Array.isArray(m.vslots)?m.vslots:[],islots:Array.isArray(m.islots)?m.islots:[],typeInfo:raw.typeInfo||null,metadataFetchedAt:new Date().toISOString(),metadataSourceUrl:`https://maplestory.io/api/MCW/1/item/${raw.id??index.id}`,metadataNote:'공개 클라이언트 기준 기본값입니다. 실제 매물의 추가 옵션·강화 결과는 별도로 입력하세요.'};
}
export function normalizeQuestDetail(raw, index={}, data={}) {
  const evidence=index.metadataInputSignature===questEvidenceSignature(raw)?index.clientEvidence??{}:{};
  return normalizeQuestEvidence(raw,index,data,evidence);
}
export function normalizeMapDetail(raw,index={},data={}) {
  const maps=new Map((data.maps||[]).map(m=>[String(m.id),m]));
  const validPortals=(raw.portals||[]).filter(p=>p&&p.toMap!==undefined&&p.toMap!==Number(raw.id)&&p.toMap!==999999999&&p.toMap!==0&&!p.unknownExit).map(p=>({fromId:String(raw.id),toId:String(p.toMap),toName:maps.get(String(p.toMap))?.name||String(p.toMap),portalName:p.portalName,portalType:'client-portal',x:p.x,y:p.y,requiresLevel:null,requiresQuest:null,requiresItem:null,sourceUrl:`https://maplestory.io/api/MCW/1/map/${raw.id}`}));
  const portals=[...(index.portals||[])];
  for(const portal of validPortals)if(!portals.some(p=>p.toId===portal.toId&&p.portalName===portal.portalName))portals.push(portal);
  const npcs=(raw.npcs||[]).filter(n=>n&&n.id!==undefined),mobs=(raw.mobs||[]).filter(m=>m&&m.id!==undefined);
  return {...index,isTown:Boolean(raw.isTown),isSwim:Boolean(raw.isSwim),returnMapId:raw.returnMap?String(raw.returnMap):null,mobRate:finite(raw.mobRate),npcIds:[...new Set(npcs.map(n=>String(n.id)))],mobIds:[...new Set(mobs.map(m=>String(m.id)))],spawns:mobs.map(m=>({monsterId:String(m.id),x:m.x,y:m.y,respawnSeconds:finite(m.mobTime)})),portals,metadataFetchedAt:new Date().toISOString(),metadataSourceUrl:`https://maplestory.io/api/MCW/1/map/${raw.id}`,metadataNote:'클라이언트 포털의 숨은 퀘스트·입장 조건은 기록되지 않을 수 있습니다.'};
}
