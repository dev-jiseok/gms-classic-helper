import { createRankReader, rankRequest } from '@/lib/rank-client.mjs';
const read=createRankReader();
export async function GET(request:Request){
 try{const result=await read(rankRequest(new URL(request.url).searchParams));return Response.json(result.body,{status:result.status,headers:{'Cache-Control':'private, no-store',...((result.body as any).retryAfter?{'Retry-After':String((result.body as any).retryAfter)}:{})}});}
 catch(error:any){return Response.json({error:error.message||'랭킹 요청 조건을 확인해 주세요.'},{status:400});}
}
