import { headers } from 'next/headers';
import { env } from 'cloudflare:workers';
import { createMarketConnector, feedConfig } from '@/lib/market-provider.mjs';
import {defaultCozyReader as cozyReader}from'@/lib/market-cozy.mjs';
import{dedupeQuotes}from'@/lib/market-core.mjs';
import{createMarketStore,readStoredCozy}from'@/lib/market-store.mjs';
const store=createMarketStore((env as any).DB);
const connector = createMarketConnector();
export async function GET(request:Request) {
  if (!(await headers()).get('oai-authenticated-user-id')) return Response.json({ error: '로그인 후 이용할 수 있습니다.' }, { status: 401 });
  const config = feedConfig(env as any);
  const result:any = config.enabled?await connector(config):await readStoredCozy(cozyReader,store);
  if(!config.enabled){
   const ids=[...new Set((new URL(request.url).searchParams.get('items')||'').split(',').filter(id=>/^\d{1,10}$/.test(id)))].slice(0,6),watched=[],coverage=[];
   for(const id of ids){try{const data=await cozyReader.sightings(id,{show:'listed',size:30,maxAgeHours:24});watched.push(...data.quotes);coverage.push({itemId:id,checkedAt:data.fetchedAt,quoteCount:data.quotes.length,error:data.error??null});}catch{coverage.push({itemId:id,checkedAt:null,quoteCount:0,error:'공급원 조회 지연'});}}
   if(watched.length)result.quotes=dedupeQuotes([...watched,...result.quotes]);result.watchedItems=ids.length;result.watched=coverage;
  }
  return Response.json(result, { headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
