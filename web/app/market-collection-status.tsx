'use client';
import { useEffect, useState } from 'react';
import { Badge, Button, Card } from './components';
import { format } from '@/lib/engine.mjs';

export function MarketCollectionStatus() {
  const [data,setData]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function load(signal?:AbortSignal) {
    setBusy(true);setError('');
    try {
      const response=await fetch('/api/market/collect',{signal}),body:any=await response.json();
      if(!response.ok)throw new Error(body.error||'수집 상태를 불러오지 못했습니다.');
      setData(body);
    } catch(e:any) {if(e.name!=='AbortError')setError(e.message);}
    finally {if(!signal?.aborted)setBusy(false);}
  }
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort();},[]);
  const date=(value:any)=>value?new Date(value).toLocaleString('ko-KR'):'아직 보관한 관찰 없음';
  return <Card title="서버에 보관된 공개 시세" action={<Button variant="secondary" disabled={busy} onClick={()=>void load()}>상태 확인</Button>}>
    {error&&<p className="notice" role="status">{error}</p>}
    {data?<><Badge tone={data.storageStatus==='connected'?'green':'amber'}>{data.storageStatus==='connected'?'이력 저장소 연결됨':'저장소 확인 필요'}</Badge>
      <div className="stat-line"><span>마지막 시세 조회</span><strong>{date(data.fetchedAt)}</strong></div>
      <div className="stat-line"><span>공급원의 최신 실제 관찰</span><strong>{date(data.sourceUpdatedAt)}</strong></div>
      <div className="stat-line"><span>보관 중인 관찰</span><strong>{format(data.history?.rows)}개</strong></div></>:<p className="muted">{busy?'보관 상태를 확인하고 있어요.':'잠시 후 다시 확인해 주세요.'}</p>}
    <p className="muted">공개 관찰 이력은 최대 30일간 보관해요. 조회 시각이 새로워져도 공급원에 새 관찰이 없으면 원래 가격 시각을 유지합니다. 관심 조건 알림은 사이트가 열린 동안 작동해요.</p>
  </Card>;
}
