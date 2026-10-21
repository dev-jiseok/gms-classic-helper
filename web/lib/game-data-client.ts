'use client';
import { useEffect, useMemo, useState } from 'react';

const loaded:Record<string,any>={};
const pending=new Map<string,Promise<any>>();
let metadata:any=null;
const listeners=new Set<()=>void>();
const DEFAULT_SETS=['monsters','maps','quests','items','recipes','npcs','shops','portals','drops'];
const notify=()=>listeners.forEach(fn=>fn());
async function fetchSets(sets:string[]) {
  const missing=sets.filter(k=>!Object.prototype.hasOwnProperty.call(loaded,k));
  if(!missing.length)return;
  const key=[...missing].sort().join(',');
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{
    const response=await fetch('/api/game-data?kind=bundle&sets='+encodeURIComponent(key));
    const result:any=await response.json();
    if(!response.ok)throw new Error(result.error||'도감 자료를 불러오지 못했습니다.');
    for(const set of missing)if(Array.isArray(result[set]))loaded[set]=result[set];
    metadata={meta:result.meta,sources:result.sources};notify();
  })();
  pending.set(key,task);
  try{return await task;}finally{pending.delete(key);}
}
/** Shared in-memory bundles: only request the sets the screen actually needs. */
export function useGameBundle(sets:string[]|string=DEFAULT_SETS) {
  const key=(Array.isArray(sets)?sets:sets.split(',')).filter(Boolean).sort().join(',');
  const [version,setVersion]=useState(0),[error,setError]=useState<string|null>(null),[retry,setRetry]=useState(0);
  useEffect(()=>{const listener=()=>setVersion(v=>v+1);listeners.add(listener);return()=>{listeners.delete(listener);};},[]);
  useEffect(()=>{let active=true;setError(null);fetchSets(key.split(',')).catch(e=>{if(active)setError(e.message||'도감 연결에 실패했습니다.');});return()=>{active=false;};},[key,retry]);
  const requested=key.split(',');
  const complete=requested.every(k=>Object.prototype.hasOwnProperty.call(loaded,k));
  const data=useMemo(()=>complete?{...metadata,...Object.fromEntries(key.split(',').map(k=>[k,loaded[k]]))}:null,[complete,key,version]);
  return {data,loading:!complete&&!error,error,reload:()=>setRetry(v=>v+1),verifiedAt:metadata?.meta?.verifiedAt||null};
}

export async function fetchGameItem(kind:string,id:string|number,detail=true,signal?:AbortSignal) {
  const response=await fetch('/api/game-data?kind='+encodeURIComponent(kind)+'&id='+encodeURIComponent(String(id))+(detail?'&detail=1':''),{signal});
  const result:any=await response.json();
  if(!response.ok)throw new Error(result.error||'상세 자료를 불러오지 못했습니다.');
  return result;
}
