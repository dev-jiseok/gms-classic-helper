'use client';
import { useEffect, useState } from 'react';
import { useCompass } from './context';
import { Badge, Button, Card, Empty, External, Field, Icon, Modal, SectionTitle } from './components';
import { fetchGameItem } from '@/lib/game-data-client';
import { format, mesos } from '@/lib/engine.mjs';
import { currentJobForProfile } from '@/lib/recommendations.mjs';
import { WorldAtlas } from './world-atlas';
import { GameVisual } from './game-visual';
import { catalogMedia, questGiverId } from '@/lib/game-media.mjs';
import './catalog-explorer.css';
import QuestStepGuide from './quest-step-guide';
import CatalogSourceFields from './catalog-source-fields';

export type CatalogKind='items'|'monsters'|'maps'|'quests'|'npcs'|'recipes'|'shops';
const LABELS:Record<CatalogKind,string>={items:'아이템',monsters:'몬스터',maps:'맵',quests:'퀘스트',npcs:'NPC · 상점',recipes:'제작 레시피',shops:'NPC 판매 목록'};
const ICONS:Record<CatalogKind,string>={items:'shield',monsters:'leaf',maps:'map',quests:'scroll',npcs:'store',recipes:'hammer',shops:'coins'};
const known=(value:any,suffix='')=>value===null||value===undefined?'확인 필요':format(value)+suffix;
const numeric=(id:any)=>/^\d+$/.test(String(id));

