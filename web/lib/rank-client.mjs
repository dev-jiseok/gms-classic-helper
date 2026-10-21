export const RANK_API='https://classicrank.com/api/v1';
export const RANK_FIELDS='name,display_name,name_cut_off,level,job,job_tier,family,beginner_type,fame,overall_rank,job_rank,fame_rank,position,photo,verified,claimed,last_checked,level_updated,profile_url';
const allowedFamilies=['Beginner','Warrior','Magician','Bowman','Thief','Pirate'];
export function rankRequest(searchParams){
 const mode=searchParams.get('mode')|| (searchParams.get('name')?'character':'list');
 if(mode==='jobs'||mode==='stats')return {path:`/${mode}`,ttl:mode==='jobs'?3600:60};
 const name=(searchParams.get('name')||'').trim();
 if(mode==='character'){
  if(!name||name.length>30||/[\u0000-\u001f]/.test(name))throw new Error('캐릭터 이름을 1~30자로 입력해 주세요.');
  return {path:`/characters/${encodeURIComponent(name)}?fields=${RANK_FIELDS}`,ttl:30};
 }
 if(mode!=='list')throw new Error('지원하지 않는 랭킹 요청입니다.');
 const params=new URLSearchParams({fields:RANK_FIELDS});
 const q=(searchParams.get('q')||'').trim();if(q.length>40)throw new Error('검색어를 40자 이내로 입력해 주세요.');if(q)params.set('q',q);
 const family=searchParams.get('family');if(family){if(!allowedFamilies.includes(family))throw new Error('직업 계열을 확인해 주세요.');params.set('family',family);}
 const job=(searchParams.get('job')||'').trim();if(job){if(job.length>60)throw new Error('직업 필터를 확인해 주세요.');params.set('job',job);}
 const type=searchParams.get('type');if(type){if(!['islander','permanent'].includes(type))throw new Error('초보자 종류를 확인해 주세요.');params.set('type',type);}
 const sort=searchParams.get('sort')||'level';if(!['level','fame','name','recent'].includes(sort))throw new Error('정렬 방식을 확인해 주세요.');params.set('sort',sort);
 for(const key of ['verified','claimed']){const value=searchParams.get(key);if(value){if(!['true','false'].includes(value))throw new Error('인증 필터를 확인해 주세요.');params.set(key,value);}}
 for(const key of ['min_level','max_level']){const value=searchParams.get(key);if(value){const n=Number(value);if(!Number.isSafeInteger(n)||n<1||n>300)throw new Error('레벨 범위를 1~300 사이로 입력해 주세요.');params.set(key,String(n));}}
 const limit=Number(searchParams.get('limit')||25),page=Number(searchParams.get('page')||1);
 if(!Number.isSafeInteger(limit)||limit<1||limit>50||!Number.isSafeInteger(page)||page<1||page*limit>1000)throw new Error('공개 API는 페이지당 50명, 처음 1,000개 결과까지 지원합니다.');
 params.set('limit',String(limit));params.set('page',String(page));
 return {path:'/characters?'+params,ttl:30};
}
export function createRankReader({fetchFn=fetch,clock=Date.now}={}){
 const cache=new Map(),pending=new Map();let blockedUntil=0;const recent=[];
 return async function read(request){
  const now=clock(),previous=cache.get(request.path);
  const envelope=(entry,extra={})=>({body:{...entry.body,_source:{name:'ClassicRank · Windia',url:'https://classicrank.com/developer',fetchedAt:entry.fetchedAt,world:'Windia',...extra}},status:200});
  if(previous&&now-previous.checkedAt<request.ttl*1000)return envelope(previous,{cached:true});
  if(pending.has(request.path))return pending.get(request.path);
  while(recent.length&&recent[0]<now-60_000)recent.shift();
  if(now<blockedUntil||recent.length>=26){const retry=Math.max(1,Math.ceil((blockedUntil-now)/1000),recent.length>=26?60:0);return previous?envelope(previous,{stale:true,error:'랭킹 공급원의 요청 제한으로 재시도를 기다리고 있어요.',retryAfter:retry}):{body:{error:'랭킹 요청이 많아요. 잠시 후 다시 확인해 주세요.',retryAfter:retry},status:429};}
  recent.push(now);
  const promise=(async()=>{try{
   const response=await fetchFn(RANK_API+request.path,{headers:{Accept:'application/json',...(previous?.etag?{'If-None-Match':previous.etag}:{})},redirect:'manual',signal:AbortSignal.timeout(8000)});
   if(response.status===304&&previous){previous.checkedAt=clock();return envelope(previous,{cached:true});}
   if(!response.ok){if(response.status===429)blockedUntil=clock()+Math.min(300,Math.max(30,Number(response.headers.get('retry-after'))||60))*1000;const status=[400,403,404,429].includes(response.status)?response.status:502;return previous?envelope(previous,{stale:true,error:'공급원 연결 지연 · 마지막 정상 자료입니다.'}):{body:{error:status===404?'등록된 캐릭터를 찾지 못했습니다.':status===429?'랭킹 공급원의 요청 제한입니다. 잠시 후 다시 확인해 주세요.':status===403?'공개 API 조회 범위를 벗어났습니다.':'랭킹 공급원에 연결하지 못했습니다.'},status};}
   const body=await response.json();if(!body||typeof body!=='object'||!('data'in body))throw new Error('Unexpected ranking schema');
   const entry={body,checkedAt:clock(),fetchedAt:new Date(clock()).toISOString(),etag:response.headers.get('etag')};cache.set(request.path,entry);while(cache.size>100)cache.delete(cache.keys().next().value);return envelope(entry);
  }catch{return previous?envelope(previous,{stale:true,error:'네트워크 연결 지연 · 마지막 정상 자료입니다.'}):{body:{error:'랭킹 요청 시간이 초과됐거나 연결을 마치지 못했습니다.'},status:504};}finally{pending.delete(request.path);}})();
  pending.set(request.path,promise);return promise;
 };
}
