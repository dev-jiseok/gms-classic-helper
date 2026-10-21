'use client';
import {useEffect,useRef,useState} from 'react';
import {gameMediaId,gameMediaKind,gameMediaProxyUrl,gameMediaUrl,monsterMetadataUrl} from '@/lib/game-media.mjs';
import './game-visual.css';

// Browser promises live in one JS context; the Worker fallback shares only
// completed bytes/metadata, never promises belonging to another request.
const mobCache=new Map<string,{framebooks:any;expires:number}>(),mobPending=new Map<string,Promise<any>>(),queue:Array<()=>void>=[];let active=0;
function drain(){while(active<3&&queue.length){active++;queue.shift()!();}}
function mobFrames(id:string){const cached=mobCache.get(id);if(cached&&cached.expires>Date.now())return Promise.resolve(cached.framebooks);if(mobPending.has(id))return mobPending.get(id)!;
 const task=new Promise<any>(resolve=>{queue.push(async()=>{let framebooks=null;try{const r=await fetch(monsterMetadataUrl(id)!,{signal:AbortSignal.timeout(8000)});if(r.ok){const data:any=await r.json();if(String(data.id)===id&&data.framebooks&&typeof data.framebooks==='object')framebooks=data.framebooks;}}catch{/* The verified WZ fallback can still expose the source artwork. */}finally{mobCache.set(id,{framebooks,expires:Date.now()+(framebooks?6*60*60:5*60)*1000});if(mobCache.size>250)mobCache.delete(mobCache.keys().next().value!);active--;resolve(framebooks);drain();}});drain();});mobPending.set(id,task);task.finally(()=>mobPending.delete(id));return task;}
export type GameVisualProps={kind:string;id?:string|number|null;name?:string;framebooks?:any;size?:'sm'|'md'|'lg'|'scene';animate?:boolean;className?:string};
// Normal IO mob paths for2/9 (missing metadata) and14 (invalid render MIME)
// were verified to fail; their real WZ frames are served by the validated proxy.
export function GameVisual({kind,id,name='',framebooks,size='md',animate=false,className=''}:GameVisualProps){
 const type=gameMediaKind(kind),safe=gameMediaId(id),key=type+':'+safe,preferProxy=type==='monster'&&['2','9','14'].includes(safe??''),box=useRef<HTMLSpanElement>(null),picture=useRef<HTMLImageElement>(null);
 const [visible,setVisible]=useState(false),[frames,setFrames]=useState<any>(framebooks??null),[frameId,setFrameId]=useState(safe),[metadataReady,setMetadataReady]=useState(!!framebooks),[fallbackKey,setFallbackKey]=useState(''),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false),[hover,setHover]=useState(false),[reduced,setReduced]=useState(true);
 useEffect(()=>{setFrames(framebooks??null);setFrameId(safe);setMetadataReady(!!framebooks);},[type,safe,framebooks]);
 useEffect(()=>{const el=box.current;if(!el)return;if(typeof IntersectionObserver==='undefined'){setVisible(true);return;}const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'180px'});observer.observe(el);return()=>observer.disconnect();},[type,safe]);
 useEffect(()=>{if(type!=='monster'||!safe||!visible||framebooks||preferProxy)return;let current=true;mobFrames(safe).then(value=>{if(current){setFrames(value);setFrameId(safe);setMetadataReady(true);}});return()=>{current=false;};},[type,safe,visible,framebooks]);
 useEffect(()=>{const q=window.matchMedia('(prefers-reduced-motion: reduce)'),sync=()=>setReduced(q.matches);sync();q.addEventListener('change',sync);return()=>q.removeEventListener('change',sync);},[]);
 const actualFrames=framebooks??(frameId===safe?frames:null),moving=type==='monster'&&!reduced&&(animate||hover),waiting=type==='monster'&&!preferProxy&&!actualFrames&&!metadataReady;
 const primary=gameMediaUrl({kind:type,id:safe,framebooks:actualFrames,animated:moving}),backup=gameMediaProxyUrl({kind:type,id:safe,animated:moving}),still=gameMediaProxyUrl({kind:type,id:safe});
 const src=visible&&!waiting?(preferProxy||fallbackKey===key||!primary?backup:primary):null;
 // Cached successes and errors may settle before effects. Neither can leave a
 // permanent loading skeleton when list artwork is reused in a linked detail.
 useEffect(()=>{const img=picture.current,finished=!!img?.complete&&!!img.currentSrc;setFailed(false);setLoaded(finished&&img!.naturalWidth>0);if(finished&&img!.naturalWidth===0){const current=new URL(img!.src,location.origin);if(current.pathname==='/api/game-media')setFailed(true);else setFallbackKey(key);}if(!src)return;const timer=setTimeout(()=>{if(!picture.current?.naturalWidth){setFailed(true);setLoaded(false);}},28_000);return()=>clearTimeout(timer);},[src,key]);
 const fallback=failed||!safe||!still;
 return <span ref={box} role="img" aria-label={name?`${name} 게임 이미지`:'게임 이미지'} title={fallback?'공개 원본 이미지를 확인하지 못했습니다. 항목 이름과 상세 정보는 계속 사용할 수 있어요.':undefined} className={`game-visual game-visual-${type} game-visual-${size} ${loaded&&!failed?'is-ready':''} ${fallback?'is-fallback':''} ${className}`} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
  {!loaded&&!fallback&&<span className="game-visual-skeleton" aria-hidden="true"/>}
  {src&&!failed&&<img ref={picture} src={src} alt="" loading="lazy" decoding="async" onLoad={()=>{setLoaded(true);setFailed(false);}} onError={e=>{const current=new URL(e.currentTarget.src,location.origin);if(current.pathname!=='/api/game-media'){setFallbackKey(key);return;}if(moving&&still&&current.pathname+current.search!==still){e.currentTarget.src=still;return;}setFailed(true);setLoaded(false);}}/>}
  {fallback&&<span className="game-visual-fallback" aria-hidden="true">{name||'이미지 없음'}</span>}
 </span>;
}
