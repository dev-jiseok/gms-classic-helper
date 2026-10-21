import {gameMediaId,gameMediaKind,gameMediaUrl,gameWzCanvasRoot,inspectGameImage,itemWzIconUrl,selectMonsterPose,selectWzPose} from './game-media.mjs';

const BASE='https://maplestory.io/api/MCW/1',MAX_BYTES=4*1024*1024,POSITIVE_TTL=24*60*60*1000,NEGATIVE_TTL=5*60*1000;
const ascii=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export class GameMediaError extends Error{constructor(code,message){super(message);this.code=code;}}

/** One fixed public source, bounded responses, no caller-controlled upstream URL. */
export function createGameMediaReader({fetcher=fetch,now=Date.now,maxCacheBytes=24*1024*1024,startIntervalMs=250}={}){
 // Workers bind I/O and timers to the incoming request. Share completed data,
 // never a pending fetch/stream/timer promise from a different request context.
 const cache=new Map(),poses=new Map(),starts=new WeakMap(),transportErrors=new WeakMap();let cacheBytes=0,blockedUntil=0;
 function remember(key,entry){const old=cache.get(key);cacheBytes-=old?.value?.bytes.length??0;cache.delete(key);cache.set(key,entry);cacheBytes+=entry.value?.bytes.length??0;while(cache.size>220||cacheBytes>maxCacheBytes){const first=cache.keys().next().value,saved=cache.get(first);cache.delete(first);cacheBytes-=saved.value?.bytes.length??0;}}
 async function request(url,signal){
  if(blockedUntil>now())throw new GameMediaError('backoff','이미지 공급원의 재시도 대기 중입니다.');
  const wait=Math.max(0,startIntervalMs-(now()-(starts.get(signal)??-Infinity)));if(wait)await new Promise(resolve=>setTimeout(resolve,wait));starts.set(signal,now());
  const controller=new AbortController(),cancel=()=>controller.abort();if(signal.aborted)cancel();else signal.addEventListener('abort',cancel,{once:true});const timer=setTimeout(cancel,7000);let response;
  try{response=await fetcher(url,{redirect:'manual',signal:controller.signal});}finally{clearTimeout(timer);signal.removeEventListener('abort',cancel);}
  if(response.status===429){const value=response.headers.get('retry-after'),seconds=Number(value),delay=value&&Number.isFinite(seconds)?seconds*1000:Math.max(60_000,Date.parse(value??'')-now()||0);blockedUntil=now()+Math.min(30*60*1000,Math.max(1000,delay));throw new GameMediaError('backoff','이미지 공급원이 요청 간격을 제한했습니다.');}
  if(!response.ok){response.body?.cancel().catch(()=>{});return null;}
  const announced=Number(response.headers.get('content-length'));if(announced>MAX_BYTES){response.body?.cancel().catch(()=>{});throw new GameMediaError('too-large','이미지 원문이 허용된 크기를 넘었습니다.');}
  return response;
 }
 async function bounded(response){
  if(!response.body)return new Uint8Array();const reader=response.body.getReader(),chunks=[];let length=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX_BYTES){await reader.cancel();throw new GameMediaError('too-large','이미지 원문이 허용된 크기를 넘었습니다.');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}return bytes;
 }
 async function json(url,signal){
  const r=await request(url,signal);if(!r)return null;if(!r.headers.get('content-type')?.toLowerCase().startsWith('application/json')){r.body?.cancel().catch(()=>{});return null;}
  const data=JSON.parse(new TextDecoder().decode(await bounded(r)));return data&&typeof data==='object'&&!data.error?data:null;
 }
 async function image(url,signal,method){
  try{const r=await request(url,signal);if(!r)return null;const type=r.headers.get('content-type');
   if(!/^image\/(?:png|gif)(?:;|$)/i.test(type??'')){r.body?.cancel().catch(()=>{});return null;}
   const bytes=await bounded(r),info=inspectGameImage(bytes,type);return info?{...info,bytes:bytes.slice(0,info.byteLength),sourceUrl:url,method}:null;
  }catch(e){if(e instanceof GameMediaError)throw e;transportErrors.set(signal,true);return null;}
 }
 function encoded(value,sourceUrl,method){
  if(typeof value!=='string'||value.length>MAX_BYTES||!value.startsWith('iVBORw0KGgo')||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))return null;
  const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0)),info=inspectGameImage(bytes,'image/png');return info?{...info,bytes:bytes.slice(0,info.byteLength),sourceUrl,method}:null;
 }
 async function rawFrame(root,pose,signal){
  const base=root+'/'+pose;let value=await json(base+'/0',signal),frame='0';
  if(value?.type!==12||typeof value.value!=='string'){
   const children=await json(base,signal);frame=children?.children?.filter(s=>/^\d+$/.test(s)).sort((a,b)=>Number(a)-Number(b))[0];if(frame==null)return null;value=await json(base+'/'+frame,signal);
  }
  return value?.type===12?encoded(value.value,base+'/'+frame,'wz-frame'):null;
 }
 async function poseFor(type,id,signal){
  const key=type+':'+id,saved=poses.get(key);if(saved&&saved.expires>now())return saved;
  const work=(async()=>{
   let raw=null;try{raw=await json(`${BASE}/${type==='monster'?'mob':'npc'}/${id}`,signal);}catch(e){if(e.code==='backoff')throw e;}
   const frames=String(raw?.id)===id?raw?.framebooks:null;
   let pose=type==='monster'?selectMonsterPose(frames):selectWzPose(type,Object.keys(frames??{})),method='detail-framebooks';
   const root=gameWzCanvasRoot(type,id);
   if(!pose){const node=await json(root,signal);pose=node?.type===1?selectWzPose(type,node.children):null;method='wz-pose';}
   const value={pose,root,method,expires:now()+(pose?6*60*60*1000:NEGATIVE_TTL)};poses.set(key,value);if(poses.size>300)poses.delete(poses.keys().next().value);return value;
  })();return work;
 }
 async function collect(type,id,animated){
  const signal=AbortSignal.timeout(22000);let result=null;
  if(type==='monster'||type==='npc'){
   if(type==='npc')result=await image(`${BASE}/npc/${id}/icon`,signal,'npc-icon');
   if(!result){
    const pose=await poseFor(type,id,signal);if(!pose.pose)throw new GameMediaError('not-found','이 항목의 실제 이미지 포즈를 원문에서 확인하지 못했습니다.');
    const endpoint=type==='monster'?'mob':'npc';
    if(animated&&type==='monster')result=await image(`${BASE}/mob/${id}/render/${pose.pose}?bgColor=`,signal,pose.method+'-gif');
    if(!result)result=await image(`${BASE}/${endpoint}/${id}/render/${pose.pose}/0`,signal,pose.method+'-png');
    if(!result)result=await rawFrame(pose.root,pose.pose,signal);
    if(result)result.pose=pose.pose;
   }
  }else if(type==='item'){
   result=await image(gameMediaUrl({kind:type,id}),signal,'item-icon');
   if(!result){const raw=await json(`${BASE}/item/${id}`,signal);result=encoded(raw?.metaInfo?.icon,`${BASE}/item/${id}`,'item-detail-icon')??encoded(raw?.metaInfo?.iconRaw,`${BASE}/item/${id}`,'item-detail-icon-raw');}
   if(!result){const path=itemWzIconUrl(id);if(path){const raw=await json(path,signal);if(raw?.type===12)result=encoded(raw.value,path,'wz-item-icon');}}
  }else if(type==='map'){
   result=await image(gameMediaUrl({kind:type,id}),signal,'map-minimap');
   if(!result){const raw=await json(`${BASE}/map/${id}`,signal);result=encoded(raw?.miniMap?.canvas,`${BASE}/map/${id}`,'map-detail-minimap');}
  }
  if(!result)throw new GameMediaError(transportErrors.has(signal)?'unavailable':'not-found','이 항목의 이미지 원문을 확인하지 못했습니다.');
  result.kind=type;result.id=id;result.resolvedAt=new Date(now()).toISOString();result.etag='"'+ascii(new Uint8Array(await crypto.subtle.digest('SHA-256',result.bytes)))+'"';return result;
 }
 /** @param {{kind?:string,id?:string|number|null,animated?:boolean}} [options] */
 async function read({kind,id,animated=false}={}){
  const type=gameMediaKind(kind),safe=gameMediaId(id);if(!safe||!['monster','npc','item','map'].includes(type))throw new GameMediaError('invalid','게임 이미지 종류와 ID를 확인해 주세요.');
  const key=type+':'+safe+':'+Boolean(animated),cached=cache.get(key);
  if(cached&&cached.expires>now()){if(cached.error)throw cached.error;return {...cached.value,cached:true};}
  const work=(async()=>{try{const value=await collect(type,safe,animated);remember(key,{value,expires:now()+POSITIVE_TTL});return {...value,cached:false};}catch(e){if(!(e instanceof GameMediaError))console.warn('[game-media source]',type,safe,e?.name,e?.message);if(cached?.value){remember(key,{value:cached.value,expires:now()+NEGATIVE_TTL});return {...cached.value,cached:true,stale:true};}const error=e instanceof GameMediaError?e:new GameMediaError('unavailable','게임 이미지 공급원 연결이 지연되고 있습니다.');remember(key,{error,expires:now()+NEGATIVE_TTL});throw error;}})();
  return work;
 }
 return {read};
}
