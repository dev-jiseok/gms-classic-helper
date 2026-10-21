import {headers}from'next/headers';
import {defaultCozyReader as cozyReader}from'@/lib/market-cozy.mjs';
export async function GET(request:Request){
 if(!(await headers()).get('oai-authenticated-user-id'))return Response.json({error:'로그인 후 이용할 수 있어요.'},{status:401});
 const p=new URL(request.url).searchParams,id=p.get('id')||'';
 if(!/^\d{1,10}$/.test(id))return Response.json({error:'정확한 아이템 ID를 입력해 주세요.'},{status:400});
 try{const result=p.get('mode')==='history'?await cozyReader.history(id,{days:Number(p.get('days')||7)}):await cozyReader.sightings(id,{page:Number(p.get('page')||1),size:Number(p.get('size')||30),show:p.get('show')||'listed',sort:p.get('sort')||'at',dir:p.get('dir')||'desc',seller:p.get('seller')||'',channel:p.get('channel')||'',maxAgeHours:p.get('maxAgeHours'),stats:Object.fromEntries(['watk','matk','str','dex','int','luk','acc','slots'].map(k=>[k,p.get(k)]))});return Response.json(result,{headers:{'Cache-Control':'private,no-store'}});}catch(error:any){return Response.json({error:error.message||'관찰 매물을 확인하지 못했어요.'},{status:502});}
}
