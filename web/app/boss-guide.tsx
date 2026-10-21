'use client';
import {useGameBundle} from '@/lib/game-data-client';
import {useCompass} from './context';
import {Badge,Button,Card,External} from './components';
import {GameVisual} from './game-visual';
import {format} from '@/lib/engine.mjs';
export function FieldBossGuide(){
 const {data}=useGameBundle('monsters,maps'),{detail}=useCompass();
 const bosses=(data?.monsters??[]).filter((m:any)=>m.isBoss===true||m.boss===true);
 return <Card title="보스 도감 · 출현 위치" description="필드와 파티 퀘스트의 보스를 함께 확인하세요. 입장 조건과 출현 시각은 각각 달라요."><div className="guide-grid">{bosses.map((mob:any)=><section key={mob.id} className="card"><div className="button-row"><GameVisual kind="monster" id={mob.id} name={mob.name} size="lg"/><div><h3>{mob.name}</h3><Badge>Lv. {mob.level??'미확인'}</Badge>{mob.variant&&<Badge>{mob.variantLabel||mob.variant}</Badge>}<p>HP {format(mob.hp)} · EXP {format(mob.exp)}</p></div></div>{(mob.mapIds??[]).map((id:string)=>{const map=data.maps.find((m:any)=>m.id===id);return map?<button className="related-row" key={id} onClick={()=>detail({catalogKind:'maps',row:map})}><GameVisual kind="map" id={id} name={map.name} size="sm"/>{map.name} ↗</button>:null;})}<p className="muted">현재 채널의 출현 여부·리젠 시각은 게임에서 확인하세요.</p><div className="button-row"><Button variant="ghost" onClick={()=>detail({catalogKind:'monsters',row:mob})}>드롭 · 수치 보기</Button><External href={mob.sourceUrl}>자료 출처</External></div></section>)}</div></Card>;
}
