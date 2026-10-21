'use client';
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Context, useAppState, useCompass } from './context';
import { Avatar, Badge, Button, External, Field, Icon, Modal } from './components';
import { FEATURES, JOBS, LINKS } from '@/lib/catalog';
import { DATA } from '@/lib/data';
import { clamp, matches, number } from '@/lib/engine.mjs';
import {switchProfileJob} from '@/lib/profiles.mjs';
import { BuildnotesPanel, CodexPanel, CraftingPanel, DetailContent, EventsPanel, GearPanel, GuidesPanel, HomePanel, HuntPanel, MarketPanel, QuestsPanel, SettingsPanel, TrainingPanel } from './panels';
import { ChatTool, CombatTool, DressingTool, ExpTool, GuideChecklist, OrderTool, RankingTool, RouteTool, ScrollTool, SkillsTool, TimerTool, ToolsIndex } from './tools';
import ScreenReader from './screen-reader';
import SharedBuild from './shared-build';
import CommunityWorkspace, { SharedTimerPanel } from './community-workspace';
import {MarketWorkspace,MarketLiveSync} from './market-workspace';
import {RecommendationsPanel} from './recommendations';
import {CatalogExplorer,CatalogDetail} from './catalog-explorer';
import {GlobalSearch} from './global-search';
import {SyncConflict} from './sync-conflict';
import {HuntSessionRecorder} from './hunt-session';
import {ProfileManager,SkillsPlanner,ExperienceCalculator} from './progress-tools';
import {CombatLab} from './combat-lab';
import {RankingWorkspace} from './rank-workspace';
import {ClassicNewsPanel} from './classic-news';
import {LaunchEventsPanel} from './launch-events';
import {WorldRoutePlanner,RecipePlanner,GameDressingRoom} from './world-tools';
import {CitizenshipPlanner,PartyQuestPlanner} from './progression-guides';
import { MegaphonePanel, PostsPanel } from './community';
import {ClassicHeader,ClassicBreadcrumb,ClassicStatusBar} from './classic-shell';
import {ClassicHomePanel} from './classic-home';
import {DataSourcesPanel} from './data-sources';
import {FieldBossGuide} from './boss-guide';
import {pathForRoute,routeForLocation} from '@/lib/site-routes.mjs';