export function CatalogExplorer({initialKind='monsters',fixedKind=false,title}:{initialKind?:CatalogKind;fixedKind?:boolean;title?:string}) {
  const {state,profile,toggle,update}=useCompass();
  const [kind,setKind]=useState<CatalogKind>(initialKind),[query,setQuery]=useState(''),[page,setPage]=useState(0),[category,setCategory]=useState(''),[maxLevel,setMaxLevel]=useState(''),[result,setResult]=useState<any>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[selection,setSelection]=useState<{kind:CatalogKind;id:string}|null>(null);
  const [eligible,setEligible]=useState(true),[hideCompleted,setHideCompleted]=useState(true);
  const completedIds=kind==='quests'&&hideCompleted?Object.entries(state.completed?.[profile.id]||{}).filter(([,done])=>done).map(([id])=>id).slice(0,500).join(','):'';
  const currentJob=currentJobForProfile(profile);
  useEffect(()=>{setKind(initialKind);setPage(0);setQuery('');setCategory('');},[initialKind]);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');
    const timeout=setTimeout(async()=>{
      try {
        const p=new URLSearchParams({kind,q:query,offset:String(page*40),limit:'40'});
        if(category)p.set('category',category);if(maxLevel)p.set('maxLevel',maxLevel);
        if(kind==='quests'&&eligible){p.set('eligibleLevel',String(profile.level));p.set('job',currentJob);}
        if(completedIds)p.set('exclude',completedIds);
        const response=await fetch('/api/game-data?'+p,{signal:controller.signal});const json:any=await response.json();
        if(!response.ok)throw new Error(json.error||'자료를 불러오지 못했습니다.');if(!controller.signal.aborted){setResult({...json,kind});setLoading(false);}
      }catch(e:any){if(e.name!=='AbortError'){setError(e.message);setLoading(false);}}
    },220);
    return()=>{clearTimeout(timeout);controller.abort();};
  },[kind,query,page,category,maxLevel,eligible,completedIds,currentJob,profile.level]);
  function switchKind(next:CatalogKind) {setKind(next);setQuery('');setCategory('');setMaxLevel('');setPage(0);}
  const rows=result?.kind===kind?result.rows:[];
  return <>
    <SectionTitle eyebrow="THE CONNECTED MAPLE FIELD GUIDE" title={title||(fixedKind?LABELS[kind]:'연결해서 찾는 전체 도감')} description="공개 MCW 색인을 검색하고, 출현 맵·드롭·퀘스트·상점·제작을 함께 확인하세요." action={<Badge tone="green">참조 자료 · {result?.verifiedAt||'불러오는 중'}</Badge>}/>
    {!fixedKind&&<div className="tabs" aria-label="도감 종류">{(['monsters','items','maps','quests','npcs','recipes'] as CatalogKind[]).map(k=><button key={k} className={kind===k?'active':''} onClick={()=>switchKind(k)}>{LABELS[k]}</button>)}</div>}
    {kind==='maps'&&<WorldAtlas onSelect={id=>setSelection({kind:'maps',id})}/>}
    <div className="filter-bar">
      <div className="search-field"><Icon name="search"/><input aria-label={`${LABELS[kind]} 전체 검색`} placeholder="이름 · 영어 · 초성 · 아이템 ID" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></div>
      {(result?.categories?.length>0)&&<select aria-label="도감 분류" value={category} onChange={e=>{setCategory(e.target.value);setPage(0);}}><option value="">모든 분류</option>{result.categories.map((c:string)=><option key={c}>{c}</option>)}</select>}
      {['items','monsters','quests'].includes(kind)&&<div className="catalog-level-filter"><label>최대 레벨 <input aria-label="도감 최대 레벨" type="number" min="1" max="200" value={maxLevel} placeholder="전체" onChange={e=>{setMaxLevel(e.target.value);setPage(0);}}/></label><Button variant="ghost" onClick={()=>{setMaxLevel(String(profile.level));setPage(0);}}>내 레벨</Button></div>}
      {kind==='quests'&&<><label className="checkbox-label"><input type="checkbox" checked={eligible} onChange={e=>{setEligible(e.target.checked);setPage(0);}}/>내 레벨·현재 직업</label><label className="checkbox-label"><input type="checkbox" checked={hideCompleted} onChange={e=>{setHideCompleted(e.target.checked);setPage(0);}}/>완료 숨기기</label></>}
    </div>
    <div className="results-label" aria-live="polite">{loading?'자료를 찾고 있어요.':`${format(result?.total||0)}개 검색 결과`}<span>{kind==='items'?'클라이언트 항목의 실제 출시 여부는 별도 확인':kind==='quests'?'선행 · 직업 · 실제 게임 조건 확인':'수치가 없는 항목은 미확인으로 표시'}</span></div>
    {error?<Empty title="도감을 불러오지 못했어요">{error}</Empty>:!loading&&!rows.length?<Empty icon={ICONS[kind]} title="검색 결과가 없어요" action={<Button variant="secondary" onClick={()=>{setQuery('');setCategory('');setMaxLevel('');setEligible(false);setHideCompleted(false);setPage(0);}}>검색 조건 초기화</Button>}>영어 이름이나 아이템 ID로도 찾아보세요.</Empty>:<div className={`catalog-grid ${loading?'is-loading':''}`} aria-busy={loading}>{rows.map((row:any,index:number)=>{
      const id=String(row.id??row.itemId??index),favorite=state.favorites?.includes(kind+':'+id),completed=state.completed?.[profile.id]?.[id];
      return <article className={`catalog-entry catalog-entry-${kind}`} key={id+':'+index}>
        <button className="catalog-entry-main" onClick={()=>setSelection({kind:kind==='shops'?'items':kind,id:kind==='shops'?String(row.itemId):id})}>
          <GameVisual {...catalogMedia(kind,row)} size={kind==='maps'?'scene':'md'}/>
          <span className="catalog-entry-text"><strong>{row.name||row.itemName||row.npcName}</strong><small>{row.en||row.profession||row.npcName}</small><span className="catalog-entry-meta">{kind==='monsters'?<>Lv. {known(row.level)} · HP {known(row.hp)} · EXP {known(row.exp)}{row.variantLabel&&<b className="catalog-variant-tag">{row.variantLabel}</b>}</>:kind==='quests'?<>Lv. {known(row.minLevel)} · {row.npc||row.region||'조건 확인'}</>:kind==='items'?<>{row.subCategory||row.category||'분류 확인'} · Lv. {known(row.requiredLevel)}</>:kind==='maps'?<>{row.region||'지역 확인'} · 포털 {row.portals?.length||0}개</>:kind==='npcs'?<>{row.mapName||row.region||'위치 확인'} · 상점 {row.shopItems?.length||0}품목</>:kind==='recipes'?<>{row.profession} Lv. {known(row.level)} · {known(row.craftExp,' 숙련 EXP')}</>:<>{row.npcName} · {known(row.price,' 메소')}</>}</span></span><span>›</span>
        </button>
        {kind==='quests'&&<QuestCardPreview row={row}/>}
        <div className="catalog-entry-actions">{kind==='quests'?<label className="checkbox-label"><input type="checkbox" checked={!!completed} onChange={()=>{toggle('completed',id);setPage(0);}} aria-label={`${row.name} 완료`}/>완료 기록</label>:<small>#{id}</small>}<button className={`icon-button ${favorite?'catalog-starred':''}`} aria-label={`${row.name||row.itemName} 즐겨찾기 ${favorite?'해제':'추가'}`} onClick={()=>update({favorites:favorite?state.favorites.filter((s:string)=>s!==kind+':'+id):[...(state.favorites||[]),kind+':'+id]})}>{favorite?'★':'☆'}</button></div>
      </article>;
    })}</div>}
    {result&&result.total>40&&<div className="catalog-pagination"><Button variant="secondary" disabled={page===0||loading} onClick={()=>setPage(p=>p-1)}>이전</Button><span>{page+1} / {Math.ceil(result.total/40)} 페이지</span><Button variant="secondary" disabled={(page+1)*40>=result.total||loading} onClick={()=>setPage(p=>p+1)}>다음</Button></div>}
    <div className="notice catalog-source-note">{result?.coverage||'클라이언트 색인과 커뮤니티 참조 자료입니다. 현재 서버에서 확인해 주세요.'}<br/>MapleClassic Wiki 기여자 · 정규화·구성 편집 · CC BY-NC-SA 4.0. 게임 자산의 권리는 NEXON에 있습니다. <External href="https://creativecommons.org/licenses/by-nc-sa/4.0/">자료 이용 조건</External></div>
    {selection&&<CatalogDetail kind={selection.kind} id={selection.id} onSelect={(k,id)=>setSelection({kind:k,id})} onClose={()=>setSelection(null)}/>}
  </>;
}

