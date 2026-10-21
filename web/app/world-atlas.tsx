'use client';
import { useEffect, useMemo, useState } from 'react';
import { useGameBundle } from '@/lib/game-data-client';
import { catalogMatches } from '@/lib/public-catalog.mjs';
import { Badge, Button, Card, External, Field, Icon } from './components';
import './world-atlas.css';

export function WorldAtlas({onSelect}:{onSelect:(id:string)=>void}) {
  const {data}=useGameBundle(['maps']);
  const [world,setWorld]=useState('WorldMap001'),[atlas,setAtlas]=useState<any>(null),[error,setError]=useState(''),[zoom,setZoom]=useState(1),[query,setQuery]=useState(''),[selected,setSelected]=useState<string[]>([]);
  useEffect(()=>{const abort=new AbortController();setAtlas(null);setError('');setSelected([]);fetch('/api/game-data?kind=atlas&map='+world,{signal:abort.signal}).then(async r=>{const result:any=await r.json();if(!r.ok)throw new Error(result.error||'월드맵 응답 오류');setAtlas(result);}).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>abort.abort();},[world]);
  const maps:any[]=data?.maps||[],byId=useMemo(()=>new Map(maps.map(m=>[String(m.id),m])),[maps]);
  const spots=(atlas?.spots||[]).map((spot:any)=>({...spot,rows:spot.mapIds.map((id:string)=>byId.get(id)).filter(Boolean)})).filter((spot:any)=>!query||spot.rows.some((m:any)=>catalogMatches(m,query)));
  const group=selected.map(id=>byId.get(id)).filter(Boolean);
  return <Card title="지도로 찾기" description="공개 MCW의 실제 월드맵에서 표시 지점을 선택하세요." action={<Badge tone="green">실제 게임 월드맵</Badge>} className="world-atlas-card">
    <div className="world-atlas-controls"><div className="tabs"><button className={world==='WorldMap001'?'active':''} onClick={()=>{setWorld('WorldMap001');setZoom(1);}}>빅토리아 아일랜드</button><button className={world==='WorldMap000'?'active':''} onClick={()=>{setWorld('WorldMap000');setZoom(1);}}>메이플 아일랜드</button></div><Field label="지도에서 맵 찾기" value={query} placeholder="맵 이름 · 영어 · 초성" onChange={(e:any)=>setQuery(e.target.value)}/><div className="button-row"><Button variant="ghost" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.5))}>−</Button><span>{Math.round(zoom*100)}%</span><Button variant="ghost" disabled={zoom>=3} onClick={()=>setZoom(z=>Math.min(3,z+.5))}>+</Button></div></div>
    {error?<p className="notice">{error}</p>:!atlas?<p className="muted" role="status">월드맵 이미지를 불러오고 있어요.</p>:<>
      <div className="world-atlas-viewport"><div className="world-atlas-canvas" style={{width:zoom*100+'%'}}><img src={atlas.image} alt={world==='WorldMap001'?'빅토리아 아일랜드의 실제 게임 월드맵':'메이플 아일랜드의 실제 게임 월드맵'}/>{spots.map((spot:any,i:number)=>{const title=spot.rows.map((m:any)=>m.name).join(' · ')||spot.mapIds.join(',');return <button className={`world-atlas-pin ${spot.type===0?'town':''} ${selected.join(',')===spot.mapIds.join(',')?'selected':''}`} key={spot.mapIds.join(',')+':'+i} title={title} aria-label={title+' 지도 지점'} style={{left:((spot.x+atlas.origin.x)/atlas.width*100)+'%',top:((spot.y+atlas.origin.y)/atlas.height*100)+'%'}} onClick={()=>setSelected(spot.mapIds)}><span/></button>;})}</div></div>
      {!!group.length&&<div className="world-atlas-selection"><strong>선택한 지점의 맵</strong><div>{group.map((m:any)=><button key={m.id} onClick={()=>onSelect(m.id)}>{m.name}<Icon name="map" size={13}/></button>)}</div></div>}
      <div className="world-atlas-footer"><small>지도 지점 {spots.length}개 · 확대 후 지도 안에서 스크롤할 수 있어요. 상세 포털·숨겨진 맵은 아래 전체 목록에서 확인하세요.</small><External href={atlas.sourceUrl}>월드맵 출처 · NEXON / MapleStory.io</External></div>
    </>}
  </Card>;
}
