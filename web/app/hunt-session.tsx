'use client';
import { useEffect, useState } from 'react';
import { useCompass } from './context';
import { Badge, Button, Card, Empty, Field, Modal } from './components';
import ScreenReader from './screen-reader';
import { confirmHuntSetup, createHuntDraft, experienceGain, huntCombatSnapshot, isHuntActivity, itemizeHuntRecord, ocrNumberCandidates, recordedLootValue, validateHuntFinish, validateHuntStart, validateLootItems } from '@/lib/hunt-session.mjs';
import { format, mesos } from '@/lib/engine.mjs';
import { useGameBundle } from '@/lib/game-data-client';
import { useMarketPrices } from './market-workspace';
import { huntComparability, priceEvidence, valueHuntRecord } from '@/lib/recommendations.mjs';
import { GameVisual } from './game-visual';
import styles from './hunt-session.module.css';
const huntMoney=(value:any)=>value==null?'확인 필요':mesos(value);
const cashNumber = (value:any) => value === '' || value == null ? null : Number(value);
const huntDate = (value:any) => value ? new Date(value).toLocaleString('ko-KR') : '확인 시각 없음';
const priceBasis = (value:string) => ({npc:'NPC 판매가',quote:'미체결 호가','observed-sale':'판매 관찰 참고가',manual:'직접 입력한 가치'}[value] ?? '미확인');
export function HuntSessionRecorder() {
  const { profile } = useCompass();
  return <ProfileHuntRecorder key={profile.id}/>;
}
function HuntMapVisual({map,monsters=[]}:any){
 if(!map?.id)return null;
 const residents=(map.mobIds??[]).map((key:any)=>monsters.find((monster:any)=>String(monster.id)===String(key))).filter(Boolean).slice(0,5);
 return <div className={styles.mapVisual}><GameVisual kind="map" id={map.id} name={map.name} size="scene"/><div><small>{map.region??'측정 맵'} · #{map.id}</small><strong>{map.name}</strong>{residents.length>0&&<div className={styles.residents}>{residents.map((monster:any)=><span key={monster.id}><GameVisual kind="monster" id={monster.id} name={monster.name} framebooks={monster.rawDetail?.framebooks??monster.framebooks} size="sm"/><span>{monster.name}<small>Lv. {monster.level??'?'}</small></span></span>)}</div>}</div></div>;
}
function HuntMapPicker({draft,change,maps,monsters}:any){
 const [query,setQuery]=useState('');
 const matches=maps.filter((map:any)=>!query||String(map.name+' '+map.en+' '+map.id).toLowerCase().includes(query.toLowerCase())).slice(0,40);
 return <><Field label="측정할 사냥터" required maxLength={160} value={draft.map} onChange={(event:any)=>change({map:event.target.value,mapId:''})}/><details><summary>전체 도감에서 사냥터 선택{draft.mapId?' · 맵 '+draft.mapId:''}</summary><Field label="사냥터 이름·ID 검색" value={query} onChange={(event:any)=>setQuery(event.target.value)}/><Field label="도감 사냥터 선택"><select value={draft.mapId||''} onChange={event=>{const map=maps.find((row:any)=>String(row.id)===event.target.value);if(map)change({map:map.name,mapId:String(map.id)});}}><option value="">직접 입력 또는 맵 선택</option>{matches.map((map:any)=><option key={map.id} value={map.id}>{map.name} · {map.id}</option>)}</select></Field></details>{draft.mapId&&<HuntMapVisual map={maps.find((map:any)=>String(map.id)===String(draft.mapId))} monsters={monsters}/>}</>;
}
function HuntItemPicker({rows,change,items,prices,now}:any){
 const [query,setQuery]=useState('');
 const matches=items.filter((item:any)=>!query||String(item.name+' '+item.en+' '+item.id).toLowerCase().includes(query.toLowerCase())).slice(0,40);
 function add(itemId:string){
  const item=items.find((value:any)=>String(value.id)===itemId);if(!item||rows.length>=50)return;
  const existing=rows.findIndex((row:any)=>String(row.itemId)===itemId);
  if(existing>=0){change(rows.map((row:any,index:number)=>index===existing?{...row,quantity:Number(row.quantity||0)+1}:row));return;}
  const price=priceEvidence(prices,itemId,{now,npcSell:item.npcSell,equipment:item.category==='equip'});
  change([...rows,{itemId,name:item.name,isEquipment:item.category==='equip',quantity:1,recordedUnitPrice:price.price,recordedPriceBasis:price.basis,recordedPriceAt:price.at,recordedPriceSource:price.source}]);
 }
 const current=valueHuntRecord({lootMode:'itemized',lootItems:rows,mesoDelta:0,potions:0,travel:0},items,prices,now);
 return <><div className="form-grid"><Field label="전리품 아이템 검색" value={query} onChange={(event:any)=>setQuery(event.target.value)} placeholder="한글·영어·아이템 ID"/><Field label="도감 전리품 추가"><select value="" disabled={rows.length>=50} onChange={event=>add(event.target.value)}><option value="">획득한 아이템 선택 · 최대 50종</option>{matches.map((item:any)=><option key={item.id} value={item.id}>{item.name} · {item.id}</option>)}</select></Field></div>{query.trim()&&<div className={styles.itemResults}>{matches.slice(0,12).map((item:any)=><button key={item.id} type="button" aria-label={item.name+' 전리품 추가'} disabled={rows.length>=50} onClick={()=>add(String(item.id))}><GameVisual kind="item" id={item.id} name={item.name} size="sm"/><span>{item.name}<small>#{item.id}</small></span><b>＋</b></button>)}</div>}{rows.length>0&&<div className={`table-wrap ${styles.lootTable}`}><table><thead><tr><th>전리품</th><th>획득 수량</th><th>기록 당시 단가</th><th>현재 참고 단가</th><th/></tr></thead><tbody>{rows.map((row:any,index:number)=>{const latest=current.rows[index];return <tr key={row.itemId}><td><div className={styles.itemIdentity}><GameVisual kind="item" id={row.itemId} name={row.name||row.itemId} size="sm"/><span><strong>{row.name||row.itemId}</strong><small>{row.itemId}</small></span></div></td><td><input aria-label={row.name+' 획득 수량'} type="number" min="1" step="1" value={row.quantity} onChange={event=>change(rows.map((value:any,position:number)=>position===index?{...value,quantity:event.target.value}:value))} style={{width:90}}/></td><td><input aria-label={row.name+' 기록 당시 단가'} type="number" min="0" step="any" value={row.recordedUnitPrice??''} placeholder="미확인" onChange={event=>change(rows.map((value:any,position:number)=>position===index?{...value,recordedUnitPrice:event.target.value===''?null:event.target.value,recordedPriceBasis:'manual',recordedPriceSource:'직접 입력',recordedPriceAt:new Date().toISOString()}:value))} style={{width:120}}/><small>{priceBasis(row.recordedPriceBasis)} · {huntDate(row.recordedPriceAt)}</small></td><td>{latest?.currentUnitPrice==null?'확인 필요':huntMoney(latest.currentUnitPrice)}<small>{priceBasis(latest?.priceBasis)} · {huntDate(latest?.priceAt)}</small></td><td><Button variant="ghost" onClick={()=>change(rows.filter((_:any,position:number)=>position!==index))}>삭제</Button></td></tr>;})}</tbody></table></div>}<p className="muted">실제 획득 수량과 기록 당시 단가는 시세가 바뀌어도 유지합니다. 단가는 미확인일 때 빈칸으로 남기며, 장비 옵션이 없는 시세는 장비 가치로 쓰지 않습니다.</p><div className="stat-line"><span>전리품 기록 가치 / 현재 추정 가치</span><strong>{huntMoney(recordedLootValue(rows))} / {huntMoney(current.currentLootValue)}</strong></div></>;
}
function HuntLootFields({draft,change,items,prices,now}:any){
 const valuation=valueHuntRecord({lootMode:draft.lootMode,lootItems:draft.lootItems,loot:cashNumber(draft.loot),mesoDelta:cashNumber(draft.gross),potions:cashNumber(draft.potions),travel:cashNumber(draft.travel)},items,prices,now);
 return <><div className="tabs"><button className={draft.lootMode==='itemized'?'active':''} onClick={()=>change({lootMode:'itemized'})}>아이템·수량으로 기록</button><button className={draft.lootMode==='aggregate'?'active':''} onClick={()=>change({lootMode:'aggregate'})}>전리품 가치 합계 직접 입력</button></div>{draft.lootMode==='itemized'?<><HuntItemPicker rows={draft.lootItems??[]} change={(lootItems:any)=>change({lootItems,noLootConfirmed:false})} items={items} prices={prices} now={now}/>{!draft.lootItems?.length&&<label className="checkbox-label"><input type="checkbox" checked={draft.noLootConfirmed} onChange={event=>change({noLootConfirmed:event.target.checked})}/>이번 사냥에는 전리품이 없었어요</label>}</>:<Field label="전리품 순판매 가치" type="number" min={0} value={draft.loot} placeholder="미확인 · 합계는 현재 시세로 재평가할 수 없음" onChange={(event:any)=>change({loot:event.target.value})}/>}<div className="stat-line"><span>기록 가치 포함 순가치 / 현재 시세 추정 순가치</span><strong>{huntMoney(valuation.recordedNet)} / {huntMoney(valuation.currentNet)}</strong></div><p className="muted">전리품을 아직 팔지 않았다면 실제 지갑 증가액과 다릅니다. 판매 관찰가·호가는 실제 거래 완료를 보장하지 않아요.</p></>;
}
function HuntLootHistory({items,prices,now,maps}:any){
 const {state,profile,update,notify}=useCompass(),records=state.hunts.filter((record:any)=>record.profileId===profile.id);
 const [limit,setLimit]=useState(10),[editing,setEditing]=useState<any>(null),[verifySetup,setVerifySetup]=useState(false),[error,setError]=useState('');
 function save(){
  if(verifySetup){const checked=confirmHuntSetup(editing,profile);if(checked.errors.length){setError(checked.errors[0]);return;}}
  for(const key of ['gross','potions','travel'])if(editing[key]!==''&&editing[key]!=null&&(!Number.isSafeInteger(Number(editing[key]))||Number(editing[key])<0)){setError('메소와 비용은 0 이상의 정수 또는 미확인 빈칸이어야 해요.');return;}
  const result=itemizeHuntRecord({...editing,mesoDelta:cashNumber(editing.gross),potions:cashNumber(editing.potions),travel:cashNumber(editing.travel),...(verifySetup?{combatSnapshot:huntCombatSnapshot(profile)}:{})},editing.lootItems);
  if(result.errors.length){setError(result.errors[0]);return;}
  if(!editing.lootItems.length&&!editing.noLootConfirmed){setError('아이템을 추가하거나 전리품이 없었음을 확인해 주세요.');return;}
  const {gross,noLootConfirmed,...record}=result.record!;
  update((previous:any)=>({hunts:previous.hunts.map((row:any)=>row.id===record.id&&row.profileId===profile.id?record:row)}));setEditing(null);notify('전리품 합계를 아이템·수량으로 교체했어요. 메소와 아이템 가치는 중복 합산하지 않습니다.');
 }
 return <Card title="아이템별 사냥 기록 · 현재 가치" description="획득량은 유지하고 현재 시세만 다시 확인합니다. 기존 합계 기록도 아이템·수량으로 보완할 수 있어요.">{records.length?<><div className={`table-wrap ${styles.historyTable}`}><table><thead><tr><th>사냥터 · 측정 조건</th><th>기록 당시 순가치</th><th>현재 추정 순가치</th><th>전리품</th><th/></tr></thead><tbody>{records.slice(0,limit).map((record:any)=>{const value=valueHuntRecord(record,items,prices,now),comparison=huntComparability(record,profile);return <tr key={record.id}><td><div className={styles.recordMap}>{record.mapId&&<GameVisual kind="map" id={record.mapId} name={record.map} size="md"/>}<span><strong>{record.map}</strong><small>{(maps.find((map:any)=>String(map.id)===String(record.mapId)))?.region}</small></span></div><small>{huntDate(record.at)} · {comparison.status==='comparable'?'현재 프로필과 비교 가능':comparison.status==='unknown'?'측정 조건 확인 필요':'현재 조건과 다름'}</small><small>{record.setupLabel}</small></td><td>{huntMoney(value.recordedNet)}</td><td>{huntMoney(value.currentNet)}<small>{value.repriced?'현재 가격으로 수량 재평가':'현재 가치 확인 필요'}</small></td><td>{value.itemized?<div className={styles.lootStrip}>{(record.lootItems??[]).slice(0,8).map((row:any)=><span key={row.itemId} title={(row.name||row.itemId)+' × '+row.quantity}><GameVisual kind="item" id={row.itemId} name={row.name||row.itemId} size="sm"/><span>{row.name||row.itemId}<b>× {row.quantity}</b></span></span>)}{record.lootItems?.length>8&&<small>외 {record.lootItems.length-8}종</small>}{!record.lootItems?.length&&'전리품 없음 확인'}</div>:'가치 합계만 기록'}{value.missing.length>0&&<details><summary>확인할 정보 {value.missing.length}개</summary><ul>{value.missing.map((message:string,index:number)=><li key={index}>{message}</li>)}</ul></details>}</td><td><Button variant="secondary" onClick={()=>{setEditing({...record,gross:record.mesoDelta??'',potions:record.potions??'',travel:record.travel??'',lootItems:record.lootItems??[],noLootConfirmed:record.lootMode==='itemized'&&!record.lootItems?.length});setVerifySetup(false);setError('');}}>아이템·조건 보완</Button></td></tr>;})}</tbody></table></div>{records.length>limit&&<Button variant="ghost" onClick={()=>setLimit(value=>value+10)}>기록 더 보기</Button>}</>:<Empty icon="activity" title="사냥에서 얻은 아이템을 함께 기록해 보세요">경험치만 확인됐다면 비용은 빈칸으로 저장할 수 있어요. 미확인 수익은 확정하지 않습니다.</Empty>}{editing&&<Modal title="사냥 기록의 아이템·조건 보완" onClose={()=>setEditing(null)} wide><p className="notice">{editing.map} · {huntDate(editing.at)}. 기존 전리품 합계 {huntMoney(editing.loot)}를 아래 아이템 가치로 교체합니다. 합계와 아이템 가치를 더하지 않습니다.</p><div className="form-grid">{[['gross','획득 메소 · 지출 전'],['potions','물약·탄환·충전 비용'],['travel','이동·기타 비용']].map(([key,label])=><Field key={key} label={label} type="number" min={0} value={editing[key]??''} placeholder="미확인" onChange={(event:any)=>setEditing({...editing,[key]:event.target.value})}/>)}</div><HuntItemPicker rows={editing.lootItems} change={(lootItems:any)=>setEditing({...editing,lootItems,noLootConfirmed:false})} items={items} prices={prices} now={now}/>{!editing.lootItems.length&&<label className="checkbox-label"><input type="checkbox" checked={editing.noLootConfirmed} onChange={event=>setEditing({...editing,noLootConfirmed:event.target.checked})}/>이 기록에는 전리품이 없었어요</label>}<Field label="기록의 측정 조건 메모" maxLength={160} value={editing.setupLabel??''} onChange={(event:any)=>setEditing({...editing,setupLabel:event.target.value})}/><label className="checkbox-label"><input type="checkbox" checked={verifySetup} onChange={event=>setVerifySetup(event.target.checked)}/>이 기록은 현재 프로필의 직업·레벨·전투 스탯과 같은 조건에서 측정했어요</label><p className="muted">체크하면 현재 입력된 프로필 조건을 기록에 붙입니다. 실제로 장비·레벨·파티가 달랐다면 체크하지 마세요.</p>{error&&<p role="alert" className="error-text">{error}</p>}<Button onClick={save}>보완 내용 저장</Button></Modal>}</Card>;
}
function ProfileHuntRecorder() {
  const { state, profile, update, notify, ready } = useCompass();
  const {data:world,error:dataError}=useGameBundle('items,maps,monsters');
  const prices=useMarketPrices(),items=world?.items??[],maps=world?.maps??[],monsters=world?.monsters??[];
  const running = state.huntSessions?.[profile.id] ?? null;
  const draft = { ...createHuntDraft(profile, running), ...state.huntDrafts?.[profile.id] };
  const [showOcr, setShowOcr] = useState(false), [candidates, setCandidates] = useState<number[]>([]), [now, setNow] = useState(Date.now()), [error, setError] = useState('');
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const setDraft = (change: any) => update((previous: any) => ({ huntDrafts: { ...previous.huntDrafts, [profile.id]: { ...createHuntDraft(profile, running), ...previous.huntDrafts?.[profile.id], ...change } } }));
  const startedMs = running ? Date.parse(running.startedAt) : NaN;
  const seconds = Number.isFinite(startedMs) ? Math.max(0, Math.floor((now - startedMs) / 1000)) : 0;
  const checked = running ? validateHuntFinish({ session: running, endLevel: draft.endLevel, endExp: draft.endExp, manualExp: draft.manual, gross: draft.gross, potions: draft.potions, travel: draft.travel, loot: draft.loot, lootMode:draft.lootMode,lootItems:draft.lootItems,noLootConfirmed:draft.noLootConfirmed,allowUnknownCash:true, now }) : null;
  const gained = running ? (draft.manual !== '' ? Number.isSafeInteger(Number(draft.manual)) && Number(draft.manual) >= 0 ? Number(draft.manual) : null : experienceGain(running.level, running.exp, draft.endLevel, draft.endExp)) : null;
  function start() {
    const activity = state.recommendations?.[profile.id]?.activity;
    const errors = validateHuntStart({ level: profile.level, exp: draft.startExp, map: draft.map, running, activity });
    if (errors.length) { setError(errors[0]); return; }
    const startedAt = new Date().toISOString(), map = draft.map.trim();
    const lock = activity && Date.parse(activity.endsAt) > Date.now() ? activity : { id: crypto.randomUUID(), name: map, mode: 'training', startedAt, endsAt: new Date(Date.now() + 3600000).toISOString() };
    const session = { profileId: profile.id, map, mapId:draft.mapId||null,setupLabel:draft.setupLabel.trim(),combatSnapshot:huntCombatSnapshot(profile),level: profile.level, job: profile.job, exp: Number(draft.startExp), startedAt, activityId: lock.id };
    update((previous: any) => {
      if (previous.huntSessions?.[profile.id]) return {};
      return { huntSessions: { ...previous.huntSessions, [profile.id]: session }, recommendations: { ...previous.recommendations, [profile.id]: { ...previous.recommendations?.[profile.id], activity: lock } }, huntDrafts: { ...previous.huntDrafts, [profile.id]: { ...draft, map, endLevel: profile.level, endExp: Number(draft.startExp), manual: '', gross: '', potions: '', travel: '', loot: '',lootItems:[],noLootConfirmed:false } } };
    });
    setError(''); setCandidates([]); notify('사냥 측정을 시작했어요. 활동이 끝날 때까지 추천 순서를 유지합니다.');
  }
  function finish() {
    const result = validateHuntFinish({ session: running, endLevel: draft.endLevel, endExp: draft.endExp, manualExp: draft.manual, gross: draft.gross, potions: draft.potions, travel: draft.travel, loot: draft.loot,lootMode:draft.lootMode,lootItems:draft.lootItems,noLootConfirmed:draft.noLootConfirmed,allowUnknownCash:true });
    if (result.errors.length) { setError(result.errors[0]); return; }
    let record:any = { id: crypto.randomUUID(), profileId: profile.id, map: running.map,mapId:running.mapId,setupLabel:running.setupLabel,combatSnapshot:running.combatSnapshot,level: running.level, job: running.job, minutes: result.elapsedMs! / 60000, exp: result.gain, mesoDelta: cashNumber(draft.gross), potions: cashNumber(draft.potions), travel: cashNumber(draft.travel), loot: cashNumber(draft.loot), at: new Date().toISOString(), note: `실시간 측정 · ${running.level}→${draft.endLevel}레벨` };
    if(draft.lootMode==='itemized')record=itemizeHuntRecord(record,draft.lootItems).record;else record.lootMode='aggregate';
    update((previous: any) => {
      // A second click must not append a second record after the first save.
      if (previous.huntSessions?.[profile.id]?.startedAt !== running.startedAt) return {};
      const activity = previous.recommendations?.[profile.id]?.activity;
      const nextProfile = { ...profile, level: Number(draft.endLevel), exp: result.endingExp };
      return { profiles: previous.profiles.map((item: any) => item.id === profile.id ? { ...item, level: nextProfile.level, exp: nextProfile.exp } : item), hunts: [record, ...previous.hunts], huntSessions: { ...previous.huntSessions, [profile.id]: null }, recommendations: { ...previous.recommendations, [profile.id]: { ...previous.recommendations?.[profile.id], activity: isHuntActivity(activity, running) ? null : activity } }, huntDrafts: { ...previous.huntDrafts, [profile.id]: { ...createHuntDraft(nextProfile), map: running.map,mapId:running.mapId??'',setupLabel:running.setupLabel??'' } } };
    });
    setError(''); setCandidates([]); notify('측정 기록을 저장했어요. 다음 추천 계산에 반영됩니다.');
  }
  function cancel() {
    update((previous: any) => {
      const activity = previous.recommendations?.[profile.id]?.activity;
      return { huntSessions: { ...previous.huntSessions, [profile.id]: null }, recommendations: { ...previous.recommendations, [profile.id]: { ...previous.recommendations?.[profile.id], activity: isHuntActivity(activity, running) ? null : activity } }, huntDrafts: { ...previous.huntDrafts, [profile.id]: { ...createHuntDraft(profile), map: running?.map ?? draft.map } } };
    });
    setError(''); setCandidates([]); notify('측정을 취소했어요.');
  }
  return <><Card title="게임과 함께 사냥 측정" description="경험치·아이템 수량·획득 메소와 비용을 함께 기록합니다. 전리품은 현재 시세로 다시 평가해요." action={<Button variant="secondary" onClick={() => setShowOcr(true)}>화면에서 경험치 읽기</Button>}>
    {dataError&&<p className="notice">도감 연결 확인 필요: {dataError}</p>}{running ? <><HuntMapVisual map={maps.find((map:any)=>String(map.id)===String(running.mapId))} monsters={monsters}/><Badge tone="green">{running.map} · {Math.floor(seconds / 60)}분 {seconds % 60}초 측정 중</Badge><p className="muted">시작 Lv. {running.level} · EXP {format(running.exp)} · 다른 화면으로 이동해도 시간과 입력을 유지합니다.</p><div className="form-grid"><Field label="종료 레벨" type="number" min={running.level} max={200} value={draft.endLevel} onChange={(event: any) => setDraft({ endLevel: event.target.value })}/><Field label="종료 레벨 안의 현재 경험치" type="number" min={0} value={draft.endExp} onChange={(event: any) => setDraft({ endExp: event.target.value })}/><Field label="획득 EXP 직접 확인 · 선택" type="number" min={0} value={draft.manual} onChange={(event: any) => setDraft({ manual: event.target.value })}/>{[['gross', '획득 메소 · 지출 전'], ['potions', '물약·탄환·충전 비용'], ['travel', '이동·기타 비용']].map(([key, label]) => <Field key={key} label={label} type="number" min={0} value={draft[key]} placeholder="미확인 · 빈칸 유지" onChange={(event: any) => setDraft({ [key]: event.target.value })}/>)}</div><HuntLootFields draft={draft} change={setDraft} items={items} prices={prices} now={now}/><div className="stat-line"><span>측정 중 획득 EXP</span><strong>{gained === null ? '경험치 표 또는 직접 입력 필요' : format(gained)}</strong></div><p className="muted">획득 메소는 아이템 판매액을 제외한 지출 전 액수예요. 전리품과 비용은 각각 한 번만 반영합니다. 빈 비용은 미확인으로 보관하고, 비용이 없으면 0을 입력하세요. 레벨과 경험치로 저장하면 프로필의 현재 레벨·경험치도 함께 갱신해요.</p><div className="button-row"><Button disabled={!ready} onClick={finish}>측정 마치고 저장</Button><Button variant="ghost" onClick={cancel}>측정 취소</Button></div></> : <><div className="form-grid"><HuntMapPicker draft={draft} change={setDraft} maps={maps} monsters={monsters}/><Field label="측정 조건 메모" maxLength={160} value={draft.setupLabel} onChange={(event:any)=>setDraft({setupLabel:event.target.value})} placeholder="예: 한손검 · 솔로 · 경험치 버프 없음"/><Field label="시작 레벨 안의 현재 경험치" type="number" min={0} value={draft.startExp} onChange={(event: any) => setDraft({ startExp: event.target.value })}/></div><p className="muted">시작할 때 현재 프로필의 직업·레벨·전투 스탯을 함께 보관합니다. 장비·버프·파티가 바뀌면 프로필과 조건 메모를 맞춰 주세요.</p><Button disabled={!ready} onClick={start}>사냥 측정 시작</Button></>}
    {candidates.length > 0 && <div><p className="muted">OCR 숫자 후보예요. 게임 경험치와 대조한 뒤 선택한 값만 적용해 주세요.</p><div className="button-row">{candidates.map(value => <Button key={value} variant="secondary" onClick={() => { setDraft(running ? { endExp: value } : { startExp: value }); setError(''); }}>{format(value)} 적용</Button>)}</div></div>}
    {error && <p className="error-text" role="alert">{error}</p>}
    {!error && running && checked && checked.errors.length > 0 && seconds > 1 && <p className="muted">{checked.errors[0]}</p>}
  </Card><HuntLootHistory items={items} prices={prices} now={now} maps={maps}/>{showOcr && <Modal title="경험치 화면 읽기" onClose={() => setShowOcr(false)} wide><ScreenReader onText={text => setCandidates(ocrNumberCandidates(text))}/><Button onClick={() => setShowOcr(false)}>숫자 확인하러 돌아가기</Button></Modal>}</>;
}
