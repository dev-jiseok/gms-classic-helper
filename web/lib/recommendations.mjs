/** Personalized recommendations. Unknown facts stay null; quotes never become trades. */
import { optionSignature } from './market-core.mjs';
import { JOBS } from './job-data.mjs';
import { HUNT_COMBAT_KEYS, huntProfileSignature, recordedLootValue, validateLootItems } from './hunt-session.mjs';
const finite = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const positive = value => finite(value) && Number(value) > 0;
const n = (value, fallback = 0) => finite(value) ? Number(value) : fallback;
const id = value => String(value ?? '');
const unique = values => [...new Set(values)];
const clamp = (value, low, high) => Math.max(low, Math.min(high, n(value)));
export const RECOMMENDATION_INTERVAL_MS = 60 * 60 * 1000;
export const MARKET_INTERVAL_MS = 60 * 1000;
export const JOB_FAMILIES = {
  beginner: 'beginner', warrior: 'warrior', magician: 'magician', bowman: 'bowman', thief: 'thief', fighter: 'warrior', page: 'warrior', spearman: 'warrior',
  firePoison: 'magician', iceLightning: 'magician', cleric: 'magician',
  hunter: 'bowman', crossbowman: 'bowman', assassin: 'thief', bandit: 'thief',
};
export const CURRENT_JOB_CODES = { beginner: 0, warrior: 100, fighter: 110, page: 120, spearman: 130, magician: 200, firePoison: 210, iceLightning: 220, cleric: 230, bowman: 300, hunter: 310, crossbowman: 320, thief: 400, assassin: 410, bandit: 420 };
// Explicit current Wiki variant values: KPQ and four second-advancement tests.
const INSTANCE_MONSTER_VARIANTS=new Set(['kpq','warrior','magician','bowman','thief']);
const instanceVariant=monster=>INSTANCE_MONSTER_VARIANTS.has(String(monster.variant??'').trim().toLowerCase());
const instanceMap=map=>map.instance===true||['party quest','job test','quest instance'].includes(String(map.mapType??'').toLowerCase())||[map.en,map.wikiPage,map.name].some(value=>/^1st Accompaniment(?:\s|$)/i.test(String(value??'')));
const referenceOnly=row=>row.referenceOnly===true||row.availability==='community-reference-only';
const monsterMaps=(monster,maps)=>maps.filter(map=>monster.mapIds?.map(id).includes(id(map.id))||map.mobIds?.map(id).includes(id(monster.id)));
export function jobMatches(jobs, job) {
  if (!jobs?.length) return true;
  const normalized = (Array.isArray(jobs) ? jobs : [jobs]).flatMap(value => String(value).toLowerCase().split(/[,/]/)).map(value => value.trim());
  return normalized.includes('all') || normalized.includes(String(job).toLowerCase()) || normalized.includes(String(JOB_FAMILIES[job]).toLowerCase());
}
/** Profiles keep the chosen future path from level one; quest/equip eligibility uses the current stage. */
export function currentJobForProfile(profile) {
  if (profile.currentJob && JOBS[profile.currentJob]) return profile.currentJob;
  const job = JOBS[profile.job], firstLevel = job?.firstAdvancementLevel ?? 10;
  if (n(profile.level) < firstLevel) return 'beginner';
  return job?.tier >= 2 && n(profile.level) < (job.secondAdvancementLevel ?? 30) ? job.family : profile.job;
}
export function priceEvidence(prices = [], itemId, { purpose = 'revenue', now = Date.now(), maxAgeMs = 24 * 60 * 60 * 1000, npcSell = null, equipment = false, quantity = 1 } = {}) {
  const rows = prices.filter(row => id(row.itemId) === id(itemId) && row.active !== false && !equipment && positive(row.price ?? row.unitPrice))
    .map(row => ({ ...row, price: n(row.unitPrice ?? (row.priceBasis === 'bundle' && positive(row.quantity) ? row.price / row.quantity : row.price)), timestamp: Date.parse(row.at ?? row.observedAt ?? row.updatedAt ?? '') }))
    .filter(row => Number.isFinite(row.timestamp) && row.timestamp <= now + 5 * 60 * 1000)
    .sort((a, b) => b.timestamp - a.timestamp);
  const fresh = rows.filter(row => now - row.timestamp <= maxAgeMs);
  const sold = fresh.filter(row => ['sold', 'observed-sale', 'trade'].includes(row.type ?? row.kind));
  const purchase = row => { const minimum = positive(row.minimumPurchaseQuantity) ? Number(row.minimumPurchaseQuantity) : row.priceBasis === 'bundle' || row.originalPriceBasis === 'bundle' ? Math.max(1, n(row.quantity, 1)) : 1; return Math.ceil(Math.max(0, n(quantity, 1)) / minimum) * n(row.minimumPurchaseTotal, minimum * row.price); };
  let row = purpose === 'cost' ? fresh.filter(row => ['sell', 'ask', 'listing'].includes(row.type ?? row.kind)).sort((a, b) => purchase(a) - purchase(b) || a.price - b.price)[0] : sold[0];
  if (!row && purpose === 'cost') row = sold[0];
  if (!row && finite(npcSell) && Number(npcSell) >= 0 && purpose === 'revenue') return { price: Number(npcSell), basis: 'npc', source: 'NPC 판매가', at: null, ageMs: null, stale: false, certainSale: true };
  if (!row) row = fresh.find(row => purpose === 'revenue' ? ['sell', 'ask', 'listing'].includes(row.type ?? row.kind) : true);
  if (!row) return { price: null, basis: 'unknown', source: null, at: null, ageMs: rows[0] ? now - rows[0].timestamp : null, stale: rows.length > 0, certainSale: false };
  const basis = ['sold', 'observed-sale', 'trade'].includes(row.type ?? row.kind) ? 'observed-sale' : 'quote';
  return { price: row.price, purchaseCost: purpose === 'cost' ? purchase(row) : null, minimumPurchaseQuantity: row.minimumPurchaseQuantity ?? (row.priceBasis === 'bundle' || row.originalPriceBasis === 'bundle' ? n(row.quantity, 1) : 1), basis, source: row.source ?? row.sourceUrl ?? '입력한 가격', at: new Date(row.timestamp).toISOString(), ageMs: now - row.timestamp, stale: false, certainSale: basis === 'observed-sale' };
}
/** Immutable quantities and recorded values are compared against today's references, not added together. */
export function valueHuntRecord(record, items = [], prices = [], now = Date.now()) {
  const itemized = record.lootMode === 'itemized' || Array.isArray(record.lootItems) && record.lootItems.length > 0;
  const stacks = itemized ? record.lootItems ?? [] : [];
  const errors = itemized ? validateLootItems(stacks) : [];
  const rows = [], missing = [...errors];
  let currentValue = 0, complete = !errors.length;
  for (const stack of stacks) {
    const item = items.find(row => id(row.id) === id(stack.itemId));
    const quote = prices.find(row => id(row.itemId) === id(stack.itemId) && typeof row.isEquipment === 'boolean');
    const categoryKnown = !!item || typeof stack.isEquipment === 'boolean' || !!quote;
    const equipment = item?.category === 'equip' || stack.isEquipment === true || quote?.isEquipment === true;
    const price = categoryKnown ? priceEvidence(prices, stack.itemId, { now, npcSell: item?.npcSell, equipment }) : { price: null, basis: 'unknown', at: null, source: null };
    const validQuantity = positive(stack.quantity) && Number.isSafeInteger(Number(stack.quantity));
    const value = validQuantity && price.price !== null ? Number(stack.quantity) * price.price : null;
    if (value === null || !Number.isFinite(value)) { complete = false; missing.push(`${item?.name ?? stack.name ?? stack.itemId}: 현재 판매 가치 미확인`); }
    else currentValue += value;
    rows.push({ itemId: id(stack.itemId), name: item?.name ?? stack.name ?? id(stack.itemId), quantity: Number(stack.quantity), recordedUnitPrice: finite(stack.recordedUnitPrice) ? Number(stack.recordedUnitPrice) : null, currentUnitPrice: price.price, currentValue: value, priceBasis: price.basis, priceAt: price.at, priceSource: price.source, estimated: price.basis !== 'npc' });
  }
  const savedLoot = itemized ? recordedLootValue(stacks) : null;
  const recordedValue = itemized ? savedLoot : finite(record.loot) && Number(record.loot) >= 0 ? Number(record.loot) : null;
  if (!itemized) { currentValue = recordedValue === 0 ? 0 : null; complete = currentValue !== null; if (recordedValue !== 0) missing.push('합계로만 기록한 전리품은 아이템·수량을 보완해야 현재 시세로 재평가할 수 있습니다'); }
  const cashComplete = ['mesoDelta', 'potions', 'travel'].every(key => finite(record[key]) && Number(record[key]) >= 0);
  const cashNet = cashComplete ? Number(record.mesoDelta) - Number(record.potions) - Number(record.travel) : null;
  if (!cashComplete) missing.push('획득 메소·소모품·이동 비용 확인 필요');
  const currentLootValue = complete && Number.isFinite(currentValue) ? currentValue : null;
  return { itemized, rows, recordedLootValue: recordedValue, currentLootValue, knownPartialCurrentValue: itemized ? rows.reduce((sum, row) => sum + n(row.currentValue), 0) : null, recordedNet: cashNet !== null && recordedValue !== null ? cashNet + recordedValue : null, currentNet: cashNet !== null && currentLootValue !== null ? cashNet + currentLootValue : null, cashNet, complete: complete && cashComplete, repriced: itemized && complete, estimated: rows.some(row => row.estimated), missing: unique(missing) };
}
export function huntComparability(record, profile, { levelTolerance = 5 } = {}) {
  const snapshot = record.combatSnapshot;
  if (!snapshot) return { status: 'unknown', reasons: ['기록 당시 직업·스탯 조건 미등록'] };
  const reasons = [];
  if (snapshot.job !== profile.job) reasons.push('기록 후 직업이 변경됨');
  if (!finite(snapshot.level) || Math.abs(Number(snapshot.level) - n(profile.level)) > levelTolerance) reasons.push('현재 레벨과 차이가 큰 기록');
  const family = JOB_FAMILIES[profile.job];
  const relevant = family === 'magician' ? ['int', 'luk', 'magicAttack'] : family === 'thief' ? ['dex', 'luk', 'attack', 'accuracy'] : ['str', 'dex', 'attack', 'accuracy'];
  for (const key of relevant) if (finite(snapshot[key]) && finite(profile[key]) && Number(snapshot[key]) !== Number(profile[key])) reasons.push('기록 후 공격력·마력·스탯·명중이 변경됨');
  const unknown = relevant.some(key => !finite(snapshot[key]) || !finite(profile[key]));
  return { status: reasons.length ? 'different' : unknown ? 'unknown' : 'comparable', reasons: unique([...reasons, ...(unknown ? ['프로필의 일부 전투 스탯 미입력'] : [])]) };
}
/** Only current-version, sourced and explicitly verified per-kill probabilities enter EV. */
export function expectedDropValue(monster, items = [], prices = [], options = {}) {
  const drops = monster.drops ?? (monster.dropItemIds ?? []).map(itemId => ({ itemId }));
  let knownValue = 0, verifiedCount = 0;
  const missing = [], evidence = [];
  for (const drop of drops) {
    const itemId = drop.itemId ?? drop.id;
    const item = items.find(row => id(row.id) === id(itemId));
    const chance = drop.probability ?? drop.chance;
    const verified = drop.probabilityVerified === true && positive(chance) && Number(chance) <= 1 && !!(drop.sourceUrl || drop.sourceId) && drop.versionMatches !== false;
    if (!verified) { missing.push(`${item?.name ?? itemId}: 드롭 확률 미확인`); continue; }
    const price = priceEvidence(prices, itemId, { ...options, npcSell: item?.npcSell, equipment: item?.category === 'equip' });
    if (price.price === null) { missing.push(`${item?.name ?? itemId}: 판매 가치 미확인`); continue; }
    const quantity = finite(drop.quantity) ? Number(drop.quantity) : null;
    if (quantity === null || quantity <= 0) { missing.push(`${item?.name ?? itemId}: 드롭 수량 미확인`); continue; }
    knownValue += Number(chance) * quantity * price.price;
    verifiedCount++;
    evidence.push({ itemId: id(itemId), name: item?.name ?? id(itemId), probability: Number(chance), quantity, ...price });
  }
  return { expectedValuePerKill: drops.length && !missing.length && monster.dropsComplete === true ? knownValue : null, knownPartialValue: knownValue, verifiedCount, totalDrops: drops.length, missing, evidence, complete: monster.dropsComplete === true && !missing.length };
}
/** Community observations are a sensitivity range for known components, never a true drop rate.
 * The sum of component bounds is not an overall statistical confidence interval.
 */