function QuestCardPreview({row}:{row:any}) {
 const needs=(row.requirements||[]).slice(0,3),rewards=(row.rewardItems||[]).slice(0,3);
 if(!needs.length&&!rewards.length&&row.exp==null&&row.mesos==null)return null;
 return <div className="catalog-quest-preview">
  {!!needs.length&&<div><small>필요 재료</small><span className="catalog-mini-items">{needs.map((r:any,i:number)=><span key={r.itemId+':'+i} title={`${r.name} ×${known(r.quantity)}`}><GameVisual kind="item" id={r.itemId} name={r.name} size="sm"/><b>×{known(r.quantity)}</b></span>)}{row.requirements.length>3&&<small>+{row.requirements.length-3}종</small>}</span></div>}
  <div><small>보상</small><span className="catalog-mini-items">{row.exp!=null&&<span className="catalog-exp-chip">EXP {format(row.exp)}</span>}{row.mesos!=null&&<span className="catalog-meso-chip">{mesos(row.mesos)}</span>}{rewards.map((r:any,i:number)=><span key={r.itemId+':'+i} title={`${r.name} ×${known(r.quantity)}`}><GameVisual kind="item" id={r.itemId} name={r.name} size="sm"/><b>×{known(r.quantity)}</b></span>)}{(row.rewardItems?.length||0)>3&&<small>+{row.rewardItems.length-3}종</small>}</span></div>
 </div>;
}

