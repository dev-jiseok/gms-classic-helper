'use client';
import { useEffect, useMemo, useState } from 'react';
import { useCompass } from './context';
import { Badge, Button, Card, Empty, External, Field, Icon, SectionTitle } from './components';
import { CatalogDetail, CatalogKind } from './catalog-explorer';
import { useGameBundle } from '@/lib/game-data-client';
import { catalogMatches, mapRoute } from '@/lib/public-catalog.mjs';
import { DEFAULT_GAME_LOOK, LOOK_POSES, LOOK_SLOT_LABELS, LOOK_SLOTS, decodeGameLook, encodeGameLook, equipmentSlot, equipGameLook, evaluateRecipe, gameCharacterUrl, normalizeGameLook } from '@/lib/world-tools.mjs';
import { format, mesos } from '@/lib/engine.mjs';
import { useMarketPrices } from './market-workspace';
import './world-tools.css';

const known=(value:any,suffix='')=>value===null||value===undefined?'확인 필요':format(value)+suffix;
type Selection={kind:CatalogKind;id:string};
function DataStatus({loading,error,reload}:any){return loading?<Empty title="게임 자료를 불러오고 있어요">공개 도감과 참조 관계를 준비합니다.</Empty>:error?<Empty title="자료를 불러오지 못했어요" action={<Button onClick={reload}>다시 시도</Button>}>{error}</Empty>:null;}