export function observedDropScenario(monster, items = [], prices = [], options = {}) {
  let low = 0, high = 0;
  const components = [], missing = [];
  for (const drop of monster.drops ?? []) {
    if (drop.category === 'nothing' || drop.questOnly === true) continue;
    const name = drop.itemName ?? id(drop.itemId);
    const valid = positive(drop.sampleKills) && finite(drop.sampleDrops) && Number(drop.sampleDrops) >= 0 && Number(drop.sampleDrops) <= Number(drop.sampleKills) && finite(drop.confidenceLowPercent) && finite(drop.confidenceHighPercent) && Number(drop.confidenceLowPercent) >= 0 && Number(drop.confidenceHighPercent) <= 100 && Number(drop.confidenceLowPercent) <= Number(drop.confidenceHighPercent) && !!drop.sourceUrl;
    if (!valid) { missing.push(`${name}: 관찰 표본·신뢰구간 미확인`); continue; }
    if (!positive(drop.minQuantity) || !positive(drop.maxQuantity) || Number(drop.maxQuantity) < Number(drop.minQuantity)) { missing.push(`${name}: 획득 수량 범위 미확인`); continue; }
    const item = items.find(row => id(row.id) === id(drop.itemId));
    const price = drop.category === 'meso' ? { price: 1, basis: 'meso', source: '메소' } : priceEvidence(prices, drop.itemId, { ...options, npcSell: item?.npcSell, equipment: item?.category === 'equip' });
    if (price.price === null) { missing.push(`${name}: 판매 가치 미확인`); continue; }
    const componentLow = Number(drop.confidenceLowPercent) / 100 * Number(drop.minQuantity) * price.price;
    const componentHigh = Number(drop.confidenceHighPercent) / 100 * Number(drop.maxQuantity) * price.price;
    low += componentLow; high += componentHigh;
    components.push({ itemId: drop.itemId, name, low: componentLow, high: componentHigh, sampleKills: Number(drop.sampleKills), sampleDrops: Number(drop.sampleDrops), observedOn: drop.observedOn ?? null, sourceUrl: drop.sourceUrl, priceBasis: price.basis });
  }
  return { lowPerKill: components.length ? low : null, highPerKill: components.length ? high : null, components, missing, complete: false, label: '관찰 표본의 확인된 일부 항목 민감도 범위 · 전체 수익·합산 신뢰구간 아님' };
}
function normalizeScores(rows, weights) {
  const dimensions = [{ key: 'expPerHour', weight: weights.exp }, { key: 'netPerHour', weight: weights.mesos }];
  const eligible = dimensions.filter(dimension => rows.some(row => finite(row[dimension.key])) && dimension.weight > 0);
  // Missing an entire dimension must not make the remaining dimension look fully verified.
  const total = dimensions.reduce((sum, dimension) => sum + Math.max(0, n(dimension.weight)), 0);
  return rows.map(row => {
    const used = eligible.filter(dimension => finite(row[dimension.key]));
    const coverage = total ? used.reduce((sum, dimension) => sum + dimension.weight, 0) / total : 0;
    let score = 0;
    for (const dimension of used) {
      const values = rows.map(candidate => candidate[dimension.key]).filter(finite).map(Number);
      const min = Math.min(...values), max = Math.max(...values);
      score += (max === min ? 1 : (row[dimension.key] - min) / (max - min)) * dimension.weight / Math.max(1, total);
    }
    return { ...row, score: score * 100, scoreCoverage: coverage };
  }).sort((a, b) => b.scoreCoverage - a.scoreCoverage || b.score - a.score || String(a.name).localeCompare(String(b.name)));
}
/** Recent sessions are weighted by duration and a seven-day half-life, not averaged equally.
 * @param {any} input
 */
