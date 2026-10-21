/** GG's public client endpoints. Fixed origin; no credentials or browser headers. */
export const GLCLME_ORIGIN='https://xn--bj0bv7uo4la196f.com';
const id=value=>/^\d{1,10}$/.test(String(value??''))?String(value):null;
// Arrays, booleans and objects must never be coerced to a price.
const number=value=>(typeof value==='number'||typeof value==='string'&&value.trim()!=='')&&Number.isFinite(Number(value))?Number(value):null;
const count=value=>{const n=number(value);return n!==null&&Number.isInteger(n)&&n>=0?n:null;};
export function glclmeTime(value){
 if(value===null||value===undefined||value==='')return null;
 const numeric=number(value),at=numeric!==null?numeric*(numeric<100_000_000_000?1000:1):Date.parse(value);
 return Number.isFinite(at)&&at>1_500_000_000_000&&at<Date.now()+300_000?new Date(at).toISOString():null;
}
/** Public client module 23075.jg + 15141.B: [median,q1,q3,low,high,posts]. */
export function normalizeGlclmeStats(value){
 if(!Array.isArray(value)||value.length!==6)return null;
 const [median,q1,q3,low,high]=value.slice(0,5).map(number),sampleCount=count(value[5]);
 if(median===null||median<=0||sampleCount===null)return null;
 return {median,q1,q3,low,high,sampleCount};
}
/** Keep unfamiliar keys verbatim; display only the interpretation in the public client. */
export function glclmeOptionLabel(value){
 if(typeof value!=='string'||!value)return null;
 const [grade,stat,...rest]=value.split('|');
 if(rest.length||!(grade==='c'||/^[a-z]\d+$/i.test(grade))||stat&&!/^[ams]-?\d+(?:\.\d+)?$/.test(stat))return value.slice(0,100);
 return [grade==='c'?'노작':`+${grade.slice(1)}`,stat?`${{a:'공',m:'마',s:'합'}[stat[0]]} ${stat.slice(1)}`:null].filter(Boolean).join(' · ');
}
function history(value){
 if(!Array.isArray(value))return [];
 return value.slice(0,366).filter(p=>Array.isArray(p)&&p.length===5&&typeof p[0]==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(p[0])).map(p=>({date:p[0],sellMedian:number(p[1]),sellCount:count(p[2]),buyMedian:number(p[3]),buyCount:count(p[4])}));
}
/** @param {any} raw @param {Map<string,any>} byId @param {number} [index] */
function normalizeRow(raw,byId,index=0){
 const providerItemId=id(raw?.id);if(!providerItemId)return null;const item=byId.get(providerItemId),sellStats=normalizeGlclmeStats(raw.s),buyStats=normalizeGlclmeStats(raw.b);
 return {rowKey:`${providerItemId}:${raw.src??''}:${index}`,providerItemId,itemId:item?String(item.id):null,name:item?.name||`글클메지지 #${providerItemId}`,en:item?.en||'',sell:sellStats?.median??null,buy:buyStats?.median??null,sellStats,buyStats,reference:number(raw.t),sampleCount:count(raw.n),lastObservedAt:glclmeTime(raw.last),sourceKind:raw.src==='board'?'board':'megaphone',equipment:raw.src==='board'||item?.category==='Equip',optionKind:typeof raw.k==='string'?raw.k:null,optionLabel:glclmeOptionLabel(raw.k),variants:Array.isArray(raw.v)?raw.v.slice(0,500).filter(v=>v&&typeof v.k==='string').map(v=>({key:v.k.slice(0,100),label:glclmeOptionLabel(v.k),sellStats:normalizeGlclmeStats(v.s),buyStats:normalizeGlclmeStats(v.b),sampleCount:count(v.n),soldCount:count(v.sold)})):[],history:history(raw.h),dayChangePercent:number(raw.d)};
}
export function normalizeGlclmeSummary(body,catalog=[]){
 if(!body||!Array.isArray(body.items)||body.items.length>20_000)throw Error('글클메지지 시세 응답 형식 확인 필요');
 const byId=new Map(catalog.map(item=>[String(item.id),item]));let unmapped=0;
 const rows=body.items.map((raw,index)=>{
  const row=normalizeRow(raw,byId,index);if(row&&!row.itemId)unmapped++;return row;
 }).filter(Boolean);
 return {rows,unmapped,updatedAt:glclmeTime(body.updated),syncedAt:glclmeTime(body.synced),latestMessageAt:glclmeTime(body.latest),stale:body.stale===true,ready:body.ready!==false,messages:count(body.messages),quoteCount:count(body.quotes),listingCount:count(body.listings)};
}
export function normalizeGlclmeDetail(body,itemId){
 if(!body||!Array.isArray(body.quotes)||body.quotes.length>20_000)throw Error('글클메지지 아이템 응답 형식 확인 필요');
 if(body.row?.id!==undefined&&String(body.row.id)!==String(itemId))throw Error('아이템 식별자가 일치하지 않습니다.');
 return {itemId,updatedAt:glclmeTime(body.updated),stale:body.stale===true,ready:body.ready!==false,row:body.row?normalizeRow(body.row,new Map()):null,quotes:body.quotes.map((q,i)=>({id:`${q.msg??i}:${itemId}:${q.side}:${q.k??''}:${q.at}`,messageId:q.msg==null?null:String(q.msg),type:q.side==='sell'||q.side==='s'?'sell':q.side==='buy'||q.side==='b'?'buy':null,price:number(q.price),at:glclmeTime(q.at),channel:q.ch==null?null:String(q.ch).slice(0,20),optionKey:typeof q.k==='string'?q.k.slice(0,100):null,optionLabel:glclmeOptionLabel(q.k),sold:q.sold===true||q.sold===1,quantityKnown:false})).filter(q=>q.type&&q.price!==null&&q.price>0&&q.at)};
}
async function readJson(response){
 if(!response.headers.get('content-type')?.includes('json'))throw Error('글클메지지 JSON 응답 확인 필요');
 if(!response.body)throw Error('글클메지지 빈 응답');
 const reader=response.body.getReader(),parts=[];let size=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>2_000_000){await reader.cancel();throw Error('글클메지지 응답 용량 초과');}parts.push(value);}}finally{reader.releaseLock();}
 const result=new Uint8Array(size);let offset=0;for(const part of parts){result.set(part,offset);offset+=part.byteLength;}
 return JSON.parse(new TextDecoder().decode(result));
}
/** @param {{fetchFn?:typeof fetch,clock?:()=>number,catalog?:Array<any>}} [options] */
export function createGlclmeReader({fetchFn=fetch,clock=Date.now,catalog=[]}={}){
 // Workers can share completed values, but not another request's pending Promise.
 const cache=new Map(),pending=new Set();let blockedUntil=0,blockedStatus=null;
 /** @param {string|null} [itemId] */
 async function read(itemId=null){
  if(itemId!==null&&!id(itemId))throw Error('올바른 아이템 ID를 선택하세요.');
  const key=itemId?String(itemId):'summary',now=clock(),previous=cache.get(key);
  const result=(status,message='',data=previous?.data??null)=>({provider:{id:'glclme',name:'글클메지지',status,message,httpStatus:blockedStatus,sourceUrl:GLCLME_ORIGIN+'/market'},data,fetchedAt:previous?.fetchedAt??null,checkedAt:new Date(now).toISOString(),intervalSeconds:60,nextPollAt:new Date(Math.max(blockedUntil,status==='waiting'?clock()+2_000:Math.max(clock(),previous?.checkedAt??now)+60_000)).toISOString(),stale:status==='backoff'||!data||data.stale===true||data.ready===false,ready:!!data&&data.ready!==false});
  if(blockedUntil>now)return result('backoff',blockedStatus===403?'글클메지지가 서버 요청을 거부했습니다 (403). 마지막 정상 자료가 있으면 그대로 표시합니다.':'공급원의 재시도 대기 중입니다.');
  if(previous&&now-previous.checkedAt<60_000)return result('cached');
  if(pending.has(key))return result('waiting','다른 조회가 진행 중입니다. 마지막 정상 자료를 유지하며 잠시 후 자동으로 확인합니다.');
  pending.add(key);
  const task=(async()=>{
   try{
    const response=await fetchFn(GLCLME_ORIGIN+'/api/prices'+(itemId?'?item='+encodeURIComponent(itemId):''),{headers:{Accept:'application/json',...(previous?.etag?{'If-None-Match':previous.etag}:{})},redirect:'manual',signal:AbortSignal.timeout(8000)});
    if(response.status===304&&previous){previous.checkedAt=clock();blockedStatus=null;return result('unchanged');}
    if(!response.ok){blockedStatus=response.status;const retry=response.headers.get('retry-after'),seconds=/^\d+$/.test(retry??'')?Number(retry):0;blockedUntil=clock()+Math.max(response.status===403?15*60:60,seconds)*1000;return result('backoff',response.status===403?'글클메지지가 서버 요청을 거부했습니다 (403). 연결되지 않은 값을 새 시세로 표시하지 않습니다.':`글클메지지 응답 ${response.status} · 재시도 대기`);}
    const raw=await readJson(response),data=itemId?normalizeGlclmeDetail(raw,String(itemId)):normalizeGlclmeSummary(raw,catalog),at=new Date(clock()).toISOString();
    cache.set(key,{data,checkedAt:clock(),fetchedAt:at,etag:response.headers.get('etag')});if(cache.size>40)cache.delete(cache.keys().next().value);blockedStatus=null;blockedUntil=0;
    return {...result('connected','',data),fetchedAt:at};
   }catch{blockedUntil=clock()+60_000;return result('backoff','글클메지지 시세 연결을 확인하지 못했습니다. 마지막 정상 자료를 유지합니다.');}
   finally{pending.delete(key);}
  })();return task;
 }
 return read;
}
