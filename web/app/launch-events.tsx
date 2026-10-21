'use client';
import {useEffect,useState} from 'react';
import {useCompass} from './context';
import {Badge,Button,Card,External} from './components';
import {CLASSIC_LAUNCH,LAUNCH_EVENTS,launchEventStatus,launchEventEligibility,launchPriority} from '@/lib/launch-data.mjs';
import './launch-events.css';

const periodNames:Record<string,string>={active:'공지 기간 중',upcoming:'예정',ended:'기간 종료','launch-pending':'서버 오픈 전'};
const koreanTime=(value:string)=>new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
function useNow(){const [now,setNow]=useState(Date.now());useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60_000);return()=>clearInterval(timer);},[]);return now;}

export function LaunchPriorityCard(){
 const {profile,navigate}=useCompass(),now=useNow(),priority=launchPriority(profile,now);
 return <Card className="launch-priority" title={priority.title} action={<Badge tone="green">공식 출시 공략</Badge>}><p>{priority.text}</p><div className="button-row"><Button onClick={()=>navigate('events')}>이벤트 · 참여 조건 보기</Button><Button variant="ghost" onClick={()=>navigate('guides')}>레벨별 공략 보기</Button></div><small>공식 출시: {koreanTime(CLASSIC_LAUNCH.launchAt)} KST · 계정당 일일 수령 여부는 게임에서 확인하세요.</small></Card>;
}

export function LaunchEventsPanel(){
 const {state,profile,update,notify}=useCompass(),now=useNow(),[expanded,setExpanded]=useState(false);
 function add(event:any){const stableId='launch-event-'+event.id;if(state.events.some((e:any)=>e.id===stableId||e.sourceEventId===event.id)){notify('이미 내 일정에 추가한 이벤트예요.');return;}update({events:[{id:stableId,sourceEventId:event.id,title:event.title,start:event.start,end:event.end,deadline:event.end,url:event.sourceUrl,source:event.sourceUrl,note:event.summary+' '+event.eligibilityNote,done:false},...state.events]});notify('공식 참여 기간을 내 일정에 추가했어요.');}
 const rows=expanded?LAUNCH_EVENTS:LAUNCH_EVENTS.slice(0,5);
 return <Card title="출시 이벤트 · 공식 참여 일정" description="공식 출시 공지에서 확인한 기간과 준비물을 현재 캐릭터에 맞춰 보여줘요." className="launch-events-panel" action={<Badge>10월21일 공식 확인</Badge>}>
  <p className="notice">모든 시각은 한국 표준시(KST)예요. Grand Launch는 {koreanTime(CLASSIC_LAUNCH.launchAt)} KST입니다. 공지 기간과 실제 서버 입장 가능 시각을 구분해요.</p>
  <div className="launch-events-grid">{rows.map((event:any)=>{const status=launchEventStatus(event,now),eligibility=launchEventEligibility(event,profile),added=state.events.some((e:any)=>e.id==='launch-event-'+event.id||e.sourceEventId===event.id);return <article key={event.id} className={status==='ended'?'is-ended':''}>
   <div className="launch-event-tags"><Badge tone={status==='active'?'green':status==='ended'?'':'amber'}>{periodNames[status]}</Badge><Badge tone={eligibility.status==='eligible'?'green':''}>{event.minLevel!=null?`Lv.${event.minLevel}+`:event.betaRequired?'테스트 이력 필요':'게임 내 조건 확인'}</Badge></div>
   <h3>{event.title}</h3><p className="launch-event-period"><time dateTime={event.start}>{koreanTime(event.start)}</time><span> → </span><time dateTime={event.end}>{koreanTime(event.end)} KST</time></p>
   <p>{event.summary}</p><p className="muted">{eligibility.reason}</p>
   <ol>{event.steps.map((step:string,index:number)=><li key={index}>{step}</li>)}</ol>
   <div className="launch-event-rewards"><strong>확인할 보상</strong>{event.rewards.map((reward:string,index:number)=><p key={index}>{reward}</p>)}</div>
   {event.important&&<p className="notice">{event.important}</p>}
   {event.repeat==='daily-account'&&<small>계정당 하루1회 · 일일 초기화 시각은 이 공지에 명시되지 않았어요. 게임의 수령 상태를 확인하세요.</small>}
   <div className="button-row"><Button variant="secondary" disabled={added} onClick={()=>add(event)}>{added?'내 일정에 추가됨':'내 일정에 추가'}</Button><External href={event.sourceUrl}>공식 조건</External></div>
  </article>;})}</div>
  <div className="button-row"><Button variant="ghost" onClick={()=>setExpanded(v=>!v)}>{expanded?'기간 이벤트만 보기':'GM 단기 이벤트3개도 보기'}</Button><External href={CLASSIC_LAUNCH.sourceUrl}>Grand Launch 공식 원문</External></div>
  <p className="muted">기준은10월21일 확인한 공식 출시 공지입니다. 이후 수정 공지·점검·게임 창이 우선해요. 등록한 일정은 아래 ‘나의 일정’에서 완료·삭제할 수 있어요.</p>
 </Card>;
}