export function recommendHunting({ profile, records = [], monsters = [], maps = [], items = [], prices = [], weights, calibration = {}, mapCalibrations = {}, comparison = {}, now = Date.now() }) {
  const preference = weights ?? (profile.goal === 'exp' ? { exp: 100, mesos: 0 } : profile.goal === 'mesos' ? { exp: 0, mesos: 100 } : { exp: 55, mesos: 45 });
  const groups = new Map();
  for (const record of records) {
    if (record.profileId && id(record.profileId) !== id(profile.id)) continue;
    const minutes = n(record.minutes);
    if (minutes <= 0 || !record.map || !finite(record.exp) || Number(record.exp) < 0) continue;
    const timestamp = Date.parse(record.at ?? '');
    const age = Number.isFinite(timestamp) ? Math.max(0, now - timestamp) : 7 * 86400000;
    const decay = 2 ** (-age / (7 * 86400000));
    const matching = huntComparability(record, profile, comparison);
    if (!Number.isFinite(timestamp) || timestamp > now + 5 * 60000) { matching.status = 'unknown'; matching.reasons.push('기록 시각 확인 필요'); }
    if (age > 30 * 86400000) { matching.status = 'different'; matching.reasons.push('30일보다 오래된 기록'); }
    if (comparison.setupLabel && record.setupLabel !== comparison.setupLabel) { matching.status = 'different'; matching.reasons.push('선택한 측정 조건·파티와 다름'); }
    const mapKey = id(record.mapId ?? record.map);
    const key = [mapKey, record.combatSnapshot ? huntProfileSignature(record.combatSnapshot) : 'legacy', record.setupLabel ?? '', matching.status].join('|');
    const current = groups.get(key) ?? { id: key, mapId: record.mapId ?? null, name: record.map, setupLabel: record.setupLabel ?? '', source: 'measured', comparability: matching.status, minutes: 0, weightedMinutes: 0, weightedExp: 0, weightedCurrentNet: 0, weightedRecordedNet: 0, sessions: 0, newestAt: null, missing: [], repricedSessions: 0, currentComplete: true, recordedComplete: true, hasAggregate: false };
    const valuation = valueHuntRecord(record, items, prices, now);
    current.missing.push(...valuation.missing, ...matching.reasons);
    if (!valuation.itemized && n(record.loot) > 0) current.hasAggregate = true;
    if (valuation.currentNet === null) current.currentComplete = false;
    else current.weightedCurrentNet += valuation.currentNet * decay;
    if (valuation.recordedNet === null) current.recordedComplete = false;
    else current.weightedRecordedNet += valuation.recordedNet * decay;
    current.minutes += minutes; current.weightedMinutes += minutes * decay;
    current.weightedExp += Number(record.exp) * decay; current.sessions++;
    current.repricedSessions += Number(valuation.repriced);
    if (Number.isFinite(timestamp) && (!current.newestAt || timestamp > Date.parse(current.newestAt))) current.newestAt = new Date(timestamp).toISOString();
    groups.set(key, current);
  }
  const allMeasured = [...groups.values()].map(row => {
    const recordedNetPerHour = row.recordedComplete ? row.weightedRecordedNet * 60 / row.weightedMinutes : null;
    const currentNetPerHour = row.currentComplete ? row.weightedCurrentNet * 60 / row.weightedMinutes : null;
    return { ...row, expPerHour: row.weightedExp * 60 / row.weightedMinutes, recordedNetPerHour, currentNetPerHour, netPerHour: currentNetPerHour ?? (row.hasAggregate ? recordedNetPerHour : null), pricingBasis: currentNetPerHour !== null ? 'current-estimate' : row.hasAggregate ? 'recorded' : 'unknown', confidence: row.minutes >= 60 && row.sessions >= 3 ? 'high' : row.minutes >= 20 ? 'medium' : 'low', missing: unique(row.missing), reasons: [row.sessions + '회 · ' + Math.round(row.minutes) + '분의 내 기록', row.setupLabel || '측정 조건 메모 없음', '최근 7일 반감기로 가중 · 입력된 프로필 조건 비교'] };
  });
  const measured = normalizeScores(allMeasured.filter(row => comparison.includeOtherSetups === true || row.comparability === 'comparable'), preference);
  const historical = allMeasured.filter(row => row.comparability !== 'comparable').sort((a, b) => Date.parse(b.newestAt) - Date.parse(a.newestAt));
  const candidates = monsters.filter(monster => {
    if(referenceOnly(monster)||instanceVariant(monster))return false;
    const places=monsterMaps(monster,maps);
    return !(places.length&&places.every(map=>referenceOnly(map)||instanceMap(map)))&&positive(monster.hp)&&positive(monster.exp)&&finite(monster.level)&&Number(monster.level)>=Math.max(1,n(profile.level)-10)&&Number(monster.level)<=n(profile.level)+10;
  }).map(monster => {
    const dropValue = expectedDropValue(monster, items, prices, { now });
    const observedScenario = observedDropScenario(monster, items, prices, { now });
    const mapRows = monsterMaps(monster,maps).filter(map=>!referenceOnly(map)&&!instanceMap(map));
    const calibratedMap = mapRows.find(map => { const value = mapCalibrations[id(map.id)]; return value && id(value.monsterId) === id(monster.id) && value.profileSignature === huntProfileSignature(profile); });
    const local = calibratedMap ? mapCalibrations[id(calibratedMap.id)] : null;
    const input = local ?? calibration;
    const damage = n(input.averageDamage), rate = n(input.hitRate) / 100, attackSeconds = n(input.attackSeconds);
    const calibrated = damage > 0 && rate > 0 && rate <= 1 && attackSeconds > 0;
    const hits = calibrated ? Math.ceil(Number(monster.hp) / damage) : null;
    const killCeiling = calibrated ? 3600 * rate / (hits * attackSeconds) : null;
    const uptimeKnown = finite(input.uptimePercent) && Number(input.uptimePercent) > 0 && Number(input.uptimePercent) <= 100;
    const kills = calibrated && uptimeKnown && local ? Math.min(killCeiling * Number(input.uptimePercent) / 100, positive(input.maxKillsPerHour) ? Number(input.maxKillsPerHour) : Infinity) : null;
    const missing = [...dropValue.missing];
    if(monster.variant)missing.push(`변형 용도 미확인: ${monster.variantLabel??monster.variant} · 일반 사냥 가능 여부를 게임에서 확인`);
    if (!calibrated) missing.push('실측 평균 데미지·명중률·공격 주기 필요');
    if (!local) missing.push('이 몬스터·맵·현재 프로필에 맞는 개별 실측 보정 필요 · 공통 값은 시간당 효율로 확정하지 않음');
    if (!uptimeKnown) missing.push('이동·경쟁·리젠을 반영한 공격 가동률 필요');
    if (!positive(input.maxKillsPerHour)) missing.push('맵별 실제 처치·리젠 상한 미확인');
    if (!dropValue.complete) missing.push('전체 드롭 기대가치 미확정');
    const netKnown = kills !== null && dropValue.complete && finite(input.costPerHour) && Number(input.costPerHour) >= 0 && finite(monster.expectedMesos) && Number(monster.expectedMesos) >= 0 && monster.mesosVerified === true;
    const opportunities = (monster.dropItemIds ?? monster.drops?.map(row => row.itemId) ?? []).map(itemId => {
      const item = items.find(row => id(row.id) === id(itemId));
      const price = priceEvidence(prices, itemId, { now, npcSell: item?.npcSell, equipment: item?.category === 'equip' });
      return { itemId: id(itemId), name: item?.name ?? id(itemId), ...price };
    }).filter(row => row.price !== null).sort((a, b) => b.price - a.price).slice(0, 5);
    return { id: id(monster.id), name: monster.name, monster, maps: mapRows, calibratedMap: calibratedMap ? { id: calibratedMap.id, name: calibratedMap.name } : null, source: 'reference', confidence: 'reference', hits, expPerHour: kills === null ? null : kills * Number(monster.exp), expCeiling: killCeiling === null ? null : killCeiling * Number(monster.exp), netPerHour: netKnown ? kills * (dropValue.expectedValuePerKill + Number(monster.expectedMesos)) - Number(input.costPerHour) : null, expPer100Hp: Number(monster.exp) * 100 / Number(monster.hp), knownDropValuePerHour: kills === null ? null : kills * dropValue.knownPartialValue, observedScenario, dropValue, opportunities, missing: unique(missing), reasons: ['확인된 몬스터 HP·EXP 기준의 후보', local ? calibratedMap.name + '에서 입력한 보정값 적용' : '공통 전투값은 참고용', '실측 사냥터 순위와 별도로 비교'] };
  }).sort((a, b) => (b.expPerHour ?? b.expPer100Hp) - (a.expPerHour ?? a.expPer100Hp));
  return { measured, historical, candidates, weights: preference, generatedAt: new Date(now).toISOString(), missing: measured.length ? [] : ['현재 프로필과 비교 가능한 사냥 기록이 없습니다. 새로 측정하거나 과거 기록의 측정 조건을 확인해 주세요.'] };
}
function prerequisitePlan(quest, questById, completed) {
  const ordered = [], missing = [], visiting = new Set(), visited = new Set();
  function visit(current) {
    if (completed[id(current.id)] || visited.has(id(current.id))) return;
    if (visiting.has(id(current.id))) { missing.push(`선행 관계 순환: ${current.name ?? current.id}`); return; }
    visiting.add(id(current.id));
    for (const parentId of current.prerequisiteIds ?? []) {
      if (completed[id(parentId)]) continue;
      const parent = questById.get(id(parentId));
      if (!parent) missing.push(`선행 퀘스트 정보 없음: ${parentId}`);
      else visit(parent);
    }
    visiting.delete(id(current.id)); visited.add(id(current.id)); ordered.push(current);
  }
  visit(quest);
  return { ordered, missing: unique(missing) };
}
function freshConfirmation(value, now) {
  const time = Date.parse(value ?? '');
  return Number.isFinite(time) && time <= now + 5 * 60000 && now - time <= RECOMMENDATION_INTERVAL_MS;
}
/** Known unmet conditions stay blocked. A recent explicit game check can resolve unknown facts. */
export function questGateEvidence(quest, profile, { citizenship = {}, professions = {}, now = Date.now() } = {}) {
  const reasons = [], verified = freshConfirmation(quest.conditionsVerifiedAt, now);
  if(referenceOnly(quest))reasons.push('참고 전용 자료: 원천 ID와 현재 클라이언트의 일치 관계 미확인');
  if (Array.isArray(quest.clientJobCodes) && quest.clientJobCodes.length && !quest.clientJobCodes.map(Number).includes(CURRENT_JOB_CODES[currentJobForProfile(profile)])) reasons.push('현재 직업의 정확한 코드 조건 불충족');
  const addUnknown = reason => { if (!verified) reasons.push(reason); };
  if (finite(quest.completeLevel) && n(profile.level) < Number(quest.completeLevel)) reasons.push(`보상 수령은 ${quest.completeLevel}레벨부터 가능`);
  if (finite(quest.requiredFame)) {
    if (!finite(profile.fame)) addUnknown(`필요 인기도 ${quest.requiredFame} 충족 여부 미확인`);
    else if (Number(profile.fame) < Number(quest.requiredFame)) reasons.push(`인기도 ${quest.requiredFame} 필요`);
  }
  if (quest.profession) {
    const value = professions[quest.profession] ?? profile.professions?.[quest.profession];
    const level = typeof value === 'object' && value ? value.level : value;
    if (!finite(level)) addUnknown(`${quest.profession} 숙련 조건 미확인`);
    else if (finite(quest.professionLevel) && Number(level) < Number(quest.professionLevel)) reasons.push(`${quest.profession} Lv. ${quest.professionLevel} 필요`);
    else if (!finite(quest.professionLevel)) addUnknown(`${quest.profession} 필요 숙련 레벨 미확인`);
  }
  const town = quest.citizenshipTown ? citizenship[quest.citizenshipTown] : null;
  if (quest.citizenshipTown) {
    if (!town || town.resident === undefined) addUnknown(`${quest.citizenshipTown} 주민 여부 미확인`);
    else if (town.resident !== true) reasons.push(`${quest.citizenshipTown} 주민 등록 필요`);
    if (finite(quest.citizenshipGrade)) {
      if (!finite(town?.grade)) addUnknown(`${quest.citizenshipTown} 시민권 ${quest.citizenshipGrade}등급 확인 필요`);
      else if (Number(town.grade) < Number(quest.citizenshipGrade)) reasons.push(`${quest.citizenshipTown} 시민권 ${quest.citizenshipGrade}등급 필요`);
    }
  }
  if (quest.rotationPool === true) {
    const period = quest.repeatPeriod === 'weekly' ? 'weekly' : 'daily';
    const selected = town?.[period + 'QuestId'];
    const selectedAt = town?.[period + 'SelectedAt'];
    const selectedOn = town?.[period + 'SelectedOn'];
    const localDate = new Date(now).toLocaleDateString('en-CA');
    const currentSelection = selected && (selectedOn === localDate || freshConfirmation(selectedAt, now));
    if (currentSelection && id(selected) !== id(quest.id)) reasons.push('현재 게시판에서 선택한 의뢰와 다른 회차 후보');
    else if (!currentSelection || id(selected) !== id(quest.id)) addUnknown('오늘 실제로 선정된 의뢰인지 게시판 확인 필요');
  }
  for (const [field, label, check] of [['availableFrom', '이벤트 시작 조건', value => value > now], ['availableUntil', '이벤트 종료 조건', value => value < now]]) {
    if (!quest[field]) continue;
    const timestamp = Date.parse(quest[field]);
    if (!Number.isFinite(timestamp)) addUnknown(`${label}의 날짜·시간 미확인`);
    else if (check(timestamp)) reasons.push(field === 'availableFrom' ? '아직 시작하지 않은 이벤트 퀘스트' : '등록된 이벤트 진행 기간 종료');
  }
  if (finite(quest.mesoCost) && Number(quest.mesoCost) > 0) {
    if (!finite(profile.mesos)) addUnknown(`필요 메소 ${quest.mesoCost} 보유 여부 미확인`);
    else if (Number(profile.mesos) < Number(quest.mesoCost)) reasons.push(`시작 비용 ${quest.mesoCost} 메소 필요`);
  }
  return { blocked: reasons.length > 0, reasons, verified, confidence: referenceOnly(quest)||quest.conditionsComplete === false && !verified ? 'partial' : 'known' };
}
/** @param {any} input */
export function questMaterialNeeds(quest) {
  const end = new Map(), start = new Map(), startSpent = new Map(), endSpent = new Map(), missing = [];
  for (const [rows, target] of [[quest.requirements ?? [], end], [quest.startRequirements ?? [], start], [(quest.consumedItems ?? []).filter(row => row.stage === 'start'), startSpent], [(quest.consumedItems ?? []).filter(row => row.stage !== 'start'), endSpent]]) for (const row of rows) {
    if (!finite(row.quantity) || !Number.isSafeInteger(Number(row.quantity)) || Number(row.quantity) < 0) { missing.push(`${row.itemId}: 필요·소모 수량 미확인`); continue; }
    target.set(id(row.itemId), (target.get(id(row.itemId)) ?? 0) + Number(row.quantity));
  }
  const required = new Map(), consumed = new Map(), held = new Map();
  for (const key of unique([...end.keys(), ...start.keys(), ...startSpent.keys(), ...endSpent.keys()])) {
    const atStart = startSpent.get(key) ?? 0, atEnd = endSpent.get(key) ?? 0;
    held.set(key, Math.max(start.get(key) ?? 0, end.get(key) ?? 0));
    required.set(key, Math.max(start.get(key) ?? 0, atStart + Math.max(end.get(key) ?? 0, atEnd)));
    consumed.set(key, atStart + atEnd);
  }
  const legacyNoMaterials = !required.size && !consumed.size && quest.conditionEvidence === undefined && quest.clientConsumptionComplete === undefined && quest.costsConfirmed !== false;
  const complete = !missing.length && (quest.costsConfirmed === true || quest.consumptionComplete === true || legacyNoMaterials);
  return { required, consumed, held, complete, missing };
}
/** @param {any} input */
export function recommendQuests({ profile, quests = [], items = [], prices = [], completed = {}, inventory = {}, durations = {}, citizenship = {}, professions = {}, goal = 'progress', now = Date.now() }) {
  const byId = new Map(quests.map(quest => [id(quest.id), quest]));
  const done = { ...completed };
  for (const quest of quests) if (quest.legacyId && completed[id(quest.legacyId)]) done[id(quest.id)] = true;
  const currentJob = currentJobForProfile(profile);
  return quests.filter(quest => !done[id(quest.id)] && jobMatches(quest.jobs, currentJob)).map(quest => {
    const plan = prerequisitePlan(quest, byId, done);
    const gateRows = plan.ordered.map(step => ({ step, evidence: questGateEvidence(step, profile, { citizenship, professions, now }) }));
    const gateReasons = gateRows.flatMap(row => row.evidence.reasons.map(reason => `${row.step.name}: ${reason}`));
    const missing = [...plan.missing], needed = new Map(), consumed = new Map(), consumedBefore = new Map();
    let rewardKnown = true, costKnown = true, preparationKnown = true, timeKnown = true, expKnown = true, reward = 0, cost = 0, purchaseCost = 0, exp = 0, minutes = 0;
    let estimated = false;
    for (const step of plan.ordered) {
      if (step.requirementsComplete === false) { costKnown = preparationKnown = false; missing.push(`${step.name}: 요구 조건 미확인 항목 있음`); }
      if (step.rewardsComplete === false || !finite(step.mesos) || Number(step.mesos) < 0) { rewardKnown = false; missing.push(`${step.name}: 보상 전체 확인 필요`); }
      if ((step.choiceRewards?.length || step.rewardChoices?.length) && !step.selectedRewardId) { rewardKnown = false; missing.push(`${step.name}: 선택·랜덤 보상은 확정 보상과 합산하지 않습니다`); }
      if (finite(step.mesos) && Number(step.mesos) >= 0) reward += Number(step.mesos);
      if (finite(step.mesoCost) && Number(step.mesoCost) >= 0) { cost += Number(step.mesoCost); purchaseCost += Number(step.mesoCost); }
      else if (step.costsConfirmed === true || step.conditionEvidence !== undefined || finite(step.mesoCost)) { costKnown = preparationKnown = false; missing.push(`${step.name}: 시작·완료 진행 메소 비용 미확인`); }
      if (step.conditionsComplete === false && !freshConfirmation(step.conditionsVerifiedAt, now)) missing.push(`${step.name}: 추가 조건 전체는 아직 확인되지 않았습니다`);
      if (finite(step.exp)) exp += Number(step.exp); else expKnown = false;
      const duration = durations[id(step.id)] ?? durations[id(step.legacyId)] ?? step.estimatedMinutes;
      if (positive(duration)) minutes += Number(duration); else { timeKnown = false; missing.push(`${step.name}: 이동 포함 소요 시간 필요`); }
      for (const stack of step.rewardItems ?? []) {
        const item = items.find(row => id(row.id) === id(stack.itemId));
        const price = priceEvidence(prices, stack.itemId, { now, npcSell: item?.npcSell, equipment: item?.category === 'equip' });
        if (price.price === null || !finite(stack.quantity)) { rewardKnown = false; missing.push(`${item?.name ?? stack.itemId}: 보상 가격·수량 미확인`); }
        else { reward += price.price * Number(stack.quantity); estimated ||= !price.certainSale; }
      }
      const materialNeeds = questMaterialNeeds(step), held = materialNeeds.required, spent = materialNeeds.consumed, consumptionKnown = materialNeeds.complete;
      if (materialNeeds.missing.length) { costKnown = preparationKnown = false; missing.push(...materialNeeds.missing); }
      if (!consumptionKnown) { costKnown = false; missing.push(`${step.name}: 보유 조건과 실제 소모량·전체 비용 미확인 · 준비 상한만 계산`); }
      for (const itemId of unique([...held.keys(), ...spent.keys()])) {
        const requirement = Math.max(held.get(itemId) ?? 0, spent.get(itemId) ?? 0), before = consumedBefore.get(itemId) ?? 0;
        needed.set(itemId, Math.max(needed.get(itemId) ?? 0, before + requirement));
        consumedBefore.set(itemId, before + (consumptionKnown ? spent.get(itemId) ?? 0 : requirement));
        consumed.set(itemId, (consumed.get(itemId) ?? 0) + (spent.get(itemId) ?? 0));
      }
    }
    const materials = [];
    for (const [itemId, quantity] of needed) {
      const item = items.find(row => id(row.id) === itemId);
      const inventoryCount = inventory[itemId] ?? (item?.legacyId && !/^\d+$/.test(id(item.legacyId)) ? inventory[id(item.legacyId)] : null);
      const owned = Math.min(quantity, Math.max(0, n(inventoryCount))), buyQuantity = quantity - owned;
      const sale = priceEvidence(prices, itemId, { now, npcSell: item?.npcSell, equipment: item?.category === 'equip' });
      const buy = priceEvidence(prices, itemId, { now, purpose: 'cost', quantity: buyQuantity, equipment: item?.category === 'equip' });
      if (buyQuantity > 0 && buy.price === null) { preparationKnown = false; missing.push(`${item?.name ?? itemId}: 준비 구매 가격 미확인`); }
      else purchaseCost += buyQuantity > 0 ? n(buy.purchaseCost, buyQuantity * n(buy.price)) : 0;
      const consumedQuantity = consumed.get(itemId) ?? 0, ownedConsumed = Math.min(owned, consumedQuantity), consumedToBuy = consumedQuantity - ownedConsumed;
      const consumedBuy = priceEvidence(prices, itemId, { now, purpose: 'cost', quantity: consumedToBuy, equipment: item?.category === 'equip' });
      if ((ownedConsumed > 0 && sale.price === null) || (consumedToBuy > 0 && consumedBuy.price === null)) { costKnown = false; missing.push(`${item?.name ?? itemId}: 소모 재료 판매·구매 가격 미확인`); }
      else cost += ownedConsumed * n(sale.price) + (consumedToBuy > 0 ? n(consumedBuy.purchaseCost, consumedToBuy * n(consumedBuy.price)) : 0);
      if (buyQuantity > 0 && n(buy.minimumPurchaseQuantity) > 1) missing.push(`${item?.name ?? itemId}: 묶음 최소 구매비 포함 · 남는 재료 가치는 수익에 더하지 않음`);
      estimated ||= (owned > 0 && !sale.certainSale) || buy.basis === 'quote';
      materials.push({ itemId, name: item?.name ?? itemId, quantity, consumedQuantity, owned, buyQuantity, sale, buy });
    }
    const blockers = plan.ordered.filter(step => !finite(step.minLevel) && step.clientNoMinimumLevel !== true || finite(step.minLevel) && Number(step.minLevel) > n(profile.level) || finite(step.maxLevel) && Number(step.maxLevel) < n(profile.level) || !jobMatches(step.jobs, currentJob));
    const prerequisites = plan.ordered.filter(step => id(step.id) !== id(quest.id));
    const available = !blockers.length && !plan.missing.length && !gateRows.some(row => row.evidence.blocked);
    const conditionsKnown = gateRows.every(row => row.evidence.confidence === 'known');
    const ready = available && prerequisites.length === 0 && conditionsKnown;
    const net = rewardKnown && costKnown && conditionsKnown && !plan.missing.length ? reward - cost : null;
    const deadline = quest.deadline ? Date.parse(quest.deadline) : null;
    const expired = Number.isFinite(deadline) && deadline < now;
    const required = quest.requiredForAdvancement === true || quest.mandatory === true || /^job advancement$/i.test(String(quest.questType ?? ''));
    const urgent = Number.isFinite(deadline) && deadline >= now && deadline - now <= 24 * 3600000;
    const priority = (available && !expired ? 1000 : 0) + (required ? 500 : 0) + (urgent ? 200 : 0) + (ready ? 100 : 0) + (net !== null && net > 0 ? 20 : 0) + (materials.length && materials.every(row => !row.buyQuantity) ? 10 : 0);
    return { id: id(quest.id), name: quest.name, quest, plan: plan.ordered.map(step => ({ id: id(step.id), name: step.name, minLevel: step.minLevel })), prerequisites, available: available && !expired, ready: ready && !expired, conditionsKnown, gates: gateReasons, expired, required, urgent, priority, reward: rewardKnown ? reward : null, knownPartialReward: reward, cost: costKnown ? cost : null, purchaseCost: preparationKnown ? purchaseCost : null, net, exp: expKnown ? exp : null, minutes: timeKnown ? minutes : null, netPerHour: net !== null && timeKnown ? net * 60 / minutes : null, expPerHour: expKnown && timeKnown ? exp * 60 / minutes : null, estimated, materials, missing: unique([...gateReasons, ...missing, ...blockers.map(step => `${step.name}: 레벨·직업 조건 확인 필요`)]), reasons: [required ? '전직·진행에 필요한 것으로 등록된 퀘스트' : null, urgent ? '24시간 이내 종료' : null, ready ? '미완료 선행 퀘스트 없음' : prerequisites.length ? `${prerequisites.length}개 선행 퀘스트와 함께 계획` : '게임에서 추가 조건 확인 필요', materials.length && materials.every(row => !row.buyQuantity) ? '등록된 필요 재료를 모두 보유' : null].filter(Boolean) };
  }).sort((a, b) => {
    const priority = b.priority - a.priority;
    if (priority) return priority;
    const knownDifference = (left, right) => left === null && right === null ? 0 : left === null ? 1 : right === null ? -1 : right - left;
    if (goal === 'money') return knownDifference(a.netPerHour, b.netPerHour) || knownDifference(a.net, b.net) || b.knownPartialReward - a.knownPartialReward || n(b.quest.minLevel) - n(a.quest.minLevel);
    if (goal === 'exp') return knownDifference(a.expPerHour, b.expPerHour) || knownDifference(a.exp, b.exp) || n(b.quest.minLevel) - n(a.quest.minLevel);
    return knownDifference(a.netPerHour, b.netPerHour) || n(b.quest.minLevel) - n(a.quest.minLevel);
  });
}
const STAT_KEYS = ['attack', 'magicAttack', 'stat', 'accuracy', 'str', 'dex', 'int', 'luk'];
const statsOf = item => Object.fromEntries(STAT_KEYS.map(key => [key, n(item?.stats?.[key] ?? item?.[key])]));
const addStats = (left, right, direction = 1) => Object.fromEntries(STAT_KEYS.map(key => [key, n(left[key]) + n(right[key]) * direction]));
const requirement = item => item.requirements ?? {};
function itemEligible(item, profile) {
  const req = requirement(item);
  const fame = req.fame ?? item.extraRequirements?.fame;
  return n(req.level ?? item.minLevel) <= n(profile.level) && jobMatches(req.jobs ?? item.jobs, currentJobForProfile(profile)) && (!positive(fame) || finite(profile.fame) && Number(profile.fame) >= Number(fame));
}
function equipmentOrder(items, base, currentIds) {
  let stats = { ...base }, remaining = [...items], order = [];
  while (remaining.length) {
    const eligible = remaining.find(item => currentIds.has(id(item.id)) || ['str', 'dex', 'int', 'luk'].every(key => n(stats[key]) >= n(requirement(item)[key])));
    if (!eligible) return null;
    stats = addStats(stats, statsOf(eligible)); order.push(id(eligible.id)); remaining = remaining.filter(item => item !== eligible);
  }
  return order;
}
function conflict(items) {
  const slots = new Set(items.map(item => item.slot));
  return slots.has('한벌옷') && (slots.has('상의') || slots.has('하의')) || items.some(item => item.twoHanded === true) && slots.has('방패');
}
export function equipmentSlot(item) {
  const category = String(item.subCategory ?? '').trim().toLowerCase();
  const fixed = { hat: '모자', top: '상의', bottom: '하의', overall: '한벌옷', gloves: '장갑', shoes: '신발', cape: '망토', shield: '방패', earring: '장신구' };
  if (fixed[category]) return fixed[category];
  return ['one-handed sword', 'two-handed sword', 'one-handed axe', 'two-handed axe', 'one-handed blunt weapon', 'two-handed blunt weapon', 'spear', 'polearm', 'dagger', 'bow', 'crossbow', 'claw', 'wand', 'staff'].includes(category) ? '무기' : null;
}
/** Never fill missing rolled options or wearing requirements with zero when importing a market feed.
 * @param {any} input
 */
