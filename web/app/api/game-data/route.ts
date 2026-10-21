import catalog from '@/content/public-catalog.json';
import { CATALOG_KINDS, mapRoute, normalizeItemDetail, normalizeMapDetail, normalizeQuestDetail, queryCatalog } from '@/lib/public-catalog.mjs';
import {catalogCoverage,sourceTablePage} from '@/lib/catalog-sources.mjs';

const DATA:any=catalog;
const runtimeCache=new Map<string,{value:any;expires:number}>();
async function upstream(kind:string,id:string) {
  const endpoint=({items:'item',maps:'map',quests:'quest',npcs:'npc'} as Record<string,string>)[kind];
  if(!endpoint||!/^\d{1,10}$/.test(id))return null;
  const key=endpoint+'/'+id,cached=runtimeCache.get(key);
  if(cached&&cached.expires>Date.now())return cached.value;
    const response=await fetch('https://maplestory.io/api/MCW/1/'+key,{signal:AbortSignal.timeout(7000)});
    if(!response.ok)throw new Error('공개 자료 응답 '+response.status);
    const raw:any=await response.json();
    if(!raw||typeof raw!=='object'||raw.error)throw new Error('현재 공개 API에서 상세 자료를 제공하지 않습니다.');
    runtimeCache.set(key,{value:raw,expires:Date.now()+6*60*60*1000});
    if(runtimeCache.size>300)runtimeCache.delete(runtimeCache.keys().next().value!);
    return raw;
}
function reply(data:any,status=200) {return Response.json(data,{status,headers:{'Cache-Control':'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400','X-Content-Type-Options':'nosniff'}});}
export async function GET(request:Request) {
  const p=new URL(request.url).searchParams;
  const kind=p.get('kind')||'items';
  if(kind==='coverage'||kind==='sourceTable') {
    const {default:sourceTables}=await import('@/content/source-tables.json');
    if(kind==='sourceTable') {
      const result=sourceTablePage(sourceTables,p.get('table')||'',{q:p.get('q')||'',offset:Number(p.get('offset')||0),limit:Number(p.get('limit')||20)});
      return reply(result,'error' in result?400:200);
    }
    const {default:snapshot}=await import('@/content/catalog-sources.json');
    return reply(catalogCoverage(snapshot,sourceTables,DATA.meta.counts));
  }
  if(kind==='atlas') {
    const map=p.get('map')||'WorldMap001';
    if(!['WorldMap000','WorldMap001'].includes(map))return reply({error:'지원하지 않는 월드맵입니다.'},400);
    const key='atlas/'+map,cached=runtimeCache.get(key);
    if(cached&&cached.expires>Date.now())return reply(cached.value);
    try {
      const response=await fetch('https://maplestory.io/api/MCW/1/map/worldmap/'+map,{signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw new Error('월드맵 이미지 서비스가 응답하지 않습니다.');
      const raw:any=await response.json(),base=raw.baseImage?.[0],encoded=base?.image;
      if(typeof encoded!=='string'||encoded.length>4*1024*1024||!encoded.startsWith('iVBORw0KGgo'))throw new Error('지원하는 월드맵 이미지가 없습니다.');
      const header=Uint8Array.from(atob(encoded.slice(0,64)),c=>c.charCodeAt(0)),view=new DataView(header.buffer);
      const value={map,image:'data:image/png;base64,'+encoded,width:view.getUint32(16),height:view.getUint32(20),origin:base.originOrZero||base.origin||{x:0,y:0},spots:(raw.maps||[]).filter((s:any)=>s&&s.spot&&Array.isArray(s.mapNumbers)).map((s:any)=>({x:s.spot.x,y:s.spot.y,type:s.type,mapIds:s.mapNumbers.map(String)})),sourceUrl:'https://maplestory.io/api/MCW/1/map/worldmap/'+map,fetchedAt:new Date().toISOString()};
      runtimeCache.set(key,{value,expires:Date.now()+6*60*60*1000});return reply(value);
    }catch{return reply({error:'월드맵 이미지를 불러오지 못했습니다. 아래 맵 목록과 연결 관계는 계속 사용할 수 있습니다.'},502);}
  }
  if(kind==='bundle') {
    const requested=(p.get('sets')||'monsters,maps,quests,items,recipes,npcs,shops,portals,drops').split(',');
    if(requested.some(k=>!CATALOG_KINDS.includes(k)))return reply({error:'지원하지 않는 자료 묶음입니다.'},400);
    const result:any={meta:DATA.meta,sources:DATA.sources};
    // The full source fields remain in item detail and the source-table endpoint.
    // Repeating them in shared bundles would add several MB to every first visit.
    for(const k of requested)result[k]=DATA[k].map(({wikiFields,wikiFieldSource,...row}:any)=>row);
    return reply(result);
  }
  if(kind==='route')return reply({...mapRoute(DATA,p.get('from'),p.get('to'),{level:p.has('level')?p.get('level'):undefined,allowConditional:p.get('conditional')==='1',allowTransport:p.get('transport')==='1'}),source:DATA.meta});
  if(!CATALOG_KINDS.includes(kind))return reply({error:'도감 종류를 확인해 주세요.'},400);
  const id=p.get('id');
  if(id!==null) {
    if(id.length>160)return reply({error:'잘못된 항목 ID입니다.'},400);
    let row:any=queryCatalog(DATA,kind,{id});
    if(!row)return reply({error:'항목을 찾을 수 없습니다.'},404);
    let detailError:string|null=null;
    if(p.get('detail')==='1'&&['items','maps','npcs','quests'].includes(kind)) {
      try {
        const raw=await upstream(kind,id);
        if(raw) {
          if(kind==='items')row=normalizeItemDetail(raw,row);
          if(kind==='maps')row=normalizeMapDetail(raw,row,DATA);
          if(kind==='quests')row=normalizeQuestDetail(raw,row,DATA);
          if(kind==='npcs')row={...row,isShop:raw.isShop,metadataFetchedAt:new Date().toISOString()};
        }
      }catch(error:any){detailError=error.message||'상세 자료를 불러오지 못했습니다.';}
    }
    const related:any={};
    if(kind==='monsters') {related.maps=DATA.maps.filter((m:any)=>row.mapIds?.includes(m.id));related.items=DATA.items.filter((i:any)=>row.dropItemIds?.includes(i.id));}
    if(kind==='maps') {related.monsters=DATA.monsters.filter((m:any)=>row.mobIds?.includes(m.id));related.npcs=DATA.npcs.filter((n:any)=>row.npcIds?.includes(n.id));}
    if(kind==='items') {related.monsters=DATA.monsters.filter((m:any)=>m.dropItemIds?.includes(row.id));related.quests=DATA.quests.filter((q:any)=>[...(q.requirements||[]),...(q.rewardItems||[]),...(q.rewardChoices||[])].some((r:any)=>r.itemId===row.id));related.shops=DATA.shops.filter((s:any)=>s.itemId===row.id);related.recipes=DATA.recipes.filter((r:any)=>r.outputItemId===row.id||r.ingredients.some((i:any)=>i.itemId===row.id));}
    if(kind==='quests') {related.prerequisites=DATA.quests.filter((q:any)=>row.prerequisiteIds?.includes(q.id));related.items=DATA.items.filter((i:any)=>[...(row.requirements||[]),...(row.rewardItems||[]),...(row.rewardChoices||[])].some((r:any)=>r.itemId===i.id));related.monsters=DATA.monsters.filter((m:any)=>row.killRequirements?.some((r:any)=>r.monsterId===m.id));}
    return reply({row,related,detailError,source:DATA.meta,coverage:DATA.meta.coverage[kind]||null});
  }
  const options:any={q:(p.get('q')||'').slice(0,120),offset:p.get('offset'),limit:p.get('limit'),category:p.get('category'),equipment:p.get('equipment')==='1',hideCash:p.get('hideCash')==='1',job:p.get('job')};
  if(p.has('minLevel'))options.minLevel=p.get('minLevel');
  if(p.has('maxLevel'))options.maxLevel=p.get('maxLevel');
  if(p.has('eligibleLevel'))options.eligibleLevel=p.get('eligibleLevel');
  if(p.has('exclude'))options.exclude=(p.get('exclude')||'').split(',').slice(0,500).filter(id=>id.length<=160);
  return reply({...queryCatalog(DATA,kind,options),verifiedAt:DATA.meta.verifiedAt,source:DATA.meta,coverage:DATA.meta.coverage[kind]||null,categories:[...new Set((DATA[kind]||[]).map((r:any)=>r.subCategory||r.category).filter(Boolean))]});
}
