// Adapted mechanic facts: CC BY-NC-SA 4.0. Community reference, not verified server code.
export const COMBAT_REFERENCE = {
  source: 'MapleClassic Wiki', sourceUrl: 'https://mapleclassic.wiki/wiki/Damage',
  accuracyUrl: 'https://mapleclassic.wiki/wiki/Accuracy', license: 'CC BY-NC-SA 4.0',
  verifiedAt: '2026-10-21', defenseConfirmed: false,
};
export const WEAPONS = [
  { id: 'sword1', name: '한손검', swing: 1.8, stab: 1.8 },
  { id: 'sword2', name: '두손검', swing: 2.5, stab: 2.5 },
  { id: 'axe1', name: '한손도끼', swing: 2.4, stab: 1.2 },
  { id: 'axe2', name: '두손도끼', swing: 3, stab: 2 },
  { id: 'blunt1', name: '한손둔기', swing: 2.4, stab: 1.2 },
  { id: 'blunt2', name: '두손둔기', swing: 3, stab: 2 },
  { id: 'spear', name: '창', swing: 1.5, stab: 3.5 },
  { id: 'polearm', name: '폴암', swing: 3.5, stab: 1.5 },
  { id: 'dagger', name: '단검', swing: 1, stab: 2 },
  { id: 'bow', name: '활', swing: 2.5, stab: 2.5 },
  { id: 'crossbow', name: '석궁', swing: 2.5, stab: 2.5 },
  { id: 'claw', name: '아대', swing: 2.5, stab: 2.5 },
];
const finite = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const numeric = (value, fallback = 0) => finite(value) ? Number(value) : fallback;
const bound = (value, low, high) => Math.max(low, Math.min(high, value));
const validRange = (value, low, high = Infinity) => finite(value) && Number(value) >= low && Number(value) <= high;
const optionalRange = (value, low, high = Infinity) => value === undefined || validRange(value, low, high);
const validLevel = value => validRange(value, 1) && Number.isInteger(Number(value));
export function baseAccuracy(dex, luk) {
  if (!validRange(dex, 0) || !validRange(luk, 0)) return null;
  return Math.floor(Number(dex) / 3) + Math.floor(Number(luk) / 6) + 5;
}
/** @param {any} input */
export function physicalHitRate({ accuracy, level, monsterLevel, avoid, magic = false } = {}) {
  if (magic) return 1;
  if (!validRange(accuracy, 0) || !validLevel(level) || !validLevel(monsterLevel) || !validRange(avoid, 0)) return null;
  const adjusted = Number(accuracy) * 100 / ((Math.max(0, Number(monsterLevel) - Number(level)) + 51) * 5);
  if (adjusted === 0) return Number(avoid) === 0 ? 1 : 0;
  const f = .3 / (1 + Math.exp((adjusted - Number(avoid)) / 12));
  const low = .95 - f, high = 1.05 + f;
  return bound((high - Number(avoid) / adjusted) / (high - low), 0, 1);
}
/** @param {any} input */
export function accuracyForRate(input = {}, target = .95) {
  if (!validRange(target, 0, 1)) return null;
  if (input.magic) return 0;
  if (physicalHitRate({ ...input, accuracy: 0 }) === null) return null;
  const desired = Number(target);
  if (desired === 0 || physicalHitRate({ ...input, accuracy: 0 }) >= desired) return 0;
  let low = 0, high = 1;
  // Search integer accuracy directly, avoiding ceil(epsilon) at the zero boundary.
  while (high < Number.MAX_SAFE_INTEGER / 2 && physicalHitRate({ ...input, accuracy: high }) < desired) high *= 2;
  if (physicalHitRate({ ...input, accuracy: high }) < desired) return null;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (physicalHitRate({ ...input, accuracy: middle }) >= desired) high = middle;
    else low = middle;
  }
  return high;
}
/** @param {any} input */
export function damageRange(input = {}) {
  const errors = [];
  for (const [key, label] of [['primary', '주스탯'], ['attack', input.magic ? '총 마력' : '무기 공격력']]) if (!validRange(input[key], 0)) errors.push(`${label}에 0 이상의 수치를 입력하세요.`);
  for (const [key, low, high, label] of [['mastery', 0, 10, '마스터리'], ['secondary', 0, Infinity, '부스탯'], ['critChance', 0, 100, '크리티컬 확률'], ['critBonus', 0, 500, '크리티컬 추가 데미지'], ['skillPercent', 0, Infinity, '스킬 계수'], ['basicAttack', 0, Infinity, '주문 기본 공격력']]) if (!optionalRange(input[key], low, high)) errors.push(`${label}의 입력 범위를 확인하세요.`);
  if (input.ap !== undefined && !finite(input.ap)) errors.push('추가 AP를 확인하세요.');
  if (input.defenseMultiplier != null && !validRange(input.defenseMultiplier, 0, 1)) errors.push('방어 후 배율은 0–1 사이로 입력하세요.');
  if (input.magic && input.elementMultiplier !== undefined && !validRange(input.elementMultiplier, 0, 1.25)) errors.push('속성 배율은 0–1.25 사이로 입력하세요.');
  if ((input.level !== undefined || input.monsterLevel !== undefined) && (!validLevel(input.level) || !validLevel(input.monsterLevel))) errors.push('캐릭터와 몬스터 레벨을 모두 1 이상의 정수로 입력하세요.');
  const weapon = WEAPONS.find(row => row.id === (input.weapon ?? 'sword1'));
  if (!input.magic && !weapon) errors.push('지원하는 무기 종류를 선택하세요.');
  if (!input.magic && input.animation !== undefined && !['mixed', 'swing', 'stab'].includes(input.animation)) errors.push('공격 동작을 확인하세요.');
  if (errors.length) return { valid: false, errors, min: null, max: null, average: null, levelPenalty: null, preDefense: input.defenseMultiplier == null, components: [] };
  const mastery = (.1 + numeric(input.mastery) / 10) * .8;
  const attack = Number(input.attack), primary = Number(input.primary), secondary = numeric(input.secondary);
  const diff = Math.max(0, numeric(input.monsterLevel) - numeric(input.level));
  const penalty = diff < 10 ? 1 / (diff * diff * .005 + 1) : 1 / (diff * .05 + 1);
  const factor = penalty * (input.magic ? numeric(input.elementMultiplier, 1) : 1) * numeric(input.defenseMultiplier, 1);
  const critFactor = 1 + numeric(input.critChance) / 100 * numeric(input.critBonus) / 100;
  const rounded = (min, max, weight = 1) => {
    if (factor === 0 || max <= 0) return { min: 0, max: 0, weight, average: 0 };
    const lower = Math.max(1, Math.floor(min * factor)), upper = Math.max(lower, Math.floor(max * factor));
    return { min: lower, max: upper, weight, average: (lower + upper) / 2 * critFactor };
  };
  let components;
  if (input.magic) {
    const basic = numeric(input.basicAttack);
    components = [rounded((basic + attack / 7) * ((attack * 2 * mastery + primary) / 100 + 1), (basic + attack / 7) * ((attack * 2 + primary) / 100 + 1))];
  } else {
    const coefficient = numeric(input.skillPercent, 100) / 100, ap = numeric(input.ap);
    const component = (multiplier, weight) => rounded((.8 + (primary * multiplier * mastery + secondary + ap) / 100) * attack * coefficient, (1 + (primary * multiplier + secondary + ap) / 100) * attack * coefficient, weight);
    // An animation is selected for the cast; averaging the multiplier would invent a narrower range.
    components = input.animation === 'swing' || weapon.swing === weapon.stab ? [component(weapon.swing, 1)] : input.animation === 'stab' ? [component(weapon.stab, 1)] : [component(weapon.swing, .6), component(weapon.stab, .4)];
  }
  if (components.some(row => !Number.isFinite(row.min) || !Number.isFinite(row.max) || !Number.isFinite(row.average))) return { valid: false, errors: ['입력 수치가 계산 가능한 범위를 넘었습니다.'], min: null, max: null, average: null, levelPenalty: penalty, preDefense: input.defenseMultiplier == null, components: [] };
  return { valid: true, errors: [], min: Math.min(...components.map(row => row.min)), max: Math.max(...components.map(row => row.max)), average: components.reduce((sum, row) => sum + row.average * row.weight, 0), levelPenalty: penalty, preDefense: input.defenseMultiplier == null, components };
}
function choose(n, k) { let result = 1; for (let i = 1; i <= k; i++) result = result * (n - i + 1) / i; return result; }
function uniformSumCdf(threshold, ranges) {
  // Normalize first: the six-line convolution should not overflow on large but finite inputs.
  const scale = Math.max(1, ...ranges.flat());
  let fixed = 0; const widths = [];
  for (const [minimum, maximum] of ranges) { fixed += minimum / scale; if (maximum > minimum) widths.push((maximum - minimum) / scale); }
  const x = threshold / scale - fixed;
  if (!widths.length) return x >= 0 ? 1 : 0;
  if (x <= 0) return 0;
  if (x >= widths.reduce((sum, value) => sum + value, 0)) return 1;
  let sum = 0; const count = widths.length;
  for (let mask = 0; mask < 2 ** count; mask++) {
    let shift = 0, sign = 1;
    for (let i = 0; i < count; i++) if (mask & (1 << i)) { shift += widths[i]; sign = -sign; }
    sum += sign * Math.max(0, x - shift) ** count;
  }
  let factorial = 1; for (let i = 2; i <= count; i++) factorial *= i;
  return bound(sum / (factorial * widths.reduce((product, value) => product * value, 1)), 0, 1);
}
/** Continuous-uniform independent damage lines; animation components are shared within a cast.
 * @param {any} input
 */
