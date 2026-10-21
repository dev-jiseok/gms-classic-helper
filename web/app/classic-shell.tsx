'use client';
import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {Bell,ChevronDown,Menu,Moon,Search,Sun,X} from 'lucide-react';
import {useCompass} from './context';
import {Icon} from './components';
import {GameVisual} from './game-visual';
import {FEATURES,JOBS} from '@/lib/catalog';
import {CLASSIC_NAV_GROUPS,CLASSIC_MOBILE_LINKS,classicGroupForRoute} from '@/lib/classic-navigation.mjs';
import {currentJobForProfile} from '@/lib/recommendations.mjs';
import {experienceToNext} from '@/lib/experience-data.mjs';
import {DEFAULT_GAME_LOOK,gameCharacterUrl} from '@/lib/world-tools.mjs';
import './classic-shell.css';

function ProfileSprite({profile}:any){
 const {state}=useCompass(),[failed,setFailed]=useState(false),saved=state.characterLook?.[profile.id];
 const url=gameCharacterUrl({...(saved??DEFAULT_GAME_LOOK),pose:'stand1',frame:0,animated:false});
 useEffect(()=>setFailed(false),[url]);
 return <span className="classic-profile-sprite" title={saved?'코디룸에 저장한 캐릭터':'기본 캐릭터 미리보기 · 코디룸에서 설정'}>{!failed?<img src={url} alt="" onError={()=>setFailed(true)}/>:<span>{String(profile.name??'모험가').slice(0,1)}</span>}</span>;
}