export default function CompassApp(){
 const app=useAppState();
 const [route,setRoute]=useState('today'),[searchOpen,setSearchOpen]=useState(false),[selection,setSelection]=useState<any>(null),[editingId,setEditingId]=useState<string|null>(null);
 const navigate=(id:string)=>{const target=FEATURES.some(f=>f.id===id)?id:'today';setRoute(target);if(typeof window!=='undefined'){history.pushState(null,'',pathForRoute(target));window.scrollTo({top:0,behavior:'smooth'});}};
 useEffect(()=>{
  const read=()=>setRoute(routeForLocation(location.pathname,location.hash));read();
  window.addEventListener('hashchange',read);window.addEventListener('popstate',read);
  const keyboard=(event:KeyboardEvent)=>{const target=event.target as HTMLElement;if((event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(target.tagName)&&!target.isContentEditable)||((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k')){event.preventDefault();setSearchOpen(true);}};
  window.addEventListener('keydown',keyboard);
  return()=>{window.removeEventListener('hashchange',read);window.removeEventListener('popstate',read);window.removeEventListener('keydown',keyboard);};
 },[]);
 useEffect(()=>{document.documentElement.dataset.theme=app.state.settings.theme??'light';},[app.state.settings.theme]);
 const context={...app,route,navigate,openSearch:()=>setSearchOpen(true),detail:setSelection,openProfile:(id?:string)=>setEditingId(id??app.profile.id)};
 return <Context.Provider value={context}><div className="app-shell classic-app" data-route={route}>
  <SharedBuild/><MarketLiveSync/><SyncConflict/>
  <a className="skip-link" href="#page-content" onClick={event=>{event.preventDefault();const main=document.getElementById("page-content");main?.focus();main?.scrollIntoView({block:"start"});}}>본문으로 건너뛰기</a>
  <ClassicHeader onSearch={()=>setSearchOpen(true)} searchOpen={searchOpen}/>
  <div className="main-shell"><main id="page-content" className="page-content" tabIndex={-1}>
   <ClassicBreadcrumb/><Page route={route}/>
   <footer className="app-footer"><span>메이플 컴패스 <b>✦</b> 함께 기록하는 클래식 모험</span><span>비공식 팬 프로젝트 · 게임 이미지 © NEXON · {app.ready?app.sync:'기록 불러오는 중…'}</span></footer>
  </main></div>
  <ClassicStatusBar/>
  {app.toast&&<div className="toast" role="status"><Icon name="leaf" size={18}/>{app.toast}<button aria-label="알림 닫기" onClick={()=>app.notify('')}><X size={15}/></button></div>}
  {searchOpen&&<GlobalSearch onClose={()=>setSearchOpen(false)}/>}
  {selection?.catalogKind&&<CatalogDetail kind={selection.catalogKind} id={String(selection.row.id)} onSelect={(kind,id)=>setSelection({catalogKind:kind,row:{id}})} onClose={()=>setSelection(null)}/>}
  {selection&&!selection.catalogKind&&<Modal title={selection.kind==='guide'?'모험 공략':'도감 상세'} onClose={()=>setSelection(null)} wide><DetailContent selection={selection} onClose={()=>setSelection(null)}/></Modal>}
  {editingId&&<ProfileModal id={editingId} onClose={()=>setEditingId(null)}/>}
 </div></Context.Provider>;
}
function ExperienceCalculatorKeyed(){const {profile}=useCompass();return <ExperienceCalculator key={profile.id}/>;}
function Page({route}:any){switch(route){case'today':return <ClassicHomePanel/>;case'guides':return <GuidesPanel/>;case'quests':return <CatalogExplorer key="quests" initialKind="quests" fixedKind/>;case'money':return <RecommendationsPanel key="money" mode="quests" questGoal="money"/>;case'expQuests':return <RecommendationsPanel key="expQuests" mode="quests" questGoal="exp"/>;case'training':return <RecommendationsPanel mode="training"/>;case'codex':return <CatalogExplorer key="codex"/>;case'items':return <CatalogExplorer key="items" initialKind="items" fixedKind/>;case'monsters':return <CatalogExplorer key="monsters" initialKind="monsters" fixedKind/>;case'maps':return <CatalogExplorer key="maps" initialKind="maps" fixedKind/>;case'npcs':return <CatalogExplorer key="npcs" initialKind="npcs" fixedKind/>;case'market':return <MarketWorkspace/>;case'owl':return <MarketWorkspace mode="owl"/>;case'trade':case'party':case'messages':case'nickname':case'shop':return <CommunityWorkspace key={route} mode={route}/>;case'tools':return <ToolsIndex/>;case'calculator':case'accuracy':return <CombatLab key={route} mode={route}/>;case'hunt':return <><HuntSessionRecorder/><HuntPanel/></>;case'exp':return <ExperienceCalculatorKeyed/>;case'skills':return <SkillsPlanner/>;case'gear':return <RecommendationsPanel mode="gear"/>;case'buildnotes':return <BuildnotesPanel/>;case'crafting':return <RecipePlanner/>;case'scroll':return <ScrollTool/>;case'dressing':return <GameDressingRoom/>;case'route':return <WorldRoutePlanner/>;case'timer':return <><TimerTool/><SharedTimerPanel/></>;case'order':return <OrderTool/>;case'chat':return <ChatTool/>;case'liveTranslate':return <ScreenReader/>;case'megaphone':return <MegaphonePanel/>;case'citizenship':return <CitizenshipPlanner/>;case'pq':return <><PartyQuestPlanner/><FieldBossGuide/></>;case'start':case'errors':return <GuideChecklist key={route} mode={route}/>;case'events':return <><LaunchEventsPanel/><ClassicNewsPanel/><EventsPanel/></>;case'ranking':return <RankingWorkspace/>;case'settings':return <><ProfileManager/><SettingsPanel/><DataSourcesPanel/></>;default:return <ClassicHomePanel/>;}}
function SearchModal({onClose}:any){const {navigate,detail}=useCompass();const [query,setQuery]=useState('');const features=FEATURES.filter(f=>matches(f.name+' '+f.description,query)).slice(0,query?7:6);const entities=[...DATA.monsters.map((row:any)=>({kind:'monster',row})),...DATA.items.map((row:any)=>({kind:'item',row})),...DATA.quests.map((row:any)=>({kind:'quest',row})),...DATA.maps.map((row:any)=>({kind:'map',row}))].filter(v=>query&&matches(v.row.name+' '+v.row.en,query)).slice(0,8);return <Modal title="모험의 궁금증을 찾아보세요" onClose={onClose}><div className="search-field search-large"><Search size={21}/><input autoFocus aria-label="통합 검색" value={query} onChange={e=>setQuery(e.target.value)} placeholder="아이템, 몬스터, 퀘스트, 편의도구…"/><kbd>ESC</kbd></div><div className="search-results"><span className="eyebrow">{query?'찾은 기능':'자주 찾는 기능'}</span>{features.map(f=><button key={f.id} onClick={()=>{onClose();navigate(f.id);}}><Icon name={f.icon}/><span><strong>{f.name}</strong><small>{f.description}</small></span><b>↗</b></button>)}{entities.length>0&&<span className="eyebrow">도감에서 찾았어요</span>}{entities.map(v=><button key={v.kind+v.row.id} onClick={()=>{onClose();detail(v);}}><Icon name={v.kind==='monster'?'leaf':v.kind==='item'?'shield':'scroll'}/><span><strong>{v.row.name}</strong><small>{v.row.en}</small></span><b>↗</b></button>)}{!features.length&&!entities.length&&<p className="empty">다른 이름이나 초성으로 검색해 보세요.</p>}</div></Modal>;}
function ProfileModal({id,onClose}:any){const {state,update,notify}=useCompass();const original=state.profiles.find((p:any)=>p.id===id);const [p,setP]=useState<any>({...original});const set=(key:string,value:any)=>setP({...p,[key]:value});return <Modal title="모험가 프로필" onClose={onClose}><form onSubmit={e=>{e.preventDefault();if(!p.name.trim())return;const changes=p.job!==original.job?switchProfileJob(state,id,p.job):{};update({...changes,profiles:state.profiles.map((v:any)=>v.id===id?{...p,level:clamp(p.level,1,200),name:p.name.trim()}:v),activeProfile:id});notify('프로필을 저장했어요. 추천이 함께 바뀝니다.');onClose();}}><div className="profile-edit-avatar"><Avatar job={p.job} size={110}/><div><Badge tone="green">{p.role}</Badge><p>{JOBS[p.job].path}</p></div></div><div className="form-grid"><Field label="닉네임" required maxLength={30} value={p.name} onChange={(e:any)=>set('name',e.target.value)}/><Field label="현재 레벨" type="number" min="1" max="200" required value={p.level} onChange={(e:any)=>set('level',Number(e.target.value))}/><Field label="직업 목표"><select value={p.job} onChange={e=>set('job',e.target.value)}>{Object.entries(JOBS).map(([id,j])=><option key={id} value={id}>{j.name} · {j.short}</option>)}</select></Field><Field label="실제 현재 전직 · 선택"><select value={p.currentJob??''} onChange={e=>set('currentJob',e.target.value||null)}><option value="">레벨과 목표 직업으로 예상</option>{Object.entries(JOBS).map(([id,j])=><option key={id} value={id}>{j.name}</option>)}</select></Field><Field label="보유 메소" type="number" min="0" value={p.mesos||''} onChange={(e:any)=>set('mesos',number(e.target.value))}/>{['str','dex','int','luk','attack','magicAttack','accuracy'].map(k=><Field key={k} label={k==='attack'?'현재 무기 공격력':k==='magicAttack'?'현재 총 마력':k==='accuracy'?'현재 명중 스탯':k.toUpperCase()} type="number" min="0" value={p[k]??0} onChange={(e:any)=>set(k,clamp(e.target.value,0,99999))}/>)}<Field label="현재 인기도 · 모르면 빈칸" type="number" step="1" value={p.fame??''} onChange={(e:any)=>set('fame',e.target.value===''?null:Math.trunc(clamp(e.target.value,-99999,99999)))}/><Field label="현재 위치" value={p.location} onChange={(e:any)=>set('location',e.target.value)}/><Field label="성장 목표"><select value={p.goal} onChange={e=>set('goal',e.target.value)}><option value="balance">균형 잡힌 성장</option><option value="exp">경험치 우선</option><option value="mesos">메소 우선</option></select></Field></div><p className="muted">현재 공식 레벨 상한은 100이에요. 그보다 높은 레벨은 미리 계획하는 값입니다. 1레벨 스탯은 시작값이므로 실제 게임 수치로 수정하세요.</p><Button type="submit">프로필 저장</Button></form></Modal>;}
