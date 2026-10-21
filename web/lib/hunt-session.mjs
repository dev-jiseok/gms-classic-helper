import { experienceBetween, experienceToNext } from './experience-data.mjs';
const integer = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => value !== null && value !== undefined && value !== '' && Number.isSafeInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
const validLevel = value => integer(value, 1, 200);
const validBar = (level, exp) => integer(exp) && (experienceToNext(level) === null || Number(exp) < experienceToNext(level));
export function experienceGain(startLevel, startExp, endLevel, endExp) {
  if (!validLevel(startLevel) || !validLevel(endLevel) || Number(endLevel) < Number(startLevel) || !validBar(startLevel, startExp) || !validBar(endLevel, endExp)) return null;
  const a = Number(startLevel), b = Number(endLevel), x = Number(startExp), y = Number(endExp);
  if (a === b) return y >= x ? y - x : null;
  const between = experienceBetween(a, b);
  return between === null || !Number.isSafeInteger(between - x + y) ? null : between - x + y;
}
export function createHuntDraft(profile, session = null) {
  return { map: session?.map ?? '', mapId: session?.mapId ?? '', setupLabel: session?.setupLabel ?? '', startExp: validBar(profile.level, profile.exp) ? Number(profile.exp) : 0, endExp: 0, endLevel: Math.max(Number(profile.level), Number(session?.level ?? profile.level)), manual: '', gross: '', potions: '', travel: '', loot: '', lootMode: 'itemized', lootItems: [], noLootConfirmed: false };
}
export const HUNT_COMBAT_KEYS = ['str', 'dex', 'int', 'luk', 'attack', 'magicAttack', 'accuracy'];
/** These are the user's saved profile values, not values read from the game. */
export function huntCombatSnapshot(profile) {
  return { job: profile.job, level: Number(profile.level), ...Object.fromEntries(HUNT_COMBAT_KEYS.map(key => [key, integer(profile[key]) ? Number(profile[key]) : null])) };
}
export function huntProfileSignature(profile) {
  const snapshot = huntCombatSnapshot(profile);
  return JSON.stringify([snapshot.job, snapshot.level, ...HUNT_COMBAT_KEYS.map(key => snapshot[key])]);
}
export function validateLootItems(rows) {
  const errors = [], seen = new Set();
  if (!Array.isArray(rows) || rows.length > 50) return ['전리품은 기록당 최대 50종까지 입력해 주세요.'];
  for (const row of rows) {
    const itemId = String(row?.itemId ?? '').trim();
    if (!itemId || itemId.length > 120) errors.push('도감에서 전리품 아이템을 선택해 주세요.');
    if (seen.has(itemId)) errors.push('같은 아이템은 한 줄에 수량을 합쳐 주세요.');
    seen.add(itemId);
    if (!integer(row?.quantity, 1, 999999999)) errors.push('아이템 수량은 1 이상의 유한한 정수여야 해요.');
    const price = row?.recordedUnitPrice;
    if (price !== '' && price !== null && price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 0 || Number(price) * Number(row.quantity) > Number.MAX_SAFE_INTEGER)) errors.push('기록 당시 단가는 0 이상의 유한한 수치여야 해요. 미확인은 빈칸으로 두세요.');
  }
  return [...new Set(errors)];
}
export function recordedLootValue(rows) {
  if (validateLootItems(rows).length) return null;
  let total = 0;
  for (const row of rows) {
    if (row.recordedUnitPrice === '' || row.recordedUnitPrice === null || row.recordedUnitPrice === undefined) return null;
    total += Number(row.quantity) * Number(row.recordedUnitPrice);
  }
  return Number.isFinite(total) && total <= Number.MAX_SAFE_INTEGER ? total : null;
}
/** Explicitly replaces the aggregate loot value; it never adds itemized value on top. */
export function itemizeHuntRecord(record, rows, now = Date.now()) {
  const errors = validateLootItems(rows);
  if (errors.length) return { errors, record: null };
  const lootItems = rows.map(row => ({ ...row, itemId: String(row.itemId), quantity: Number(row.quantity), recordedUnitPrice: row.recordedUnitPrice === '' || row.recordedUnitPrice == null ? null : Number(row.recordedUnitPrice) }));
  return { errors: [], record: { ...record, ...(record.lootMode !== 'itemized' ? { previousAggregateLoot: record.loot ?? null } : {}), lootMode: 'itemized', lootItems, loot: recordedLootValue(lootItems), lootUpdatedAt: new Date(now).toISOString() } };
}
export function confirmHuntSetup(record, profile) {
  if (record.job && record.job !== profile.job) return { errors: ['기록 당시 직업이 현재 프로필과 달라 같은 조건으로 확인할 수 없어요.'], snapshot: null };
  if (integer(record.level, 1, 200) && Number(record.level) !== Number(profile.level)) return { errors: ['기록 당시 레벨이 현재 프로필과 달라 같은 조건으로 확인할 수 없어요.'], snapshot: null };
  const saved = record.combatSnapshot;
  if (saved && HUNT_COMBAT_KEYS.some(key => saved[key] != null && profile[key] != null && Number(saved[key]) !== Number(profile[key]))) return { errors: ['이미 저장된 전투 스탯이 현재와 달라요. 과거 조건을 현재 조건으로 덮어쓰지 않습니다.'], snapshot: null };
  return { errors: [], snapshot: huntCombatSnapshot(profile) };
}
export function isHuntActivity(activity, session) {
  return !!activity && !!session && (session.activityId ? activity.id === session.activityId : activity.mode === 'training' && activity.name === session.map);
}
/** @param {any} input */
export function validateHuntStart({ level, exp, map, running = null, activity = null, now = Date.now() } = {}) {
  const errors = [];
  if (!String(map ?? '').trim() || String(map).trim().length > 160) errors.push('사냥터를 1–160자 안으로 입력해 주세요.');
  if (!validLevel(level)) errors.push('시작 레벨은 1–200 사이의 정수여야 해요.');
  if (!validLevel(level) || !validBar(level, exp)) errors.push('시작 경험치는 0 이상의 정수이며 현재 레벨의 다음 레벨 필요 EXP보다 작아야 해요.');
  if (running) errors.push('이 캐릭터는 이미 사냥을 측정하고 있어요. 먼저 기존 측정을 마치거나 취소하세요.');
  if (activity && Date.parse(activity.endsAt) > now && (activity.mode !== 'training' || activity.name !== String(map ?? '').trim())) errors.push(`현재 ${activity.name ?? '다른 활동'}의 추천을 유지하고 있어요. 해당 활동을 마친 뒤 새 측정을 시작하세요.`);
  return errors;
}
/** @param {any} input */
export function validateHuntFinish({ session, endLevel, endExp, manualExp = '', gross, potions, travel, loot, lootMode = 'aggregate', lootItems = [], noLootConfirmed = false, allowUnknownCash = false, now = Date.now() } = {}) {
  const errors = [];
  if (!session || !validLevel(session.level) || !validBar(session.level, session.exp) || !String(session.map ?? '').trim()) errors.push('시작 기록이 올바르지 않아요. 측정을 취소하고 다시 시작해 주세요.');
  if (!validLevel(endLevel) || session && Number(endLevel) < Number(session.level)) errors.push('종료 레벨은 시작 레벨 이상인 1–200 사이의 정수여야 해요.');
  const manual = manualExp !== '' && manualExp !== undefined && manualExp !== null;
  if (manual && !integer(manualExp)) errors.push('직접 확인한 획득 EXP는 0 이상의 유한한 정수여야 해요.');
  if (!manual && (!validLevel(endLevel) || !validBar(endLevel, endExp))) errors.push('종료 경험치는 현재 레벨의 경험치 범위 안에 입력해 주세요.');
  for (const [value, name] of [[gross, '획득 메소'], [potions, '물약·보급 비용'], [travel, '이동·기타 비용'], ...(lootMode === 'itemized' ? [] : [[loot, '전리품 가치']])]) if (!(allowUnknownCash && (value === '' || value == null)) && !integer(value)) errors.push(`${name}은 0 이상의 유한한 정수로 입력해 주세요.`);
  if (lootMode === 'itemized') errors.push(...validateLootItems(lootItems));
  if (lootMode === 'itemized' && lootItems.length === 0 && !noLootConfirmed) errors.push('전리품을 추가하거나 이번 사냥에 전리품이 없었는지 확인해 주세요.');
  const started = Date.parse(session?.startedAt ?? '');
  const elapsedMs = Number.isFinite(now) && Number.isFinite(started) ? now - started : null;
  if (elapsedMs === null || elapsedMs < 1000) errors.push('측정 시간이 1초 이상 경과한 뒤 저장해 주세요.');
  const gain = manual && integer(manualExp) ? Number(manualExp) : experienceGain(session?.level, session?.exp, endLevel, endExp);
  if (gain === null || !integer(gain)) errors.push('경험치 표로 계산할 수 없어요. 게임에서 확인한 획득 EXP를 직접 입력해 주세요.');
  let endingExp = !manual && validBar(endLevel, endExp) ? Number(endExp) : null;
  if (manual && integer(gain) && session && validLevel(endLevel) && validLevel(session.level)) {
    const between = experienceBetween(session.level, endLevel);
    if (between !== null) {
      const implied = Number(session.exp) + Number(gain) - between;
      if (!validBar(endLevel, implied)) errors.push('직접 입력한 획득 EXP와 종료 레벨이 일치하지 않아요. 게임의 종료 레벨을 다시 확인해 주세요.');
      else endingExp = implied;
    }
  }
  return { errors: [...new Set(errors)], gain: errors.length ? null : gain, elapsedMs, manual, endingExp };
}
export function ocrNumberCandidates(text) {
  const matches = String(text || '').matchAll(/\d[\d,]*(?:\.\d+)?/g);
  return [...new Set([...matches].filter(match => !String(text).slice(match.index + match[0].length).trimStart().startsWith('%')).map(match => Number(match[0].replaceAll(',', ''))).filter(value => Number.isSafeInteger(value) && value >= 0))].slice(0, 20);
}
