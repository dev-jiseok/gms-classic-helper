import { createNewsReader } from '@/lib/classic-news.mjs';
const read=createNewsReader();
export async function GET(){return Response.json(await read(),{headers:{'Cache-Control':'private, no-store'}});}
