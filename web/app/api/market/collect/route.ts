import { env } from 'cloudflare:workers';
import { defaultCozyReader } from '@/lib/market-cozy.mjs';
import { collectPublicMarket, publicMarketCollectionStatus } from '@/lib/market-collection.mjs';

// Sites dispatch authorizes the owner-private Site's service caller. A service
// token does not impersonate a signed-in visitor; this writes only shared data.
const reply = (body:any, status=200) => Response.json(body, {status, headers:{'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'}});
export async function POST() {
  try {return reply(await collectPublicMarket(defaultCozyReader, (env as any).DB));}
  catch {return reply({error:'공개 시세 수집·저장에 실패했습니다. 기존 이력은 유지됩니다.'},503);}
}
export async function GET() {
  try {return reply(await publicMarketCollectionStatus((env as any).DB));}
  catch {return reply({error:'시세 수집 상태를 확인하지 못했습니다.'},503);}
}