export function oneCastProbability({ min, max, hits = 1, hp, accuracy = 1, critChance = 0, critBonus = 0, components, hitMode = 'independent' } = {}) {
  if (!validRange(min, 0) || !validRange(max, Number(min)) || !validRange(hits, 1, 6) || !Number.isInteger(Number(hits)) || !validRange(hp, Number.MIN_VALUE) || !validRange(accuracy, 0, 1) || !validRange(critChance, 0, 100) || !validRange(critBonus, 0, 500)) return null;
  if (!['independent', 'shared'].includes(hitMode) || components !== undefined && !Array.isArray(components)) return null;
  if (Array.isArray(components) && components.length) {
    if (components.length > 8 || !components.every(row => validRange(row.weight, 0, 1)) || Math.abs(components.reduce((sum, row) => sum + Number(row.weight), 0) - 1) > 1e-9) return null;
    let result = 0;
    for (const row of components) {
      const chance = oneCastProbability({ min: row.min, max: row.max, hits, hp, accuracy, critChance, critBonus, hitMode });
      if (chance === null) return null;
      result += Number(row.weight) * chance;
    }
    return bound(result, 0, 1);
  }
  const lines = Number(hits), health = Number(hp), hit = Number(accuracy), critical = Number(critChance) / 100, multiplier = 1 + Number(critBonus) / 100;
  if (Number(max) === 0 || hit === 0) return 0;
  if (hitMode === 'shared' && hit !== 1) {
    const conditional = oneCastProbability({ min, max, hits, hp, accuracy: 1, critChance, critBonus });
    return conditional === null ? null : hit * conditional;
  }
  let chance = 0;
  for (let landed = 1; landed <= lines; landed++) {
    const landedProbability = choose(lines, landed) * hit ** landed * (1 - hit) ** (lines - landed);
    for (let crits = 0; crits <= landed; crits++) {
      const criticalProbability = choose(landed, crits) * critical ** crits * (1 - critical) ** (landed - crits);
      const ranges = Array.from({ length: landed }, (_, index) => index < crits ? [Number(min) * multiplier, Number(max) * multiplier] : [Number(min), Number(max)]);
      const floor = ranges.reduce((sum, row) => sum + row[0], 0), ceiling = ranges.reduce((sum, row) => sum + row[1], 0);
      const kill = health <= floor ? 1 : health >= ceiling ? Number(health === ceiling && floor === ceiling) : 1 - uniformSumCdf(health, ranges);
      chance += landedProbability * criticalProbability * kill;
    }
  }
  return Number.isFinite(chance) ? bound(chance, 0, 1) : null;
}
export function validateSkillPlan(skills, points = {}, budgets = {}) {
  if (!Array.isArray(skills) || !points || typeof points !== 'object' || Array.isArray(points) || !budgets || typeof budgets !== 'object' || Array.isArray(budgets)) return ['SP 계획 데이터 형식을 확인하세요.'];
  const errors = [], known = new Set(skills.map(skill => String(skill.id))), byId = new Map(skills.map(skill => [String(skill.id), skill]));
  if (known.size !== skills.length) errors.push('스킬 목록의 중복 ID를 확인하세요.');
  for (const [key, value] of Object.entries(points)) if (!known.has(key) && (!validRange(value, 0) || Number(value) !== 0)) errors.push(`현재 직업에 없는 스킬: ${key}`);
  const tiers = new Set(skills.map(skill => Number(skill.tier)).filter(tier => Number.isInteger(tier) && tier > 0));
  for (const key of Object.keys(budgets)) {
    const tier = Number(key);
    if (Number.isInteger(tier) && tier > 0) tiers.add(tier);
    if (!validRange(budgets[key], 0) || !Number.isInteger(Number(budgets[key]))) errors.push(`${key}차 SP 총량은 0 이상의 정수여야 해요.`);
  }
  const spent = new Map();
  for (const skill of skills) {
    if (!validRange(skill.max, 0) || !Number.isInteger(Number(skill.max)) || !validRange(skill.tier, 0) || !Number.isInteger(Number(skill.tier))) { errors.push(`${skill.name}: 최대 레벨·차수 정보를 확인하세요.`); continue; }
    const raw = points[skill.id] === undefined ? 0 : points[skill.id];
    if (!validRange(raw, 0, skill.max) || !Number.isInteger(Number(raw))) { errors.push(`${skill.name}: 0–${skill.max} 사이의 정수 레벨을 입력하세요.`); continue; }
    const value = Number(raw);
    if (value > 0) for (const req of skill.prerequisites ?? (skill.requires ? [skill.requires] : [])) {
      if (!byId.has(String(req.id))) errors.push(`${skill.name}: 선행 스킬 정보 없음 (${req.name ?? req.id})`);
      else if (!finite(points[req.id]) || Number(points[req.id]) < Number(req.level)) errors.push(`${skill.name}: ${req.name ?? req.id} ${req.level}레벨 필요`);
    }
    if (Number(skill.tier) > 0) spent.set(Number(skill.tier), (spent.get(Number(skill.tier)) ?? 0) + value);
  }
  const visiting = new Set(), visited = new Set();
  function visit(skill) {
    if (visited.has(skill.id) || numeric(points[skill.id]) <= 0) return;
    if (visiting.has(skill.id)) { errors.push(`${skill.name}: 선행 스킬 관계가 순환합니다.`); return; }
    visiting.add(skill.id);
    for (const req of skill.prerequisites ?? (skill.requires ? [skill.requires] : [])) if (byId.has(String(req.id))) visit(byId.get(String(req.id)));
    visiting.delete(skill.id); visited.add(skill.id);
  }
  skills.forEach(visit);
  // A point earned at tier T may fund T or below: each suffix needs enough higher-tier points.
  for (const threshold of [...tiers].sort((a, b) => b - a)) {
    const used = [...spent].filter(([tier]) => tier >= threshold).reduce((sum, [, value]) => sum + value, 0);
    const available = [...tiers].filter(tier => tier >= threshold).reduce((sum, tier) => sum + numeric(budgets[tier]), 0);
    if (used > available) errors.push(threshold === 1 ? '전체 SP가 부족해요.' : `${threshold}차 이상 SP가 부족해요.`);
  }
  return [...new Set(errors)];
}
