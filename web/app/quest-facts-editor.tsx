'use client';
import { Button, Field } from './components';

/** These confirmations describe the displayed lists; missing numbers remain unknown. */
export default function QuestFactsEditor({quest,override={},onChange}:any){
 const numeric=(value:any)=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))&&Number(value)>=0;
 const consumed=quest.consumedItems??[];
 const validCosts=numeric(override.mesoCost??quest.mesoCost)&&consumed.every((row:any)=>numeric(row.quantity)&&Number.isSafeInteger(Number(row.quantity)));
 const prefix=quest.name+' ';
 const editNumber=(key:string,value:string)=>{if(value!==''&&(!numeric(value)||!Number.isSafeInteger(Number(value))))return;onChange({[key]:value===''?null:Number(value),[key==='mesos'?'rewardsComplete':'costsConfirmed']:false});};
 return <details><summary>게임에서 확인한 보상·소모 비용 반영</summary>
  <p className="muted">이 프로필의 개별 추천과 묶음 계획에 함께 반영됩니다. 빈 금액은 미확인이고, 비용이나 보상이 없음을 확인했다면 0을 입력하세요.</p>
  <Button variant="secondary" onClick={()=>onChange({conditionsVerifiedAt:new Date().toISOString()})}>이 의뢰의 현재 선정·추가 조건을 게임에서 확인했어요</Button>
  <small>조건 확인은 1시간 동안 유효합니다. 기록된 미충족 레벨·직업·시민권 등급은 해당 기록을 수정해야 합니다.</small>
  <div className="form-grid"><Field label={prefix+'확인한 확정 메소 보상 (없으면 0)'} type="number" min="0" step="1" value={override.mesos??''} onChange={(event:any)=>editNumber('mesos',event.target.value)}/><Field label={prefix+'진행 메소 비용 · 시작·완료 합계 (없으면 0)'} type="number" min="0" step="1" value={override.mesoCost??''} onChange={(event:any)=>editNumber('mesoCost',event.target.value)}/></div>
  <p><strong>실제 소모로 등록된 재료</strong>{consumed.length?'':' · 없음으로 등록됨'}</p>
  {consumed.length>0&&<ul>{consumed.map((row:any,index:number)=><li key={row.itemId+':'+index}>{row.name??row.itemId} {row.quantity??'?'}개 · {row.stage==='start'?'수락 때':'완료 때'} 소모</li>)}</ul>}
  <small>보유 검사 목록과 별도입니다. 목록에 빠진 소모품이나 잘못된 수량이 있다면 전체 확인을 선택하지 마세요. 진행 비용에는 재료 가격·NPC 이동 비용을 다시 넣지 않습니다.</small>
  <div className="checkbox-stack">
   <label className="checkbox-label"><input type="checkbox" checked={override.requirementsComplete===true} onChange={event=>onChange({requirementsComplete:event.target.checked})}/>등록된 재료·선행·조건이 전체인지 게임에서 확인했어요</label>
   <label className="checkbox-label"><input type="checkbox" checked={override.rewardsComplete===true} onChange={event=>onChange({rewardsComplete:event.target.checked})}/>등록된 확정 보상 전체를 게임에서 확인했어요</label>
   <label className="checkbox-label"><input type="checkbox" disabled={!validCosts} checked={override.costsConfirmed===true} onChange={event=>onChange({costsConfirmed:event.target.checked,costsVerifiedAt:event.target.checked?new Date().toISOString():null})}/>위 실제 소모 재료 목록·수량과 입력한 시작·완료 메소 비용이 전부임을 게임에서 확인했어요</label>
  </div>
  {!validCosts&&<small>진행 메소 비용과 등록된 소모 수량을 먼저 확인해야 전체 비용을 확정할 수 있습니다.</small>}
  <small>랜덤·선택·조건부 보상과 가격이 미확인인 재료는 이 확인만으로 확정 수익이 되지 않습니다. 개별 추천은 새로 계산하면 반영됩니다.</small>
 </details>;
}