function moveInMenu(event:KeyboardEvent<HTMLElement>){
 if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
 const buttons=[...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
 if(!buttons.length)return;
 const index=buttons.indexOf(document.activeElement as HTMLButtonElement);
 const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length;
 event.preventDefault();buttons[next].focus();
}

export function ClassicHeader({onSearch,searchOpen=false}: {onSearch:()=>void;searchOpen?:boolean}){
 const {state,profile,update,navigate,route,openProfile}=useCompass();
 const [open,setOpen]=useState<string|null>(null),[mobile,setMobile]=useState(false);
 const root=useRef<HTMLElement>(null),mobileTrigger=useRef<HTMLButtonElement>(null),lastTrigger=useRef<HTMLButtonElement|null>(null);
 const activeGroup=classicGroupForRoute(route);
 const close=()=>{setOpen(null);setMobile(false);};
 useEffect(()=>{setOpen(null);setMobile(false);},[route]);
 useEffect(()=>{if(searchOpen){setOpen(null);setMobile(false);}},[searchOpen]);
 useEffect(()=>{
  if(!open&&!mobile)return;
  const key=(event:globalThis.KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setOpen(null);setMobile(false);(mobile?mobileTrigger.current:lastTrigger.current)?.focus();}};
  const outside=(event:PointerEvent)=>{if(root.current&&!root.current.contains(event.target as Node)){setOpen(null);setMobile(false);}};
  document.addEventListener('keydown',key);document.addEventListener('pointerdown',outside);
  return()=>{document.removeEventListener('keydown',key);document.removeEventListener('pointerdown',outside);};
 },[open,mobile]);
 function toggleGroup(id:string,trigger:HTMLButtonElement){lastTrigger.current=trigger;setOpen(value=>value===id?null:id);}
 function keyboardOpen(event:KeyboardEvent<HTMLButtonElement>,id:string,prefix:string){
  if(event.key!=='ArrowDown')return;event.preventDefault();lastTrigger.current=event.currentTarget;setOpen(id);
  requestAnimationFrame(()=>root.current?.querySelector<HTMLButtonElement>(`#${prefix}-${id}-menu [role="menuitem"]`)?.focus());
 }
 const hasEvents=state.events.some((event:any)=>!event.done&&Date.parse(event.deadline??event.deadlineISO)>Date.now());
 const groupNav=(prefix:string)=><>{CLASSIC_NAV_GROUPS.map(group=><div className={`classic-nav-group ${open===group.id?'is-open':''}`} key={group.id}>
  <button id={`${prefix}-${group.id}-trigger`} className={`classic-nav-trigger ${activeGroup===group.id?'is-current':''}`} aria-haspopup="menu" aria-expanded={open===group.id} aria-controls={`${prefix}-${group.id}-menu`} onClick={e=>toggleGroup(group.id,e.currentTarget)} onKeyDown={e=>keyboardOpen(e,group.id,prefix)}><Icon name={group.icon} size={16}/><span>{group.name}</span><ChevronDown size={12}/></button>
  {open===group.id&&<div id={`${prefix}-${group.id}-menu`} role="menu" aria-labelledby={`${prefix}-${group.id}-trigger`} className={`classic-flyout classic-flyout-${group.id}`} onKeyDown={moveInMenu}>
   <div className="classic-flyout-heading"><strong>{group.name}</strong><span>{group.description}</span></div>
   <div className="classic-flyout-links">{group.ids.map(id=>{const feature=FEATURES.find(row=>row.id===id)!;return <button key={id} role="menuitem" data-route={id} aria-current={route===id?'page':undefined} className={route===id?'is-current':''} onClick={()=>{close();navigate(id);}}><Icon name={feature.icon} size={18}/><span><strong>{feature.name}</strong><small>{feature.description}</small></span>{['training','gear','money'].includes(id)&&<em>추천</em>}</button>;})}</div>
  </div>}
 </div>)}</>;
 return <>
  {(open||mobile)&&<button className={`classic-nav-shade ${mobile?'is-mobile':''}`} aria-label="열린 메뉴 닫기" tabIndex={-1} onClick={close}/>}
  <header className="classic-header" ref={root}>
   <div className="classic-header-inner">
    <button className="classic-brand" onClick={()=>{close();navigate('today');}} aria-label="GMS Classic Helper 홈"><GameVisual kind="item" id="4031134" name="단풍잎" size="sm"/><span><strong>GMS Classic<br/><span>Helper</span></strong></span></button>
    <nav className="classic-desktop-nav" aria-label="주요 메뉴">{groupNav('classic-desktop')}</nav>
    <div className="classic-header-actions">
     <button className="classic-search" onClick={()=>{close();onSearch();}} aria-label="기능 찾기 · 통합 검색"><Search size={17}/><span>기능 찾기</span><kbd>⌘K</kbd></button>
     <button className="classic-icon-button classic-theme-toggle" aria-label="화면 테마 전환" onClick={()=>update({settings:{...state.settings,theme:state.settings.theme==='dark'?'light':'dark'}})}>{state.settings.theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button>
     <button className="classic-icon-button classic-notification" aria-label="내 이벤트 일정 보기" onClick={()=>{close();navigate('events');}}><Bell size={17}/>{hasEvents&&<i/>}</button>
     <div className="classic-profile-wrap">
      <button className="classic-profile-button account-button" onClick={()=>{close();openProfile(profile.id);}} aria-label={`${profile.name} 프로필 편집`}><ProfileSprite profile={profile}/><span>{profile.name}</span></button>
      <button className="classic-profile-picker classic-icon-button" aria-label="캐릭터 선택" aria-haspopup="menu" aria-expanded={open==='profiles'} aria-controls="classic-profile-menu" onClick={e=>toggleGroup('profiles',e.currentTarget)}><ChevronDown size={14}/></button>
      {open==='profiles'&&<div className="classic-profile-menu" id="classic-profile-menu" role="menu" aria-label="내 캐릭터" onKeyDown={moveInMenu}><div className="classic-flyout-heading"><strong>내 캐릭터</strong><span>캐릭터마다 진행도를 따로 기록해요</span></div>{state.profiles.map((row:any)=><button role="menuitem" key={row.id} className={row.id===profile.id?'is-current':''} onClick={()=>{update({activeProfile:row.id});close();}}><ProfileSprite profile={row}/><span><strong>{row.name}</strong><small>Lv. {row.level} · {JOBS[currentJobForProfile(row)]?.name??'직업 미확인'}</small></span>{row.id===profile.id&&<b>선택</b>}</button>)}<button role="menuitem" className="classic-manage-profiles" onClick={()=>{close();navigate('settings');}}><Icon name="settings" size={17}/>프로필 관리 · 내 공간</button></div>}
     </div>
     <button ref={mobileTrigger} className="classic-mobile-toggle classic-icon-button" aria-label={mobile?'메뉴 닫기':'메뉴 열기'} aria-expanded={mobile} aria-controls="classic-mobile-menu" onClick={()=>{setOpen(null);setMobile(value=>!value);}}>{mobile?<X size={23}/>:<Menu size={23}/>}</button>
    </div>
   </div>
   {mobile&&<nav className="classic-mobile-menu" id="classic-mobile-menu" aria-label="전체 기능 메뉴"><div className="classic-mobile-menu-heading"><strong>무엇을 할까요?</strong><button onClick={()=>{close();onSearch();}}><Search size={15}/>기능 찾기</button></div>{groupNav('classic-mobile')}<div className="classic-mobile-menu-footer"><button onClick={()=>{close();openProfile(profile.id);}}>내 프로필 편집</button><button onClick={()=>{close();navigate('settings');}}>내 공간 · 백업</button><button aria-label="화면 테마 전환" onClick={()=>update({settings:{...state.settings,theme:state.settings.theme==='dark'?'light':'dark'}})}>{state.settings.theme==='dark'?'밝은 화면':'어두운 화면'}</button></div></nav>}
  </header>
 </>;
}

export function ClassicBreadcrumb(){
 const {route,navigate}=useCompass(),current=FEATURES.find(row=>row.id===route);
 return <div className={`classic-page-location breadcrumb ${route==='today'?'is-home':''}`}><button onClick={()=>navigate('today')}>홈</button><span>/</span><strong>{current?.name}</strong></div>;
}

export function ClassicStatusBar(){
 const {state,profile,navigate,openProfile,route,ready,sync}=useCompass(),currentJob=currentJobForProfile(profile);
 const next=experienceToNext(profile.level),exp=profile.exp!==null&&profile.exp!==undefined&&profile.exp!==''&&Number.isFinite(Number(profile.exp))?Math.max(0,Number(profile.exp)):null;
 const percent=next&&exp!==null?Math.max(0,Math.min(100,exp/next*100)):null;
 const mesos=profile.mesos!==null&&profile.mesos!==undefined&&profile.mesos!==''&&Number.isFinite(Number(profile.mesos))?Math.max(0,Number(profile.mesos)).toLocaleString('ko-KR'):'미입력';
 const shortcuts=[{id:'settings',name:'내 공간',icon:'settings'},{id:'market',name:'시세표',icon:'chart'},{id:'trade',name:'거래소',icon:'handshake'},{id:'party',name:'파티',icon:'users'},{id:'codex',name:'도감',icon:'library'},{id:'tools',name:'편의도구',icon:'grid'}];
 return <>
  <div className="classic-status-bar" aria-label="저장한 캐릭터 현황">
   <button className="classic-status-character" onClick={()=>openProfile(profile.id)} title="저장한 프로필 편집"><span className="classic-status-level"><small>LV.</small>{profile.level}</span><span><strong>{profile.name}</strong><small>{JOBS[currentJob]?.name??'직업 미확인'}</small></span></button>
   <button className="classic-status-exp" onClick={()=>navigate('exp')} title="프로필에 기록한 EXP · 다음 레벨 필요량은 확인된 Classic 자료만 사용"><b>EXP</b><span className="classic-exp-track">{percent!==null&&<i style={{width:percent+'%'}}/>}<span>{exp===null?'경험치 미입력':exp.toLocaleString('ko-KR')}{next?' / '+next.toLocaleString('ko-KR'): ' · 필요 EXP 미확인'}{percent!==null?' ['+percent.toFixed(1)+'%]':''}</span></span></button>
   <button className="classic-status-mesos" onClick={()=>openProfile(profile.id)} title="프로필에 기록한 보유 메소"><Icon name="coins" size={22}/><span><small>MESO</small><strong>{mesos}</strong></span></button>
   <span className="classic-save-state" title={ready?sync:'기록 불러오는 중'}><i/>{ready?sync:'불러오는 중…'}</span>
   <nav className="classic-status-shortcuts" aria-label="빠른 메뉴">{shortcuts.map(link=><button key={link.id} aria-label={link.name} aria-current={route===link.id?'page':undefined} onClick={()=>navigate(link.id)}><Icon name={link.icon} size={16}/><span>{link.name}</span></button>)}</nav>
  </div>
  <nav className="classic-bottom-nav" aria-label="모바일 빠른 메뉴">{CLASSIC_MOBILE_LINKS.map(link=><button key={link.id} className={route===link.id||classicGroupForRoute(route)===link.id?'is-current':''} aria-current={route===link.id?'page':undefined} onClick={()=>navigate(link.id)}><Icon name={link.icon} size={20}/><span>{link.name}</span></button>)}</nav>
 </>;
}