export function equipmentCandidatesFromQuotes({ items = [], prices = [], profile, now = Date.now(), maxPerSlot = 10 } = {}) {
  const itemById = new Map(items.map(item => [id(item.id), item]));
  const excluded = [], candidates = [], seen = new Set();
  for (const quote of [...prices].sort((a, b) => n(a.unitPrice ?? a.price) - n(b.unitPrice ?? b.price))) {
    if (quote.type !== 'sell' || quote.active === false) continue;
    const item = itemById.get(id(quote.itemId)), name = item?.name ?? quote.itemName ?? id(quote.itemId);
    let reason = null;
    const slot = item ? equipmentSlot(item) : null;
    if (!item || item.category !== 'equip') continue;
    if (item.isCash === true || item.available === false || item.released === false || /^(?:no|unreleased|future|client-only)$/i.test(String(item.released ?? item.availability))) reason = '캐시·미출시·획득 미확인 장비';
    else if (!slot) reason = '착용 부위 미확인';
    else if (quote.priceBasis === 'bundle' || quote.originalPriceBasis === 'bundle' || n(quote.minimumPurchaseQuantity) > 1) reason = '묶음 전체 구매 조건은 개별 장비 비용과 별도 확인 필요';
    else if (!positive(quote.unitPrice ?? quote.price) || !Number.isFinite(Date.parse(quote.at)) || now - Date.parse(quote.at) > 5 * 60000 || Date.parse(quote.at) > now + 5 * 60000) reason = '5분 이내의 유효한 판매 호가가 아님';
    else if (quote.optionsComplete !== true || !['attack', 'magicAttack', 'str', 'dex', 'int', 'luk', 'accuracy', 'slots'].every(key => finite(quote.options?.[key]) && Number.isInteger(Number(quote.options[key])) && Number(quote.options[key]) >= 0)) reason = '실제 매물의 전체 옵션 미확인';
    else if (!finite(item.requiredLevel) || Number(item.requiredLevel) < 0 || !['str', 'dex', 'int', 'luk'].every(key => finite(item.statRequirements?.[key]) && Number(item.statRequirements[key]) >= 0)) reason = '착용 레벨·스탯 조건 미확인';
    else if (!Array.isArray(item.requiredJobs) || !item.requiredJobs.length && item.jobsComplete !== true && item.requirementsKnown !== true) reason = '착용 직업 조건 미확인';
    else if (positive(item.extraRequirements?.fame) && (!finite(profile.fame) || Number(profile.fame) < Number(item.extraRequirements.fame))) reason = `인기도 ${item.extraRequirements.fame} 착용 조건 확인 필요`;
    else if (!finite(item.requiredGender) || ![0, 1, 2].includes(Number(item.requiredGender))) reason = '착용 성별 조건 미확인';
    else if (Number(item.requiredGender) !== 2 && String(profile.gender) !== String(item.requiredGender)) reason = '캐릭터와 장비의 성별 조건 확인 필요';
    if (reason) { excluded.push({ id: quote.id, name, reason }); continue; }
    const requirements = { level: Number(item.requiredLevel), ...Object.fromEntries(['str', 'dex', 'int', 'luk'].map(key => [key, Number(item.statRequirements[key])])), jobs: item.requiredJobs.length ? item.requiredJobs : ['all'], ...(finite(item.extraRequirements?.fame) ? {fame:Number(item.extraRequirements.fame)} : {}) };
    const candidate = { id: `market-${quote.sourceId ?? 'quote'}-${quote.id ?? item.id + ':' + optionSignature(quote.options)}`, itemId: id(item.id), name, slot, price: n(quote.unitPrice ?? quote.price), stats: { ...quote.options, stat: n(quote.options[JOB_FAMILIES[profile.job] === 'magician' ? 'int' : JOB_FAMILIES[profile.job] === 'thief' ? 'luk' : JOB_FAMILIES[profile.job] === 'bowman' ? 'dex' : 'str']) }, options: quote.options, optionsComplete: true, requirements, requirementsKnown: item.wearingRequirementsComplete !== false, wearingUnknowns: item.wearingRequirementsComplete === false ? item.extraRequirementUnknowns ?? ['추가 착용 조건'] : [], twoHanded: /^Two-Handed/i.test(item.subCategory) || ['Spear', 'Polearm', 'Bow', 'Crossbow', 'Staff', 'Claw'].includes(item.subCategory), at: quote.at, source: quote.source, sourceUrl: quote.sourceUrl, quoteId: quote.id };
    if (!itemEligible(candidate, profile)) { excluded.push({ id: quote.id, name, reason: '현재 레벨·직업·인기도 조건 불충족' }); continue; }
    const signature = `${id(item.id)}:${optionSignature(quote.options)}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    if (candidates.filter(row => row.slot === slot).length >= maxPerSlot) { excluded.push({ id: quote.id, name, reason: `부위별 ${maxPerSlot}개 가져오기 한도` }); continue; }
    candidates.push(candidate);
  }
  return { candidates, excluded, scope: `현재 5분 이내 매물 · 같은 옵션 최저 호가 · 부위별 최대 ${maxPerSlot}개` };
}
/** Reprice only a confirmed item identity with exactly matching, complete options. */
export function repriceEquipmentCandidates(candidates, prices = [], now = Date.now(), maxAgeMs = 5 * 60000) {
  return candidates.map(candidate => {
    if (!candidate.itemId || candidate.optionsComplete !== true) return candidate;
    const matching = prices.filter(row => id(row.itemId) === id(candidate.itemId) && row.type === 'sell' && row.active !== false && row.priceBasis !== 'bundle' && row.originalPriceBasis !== 'bundle' && n(row.minimumPurchaseQuantity, 1) <= 1 && row.optionsComplete === true && optionSignature(row.options) === optionSignature(candidate.options) && Date.parse(row.at) <= now + 5 * 60000 && now - Date.parse(row.at) <= maxAgeMs && positive(row.unitPrice ?? row.price))
      .sort((left, right) => n(left.unitPrice ?? left.price) - n(right.unitPrice ?? right.price) || Date.parse(right.at) - Date.parse(left.at));
    if (!matching.length) return { ...candidate, repricingMissing: true };
    const quote = matching[0];
    return { ...candidate, price: n(quote.unitPrice ?? quote.price), at: quote.at, sourceUrl: quote.sourceUrl || candidate.sourceUrl, source: quote.source, quoteId: quote.id, repriced: true, repricingMissing: false };
  });
}
/** Multiple-choice knapsack with a safe branch bound; never labels an interrupted search exact.
 * @param {any} input
 */
export function optimizeEquipment({ profile, candidates = [], equipped = {}, locked = {}, budget = 0, minAccuracy = 0, weights = { attack: 1, magicAttack: 1, stat: .1 }, targetUtility = null, calibration = {}, maxNodes = 200000, now = Date.now(), maxPriceAgeMs = 24 * 3600000, allowUnknownRequirements = false }) {
  const excluded = [], missing = [], current = Object.values(equipped).filter(Boolean);
  const currentIds = new Set(current.map(item => id(item.id)));
  let base = Object.fromEntries(STAT_KEYS.map(key => [key, n(profile[key])]));
  for (const item of current) base = addStats(base, statsOf(item), -1);
  const normalized = candidates.map((item, index) => ({ ...item, id: id(item.id || `candidate-${index}`), stats: statsOf(item), price: finite(item.price) ? Number(item.price) : null }));
  for (const item of current) if (!normalized.some(row => id(row.id) === id(item.id))) normalized.push({ ...item, id: id(item.id), stats: statsOf(item), price: 0 });
  const usable = normalized.filter(item => {
    let reason = null;
    const timestamp = item.at ? Date.parse(item.at) : null;
    if (!item.slot) reason = '부위 미입력';
    else if (!currentIds.has(id(item.id)) && (item.price === null || item.price < 0)) reason = '실제 매물 가격 없음';
    else if (!currentIds.has(id(item.id)) && Number.isFinite(timestamp) && now - timestamp > maxPriceAgeMs) reason = '오래된 매물 가격';
    else if (!itemEligible(item, profile)) reason = '레벨·직업·인기도 조건 불충족';
    else if (item.requirementsKnown === false && !allowUnknownRequirements && !currentIds.has(id(item.id))) reason = '착용 조건 확인 필요';
    if (reason) { excluded.push({ id: item.id, name: item.name, reason }); return false; }
    if (item.repricingMissing) missing.push(`${item.name}: 5분 이내 동일 옵션 매물이 없어 마지막 확인 가격 사용`);
    if (item.requirementsKnown === false) missing.push(`${item.name}: 착용 조건 미확인`);
    return true;
  }).map(item => ({ ...item, purchaseCost: currentIds.has(id(item.id)) ? 0 : item.price }));
  const slotNames = unique([...usable.map(item => item.slot), ...Object.keys(locked)]);
  const utility = itemStats => STAT_KEYS.reduce((sum, key) => sum + n(itemStats[key]) * n(weights[key]), 0);
  const slots = slotNames.map(slot => {
    let options = usable.filter(item => item.slot === slot);
    if (locked[slot]) options = options.filter(item => id(item.id) === id(locked[slot]));
    else options = [null, ...options];
    // Equal options retain the cheapest observed offer, preserving exact semantics.
    const cheapest = new Map();
    for (const item of options) {
      if (!item) { cheapest.set('empty', null); continue; }
      const key = JSON.stringify([item.stats, requirement(item), item.twoHanded === true, item.requirementsKnown, currentIds.has(id(item.id))]);
      if (!cheapest.has(key) || cheapest.get(key).purchaseCost > item.purchaseCost) cheapest.set(key, item);
    }
    options = [...cheapest.values()].sort((a, b) => utility(b?.stats ?? {}) - utility(a?.stats ?? {}) || n(a?.purchaseCost) - n(b?.purchaseCost));
    return { slot, options, maxUtility: Math.max(0, ...options.map(item => utility(item?.stats ?? {}))) };
  }).sort((a, b) => a.options.length - b.options.length);
  if (slots.some(slot => !slot.options.length)) return { best: null, frontier: [], exact: true, nodes: 0, excluded, missing: unique([...missing, '잠근 장비가 착용 조건·가격 조건을 만족하지 않습니다.']) };
  let best = null, nodes = 0, interrupted = false, feasibleCount = 0;
  const frontier = [];
  const suffix = Array(slots.length + 1).fill(0);
  for (let index = slots.length - 1; index >= 0; index--) suffix[index] = suffix[index + 1] + slots[index].maxUtility;
  const target = finite(targetUtility) ? Number(targetUtility) : null;
  function visit(index, selected, cost, stats, score) {
    if (++nodes > maxNodes) { interrupted = true; return; }
    if (cost > n(budget) || conflict(selected)) return;
    if (target === null && best && score + suffix[index] < best.utility - 1e-9) return;
    if (target !== null && best && cost > best.cost) return;
    if (index === slots.length) {
      const total = addStats(base, stats);
      if (total.accuracy < n(minAccuracy)) return;
      const order = equipmentOrder(selected, base, currentIds);
      if (!order || target !== null && score < target) return;
      feasibleCount++;
      let impact = null;
      const delta = addStats(total, Object.fromEntries(STAT_KEYS.map(key => [key, n(profile[key])])), -1);
      if (positive(calibration.averageDamage) && positive(calibration.monsterHp) && finite(calibration.damagePerAttack) && finite(calibration.damagePerStat)) {
        const nextDamage = Number(calibration.averageDamage) + delta.attack * Number(calibration.damagePerAttack) + delta.stat * Number(calibration.damagePerStat);
        impact = { beforeHits: Math.ceil(Number(calibration.monsterHp) / Number(calibration.averageDamage)), afterHits: nextDamage > 0 ? Math.ceil(Number(calibration.monsterHp) / nextDamage) : null, beforeDamage: Number(calibration.averageDamage), afterDamage: nextDamage, calibrated: true };
      }
      const result = { items: selected, cost, utility: score, stats: total, delta, equipOrder: order, impact };
      if (!frontier.some(row => row.cost <= cost && row.utility >= score && (row.cost < cost || row.utility > score))) {
        for (let i = frontier.length - 1; i >= 0; i--) if (cost <= frontier[i].cost && score >= frontier[i].utility) frontier.splice(i, 1);
        frontier.push(result);
      }
      if (!best || (target !== null ? cost < best.cost || cost === best.cost && score > best.utility : score > best.utility || score === best.utility && cost < best.cost)) best = result;
      return;
    }
    for (const item of slots[index].options) {
      if (interrupted) break;
      visit(index + 1, item ? [...selected, item] : selected, cost + n(item?.purchaseCost), item ? addStats(stats, item.stats) : stats, score + utility(item?.stats ?? {}));
    }
  }
  visit(0, [], 0, Object.fromEntries(STAT_KEYS.map(key => [key, 0])), 0);
  if (interrupted) missing.push(`검색 ${maxNodes.toLocaleString('ko-KR')}회 한도에 도달해 최적해가 보장되지 않습니다.`);
  if (!best) missing.push('예산·명중·착용 조건을 만족하는 조합이 없습니다.');
  if (!positive(calibration.averageDamage)) missing.push('실측 데미지 보정값이 없어 처치 타수 개선은 계산하지 않습니다.');
  return { best, frontier: frontier.sort((a, b) => a.cost - b.cost), exact: !interrupted, nodes: Math.min(nodes, maxNodes), feasibleCount, excluded, missing: unique(missing), candidateCount: usable.length, objective: target === null ? 'max-utility-under-budget' : 'cheapest-meeting-target' };
}
export function snapshotStatus(snapshot, activeSession = null, now = Date.now()) {
  const generated = snapshot?.generatedAt ? Date.parse(snapshot.generatedAt) : NaN;
  const lockUntil = activeSession?.endsAt ? Date.parse(activeSession.endsAt) : NaN;
  const locked = Number.isFinite(lockUntil) && lockUntil > now;
  const ageMs = Number.isFinite(generated) ? Math.max(0, now - generated) : Infinity;
  return { ageMs, locked, stale: ageMs >= RECOMMENDATION_INTERVAL_MS, refreshAllowed: !locked, shouldRefresh: !locked && (!snapshot || ageMs >= RECOMMENDATION_INTERVAL_MS), lockUntil: locked ? new Date(lockUntil).toISOString() : null };
}