export function CatalogDetail({kind,id,onSelect,onClose}:{kind:CatalogKind;id:string;onSelect?:(kind:CatalogKind,id:string)=>void;onClose:()=>void}) {
  const {state,profile,toggle,update,navigate}=useCompass();
  const [result,setResult]=useState<any>(null),[error,setError]=useState('');
  useEffect(()=>{const abort=new AbortController();setResult(null);setError('');fetchGameItem(kind,id,true,abort.signal).then(setResult).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>abort.abort();},[kind,id]);
  const row=result?.row,related=result?.related||{},inventory=state.inventory?.[profile.id]||{};
  function open(k:CatalogKind,r:any){onSelect?.(k,String(r.id??r.itemId));}
  function entityLink(k:CatalogKind,r:any,disabled=false){return <button className="text-button catalog-entity-link" disabled={disabled} onClick={()=>open(k,{...r,id:r.id??r.itemId??r.monsterId})}><GameVisual {...catalogMedia(k,{...r,id:r.id??r.itemId??r.monsterId})} size="sm"/><span>{r.name||r.itemName||r.npcName||'미확인 항목'}</span></button>;}
  function links(k:CatalogKind,rows:any[],title:string) {return rows?.length?<section className="catalog-detail-section"><h3>{title} <Badge>{rows.length}</Badge></h3><div className="catalog-related-list">{rows.map((r:any,i:number)=><button key={(r.id??r.itemId??i)+':'+i} onClick={()=>open(k,r)}><GameVisual {...catalogMedia(k,r)} size={k==='maps'?'md':'sm'}/><div className="catalog-linked-copy"><strong>{r.name||r.itemName||r.npcName}</strong><small>{k==='monsters'?`Lv. ${known(r.level)} · EXP ${known(r.exp)}`:k==='maps'?r.region:k==='quests'?`Lv. ${known(r.minLevel)} · ${r.npc||''}`:k==='recipes'?`${r.profession} Lv. ${known(r.level)}`:r.en||r.subCategory}</small></div><span className="catalog-related-arrow">›</span></button>)}</div></section>:null;}
  return <Modal title={row?.name||LABELS[kind]+' 상세'} onClose={onClose} wide>
    {error?<p className="error-text" role="alert">{error}</p>:!row?<p className="muted" role="status">관련 자료를 불러오고 있어요.</p>:<>
      <div className={`catalog-detail-title catalog-detail-title-${kind}`}><GameVisual {...catalogMedia(kind,row)} size="lg" animate={kind==='monsters'}/><div><div className="catalog-detail-chips">{row.minLevel!=null&&<Badge tone="amber">Lv. {row.minLevel}</Badge>}{row.level!=null&&<Badge tone="amber">Lv. {row.level}</Badge>}{row.isBoss&&<Badge>보스</Badge>}{row.variantLabel&&<Badge tone="amber">{row.variantLabel}</Badge>}{row.region&&<span>{row.region}</span>}</div><h2>{row.name}</h2><p>{row.en} · #{row.id}</p>{kind==='quests'&&<p className="catalog-quest-giver">시작 NPC · <strong>{row.npc||'확인 필요'}</strong></p>}</div><Badge tone="amber">참조 자료</Badge></div>
      {result.detailError&&<div className="notice">{result.detailError} 저장된 참조 자료를 표시합니다.</div>}
      {row.referenceOnly&&<div className="notice">위키 원천에 있는 참고 항목입니다. 현재 게임 API의 같은 항목으로 확인되지 않아 이미지·시세와 자동으로 연결하거나 실행 가능한 계획으로 추천하지 않아요.</div>}
      {row.availability==='client-entry-unverified'&&<div className="notice">이 항목은 공개 클라이언트 색인에 있습니다. 실제 출시·획득 가능 여부는 아직 확인하지 않았습니다.</div>}
      {kind==='items'&&<>
        <div className="detail-stats">{[['착용 레벨',row.requiredLevel],['NPC 판매가',row.npcSell],['업그레이드 횟수',row.slots],['공격 속도',row.attackSpeed]].map(([label,value])=><div key={String(label)}><span>{label}</span><strong>{known(value)}</strong></div>)}</div>
        <p>{row.subCategory||row.category} · 착용 직업: {row.requiredJobs?.join(' / ')||'확인 필요'}</p>
        <div className="catalog-facts">{Object.entries(row.stats||{}).filter(([,v])=>v!==null&&v!==undefined).map(([k,v])=><span key={k}>{k.toUpperCase()} <strong>{String(v)}</strong></span>)}</div>
        {row.metadataNote&&<p className="muted">{row.metadataNote}</p>}
        <div className="button-row"><Button onClick={()=>{onClose();navigate('market');}}>시세·매물 확인</Button><Button variant="secondary" onClick={()=>{onClose();navigate('gear');}}>장비 비교</Button></div>
        {links('monsters',related.monsters,'드롭 관찰 몬스터')}{links('quests',related.quests,'연결된 퀘스트')}{links('recipes',related.recipes,'사용·제작 레시피')}
        {!!related.shops?.length&&<section className="catalog-detail-section"><h3>NPC 구매처</h3>{related.shops.map((s:any,i:number)=><div className="stat-line" key={s.npcId+':'+i}>{entityLink('npcs',{id:s.npcId,name:s.npcName})}<span>{known(s.price,' 메소')}{s.residentPrice!==null&&` · 주민 ${known(s.residentPrice)}`}{s.citizenshipGrade!==null&&` · 시민권 ${s.citizenshipGrade}단계`}</span></div>)}</section>}
      </>}
      {kind==='monsters'&&<>
        <div className="detail-stats">{[['레벨',row.level],['HP',row.hp],['EXP',row.exp],['회피',row.avoidability]].map(([label,value])=><div key={String(label)}><span>{label}</span><strong>{known(value)}</strong></div>)}</div>
        <p>{row.region||'지역 확인 필요'}{row.isBoss?' · 보스':''}{row.undead?' · 언데드':''}</p>
        {links('maps',related.maps,'출현 맵')}
        <section className="catalog-detail-section"><h3>관찰된 드롭</h3>{row.drops?.length?<><div className="notice">실제 확정 확률이 아닌 커뮤니티 표본입니다. 관찰 시점·킬 수·범위를 함께 확인하세요.</div>{row.drops.filter((d:any)=>d.category!=='nothing').map((d:any,i:number)=><div className="catalog-drop-row" key={i}>{entityLink('items',{id:d.itemId,name:d.itemName||(d.category==='meso'?'메소':'미확인 항목')},!d.itemId||!numeric(d.itemId))}<div><strong>{d.observedRatePercent===null?'확률 확인 필요':`${Number(d.observedRatePercent).toFixed(2)}% 관찰`}</strong><small>{known(d.sampleDrops)}회 / {known(d.sampleKills)}킬 · 범위 {known(d.confidenceLowPercent)}–{known(d.confidenceHighPercent)}%{d.minQuantity!==null&&` · 수량 ${known(d.minQuantity)}–${known(d.maxQuantity)}`}{d.questOnly?' · 퀘스트 전용':''} · {d.observedOn||'관찰일 미상'}</small></div></div>)}</>:<p className="muted">표본과 출처가 있는 드롭 자료가 아직 없습니다.</p>}</section>
      </>}
      {kind==='maps'&&<>
        {numeric(row.id)&&<figure className="catalog-minimap"><GameVisual kind="map" id={row.id} name={row.name} size="scene"/><figcaption>실제 MCW 클라이언트 미니맵 · NEXON / MapleStory.io</figcaption></figure>}
        <p>{row.region} · {row.isTown?'마을':row.mapType||'맵'}</p>{links('monsters',related.monsters,'출현 몬스터')}{links('npcs',related.npcs,'이 맵의 NPC')}
        <section className="catalog-detail-section"><h3>연결 포털</h3>{row.portals?.length?<div className="catalog-related-list">{row.portals.map((p:any,i:number)=><button key={i} disabled={!p.toId} onClick={()=>open('maps',{id:p.toId})}><GameVisual kind="map" id={p.toId} name={p.toName||p.toId} size="md"/><div className="catalog-linked-copy"><strong>{p.toName||p.toId}</strong><small>{p.direction||p.portalName||p.portalType}{p.requiresLevel&&` · Lv. ${p.requiresLevel}`}{p.requiresQuest&&` · 선행 ${p.requiresQuest}`}{p.requiresItem&&` · ${p.requiresItem} 필요`}</small></div><span className="catalog-related-arrow">→</span></button>)}</div>:<p className="muted">연결 정보가 아직 없습니다.</p>}</section><Button variant="secondary" onClick={()=>{onClose();navigate('route');}}>이 맵까지 경로 찾기</Button>{row.metadataNote&&<p className="muted">{row.metadataNote}</p>}
      </>}
      {kind==='npcs'&&<>
        <p>{row.region} · {row.mapName||'위치 확인 필요'} · {row.role||'역할 확인 필요'}</p>
        <section className="catalog-detail-section"><h3>NPC 판매 품목 <Badge>{row.shopItems?.length||0}</Badge></h3>{row.shopItems?.length?row.shopItems.map((s:any,i:number)=><div className="stat-line" key={i}>{entityLink('items',{id:s.itemId,name:s.itemName})}<span>{known(s.price,' 메소')}{s.residentPrice!==null&&` · 주민 ${known(s.residentPrice)}`}</span></div>):<p className="muted">판매 품목이 등록되어 있지 않습니다. 상점이 없다는 뜻은 아닙니다.</p>}</section>
      </>}
      {kind==='quests'&&<>
        <div className="detail-stats"><div><span>시작 레벨</span><strong>{known(row.minLevel)}</strong></div><div><span>경험치</span><strong>{known(row.exp)}</strong></div><div><span>메소 보상</span><strong>{known(row.mesos)}</strong></div><div><span>명성</span><strong>{known(row.fame)}</strong></div></div>
        <p>{row.region} · 시작 {row.npc||'확인 필요'} · 완료 {row.turnIn||'확인 필요'}{row.requiredJob&&` · 직업 ${row.requiredJob}`}{row.repeatable&&` · 반복 ${row.repeatPeriod||'주기 확인'}`}</p>
        <div className="catalog-location-chips">{questGiverId(row)&&entityLink('npcs',{id:questGiverId(row),name:row.npc})}{row.turnInNpcId&&row.turnInNpcId!==row.npcId&&entityLink('npcs',{id:row.turnInNpcId,name:row.turnIn})}</div>
        {(row.citizenshipTown||row.profession||row.completeLevel||row.requiredFame||row.mesoCost)&&<div className="catalog-facts">{row.citizenshipTown&&<span>{row.citizenshipTown} 시민권 <strong>{known(row.citizenshipGrade)}단계</strong></span>}{row.profession&&<span>{row.profession} <strong>Lv. {known(row.professionLevel)}</strong></span>}{row.completeLevel&&<span>완료 레벨 <strong>{row.completeLevel}</strong></span>}{row.requiredFame&&<span>필요 명성 <strong>{row.requiredFame}</strong></span>}{row.mesoCost&&<span>필요 메소 <strong>{format(row.mesoCost)}</strong></span>}</div>}
        {row.rotationPool&&<div className="notice">일일·주간 회차의 후보로 등록된 퀘스트입니다. 오늘 실제로 선정된 퀘스트인지 게임의 게시판에서 확인하세요. 후보 전체가 동시에 활성화되는 것은 아닙니다.</div>}
        {(row.availableFrom||row.availableUntil)&&<p className="muted">참조 자료의 참여 기간: {row.availableFrom||'시작 확인 필요'} ~ {row.availableUntil||'종료 확인 필요'}</p>}
        <label className="checkbox-label"><input type="checkbox" checked={!!state.completed?.[profile.id]?.[id]} onChange={()=>toggle('completed',id)}/>{profile.name}의 퀘스트 완료</label>
        {links('quests',related.prerequisites,'선행 퀘스트')}
        <QuestStepGuide quest={row} level={profile.level} expanded onOpen={(kind:CatalogKind,key:string)=>onSelect?.(kind,key)}/>
        <section className="catalog-detail-section"><h3>필요 재료와 처치 목표</h3>{(row.requirements||[]).map((r:any,i:number)=><div className="catalog-required-row" key={i}>{entityLink('items',{id:r.itemId,name:r.name})}<span>필요 {known(r.quantity)}개</span><Field label="보유 수량" type="number" min="0" value={inventory[r.itemId]||''} onChange={(e:any)=>update({inventory:{...state.inventory,[profile.id]:{...inventory,[r.itemId]:Math.max(0,Number(e.target.value)||0)}}})}/></div>)}{(row.killRequirements||[]).map((r:any,i:number)=><div className="stat-line" key={i}>{entityLink('monsters',{id:r.monsterId,name:r.name})}<strong>{known(r.quantity)}마리 처치</strong></div>)}{!row.requirementsComplete&&<p className="muted">필요 조건이 모두 확인된 상태는 아닙니다. 실제 퀘스트 창을 확인하세요.</p>}{row.requirementsComplete&&!row.requirements?.length&&!row.killRequirements?.length&&<p className="muted">클라이언트에 재료·처치 조건이 기록되어 있지 않습니다. 대화·기타 조건은 확인하세요.</p>}</section>
        {!!row.rewardItems?.length&&<section className="catalog-detail-section"><h3>일반 아이템 보상</h3>{row.rewardItems.map((r:any,i:number)=><div className="stat-line" key={i}>{entityLink('items',{id:r.itemId,name:r.name})}<strong>{known(r.quantity)}개</strong></div>)}</section>}
        {!!row.rewardChoices?.length&&<section className="catalog-detail-section"><h3>선택·랜덤·조건부 보상</h3><div className="notice">아래 보상을 전부 받는다는 뜻이 아닙니다. 보상 그룹과 직업·성별 조건을 확인하세요.</div>{row.rewardChoices.map((r:any,i:number)=><div className="stat-line" key={i}>{entityLink('items',{id:r.itemId,name:r.name})}<small>{known(r.quantity)}개 · {r.choiceGroup||'조건부'}{r.chancePercent!==null&&` · ${r.chancePercent}% 참조`}{r.job&&` · ${r.job}`}{r.gender&&` · ${r.gender}`}</small></div>)}</section>}
      </>}
      {kind==='recipes'&&<>
        <p>{row.profession} Lv. {known(row.level)} · 제작 {known(row.outputCount)}개</p><div className="detail-stats"><div><span>제작 비용</span><strong>{known(row.mesoCost)}</strong></div><div><span>숙련 EXP</span><strong>{known(row.craftExp)}</strong></div></div>
        <section className="catalog-detail-section"><h3>필요 재료</h3>{row.ingredients?.map((r:any,i:number)=><div className="stat-line" key={i}>{entityLink('items',{id:r.itemId,name:r.name})}<strong>{known(r.quantity)}개</strong></div>)}{!row.ingredientsComplete&&<p className="muted">재료 목록이 모두 확인되지 않았습니다.</p>}</section>{row.catalyst&&<p>선택 촉매: {row.catalyst} × {known(row.catalystCount)}</p>}<Button onClick={()=>{onClose();navigate('crafting');}}>현재 시세로 제작 비용 비교</Button>
      </>}
      <CatalogSourceFields row={row}/>
      <footer className="catalog-detail-source"><External href={row.sourceUrl}>참조 원문</External>{row.metadataSourceUrl&&<External href={row.metadataSourceUrl}>공개 클라이언트 메타데이터</External>}<small>{row.verifiedAt} 확인 · {row.dataVersion||'버전 확인 필요'} · Wiki 기여자 자료는 CC BY-NC-SA 4.0으로 편집했습니다.</small></footer>
    </>}
  </Modal>;
}
