import { CURRENT_JOB_CODES, currentJobForProfile, jobMatches, priceEvidence, questGateEvidence, questMaterialNeeds } from './recommendations.mjs';
import { mapRoute, searchKey } from './public-catalog.mjs';
import { npcPurchasePrice } from './world-tools.mjs';
const id = value => String(value ?? '');
const finite = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const nonnegative = value => finite(value) && Number(value) >= 0;
const positive = value => finite(value) && Number(value) > 0;
const unique = values => [...new Set(values)];
export const QUEST_JOB_CODES = CURRENT_JOB_CODES;

/** One shared ancestor is visited once; completed nodes stop traversal. */
export function questClosure(selectedIds, quests, completed = {}) {
  const byId = new Map(quests.map(quest => [id(quest.id), quest]));
  const done = { ...completed };
  for (const quest of quests) if (quest.legacyId && completed[id(quest.legacyId)]) done[id(quest.id)] = true;
  const ordered = [], errors = [], visiting = new Set(), seen = new Set(), depths = new Map();
  function visit(key) {
    key = id(key);
    if (done[key] || seen.has(key)) return depths.get(key) ?? -1;
    if (visiting.has(key)) { errors.push(`선행 관계 순환: ${byId.get(key)?.name ?? key}`); return 0; }
    const quest = byId.get(key);
    if (!quest) { errors.push(`선행 퀘스트 정보 없음: ${key}`); return 0; }
    visiting.add(key); let depth = 0;
    for (const parent of quest.prerequisiteIds ?? []) if (!done[id(parent)]) depth = Math.max(depth, visit(parent) + 1);
    visiting.delete(key); seen.add(key); depths.set(key, depth); ordered.push(quest);
    return depth;
  }
  const selected = unique((selectedIds ?? []).map(id));
  if (selected.length > 50) errors.push('한 계획에는 최대 50개 의뢰를 선택해 주세요.');
  for (const key of selected.slice(0, 50)) visit(key);
  return { ordered, errors: unique(errors), done, depths, byId };
}
/** Resolve only explicit NPC identifiers or one unambiguous exact factual name. */
export function questNpcLocation(quest, phase, npcs = [], maps = [], mapChoice = null) {
  const pickup = phase === 'pickup';
  const npcId = pickup ? quest.npcId ?? quest.giverNpcId : quest.turnInNpcId ?? quest.finishNpcId;
  const name = pickup ? quest.npc ?? quest.giverNpc : quest.turnIn ?? quest.finishNpc ?? (quest.turnInSameAsGiver === true ? quest.npc : null);
  const matches = npcId != null ? npcs.filter(npc => id(npc.id) === id(npcId)) : name ? npcs.filter(npc => [npc.name, npc.en, npc.wikiPage].some(value => value && searchKey(value) === searchKey(name))) : [];
  const explicitMaps = pickup ? quest.giverMapIds : quest.turnInMapIds;
  const mapIds = unique((explicitMaps ?? (matches.length === 1 ? matches[0].mapIds ?? [] : [])).map(id)).filter(key => maps.some(map => id(map.id) === key));
  const selected = mapChoice && mapIds.includes(id(mapChoice)) ? id(mapChoice) : mapIds.length === 1 ? mapIds[0] : null;
  return { npcId: matches.length === 1 ? id(matches[0].id) : npcId ? id(npcId) : null, name: matches.length === 1 ? matches[0].name : name ?? 'NPC 미확인', mapIds, mapId: selected, sourceUrl: matches.length === 1 ? matches[0].sourceUrl ?? quest.sourceUrl : quest.sourceUrl, missing: !name && npcId == null ? 'NPC 미확인' : !mapIds.length ? 'NPC 위치 관계 미확인' : !selected ? '여러 위치 중 방문할 맵 선택 필요' : null };
}
function amounts(rows) {
  const result = new Map(), missing = [];
  for (const row of rows ?? []) {
    const key = id(row.itemId), quantity = Number(row.quantity ?? row.count);
    if (!key || !finite(row.quantity ?? row.count) || !Number.isSafeInteger(quantity) || quantity < 0) { missing.push(`${row.name ?? key}: 재료 수량 미확인`); continue; }
    result.set(key, (result.get(key) ?? 0) + quantity);
  }
  return { values: result, missing };
}
function conditionalReward(row) {
  return row.choiceGroup != null || row.choice_group != null || row.job != null || row.gender != null || finite(row.chancePercent) && Number(row.chancePercent) < 100 || finite(row.probability) && Number(row.probability) < 1 || row.prop != null;
}
/** Best-case sharing is only a mathematical bound; server counter sharing is unverified. */
export function sharedKillObjectives(ordered) {
  const groups = new Map(), ancestors = new Map();
  for (const quest of ordered) {
    const parents = new Set();
    for (const parent of quest.prerequisiteIds ?? []) { parents.add(id(parent)); for (const key of ancestors.get(id(parent)) ?? []) parents.add(key); }
    ancestors.set(id(quest.id), parents);
    for (const goal of quest.killRequirements ?? []) {
      const key = id(goal.monsterId);
      if (!key) continue;
      const group = groups.get(key) ?? { monsterId: key, name: goal.name ?? key, quests: [] };
      const quantity = positive(goal.quantity) && Number.isSafeInteger(Number(goal.quantity)) ? Number(goal.quantity) : null;
      group.quests.push({ questId: id(quest.id), questName: quest.name, quantity }); groups.set(key, group);
    }
  }
  return [...groups.values()].map(group => {
    const complete = group.quests.every(row => row.quantity !== null), longest = new Map();
    for (const row of group.quests) { const previous = group.quests.filter(other => ancestors.get(row.questId)?.has(other.questId)); longest.set(row.questId, (row.quantity ?? 0) + Math.max(0, ...previous.map(other => longest.get(other.questId) ?? 0))); }
    const separateKills = complete ? group.quests.reduce((sum, row) => sum + row.quantity, 0) : null;
    const bestCaseKillsLowerBound = complete ? Math.max(0, ...longest.values()) : null;
    return { ...group, separateKills, bestCaseKillsLowerBound, possibleSavingsUpperBound: complete ? separateKills - bestCaseKillsLowerBound : null, serverSharingVerified: false };
  });
}
/** @param {any} input */
export function buildQuestItinerary({ selectedIds = [], quests = [], items = [], npcs = [], maps = [], portals = [], shops = [], profile, completed = {}, inventory = {}, inventoryVerifiedFor = '', prices = [], citizenship = {}, professions = {}, durations = {}, travelMinutes = null, travelMesos = null, stepState = {}, mapChoices = {}, startMapId = '', now = Date.now() } = {}) {
  const closure = questClosure(selectedIds, quests, completed), selected = new Set(selectedIds.map(id));
  const missing = [...closure.errors], materialMap = new Map(), rewards = [], choices = [], steps = [];
  let requirementsKnown = true, consumptionKnown = true, feesKnown = true, rewardsKnown = true, conditionsKnown = true, expKnown = true, timeKnown = nonnegative(travelMinutes), exp = 0, rewardValue = 0, fees = 0, minutes = nonnegative(travelMinutes) ? Number(travelMinutes) : 0;
  const currentJob = currentJobForProfile(profile), jobCode = QUEST_JOB_CODES[currentJob];
  for (const quest of closure.ordered) {
    const key = id(quest.id), state = stepState[key] ?? {}, effective = { ...quest, ...(state.conditionsVerifiedAt ? { conditionsVerifiedAt: state.conditionsVerifiedAt } : {}) };
    const gate = questGateEvidence(effective, profile, { citizenship, professions, now });
    const blockers = [...gate.reasons];
    if (!finite(quest.minLevel) && quest.clientNoMinimumLevel !== true || finite(quest.minLevel) && Number(profile.level) < Number(quest.minLevel) || finite(quest.maxLevel) && Number(profile.level) > Number(quest.maxLevel)) blockers.push('레벨 조건 확인 필요');
    if (!jobMatches(quest.jobs, currentJob)) blockers.push('현재 직업 조건 불충족');
    if (Array.isArray(quest.clientJobCodes) && quest.clientJobCodes.length && !quest.clientJobCodes.map(Number).includes(jobCode)) blockers.push('클라이언트의 정확한 직업 코드 조건 불충족');
    if (quest.requirementsComplete !== true) { requirementsKnown = false; missing.push(`${quest.name}: 요구 재료·조건 전체 미확인`); }
    const needs = questMaterialNeeds(quest), consumed = {values:needs.consumed,missing:needs.missing}, required = {values:needs.required,missing:[]};
    const costsKnown = needs.complete && nonnegative(quest.mesoCost);
    if (!nonnegative(quest.mesoCost)) { feesKnown = false; missing.push(`${quest.name}: 시작·완료 진행 메소 비용 미입력`); }
    if (!costsKnown) { consumptionKnown = false; missing.push(`${quest.name}: 보유 조건과 실제 소모 재료 구분·진행 메소 비용 전체 미확인`); }
    missing.push(...required.missing, ...consumed.missing);
    if (required.missing.length || consumed.missing.length) requirementsKnown = consumptionKnown = false;
    for (const itemId of unique([...required.values.keys(), ...consumed.values.keys()])) {
      const need = required.values.get(itemId) ?? 0, use = consumed.values.get(itemId) ?? 0;
      const row = materialMap.get(itemId) ?? { itemId, requirementSum: 0, confirmedConsumedQuantity: 0, possessionMaximum: 0, preparationQuantity: 0, consumedBefore: 0, consumptionKnown: true, quests: [] };
      row.requirementSum += Math.max(need, use); row.confirmedConsumedQuantity += use; row.possessionMaximum = Math.max(row.possessionMaximum, needs.held.get(itemId) ?? 0);
      row.preparationQuantity = Math.max(row.preparationQuantity, row.consumedBefore + Math.max(need, use));
      row.consumedBefore += costsKnown ? use : Math.max(need, use); row.consumptionKnown &&= costsKnown; row.quests.push(key); materialMap.set(itemId, row);
    }
    if (quest.rewardsComplete !== true || !nonnegative(quest.mesos)) { rewardsKnown = false; missing.push(`${quest.name}: 확정 보상 전체 미확인`); }
    if (nonnegative(quest.mesos)) rewardValue += Number(quest.mesos);
    if (nonnegative(quest.exp)) exp += Number(quest.exp); else expKnown = false;
    if (nonnegative(quest.mesoCost)) fees += Number(quest.mesoCost);
    for (const reward of quest.rewardItems ?? []) {
      if (conditionalReward(reward)) { choices.push({ ...reward, questId: key }); continue; }
      const item = items.find(item => id(item.id) === id(reward.itemId));
      const value = priceEvidence(prices, reward.itemId, { now, npcSell: item?.npcSell, equipment: item?.category === 'equip' });
      if (!nonnegative(reward.quantity) || value.price === null) rewardsKnown = false;
      else rewardValue += Number(reward.quantity) * value.price;
      rewards.push({ ...reward, questId: key, name: item?.name ?? reward.name ?? id(reward.itemId), price: value });
    }
    choices.push(...(quest.rewardChoices ?? []).map(reward => ({ ...reward, questId: key })));
    if (gate.confidence !== 'known' || blockers.length) conditionsKnown = false;
    const duration = durations[key];
    if (nonnegative(duration)) minutes += Number(duration); else { timeKnown = false; missing.push(`${quest.name}: 목표 수행 시간 미입력`); }
    const pendingParents = (quest.prerequisiteIds ?? []).map(id).filter(parent => !closure.done[parent]);
    steps.push({ id: key, name: quest.name, selected: selected.has(key), depth: closure.depths.get(key), prerequisiteIds: (quest.prerequisiteIds ?? []).map(id), pendingParents, readyNow: !pendingParents.length && !blockers.length && gate.confidence === 'known', blockers: unique(blockers), conditionsKnown: gate.confidence === 'known', accepted: state.accepted === true, objectivesDone: state.objectivesDone === true, duration: nonnegative(duration) ? Number(duration) : null, pickup: questNpcLocation(quest, 'pickup', npcs, maps, mapChoices[key + ':pickup']), turnIn: questNpcLocation(quest, 'turnIn', npcs, maps, mapChoices[key + ':turnIn']), sourceUrl: quest.sourceUrl });
  }
  const inventoryKey = JSON.stringify([...materialMap.values()].map(row => [row.itemId, row.preparationQuantity]).sort((a, b) => a[0].localeCompare(b[0])));
  const purchaseEvidence = (itemId, quantity, equipment) => {
    const market = priceEvidence(prices, itemId, { now, purpose: 'cost', quantity, equipment });
    const shop = npcPurchasePrice(shops, itemId);
    const npc = shop ? { price: shop.unitPrice, purchaseCost: shop.unitPrice * quantity, minimumPurchaseQuantity: 1, basis: 'npc-buy', source: shop.npcName, sourceUrl: shop.sourceUrl, at: null } : null;
    return [market, npc].filter(value => value && value.price !== null).sort((left, right) => left.purchaseCost - right.purchaseCost)[0] ?? market;
  };
  let purchasingKnown = requirementsKnown && feesKnown, consumptionValueKnown = consumptionKnown, purchaseCost = fees, consumptionCost = fees, knownPartialPurchaseCost = fees;
  const materials = [...materialMap.values()].map(row => {
    const item = items.find(item => id(item.id) === row.itemId), ownInput = inventory[row.itemId] ?? (item?.legacyId ? inventory[id(item.legacyId)] : undefined);
    const ownedKnown = nonnegative(ownInput) || inventoryVerifiedFor === inventoryKey;
    const owned = nonnegative(ownInput) ? Math.floor(Number(ownInput)) : 0, shortage = Math.max(0, row.preparationQuantity - owned);
    const sale = priceEvidence(prices, row.itemId, { now, npcSell: item?.npcSell, equipment: item?.category === 'equip' });
    const buy = purchaseEvidence(row.itemId, shortage, item?.category === 'equip');
    const cash = shortage === 0 ? 0 : buy.price === null ? null : buy.purchaseCost;
    if (!ownedKnown || cash === null) { purchasingKnown = false; missing.push(`${item?.name ?? row.itemId}: 보유 수량·구매비 확인 필요`); }
    if (cash !== null) { purchaseCost += cash; knownPartialPurchaseCost += cash; }
    const ownedConsumed = Math.min(owned, row.confirmedConsumedQuantity), needConsumed = row.confirmedConsumedQuantity - ownedConsumed;
    const consumedBuy = purchaseEvidence(row.itemId, needConsumed, item?.category === 'equip');
    const economic = row.consumptionKnown && ownedKnown && (ownedConsumed === 0 || sale.price !== null) && (needConsumed === 0 || consumedBuy.price !== null) ? ownedConsumed * (sale.price ?? 0) + (needConsumed > 0 ? consumedBuy.purchaseCost : 0) : null;
    if (economic === null) consumptionValueKnown = false; else consumptionCost += economic;
    if (needConsumed > 0 && consumedBuy.minimumPurchaseQuantity > 1 && needConsumed % consumedBuy.minimumPurchaseQuantity !== 0) { consumptionValueKnown = false; missing.push(`${item?.name ?? row.itemId}: 남는 묶음 재료의 가치 미평가`); }
    return { ...row, name: item?.name ?? row.itemId, owned, ownedKnown, shortage, sale, buy, purchaseCost: cash, consumptionValue: economic };
  });
  const visits = [];
  for (const depth of unique(steps.map(step => step.depth)).sort((a, b) => a - b)) {
    const layer = steps.filter(step => step.depth === depth);
    for (const step of layer) if (!step.accepted) visits.push({ questId: step.id, questName: step.name, phase: 'pickup', ...step.pickup, actionable: step.readyNow });
    for (const step of layer) visits.push({ questId: step.id, questName: step.name, phase: 'turnIn', ...step.turnIn, actionable: step.accepted && step.objectivesDone && !step.blockers.length });
  }
  let from = maps.some(map => id(map.id) === id(startMapId)) ? id(startMapId) : null;
  const sourcedPortals = portals.filter(edge => edge.sourceUrl || edge.sourceId);
  const route = visits.map(visit => {
    const result = from && visit.mapId ? mapRoute({ maps, portals: sourcedPortals }, from, visit.mapId, { level: profile.level, allowConditional: false, allowTransport: false }) : { path: [], edges: [], reason: !from ? '출발지 또는 앞선 NPC 위치 확인 필요' : visit.missing };
    const leg = { ...visit, fromMapId: from, path: result.path, edges: result.edges, reason: result.reason, sourceUrls: unique([visit.sourceUrl, ...result.edges.map(edge => edge.sourceUrl)].filter(Boolean)) };
    from = visit.mapId; return leg;
  });
  if (!nonnegative(travelMinutes)) missing.push('NPC 방문 이동 시간 미입력');
  if (!nonnegative(travelMesos)) missing.push('이동 비용 미입력');
  const actualConsumptionCost = consumptionValueKnown && nonnegative(travelMesos) ? consumptionCost + Number(travelMesos) : null;
  const netValue = rewardsKnown && requirementsKnown && conditionsKnown && actualConsumptionCost !== null && !closure.errors.length ? rewardValue - actualConsumptionCost : null;
  return { steps, materials, route, killObjectives: sharedKillObjectives(closure.ordered), selectedCount: selected.size, completedSelected: [...selected].filter(key => closure.done[key]), inventoryKey, prerequisitesAdded: steps.filter(step => !step.selected).length, exp: expKnown ? exp : null, guaranteedRewardValue: rewardsKnown ? rewardValue : null, knownPartialRewardValue: rewardValue, rewards, choices, preparationPurchaseCost: purchasingKnown ? purchaseCost : null, knownPartialPurchaseCost, consumptionCost: actualConsumptionCost, netValue, minutes: timeKnown ? minutes : null, valuePerMinute: netValue !== null && timeKnown && minutes > 0 ? netValue / minutes : null, missing: unique(missing), errors: closure.errors, scope: '선택한 의뢰와 확인된 선행의 묶음 계획 · 전 레벨 전역 최적화나 서버 동시 카운트 보장 아님' };
}
