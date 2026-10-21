import{headers}from'next/headers';
import{env}from'cloudflare:workers';
import{defaultCozyReader}from'@/lib/market-cozy.mjs';
import{createMarketStore,mergeMarketHistory}from'@/lib/market-store.mjs';
const store=createMarketStore((env as any).DB);
export async function GET(request:Request){
 if(!(await headers()).get('oai-authenticated-user-id'))return Response.json({error:'로그인 후 이용할 수 있어요.'},{status:401});
 const p=new URL(request.url).searchParams,id=p.get('id')||'',days=p.get('days')==='30'?30:7;
 if(!/^\d{1,10}$/.test(id))return Response.json({error:'정확한 아이템 ID를 입력해 주세요.'},{status:400});
 let source:any=null,stored:any[]=[],storageStatus=store?'connected':'unavailable',sourceError='';
 try{source=await defaultCozyReader.history(id,{days});}catch{sourceError='공급원 이력 조회가 지연되고 있습니다.';}
 if(store){try{if(source&&!source.cached&&!source.stale)await store.record(source.quotes);stored=await store.history(id,days);}catch{storageStatus='unavailable';}}
 const quotes=mergeMarketHistory(source?.quotes??[],stored);
 if(!quotes.length&&!source)return Response.json({error:'이력을 확인하지 못했습니다. 잠시 후 다시 확인해 주세요.'},{status:503});
 return Response.json({item:source?.item??{itemId:id},quotes,storageStatus,sourceError,fetchedAt:source?.fetchedAt??null,coverage:{requestedDays:days,returned:quotes.length,maxPoints:2000,sourceLimited:source?.coverage?.sourceLimited??false,oldestAt:quotes.at(-1)?.at??null,newestAt:quotes[0]?.at??null,storedRows:stored.length}},{headers:{'Cache-Control':'private,no-store'}});
}
