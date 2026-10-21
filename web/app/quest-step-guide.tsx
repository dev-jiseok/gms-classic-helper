'use client';
import {useEffect,useMemo,useState} from 'react';
import {useGameBundle} from '@/lib/game-data-client';
import {questStepPlan} from '@/lib/quest-steps.mjs';
import {Badge,Button,External,Field} from './components';
import {GameVisual} from './game-visual';
import styles from './quest-step-guide.module.css';

export default function QuestStepGuide(props:any){
 if(!props.quest?.steps?.length)return <p className={styles.empty}>등록된 원문 진행 단계가 아직 없습니다. 시작·완료 NPC와 원문 퀘스트 조건을 확인해 주세요.</p>;
 return props.data?<StepGuideContent {...props}/>:<LoadedStepGuide {...props}/>;
}
function LoadedStepGuide(props:any){
 const bundle=useGameBundle('maps,npcs,portals');
 if(!bundle.data)return <p className={styles.empty}>{bundle.error??'진행 단계의 목적 NPC·맵을 연결하고 있어요.'}{bundle.error&&<Button variant="ghost" onClick={bundle.reload}>다시 연결</Button>}</p>;
 return <StepGuideContent {...props} data={bundle.data}/>;
}
function StepGuideContent({quest,data,onOpen,startMapId='',level,expanded:initialExpanded=false}:any){
 const [expanded,setExpanded]=useState(initialExpanded),[from,setFrom]=useState(startMapId),[choices,setChoices]=useState<any>({});
 useEffect(()=>{setExpanded(initialExpanded);setChoices({});},[quest.id,initialExpanded]);
 useEffect(()=>setFrom(startMapId),[quest.id,startMapId]);
 const steps=useMemo(()=>questStepPlan(quest,{...data,startMapId:from,mapChoices:choices,level}),[quest,data,from,choices,level]);
 function entity(kind:string,row:any){if(row&&onOpen)onOpen(kind,String(row.id));}
 return <section className={styles.guide} aria-label={quest.name+' 원문 진행 단계'}><button className={styles.heading} aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}><span>원문 진행 단계 <Badge>{steps.length}개</Badge></span><span aria-hidden="true">{expanded?'−':'＋'}</span></button>{expanded&&<div className={styles.body}>
  <p className={styles.scope}>커뮤니티 원문 순서와 확인된 NPC·맵 관계입니다. 아래 열람이나 경로 선택은 퀘스트 완료 기록을 바꾸지 않습니다.</p>
  <Field label={quest.name+' 단계 경로 출발 맵'}><select value={from} onChange={event=>setFrom(event.target.value)}><option value="">실제 현재 맵 선택 · 위치 추정 안 함</option>{data.maps.map((map:any)=><option key={map.id} value={map.id}>{map.name} · #{map.id}</option>)}</select></Field>
  <ol className={styles.steps}>{steps.map((step:any)=><li key={step.key}>
   <div className={styles.stepHeading}><Badge>{step.number===null?'순서 미확인':step.number+'단계'}</Badge><h4>{step.title||'제목 미등록'}</h4>{step.gameVersion&&<Badge>자료 버전 {step.gameVersion}</Badge>}</div>
   {step.description&&<p className={styles.description}>{step.description}</p>}
   {step.notes&&<p className={styles.notes}>{step.notes}</p>}
   {((step.titleEn&&step.titleEn!==step.title)||(step.descriptionEn&&step.descriptionEn!==step.description))&&<details className={styles.english}><summary>영문 원문 함께 보기</summary>{step.titleEn&&<strong>{step.titleEn}</strong>}{step.descriptionEn&&<p>{step.descriptionEn}</p>}</details>}
   <div className={styles.targets}>{step.npc?<button onClick={()=>entity('npcs',step.npc)} disabled={!onOpen}><GameVisual kind="npc" id={step.npc.id} name={step.npc.name} size="md"/><span><small>목적 NPC</small><strong>{step.npc.name}</strong></span></button>:step.targetNpcName||step.targetNpcId?<span className={styles.unresolved}>목적 NPC: {step.targetNpcName||'#'+step.targetNpcId} · 도감 연결 확인 필요</span>:null}
   {step.destination?<button onClick={()=>entity('maps',step.destination)} disabled={!onOpen}><GameVisual kind="map" id={step.destination.id} name={step.destination.name} size="md"/><span><small>{step.locationBasis==='step-destination'?'원문 목적 맵':'NPC 도감 위치 기준'}</small><strong>{step.destination.name}</strong></span></button>:<span className={styles.unresolved}>{step.destinationMapName?'목적 맵: '+step.destinationMapName:step.destinationMapId?'목적 맵 #'+step.destinationMapId:'목적 맵 미기재'} · 위치 확인 필요</span>}</div>
   {(step.monster||step.item||step.targetMonsterName||step.requiredItemName)&&<div className={styles.related}>{step.monster?<button onClick={()=>entity('monsters',step.monster)} disabled={!onOpen}><GameVisual kind="monster" id={step.monster.id} name={step.monster.name} framebooks={step.monster.framebooks??step.monster.rawDetail?.framebooks} size="sm"/><span>대상 몬스터 · {step.monster.name}</span></button>:step.targetMonsterName&&<small>대상 몬스터: {step.targetMonsterName} · ID 미확인</small>}{step.item?<button onClick={()=>entity('items',step.item)} disabled={!onOpen}><GameVisual kind="item" id={step.item.id} name={step.item.name} size="sm"/><span>연결 재료 · {step.item.name}</span></button>:step.requiredItemName&&<small>연결 재료: {step.requiredItemName} · ID 미확인</small>}</div>}
   {step.candidateMaps.length>1&&!step.destinationMapId&&<Field label={quest.name+' '+(step.number??'?')+'단계 NPC 방문 맵 선택'}><select value={choices[step.key]??''} onChange={event=>setChoices({...choices,[step.key]:event.target.value})}><option value="">확인된 NPC 위치 중 실제 방문 맵 선택</option>{step.candidateMaps.map((map:any)=><option key={map.id} value={map.id}>{map.name}</option>)}</select></Field>}
   {step.route.path.length>0?<div className={styles.route}><small>{step.route.edges.length}개 포털 · 방향과 등록 조건 기준 참고 경로</small><div>{step.route.path.map((map:any)=><button key={map.id} onClick={()=>entity('maps',map)} disabled={!onOpen}>{map.name} <span>↗</span></button>)}</div></div>:<p className={styles.missing}>{step.route.reason}</p>}
   <div className={styles.sources}>{step.sourceUrl&&<External href={step.sourceUrl}>진행 단계 원문</External>}{step.route.edges.length>0&&<details><summary>포털 출처</summary>{[...new Set(step.route.edges.map((edge:any)=>edge.sourceUrl).filter(Boolean))].map((url:any)=><External key={url} href={url}>연결 관계 원문</External>)}</details>}</div>
  </li>)}</ol><p className={styles.scope}>맵 안 도보·사냥·경쟁·운행 대기 시간은 포함하지 않습니다. 확인되지 않은 역방향·퀘스트 이동·배 이동을 추가하지 않습니다. Wiki 기여자 자료 · CC BY-NC-SA 4.0.</p>
 </div>}</section>;
}
