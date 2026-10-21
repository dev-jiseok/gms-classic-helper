import {headers} from 'next/headers';
import catalog from '@/content/public-catalog.json';
import {createGlclmeReader} from '@/lib/market-glclme.mjs';
const reader=createGlclmeReader({catalog:catalog.items});
export async function GET(request:Request){
 if(!(await headers()).get('oai-authenticated-user-id'))return Response.json({error:'로그인 후 이용할 수 있습니다.'},{status:401});
 const id=new URL(request.url).searchParams.get('item');if(id!==null&&!/^\d{1,10}$/.test(id))return Response.json({error:'아이템 ID를 확인해 주세요.'},{status:400});
 return Response.json(await reader(id),{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
