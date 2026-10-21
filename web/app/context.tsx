'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { initialState, normalizeState } from '@/lib/engine.mjs';
export const Context=createContext<any>(null);
export const useCompass=()=>useContext(Context);
// Retain the existing storage key so the display-name change preserves saved characters.
const STORAGE='maple-compass-v1';
export function useAppState(){
 const [state,setState]=useState<any>(initialState),[ready,setReady]=useState(false),[cloud,setCloud]=useState(false),[sync,setSync]=useState('브라우저에 저장'),[toast,setToast]=useState(''),[conflict,setConflict]=useState<any>(null),[saveTick,setSaveTick]=useState(0);
 const revision=useRef(0),latest=useRef(state),inflight=useRef(false),stopped=useRef(false),attempt=useRef(0),retryTimer=useRef<ReturnType<typeof setTimeout>|null>(null),editGeneration=useRef(0);
 latest.current=state;
 useEffect(()=>{let local:any=null,canceled=false;const controller=new AbortController();try{const raw=localStorage.getItem(STORAGE);if(raw){local=normalizeState(JSON.parse(raw));setState(local);latest.current=local;}}catch{setToast('기존 저장을 읽지 못했어요. 백업 파일로 복원할 수 있어요.');}
 fetch('/api/state',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(8000)])}).then(async r=>{if(!r.ok)return;const remote:any=await r.json();if(canceled)return;revision.current=remote.revision;const current=latest.current,remoteIsNewer=remote.state&&(!local?.updatedAt||String(remote.state.updatedAt)>String(local.updatedAt));if(remoteIsNewer&&editGeneration.current>0){stopped.current=true;setConflict({local:current,remote:normalizeState(remote.state),revision:remote.revision});setSync('불러오는 동안 기록이 바뀌었어요 · 선택 필요');}else{if(remoteIsNewer)setState(normalizeState(remote.state));setSync('계정 저장 연결됨');}setCloud(true);}).catch(()=>{}).finally(()=>{if(!canceled)setReady(true);});return()=>{canceled=true;controller.abort();};},[]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch{setSync('기기 저장 공간이 부족해요. 백업을 내려받아 주세요.');}
 if(retryTimer.current)clearTimeout(retryTimer.current);if(!cloud||stopped.current)return;
 const timer=setTimeout(async()=>{if(inflight.current)return;inflight.current=true;const snapshot=latest.current;setSync('저장 중…');
 try{const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:snapshot,revision:revision.current}),signal:AbortSignal.timeout(10000)}),body:any=await r.json();
 if(r.status===409){stopped.current=true;const response=await fetch('/api/state',{cache:'no-store'}),remote:any=await response.json();if(response.ok)setConflict({local:snapshot,remote:normalizeState(remote.state),revision:remote.revision});setSync('다른 기기의 변경과 충돌 · 선택 필요');return;}
 if(!r.ok){if(r.status===413)stopped.current=true;throw new Error(body.error||'계정 저장을 확인하지 못했어요.');}
 revision.current=body.revision;attempt.current=0;setSync('계정에 저장됨');
 }catch(e:any){setSync(e.message||'브라우저 저장됨 · 계정 동기화 재시도');if(!stopped.current&&attempt.current<5){attempt.current++;retryTimer.current=setTimeout(()=>setSaveTick(n=>n+1),Math.min(60000,5000*2**(attempt.current-1)));}}
 finally{inflight.current=false;if(latest.current!==snapshot&&!stopped.current)setSaveTick(n=>n+1);}},1000);
 return()=>clearTimeout(timer);
 },[state,ready,cloud,saveTick]);
 useEffect(()=>{const online=()=>{attempt.current=0;if(!stopped.current)setSaveTick(n=>n+1);};window.addEventListener('online',online);return()=>{window.removeEventListener('online',online);if(retryTimer.current)clearTimeout(retryTimer.current);};},[]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(timer);},[toast]);
 const update=(change:any)=>{editGeneration.current++;setState((s:any)=>({...s,...(typeof change==='function'?change(s):change),updatedAt:new Date().toISOString()}));};
 const profile=state.profiles.find((p:any)=>p.id===state.activeProfile)??state.profiles[0];
 const updateProfile=(change:any)=>update((s:any)=>({profiles:s.profiles.map((p:any)=>p.id===s.activeProfile?{...p,...change}:p)}));
 const toggle=(bucket:string,id:string)=>update((s:any)=>({[bucket]:{...s[bucket],[profile.id]:{...(s[bucket][profile.id]??{}),[id]:!s[bucket][profile.id]?.[id]}}}));
 const resolveConflict=(choice:'local'|'remote')=>{if(!conflict)return;revision.current=conflict.revision;stopped.current=false;attempt.current=0;if(choice==='remote')setState(conflict.remote);else setState((s:any)=>({...s,updatedAt:new Date().toISOString()}));setConflict(null);setSaveTick(n=>n+1);};
 return {state,update,profile,updateProfile,toggle,ready,sync,cloud,toast,notify:setToast,conflict,resolveConflict};
}
