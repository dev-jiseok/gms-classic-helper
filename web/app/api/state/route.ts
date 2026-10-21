import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { playerState } from "@/db/schema";
import {normalizeState} from "@/lib/engine.mjs";
async function owner() { return (await headers()).get("oai-authenticated-user-id"); }
export async function GET() {
  const id = await owner();
  if (!id) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  try { const row = await getDb().select().from(playerState).where(eq(playerState.ownerId, id)).get(); return Response.json({ state: row ? JSON.parse(row.payload) : null, revision: row?.revision ?? 0 }); }
  catch { return Response.json({ error: "계정 저장소에 연결하지 못했습니다." }, { status: 503 }); }
}
export async function PUT(request: Request) {
  const id = await owner();
  if (!id) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "잘못된 요청 출처입니다." }, { status: 403 });
  try {
    const text = await request.text();
    if (text.length > 2_000_000) return Response.json({ error: "저장 용량을 초과했습니다." }, { status: 413 });
    const body = JSON.parse(text);
    if (!body.state || body.state.version !== 1 || !Array.isArray(body.state.profiles) || !Number.isSafeInteger(body.revision) || body.revision < 0) return Response.json({ error: "저장 형식을 확인해 주세요." }, { status: 400 });
    try{body.state=normalizeState(body.state);}catch{return Response.json({error:"저장 데이터 형식을 확인해 주세요."},{status:400});}
    const db = getDb(), now = new Date().toISOString();
    if (body.revision === 0) {
      const result = await db.insert(playerState).values({ ownerId: id, payload: JSON.stringify(body.state), revision: 1, updatedAt: now }).onConflictDoNothing().returning({ revision: playerState.revision });
      if (!result.length) return Response.json({ error: "다른 기기의 변경이 있습니다. 새로고침 후 확인해 주세요." }, { status: 409 });
      return Response.json({ revision: 1, updatedAt: now });
    }
    const result = await db.update(playerState).set({ payload: JSON.stringify(body.state), revision: body.revision + 1, updatedAt: now }).where(and(eq(playerState.ownerId, id), eq(playerState.revision, body.revision))).returning({ revision: playerState.revision });
    if (!result.length) return Response.json({ error: "다른 기기의 변경이 있습니다. 새로고침 후 확인해 주세요." }, { status: 409 });
    return Response.json({ revision: result[0].revision, updatedAt: now });
  } catch { return Response.json({ error: "계정에 저장하지 못했습니다. 브라우저 저장은 유지됩니다." }, { status: 503 }); }
}
