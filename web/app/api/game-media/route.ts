import catalog from '@/content/public-catalog.json';
import {createGameMediaReader}from'@/lib/game-media-source.mjs';
import {gameMediaId,gameMediaKind}from'@/lib/game-media.mjs';
const reader=createGameMediaReader();
const kinds:any={item:'items',monster:'monsters',npc:'npcs',map:'maps'};
const allowed=new Map(Object.entries(kinds).map(([kind,set])=>[kind,new Set(((catalog as any)[set as string]??[]).map((r:any)=>String(r.id)))]));
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,kind=gameMediaKind(p.get('kind')),id=gameMediaId(p.get('id'));
 if([...p.keys()].some(k=>!['kind','id','animate','info'].includes(k))||!['0','1',null].includes(p.get('animate'))||!['0','1',null].includes(p.get('info'))||!id||!allowed.get(kind)?.has(id))return Response.json({error:'공개 게임 색인의 이미지 종류와 ID를 확인해 주세요.'},{status:400,headers:{'Cache-Control':'public, max-age=300'}});
 try{
  const result:any=await reader.read({kind,id,animated:p.get('animate')==='1'}),headers={'Cache-Control':'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800','X-Content-Type-Options':'nosniff',ETag:result.etag,'X-Game-Media-Method':result.method,'X-Game-Media-Source':result.sourceUrl,'X-Game-Media-Id':id,'X-Game-Media-Pose':result.pose??''};
  if(p.get('info')==='1')return Response.json({...Object.fromEntries(Object.entries(result).filter(([key])=>key!=='bytes')),byteLength:result.bytes.length},{headers});
  if(request.headers.get('If-None-Match')===result.etag)return new Response(null,{status:304,headers});
  return new Response(result.bytes,{headers:{...headers,'Content-Type':result.contentType,'Content-Length':String(result.bytes.length)}});
 }catch(error:any){return Response.json({error:error.message,code:error.code??'unavailable'},{status:error.code==='not-found'?404:error.code==='backoff'||error.code==='busy'?429:502,headers:{'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});}
}