export function WorldRoutePlanner() {
  const {profile,updateProfile}=useCompass();
  const bundle=useGameBundle(['maps','portals']);
  const [from,setFrom]=useState(profile.routePlan?.from||'10000000'),[to,setTo]=useState(profile.routePlan?.to||'10001000'),[query,setQuery]=useState(''),[conditional,setConditional]=useState(false),[transport,setTransport]=useState(false),[selection,setSelection]=useState<Selection|null>(null);
  useEffect(()=>{setFrom(profile.routePlan?.from||'10000000');setTo(profile.routePlan?.to||'10001000');},[profile.id]);
  const maps:any[]=bundle.data?.maps||[];
  const result=useMemo(()=>bundle.data?mapRoute(bundle.data,from,to,{level:profile.level,allowConditional:conditional,allowTransport:transport}):null,[bundle.data,from,to,profile.level,conditional,transport]);
  const filtered=maps.filter(m=>catalogMatches(m,query));
  return <>
    <SectionTitle eyebrow="FIND YOUR NEXT PATH" title="월드 이동 경로" description="확인된 방향성 포털로 실제 맵 사이의 경로를 찾습니다. 숨은 조건과 수송 이동을 함께 확인하세요." action={<Badge tone="green">{format(bundle.data?.portals?.length||0)}개 포털</Badge>}/>
    <DataStatus {...bundle}/>
    {bundle.data&&<><div className="two-column world-route-layout"><Card title="어디로 갈까요?" description={`Lv. ${profile.level} · ${profile.name}`}>
      <Field label="맵 찾기" value={query} placeholder="맵 이름 · 영어 · 초성" onChange={(e:any)=>setQuery(e.target.value)}/>
      <Field label="출발 맵"><select value={from} onChange={e=>setFrom(e.target.value)}>{maps.filter(m=>m.id===from||filtered.some(f=>f.id===m.id)).map(m=><option key={m.id} value={m.id}>{m.name} · {m.id}</option>)}</select></Field>
      <div className="world-swap"><Button variant="ghost" onClick={()=>{setFrom(to);setTo(from);}}><Icon name="shuffle" size={15}/>출발·도착 바꾸기</Button></div>
      <Field label="도착 맵"><select value={to} onChange={e=>setTo(e.target.value)}>{maps.filter(m=>m.id===to||filtered.some(f=>f.id===m.id)).map(m=><option key={m.id} value={m.id}>{m.name} · {m.id}</option>)}</select></Field>
      <label className="checkbox-label"><input type="checkbox" checked={conditional} onChange={e=>setConditional(e.target.checked)}/>퀘스트·아이템·인스턴스 조건이 있는 경로 포함</label>
      <label className="checkbox-label"><input type="checkbox" checked={transport} onChange={e=>setTransport(e.target.checked)}/>배·택시 등 기록된 수송 포털 포함</label>
      <Button variant="secondary" onClick={()=>updateProfile({routePlan:{from,to}})}>내 이동 계획 저장</Button>
    </Card><Card title={result?.path?.length?`${result.edges.length}개 포털을 거쳐 도착`:'연결 경로 확인'} className="world-route-result">
      {result?.path?.length?<><p className="muted">포털 수가 가장 적은 경로입니다. 맵 안에서 걷는 시간·요금·운행 대기시간은 포함하지 않습니다.</p><ol className="world-route-steps">{result.path.map((m:any,i:number)=>{const edge=result.edges[i-1];return <li key={m.id}><span className="world-route-step-number">{i+1}</span><div>{edge&&<div className="world-route-edge">{edge.portalType||'포털'}{edge.direction&&` · ${edge.direction}`}{edge.portalName&&` · ${edge.portalName}`}{edge.requiresLevel&&` · Lv. ${edge.requiresLevel}`}{edge.requiresQuest&&<Badge tone="amber">선행: {edge.requiresQuest}</Badge>}{edge.requiresItem&&<Badge tone="amber">필요: {edge.requiresItem}</Badge>}</div>}<button className="text-button" onClick={()=>setSelection({kind:'maps',id:m.id})}>{m.name}<Icon name="map" size={14}/></button><small>{m.region} · #{m.id}</small></div></li>;})}</ol></>:<Empty icon="route" title="현재 조건의 경로가 없어요">{result?.reason}</Empty>}
    </Card></div><div className="notice">현재 레벨보다 높은 입장 레벨은 제외합니다. 조건부 경로를 포함하면 선행 퀘스트·필요 아이템·수송 요금은 직접 충족해야 합니다. 기록되지 않은 배·택시·귀환 주문서까지 최적 경로라고 단정하지 않습니다.</div></>}
    {selection&&<CatalogDetail {...selection} onSelect={(kind,id)=>setSelection({kind,id})} onClose={()=>setSelection(null)}/>}
  </>;
}

export function RecipePlanner() {
  const {state,profile,updateProfile,notify}=useCompass();
  const bundle=useGameBundle(['recipes','items','shops']);
  const prices=useMarketPrices();
  const [query,setQuery]=useState(''),[profession,setProfession]=useState(''),[selected,setSelected]=useState(profile.craftPlan?.recipeId||''),[batches,setBatches]=useState(1),[craftLevel,setCraftLevel]=useState(1),[manual,setManual]=useState<Record<string,string>>({}),[sale,setSale]=useState(''),[buy,setBuy]=useState(''),[resident,setResident]=useState(false),[grade,setGrade]=useState(0),[limited,setLimited]=useState(false),[success,setSuccess]=useState(100),[tax,setTax]=useState(0),[selection,setSelection]=useState<Selection|null>(null);
  useEffect(()=>{const plan=profile.craftPlan;setSelected(plan?.recipeId||'');setBatches(plan?.batches||1);setCraftLevel(plan?.craftLevel||1);setManual(plan?.manual||{});setSale(plan?.sale||'');setBuy(plan?.buy||'');},[profile.id]);
  const data=bundle.data,recipes:any[]=data?.recipes||[];
  const list=recipes.filter(r=>(!profession||r.profession===profession)&&catalogMatches(r,query));
  const recipe=recipes.find(r=>r.id===selected)||null;
  const inventory=state.inventory?.[profile.id]||{};
  const estimate:any=useMemo(()=>recipe?evaluateRecipe({recipe,batches,items:data.items,shops:data.shops,prices,inventory,manualPrices:Object.fromEntries(Object.entries(manual).filter(([,v])=>v!=='')),outputSalePrice:sale,outputBuyPrice:buy,resident,grade,includeLimited:limited,successPercent:success,taxPercent:tax,professionLevel:craftLevel,characterLevel:profile.level}):null,[recipe,batches,data,prices,inventory,manual,sale,buy,resident,grade,limited,success,tax,craftLevel,profile.level]);
  function choose(r:any){setSelected(r.id);setManual({});setSale('');setBuy('');}
  return <>
    <SectionTitle eyebrow="CRAFT WITH A PLAN" title="제작 레시피 · 비용 최적화" description="재료 구매처·보유 재료의 가치·완제품 가격을 함께 계산합니다. 가격이 없는 재료는 0으로 처리하지 않습니다." action={<Badge tone="green">{format(recipes.length)}개 레시피</Badge>}/>
    <DataStatus {...bundle}/>
    {data&&<><div className="world-recipe-layout"><Card title="레시피 선택"><div className="search-field"><Icon name="search"/><input aria-label="제작 레시피 검색" value={query} onChange={e=>setQuery(e.target.value)} placeholder="아이템 · 재료 · 영어"/></div><Field label="제작 직업"><select value={profession} onChange={e=>setProfession(e.target.value)}><option value="">전체 제작 직업</option>{[...new Set(recipes.map(r=>r.profession))].map(p=><option key={p}>{p}</option>)}</select></Field><div className="world-recipe-list">{list.map(r=><button key={r.id} className={recipe?.id===r.id?'selected':''} onClick={()=>choose(r)}><span><strong>{r.name}</strong><small>{r.profession} Lv. {r.level}</small></span><span>{known(r.craftExp)} EXP</span></button>)}</div>{!list.length&&<p className="muted">검색 결과가 없습니다.</p>}</Card>
      <div>{!recipe?<Card><Empty icon="hammer" title="만들 레시피를 선택하세요">현재 가격과 보유 재료로 실제 구매비와 경제적 비용을 나눠 비교할 수 있어요.</Empty></Card>:<>
        <Card title={recipe.name} description={`${recipe.profession} Lv. ${recipe.level} · 1회 성공 시 ${recipe.outputCount}개 · 숙련 ${recipe.craftExp} EXP`} action={<Button variant="ghost" onClick={()=>setSelection({kind:'recipes',id:recipe.id})}>도감 보기</Button>}>
          <div className="form-grid"><Field label="시도 횟수" type="number" min="1" max="10000" value={batches} onChange={(e:any)=>setBatches(Math.max(1,Math.min(10000,Number(e.target.value)||1)))}/><Field label="현재 제작 레벨" type="number" min="1" max="10" value={craftLevel} onChange={(e:any)=>setCraftLevel(Math.max(1,Math.min(10,Number(e.target.value)||1)))}/><Field label="성공률 가정 (%)" help="미확인 성공률을 자동으로 사실로 취급하지 않습니다." type="number" min="0" max="100" value={success} onChange={(e:any)=>setSuccess(Math.max(0,Math.min(100,Number(e.target.value)||0)))}/><Field label="판매 수수료 가정 (%)" type="number" min="0" max="100" value={tax} onChange={(e:any)=>setTax(Math.max(0,Math.min(100,Number(e.target.value)||0)))}/></div>
          {(!estimate.gates.profession||!estimate.gates.character)&&<div className="notice">현재 조건 확인: {!estimate.gates.profession&&`제작 Lv. ${recipe.level} 필요. `}{!estimate.gates.character&&`캐릭터 Lv. ${Math.max(10,recipe.level*5)} 필요. `}제작 레벨 제한에 숙련이 막힌 상태라면 추가 제작 전 확인하세요.</div>}
          <div className="world-material-table"><div className="world-material-head"><span>재료 · 수량</span><span>보유 / 구매</span><span>적용 단가 · 출처</span><span>단가 직접 지정</span></div>{estimate.rows.map((r:any)=><div className="world-material-row" key={r.itemId}><span><button className="text-button" onClick={()=>setSelection({kind:'items',id:r.itemId})}>{r.name}</button><small>필요 {format(r.quantity)}개</small></span><span>{format(r.owned)} / {format(r.needed)}<small>보유 가치 {known(r.opportunity.price)}</small></span><span>{known(r.purchase.price,' 메소')}<small>{r.purchase.source||'가격 확인 필요'}{r.purchase.basis==='quote'?' · 호가':''}</small></span><Field label={`${r.name} 단가`} aria-label={`${r.name} 단가`} type="number" min="0" value={manual[r.itemId]??''} placeholder="자동 비교" onChange={(e:any)=>setManual({...manual,[r.itemId]:e.target.value})}/></div>)}</div>
          <div className="world-npc-options"><label className="checkbox-label"><input type="checkbox" checked={resident} onChange={e=>setResident(e.target.checked)}/>주민 할인 자격을 직접 확인함</label><Field label="확인한 시민권 단계" type="number" min="0" max="10" value={grade} onChange={(e:any)=>setGrade(Math.max(0,Math.min(10,Number(e.target.value)||0)))}/><label className="checkbox-label"><input type="checkbox" checked={limited} onChange={e=>setLimited(e.target.checked)}/>재고를 확인한 구매 제한 품목 포함</label></div>
          <div className="form-grid"><Field label="완제품 구매가 직접 지정" type="number" min="0" value={buy} placeholder="동일 옵션의 실제 매물" onChange={(e:any)=>setBuy(e.target.value)}/><Field label="완제품 판매가 직접 지정" type="number" min="0" value={sale} placeholder="팔 수 있는 단가" onChange={(e:any)=>setSale(e.target.value)}/></div>
          <div className="button-row"><Button variant="secondary" onClick={()=>{updateProfile({craftPlan:{recipeId:recipe.id,batches,craftLevel,manual,sale,buy}});notify('제작 계획을 프로필에 저장했어요.');}}>제작 계획 저장</Button><External href={recipe.sourceUrl}>레시피 참조 원문</External></div>
        </Card>
        <Card title="재료를 사서 만들까, 완제품을 살까?" className="world-craft-result"><div className="world-result-cards"><div><small>이번 시도에 필요한 메소</small><strong>{known(estimate.cashRequired)}</strong><span>보유 재료 제외 · 수수료 포함</span></div><div><small>보유 재료 가치까지 포함한 비용</small><strong>{known(estimate.economicCost)}</strong><span>보유 재료도 팔 수 있는 가치 반영</span></div><div><small>예상 생산 1개당 비용</small><strong>{known(estimate.costPerExpectedUnit)}</strong><span>입력한 성공률 가정 기준</span></div></div>
          <div className="stat-line"><span>같은 수량의 완제품 구매 비용</span><strong>{known(estimate.buyInsteadCost,' 메소')}</strong></div><div className="stat-line"><span>직접 제작으로 절약하는 금액</span><strong>{known(estimate.buyVsBuildSavings,' 메소')}</strong></div><div className="stat-line"><span>가정한 판매 순수익</span><strong>{known(estimate.expectedProfit,' 메소')}</strong></div><div className="stat-line"><span>숙련 EXP 1당 비용</span><strong>{estimate.costPerXP===null?'확인 필요':estimate.costPerXP.toFixed(2)+' 메소'}</strong></div><div className="stat-line"><span>판매 가치 차감 후 숙련 EXP 1당 비용</span><strong>{estimate.netCostPerXP===null?'확인 필요':estimate.netCostPerXP.toFixed(2)+' 메소'}</strong></div>
          {!!estimate.missing.length&&<div className="notice">확인할 가격·조건: {estimate.missing.join(' · ')}</div>}<p className="muted">시장 단가는 최근 1시간의 가격을 사용합니다. 판매 호가는 실제 체결가가 아닙니다. NPC 가격은 참조값이며 할인 마을·단계·재고·이동 비용을 실제 게임에서 확인하세요. 촉매의 랜덤 옵션 가치와 실패 후 재료 변화는 반영하지 않은 가정 계산입니다.</p>
        </Card>
      </>}</div>
    </div></>}
    {selection&&<CatalogDetail {...selection} onSelect={(kind,id)=>setSelection({kind,id})} onClose={()=>setSelection(null)}/>}
  </>;
}

export function GameDressingRoom() {
  const {state,profile,update,notify}=useCompass();
  const bundle=useGameBundle(['items']);
  const [look,setLook]=useState<any>(()=>normalizeGameLook(state.characterLook?.[profile.id]||DEFAULT_GAME_LOOK)),[query,setQuery]=useState(''),[slot,setSlot]=useState('hat'),[page,setPage]=useState(0),[zoom,setZoom]=useState(3),[pending,setPending]=useState(true),[failed,setFailed]=useState(false),[renderUrl,setRenderUrl]=useState(''),[shared,setShared]=useState(false);
  useEffect(()=>{setLook(normalizeGameLook(state.characterLook?.[profile.id]||DEFAULT_GAME_LOOK));setShared(false);},[profile.id]);
  useEffect(()=>{const encoded=new URL(window.location.href).searchParams.get('look');if(encoded){try{setLook(decodeGameLook(encoded));setShared(true);}catch(e:any){notify(e.message);}}},[]);
  const nextUrl=useMemo(()=>gameCharacterUrl(look),[look]);
  useEffect(()=>{const timeout=setTimeout(()=>{setPending(true);setFailed(false);setRenderUrl(nextUrl);},300);return()=>clearTimeout(timeout);},[nextUrl]);
  const items:any[]=bundle.data?.items||[],byId=useMemo(()=>new Map(items.map(i=>[String(i.id),i])),[items]);
  const candidates=useMemo(()=>items.filter(i=>equipmentSlot(i)===slot&&catalogMatches(i,query)),[items,slot,query]);
  const visible=candidates.slice(page*48,(page+1)*48);
  async function share(){try{const url=new URL(window.location.href);url.searchParams.delete('build');url.searchParams.set('look',encodeGameLook(look));url.hash='dressing';await navigator.clipboard.writeText(url.href);notify('현재 코디 링크를 복사했어요.');}catch{notify('링크 복사 권한을 확인해 주세요.');}}
  function equip(item:any){try{setLook((current:any)=>equipGameLook(current,item));}catch(e:any){notify(e.message);}}
  return <>
    <SectionTitle eyebrow="MY ACTUAL MAPLE LOOK" title="게임 장비 코디룸" description="MCW의 실제 헤어·얼굴·장비를 조합해서 표시합니다. 코디 미리보기와 게임에서의 착용·판매 가능 여부는 별개입니다." action={<Badge tone="green">실제 게임 스프라이트</Badge>}/>
    <DataStatus {...bundle}/>
    {bundle.data&&<div className="world-dressing-layout"><div className="world-dressing-preview"><Card title={shared?'공유받은 코디 미리보기':profile.name+'의 코디'}>
      <div className="world-avatar-stage" style={{backgroundColor:profile.lookBackground||'#e8eddf'}}>
        <div className="world-avatar-floor"/>{pending&&<span className="world-render-status">게임 이미지를 그리는 중…</span>}
        {failed?<div className="world-render-error"><Icon name="shirt" size={32}/><strong>이 조합의 이미지를 불러오지 못했어요.</strong><p>지원하지 않는 장비·포즈가 있거나 이미지 서비스가 잠시 응답하지 않을 수 있어요.</p><Button variant="secondary" onClick={()=>setLook(normalizeGameLook(DEFAULT_GAME_LOOK))}>확인된 기본 코디로 돌아가기</Button></div>:renderUrl&&<img key={renderUrl} src={renderUrl} alt="선택한 실제 게임 장비를 착용한 캐릭터" className="world-game-avatar" style={{height:70*zoom,maxHeight:'78%',maxWidth:'88%',opacity:pending?0:1}} onLoad={()=>setPending(false)} onError={()=>{setPending(false);setFailed(true);}}/>}
      </div>
      <div className="world-look-controls"><Field label="동작"><select value={look.pose} onChange={e=>setLook({...look,pose:e.target.value,frame:0})}>{LOOK_POSES.map(p=><option key={p}>{p}</option>)}</select></Field><Field label="피부 ID"><select value={look.skinId} onChange={e=>setLook({...look,skinId:Number(e.target.value)})}><option value="2000">기본 (2000)</option><option value="2001">피부 · 2001</option>{![2000,2001].includes(look.skinId)&&<option value={look.skinId}>{look.skinId}</option>}</select></Field><Field label="확대"><select value={zoom} onChange={e=>setZoom(Number(e.target.value))}>{[2,3,4,5].map(z=><option value={z} key={z}>{z}배</option>)}</select></Field></div>
      <div className="button-row"><label className="checkbox-label"><input type="checkbox" checked={look.animated} onChange={e=>setLook({...look,animated:e.target.checked})}/>움직이는 미리보기</label><label className="checkbox-label"><input type="checkbox" checked={look.flip} onChange={e=>setLook({...look,flip:e.target.checked})}/>좌우 반전</label></div>
      {!look.animated&&<Field label={'동작 프레임 '+look.frame}><input type="range" min="0" max="3" value={Math.min(3,look.frame)} onChange={e=>setLook({...look,frame:Number(e.target.value)})}/></Field>}
      <div className="button-row"><Button onClick={()=>{update({characterLook:{...state.characterLook,[profile.id]:normalizeGameLook(look)}});notify('현재 프로필의 게임 코디를 저장했어요.');}}>코디 저장</Button><Button variant="secondary" onClick={share}>코디 링크 복사</Button></div>{!failed&&renderUrl&&<External href={renderUrl}>원본 게임 이미지 열기</External>}
      <div className="world-equipped-slots">{LOOK_SLOTS.filter(s=>look.slots[s]).map(s=><div key={s}><span>{(LOOK_SLOT_LABELS as any)[s]}</span><button className="text-button" onClick={()=>{setSlot(s);setQuery('');setPage(0);}}>{byId.get(look.slots[s])?.name||look.slots[s]}</button><button className="icon-button" aria-label={`${(LOOK_SLOT_LABELS as any)[s]} 벗기`} onClick={()=>{const next={...look.slots};delete next[s];setLook({...look,slots:next});}}>×</button></div>)}</div>
      <p className="muted">게임 이미지의 권리는 NEXON에 있으며 maplestory.io의 공개 MCW 렌더링 서비스를 사용합니다. 클라이언트 항목의 출시 여부·직업·성별·양손 무기 조건은 게임에서 확인하세요.</p>
    </Card></div><Card title="실제 게임 장비 고르기"><div className="world-slot-tabs">{LOOK_SLOTS.map(s=><button key={s} className={slot===s?'active':''} onClick={()=>{setSlot(s);setPage(0);}}>{(LOOK_SLOT_LABELS as any)[s]}</button>)}</div><div className="search-field"><Icon name="search"/><input aria-label="코디 장비 검색" placeholder="장비 · 헤어 · 얼굴 이름 또는 ID" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></div><div className="results-label">{format(candidates.length)}개 <span>현재 선택한 부위 안에서 검색</span></div><div className="world-dressing-items">{visible.map(i=><button className={look.slots[slot]===String(i.id)?'selected':''} key={i.id} onClick={()=>equip(i)}><img src={`https://maplestory.io/api/MCW/1/item/${i.id}/icon`} loading="lazy" alt="" onError={e=>{e.currentTarget.style.visibility='hidden';}}/><strong>{i.name}</strong><small>#{i.id}{i.isCash?' · 캐시':''}</small></button>)}</div>{!visible.length&&<Empty icon="shirt" title="이 부위에서 검색 결과가 없어요">다른 이름이나 아이템 ID로 검색해 보세요.</Empty>}{candidates.length>48&&<div className="catalog-pagination"><Button variant="secondary" disabled={page===0} onClick={()=>setPage(p=>p-1)}>이전</Button><span>{page+1} / {Math.ceil(candidates.length/48)}</span><Button variant="secondary" disabled={(page+1)*48>=candidates.length} onClick={()=>setPage(p=>p+1)}>다음</Button></div>}</Card></div>}
  </>;
}
