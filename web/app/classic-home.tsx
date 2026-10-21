'use client';
import {useEffect,useMemo,useState} from 'react';
import {useCompass} from './context';
import {Icon} from './components';
import {GameVisual} from './game-visual';
import {LaunchPriorityCard} from './launch-events';
import {useMarketPrices} from './market-workspace';
import {JOBS} from '@/lib/catalog';
import {CLASSIC_LAUNCH,LAUNCH_EVENTS,launchEventStatus} from '@/lib/launch-data.mjs';
import {currentJobForProfile} from '@/lib/recommendations.mjs';
import './classic-home.css';

const cards=[
 {title:'게임 시작하기',text:'설치부터 첫 전직까지, 모험의 첫걸음',kind:'npc',id:1,name:'히나',scene:'village',links:[['게임 시작 가이드','start'],['실행 오류 해결','errors']]},
 {title:'돈 버는 퀘스트',text:'보상과 재료 시세를 함께 비교하세요',kind:'npc',id:11,name:'마이',scene:'forest',links:[['돈퀘 · 순수익 비교','money'],['퀘스트 진행 순서','quests']]},
 {title:'사고팔기',text:'관찰 시세와 옵션 매물을 한곳에서',kind:'item',id:2070003,name:'금비 표창',scene:'market',links:[['아이템 거래소','trade'],['실시간 시세표','market']]},
 {title:'화면 읽기 · 번역',text:'게임 화면과 영어 채팅을 편하게',kind:'npc',id:2,name:'세라',scene:'village',links:[['화면 번역 시작','liveTranslate'],['영어 채팅 도우미','chat']]},
 {title:'도감 찾기',text:'아이템, 몬스터, 맵과 NPC를 찾아보세요',kind:'monster',id:10,name:'리본 돼지',scene:'forest',links:[['아이템 · 몬스터 도감','codex'],['육성 공략','guides']]},
 {title:'계산하기',text:'강화부터 경험치까지, 필요한 도구 모음',kind:'item',id:2040002,name:'투구 방어력 주문서',scene:'training',links:[['모든 편의도구','tools'],['주문서 시뮬레이터','scroll']]},
];
const quick=[['training','mountain','사냥터 추천'],['gear','shield','예산별 장비'],['citizenship','flag','시민권 루트'],['skills','sparkles','스킬 · SP'],['maps','map','월드맵'],['party','users','파티 모집'],['owl','search','매물 찾기'],['hunt','activity','사냥 효율 기록']];
const guideRows=[
 {route:'start',kind:'npc',id:1,title:'처음 시작하는 클래식 메이플',text:'설치 · 서버 입장 · 첫 캐릭터',tag:'시작 가이드'},
 {route:'guides',kind:'npc',id:221,title:'내 직업의 성장 순서',text:'전직 준비와 레벨별 우선순위',tag:'전 직업'},
 {route:'citizenship',kind:'map',id:10001000,title:'시민권, 오늘 어디부터 갈까?',text:'인사 · 기부 · 보상 조건 체크',tag:'매일 확인'},
 {route:'pq',kind:'monster',id:10,title:'친구와 커닝 파티퀘스트 준비',text:'참여 레벨 · 단계별 진행 체크',tag:'Lv. 21+'},
];
function timeText(value:any){const at=Date.parse(value);return Number.isFinite(at)?new Date(at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'관찰 시각 미확인';}
function LaunchBoard(){
 const {navigate}=useCompass(),[now,setNow]=useState<number|null>(null);
 useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const seconds=now===null?null:Math.max(0,Math.floor((Date.parse(CLASSIC_LAUNCH.launchAt)-now)/1000)),launched=seconds===0;
 const pieces=seconds===null?['--','--','--']: [Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(n=>String(n).padStart(2,'0'));
 return <aside className="classic-release-board"><div className="classic-board-title"><Icon name="calendar" size={16}/> 클래식 월드 소식</div><div className="classic-board-paper"><small>GLOBAL MAPLESTORY CLASSIC</small><h2>{launched?'새로운 모험이 시작됐어요!':'그랜드 오픈까지'}</h2>{!launched&&<div className="classic-countdown" aria-label="공식 출시까지 남은 시간">{pieces.map((n,i)=><span key={i}><b>{n}</b><small>{['HOURS','MINUTES','SECONDS'][i]}</small></span>)}</div>}<p>2026. 10. 22. 오전 3:00 KST<br/>공식 출시 공지 기준</p><button className="classic-game-button" onClick={()=>navigate('events')}>이벤트 · 참여 조건 확인 <span>›</span></button><a href={CLASSIC_LAUNCH.sourceUrl} target="_blank" rel="noreferrer">NEXON 공식 출시 공지 ↗</a></div></aside>;
}
export function ClassicHomePanel(){
 const {state,profile,navigate,toggle,update,openProfile,openSearch}=useCompass(),prices=useMarketPrices();
 const done=state.tasks[profile.id]??{},job=JOBS[currentJobForProfile(profile)]??JOBS.beginner;
 const tasks=profile.level<10?[
  {id:'prepare',title:'설치와 게임 시작 준비',text:'계정 · 설치 · 접속 체크리스트',route:'start',kind:'npc',image:1},
  {id:'island',title:'메이플 아일랜드 퀘스트',text:'NPC와 선행 조건을 따라 차근차근',route:'quests',kind:'monster',image:2},
  {id:'job',title:'10레벨, 첫 전직 준비',text:`목표 진로: ${JOBS[profile.job]?.path??'모험가'}`,route:'guides',kind:'npc',image:11},
 ]:[
  {id:'guide-'+profile.level,title:`Lv. ${profile.level} 다음 성장 공략`,text:'전직 · 퀘스트 · 장비 우선순위',route:'guides',kind:'npc',image:221},
  {id:'quest-'+profile.level,title:'지금 할 수 있는 돈퀘 찾기',text:'재료 시세와 보상, 선행을 함께 비교',route:'money',kind:'item',image:4000010},
  {id:'hunt-'+profile.level,title:'사냥터, 10분만 측정하기',text:'경험치와 물약값을 반영한 순수익',route:'hunt',kind:'monster',image:10},
 ];
 const quotes=useMemo(()=>{const selected=new Map<string,any>();for(const q of [...prices].sort((a:any,b:any)=>Date.parse(b.at)-Date.parse(a.at)))if(q.itemId&&!selected.has(String(q.itemId)))selected.set(String(q.itemId),q);return [...selected.values()].slice(0,6);},[prices]);
 const hunts=state.hunts.filter((h:any)=>h.profileId===profile.id).slice(-3).reverse();
 const [now,setNow]=useState<number|null>(null);useEffect(()=>setNow(Date.now()),[]);
 return <div className="classic-home">
  <section className="classic-village-hero"><div className="classic-village-inner"><div className="classic-village-copy"><span className="classic-hero-kicker">GLOBAL MAPLE CLASSIC · 우리들의 모험</span><h1>메이플 <span>컴패스</span><em>다시 만나는, 클래식 월드</em></h1><p>아이템 도감부터 시세, 퀘스트와 육성 공략까지.<br/>모험에 필요한 모든 길을 한곳에서 찾아보세요.</p><button className="classic-home-search" onClick={()=>openSearch?.()}><Icon name="search" size={20}/><span>아이템, 몬스터, 퀘스트 또는 기능 찾기</span><kbd>⌘ K</kbd></button><div className="classic-hero-links"><button className="classic-game-button" onClick={()=>navigate('start')}><Icon name="play" size={15}/>게임 시작하기</button><button className="classic-game-button blue" onClick={()=>navigate('guides')}>육성 공략 보기 <span>›</span></button></div></div><LaunchBoard/></div></section>
  <div className="classic-home-body">
   <section className="classic-feature-grid" aria-label="주요 기능">{cards.map((card,i)=><article className={`classic-feature-card scene-${card.scene}`} key={card.title}><div className="classic-feature-art" aria-hidden="true"><GameVisual kind={card.kind} id={card.id} name={card.name} size="lg"/></div><span className="classic-card-number">0{i+1}</span><h2>{card.title}</h2><p>{card.text}</p><div className="classic-feature-actions">{card.links.map(([label,id],n)=><button key={id} className={n===0?'primary':''} onClick={()=>navigate(id)}>{label}<span>›</span></button>)}</div></article>)}</section>
   <nav className="classic-hot-links" aria-label="자주 찾는 기능"><strong><Icon name="sparkles" size={16}/> 바로가기</strong>{quick.map(([id,icon,label])=><button key={id} onClick={()=>navigate(id)}><Icon name={icon} size={15}/>{label}</button>)}</nav>
   <div className="classic-home-columns"><section className="classic-window classic-price-preview"><header><h2><Icon name="chart" size={18}/>아이템 시세표</h2><button onClick={()=>navigate('market')}>시세표 전체보기 ›</button></header><div className="classic-window-note">공개 관찰 가격 · 실제 거래 체결가와 다를 수 있어요</div>{quotes.length?<div className="classic-price-rows">{quotes.map((q:any)=><button key={q.itemId} onClick={()=>{navigate('market');history.replaceState(null,'',`/market?marketItem=${encodeURIComponent(q.itemId)}`);}}><GameVisual kind="item" id={q.itemId} name={q.itemName} size="sm"/><span><strong>{q.itemName||`아이템 ${q.itemId}`}</strong><small>{q.type==='buy'?'매수 호가':q.type==='sell'?'매도 호가':'판매 관찰'} · {timeText(q.at)}</small></span><b>{Number(q.price).toLocaleString('ko-KR',{maximumFractionDigits:12})}<small>메소 / 개</small></b><span className="classic-row-arrow">›</span></button>)}</div>:<div className="classic-home-empty"><GameVisual kind="item" id="2000000" name="빨간 포션" size="lg"/><strong>받은 시세를 여기에 모아둘게요</strong><p>가격이 연결되면 아이템 이미지와 관찰 시각을 표시해요.</p><button onClick={()=>navigate('market')}>공개 시세 연결 상태 확인 ›</button></div>}</section>
    <section className="classic-window classic-next-actions"><header><h2><Icon name="compass" size={18}/>나의 다음 모험</h2><button onClick={()=>openProfile(profile.id)}>프로필 수정 ›</button></header><div className="classic-home-character"><GameVisual kind="item" id="4031134" name="단풍잎" size="sm"/><strong>{profile.name}</strong><span>Lv. {profile.level} · {job?.name}</span></div>{tasks.map(task=><div className={`classic-next-row ${done[task.id]?'is-done':''}`} key={task.id}><input type="checkbox" aria-label={task.title+' 완료'} checked={!!done[task.id]} onChange={()=>toggle('tasks',task.id)}/><GameVisual kind={task.kind} id={task.image} name={task.title} size="sm"/><button onClick={()=>navigate(task.route)}><strong>{task.title}</strong><small>{task.text}</small></button><span>›</span></div>)}<div className="classic-home-planners"><button onClick={()=>navigate('training')}><Icon name="mountain" size={16}/>시세 기반 사냥 추천</button><button onClick={()=>navigate('gear')}><Icon name="shield" size={16}/>예산별 장비 추천</button></div></section></div>
   <LaunchPriorityCard/>
   <section className="classic-window classic-guide-preview"><header><h2><Icon name="book" size={18}/>알아두면 좋은 공략</h2><button onClick={()=>navigate('guides')}>전체 공략 보기 ›</button></header><div className="classic-home-guides">{guideRows.map(g=><button key={g.route} onClick={()=>navigate(g.route)}><div className={`classic-home-guide-art guide-${g.route}`}><GameVisual kind={g.kind} id={g.id} name={g.title} size={g.kind==='map'?'scene':'lg'}/><span>{g.tag}</span></div><strong>{g.title}</strong><small>{g.text}</small></button>)}</div></section>
   <div className="classic-home-columns classic-bottom-columns"><section className="classic-window"><header><h2><Icon name="calendar" size={18}/>이벤트 · 일정</h2><button onClick={()=>navigate('events')}>전체 일정 ›</button></header>{LAUNCH_EVENTS.slice(0,3).map(event=><button className="classic-event-row" key={event.id} onClick={()=>navigate('events')}><span className="classic-event-badge">{now===null?'공식 공지':launchEventStatus(event,now)==='active'?'진행 중':launchEventStatus(event,now)==='ended'?'종료':'예정'}</span><span><strong>{event.title}</strong><small>Lv. {event.minLevel}+ · {new Date(event.end).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}까지</small></span><b>›</b></button>)}</section><section className="classic-window"><header><h2><Icon name="activity" size={18}/>우리의 모험 기록</h2><button onClick={()=>navigate('hunt')}>사냥 기록 ›</button></header>{hunts.length?hunts.map((h:any)=><button className="classic-event-row" key={h.id} onClick={()=>navigate('hunt')}><GameVisual kind="map" id={h.mapId} name={h.mapName||h.map||'사냥 기록'} size="sm"/><span><strong>{h.mapName||h.map||'사냥 기록'}</strong><small>{h.minutes}분 · {Number(h.exp||0).toLocaleString('ko-KR')} EXP</small></span><b>›</b></button>):<div className="classic-record-empty"><GameVisual kind="monster" id="2" name="달팽이" size="md"/><p>첫 사냥을 기록하고<br/>나에게 맞는 사냥터를 찾아보세요.</p><button onClick={()=>navigate('hunt')}>첫 사냥 측정하기 ›</button></div>}<div className="classic-friend-pills">{state.profiles.map((p:any)=><button key={p.id} className={p.id===profile.id?'active':''} onClick={()=>update({activeProfile:p.id})}>{p.name} <small>Lv. {p.level}</small></button>)}</div></section></div>
  </div>
 </div>;
}
