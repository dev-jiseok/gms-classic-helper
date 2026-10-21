import { JOB_IDS } from './job-data.mjs';
import { recordedLootValue } from './hunt-session.mjs';
export const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
export const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
export const format = value => value != null && value !== '' && Number.isFinite(Number(value)) ? Math.round(Number(value)).toLocaleString('ko-KR') : '확인 필요';
export const mesos = value => value == null ? '가격 없음' : value === '' || !Number.isFinite(Number(value)) ? '확인 필요 메소' : `${Number(value)!==0&&Math.abs(Number(value))<1e-12?Number(value).toExponential(4):Number(value).toLocaleString('ko-KR',{maximumFractionDigits:12})} 메소`;
export function initialState() {
  return { version: 1, activeProfile: 'fighter', profiles: [
    { id: 'fighter', name: '나의 모험가', role: '나', job: 'fighter', level: 1, str: 12, dex: 5, int: 4, luk: 4, attack: 17, accuracy: 10, mesos: 0, exp: 0, goal: 'balance', location: '메이플 아일랜드', note: '' },
    { id: 'assassin', name: '표도 친구', role: '친구 1', job: 'assassin', level: 1, str: 4, dex: 5, int: 4, luk: 12, attack: 17, accuracy: 10, mesos: 0, exp: 0, goal: 'balance', location: '메이플 아일랜드', note: '' },
    { id: 'hunter', name: '궁수 친구', role: '친구 2', job: 'hunter', level: 1, str: 5, dex: 12, int: 4, luk: 4, attack: 17, accuracy: 10, mesos: 0, exp: 0, goal: 'balance', location: '메이플 아일랜드', note: '' },
  ], completed: {}, inventory: {}, tasks: {}, favorites: [], prices: [], hunts: [], posts: [], skills: {}, gear: [], notes: [], events: [], timers: [], characterLook: {}, settings: { room: 'our-party', sound: true }, updatedAt: null };
}
export function normalizeState(input) {
  const base = initialState();
  if (!input || input.version !== 1 || !Array.isArray(input.profiles) || input.profiles.length < 1 || input.profiles.length > 50) throw new Error('GMS Classic Helper 백업 파일을 선택해 주세요.');
  const ids=new Set();
  for(const p of input.profiles){if(!p||typeof p!== 'object'||typeof p.id!=='string'||!p.id.trim()||p.id.length>50||['__proto__','constructor','prototype'].includes(p.id)||ids.has(p.id))throw new Error('프로필 ID가 비어 있거나 중복되어 있어요.');ids.add(p.id);}
  const result = { ...base, ...input };
  for (const key of ['favorites', 'prices', 'hunts', 'posts', 'gear', 'notes', 'events', 'timers']) if (!Array.isArray(result[key])) throw new Error('백업 데이터 형식을 확인해 주세요.');
  for (const key of ['completed', 'inventory', 'tasks', 'skills', 'settings', 'characterLook']) if (!result[key] || typeof result[key] !== 'object' || Array.isArray(result[key])) throw new Error('백업 데이터 형식을 확인해 주세요.');
  result.profiles = input.profiles.map(p => ({ ...base.profiles[0], ...p, id: String(p.id).slice(0, 50), name: String(p.name??'새 모험가').slice(0, 40), job: JOB_IDS.includes(p.job) ? p.job : 'fighter', level: Math.floor(clamp(p.level, 1, 200)) }));
  if (!result.profiles.some(p => p.id === result.activeProfile)) result.activeProfile = result.profiles[0].id;
  return result;
}
const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
export function initials(value) { return [...String(value)].map(c => { const n = c.charCodeAt(0)-44032; return n>=0 && n<=11171 ? INITIALS[Math.floor(n/588)] : c; }).join(''); }
export function matches(value, query) { const v = String(value).toLowerCase().replace(/\s/g,''), q = String(query).toLowerCase().replace(/\s/g,''); return !q || v.includes(q) || initials(v).includes(q); }
export function latestPrice(prices, itemId, type = null) { return prices.filter(p => String(p.itemId)===String(itemId) && (!type || p.type===type) && number(p.price)>0).sort((a,b)=>String(b.at).localeCompare(String(a.at)))[0] ?? null; }
export function questValue(quest, items, prices, inventory = {}, minutes = null) {
  let marketKnown = quest.requirementsComplete !== false && quest.rewardsComplete !== false && quest.mesos != null, reward = number(quest.mesos), cost = 0;
  for (const r of quest.rewardItems ?? []) { const item = items.find(i=>String(i.id)===String(r.itemId)); const p = latestPrice(prices,r.itemId,'sold') ?? latestPrice(prices,r.itemId); if (!p && item?.npcSell == null) marketKnown=false; reward += number(p?.price ?? item?.npcSell)*number(r.quantity); }
  for (const r of quest.requirements ?? []) { const item=items.find(i=>String(i.id)===String(r.itemId));const p=latestPrice(prices,r.itemId); if(!p && item?.npcSell==null) marketKnown=false;cost += number(p?.price ?? item?.npcSell)*number(r.quantity); }
  const net=reward-cost; return { reward,cost,net,marketKnown,perHour: minutes && minutes>0 ? net*60/minutes:null,owned: (quest.requirements??[]).every(r=>number(inventory[r.itemId])>=number(r.quantity)) };
}
export function huntMetrics(hunt) {
 const minutes=number(hunt.minutes); if(minutes<=0) return null;
 const exp=number(hunt.exp),itemized=hunt.lootMode==='itemized'||Array.isArray(hunt.lootItems)&&hunt.lootItems.length>0;
 const known=value=>value!==null&&value!==''&&value!==undefined&&Number.isFinite(Number(value));
 // Old aggregate forms always supplied their costs. Retain compatibility for
 // absent legacy fields; an explicitly unknown value is never a verified zero.
 const legacyAmount=key=>hunt[key]===undefined&&!itemized?0:known(hunt[key])?Number(hunt[key]):null;
 const loot=itemized?recordedLootValue(hunt.lootItems??[]):legacyAmount('loot');
 const cash=['mesoDelta','potions','travel'].map(legacyAmount);
 const net=loot!==null&&cash.every(value=>value!==null)?cash[0]+loot-cash[1]-cash[2]:null;
 return {expPerHour:exp*60/minutes,mesosPerHour:net===null?null:net*60/minutes,net,minutes,incomeKnown:net!==null};
}
export function rankHuntRecords(records, goal='balance') {
 const groups={};
 for(const h of records){const m=huntMetrics(h);if(!m||!h.map)continue;const r=groups[h.map]??{map:h.map,minutes:0,exp:0,net:0,sessions:0,incomeKnown:true};r.minutes+=m.minutes;r.exp+=number(h.exp);if(m.net===null)r.incomeKnown=false;else r.net+=m.net;r.sessions++;groups[h.map]=r;}
 const rows=Object.values(groups).map(r=>({...r,net:r.incomeKnown?r.net:null,expPerHour:r.exp*60/r.minutes,mesosPerHour:r.incomeKnown?r.net*60/r.minutes:null}));
 const normalize=(value,min,max)=>max===min?1:(value-min)/(max-min);
 const knownNet=rows.filter(r=>r.incomeKnown),expMin=Math.min(...rows.map(r=>r.expPerHour)),expMax=Math.max(...rows.map(r=>r.expPerHour)),netMin=Math.min(...knownNet.map(r=>r.mesosPerHour)),netMax=Math.max(...knownNet.map(r=>r.mesosPerHour));
 return rows.filter(r=>goal!=='mesos'||r.incomeKnown).map(r=>({...r,score:goal==='exp'?r.expPerHour:goal==='mesos'?r.mesosPerHour:normalize(r.expPerHour,expMin,expMax)*.55+(r.incomeKnown?normalize(r.mesosPerHour,netMin,netMax)*.45:0)})).sort((a,b)=>b.score-a.score);
}
export function hitEstimate({ damage, hp, accuracy = 100, attackSeconds = .8, exp = 0 }) {
 const d=number(damage), h=number(hp), a=clamp(accuracy,0,100)/100;
 if(d<=0 || h<=0 || a<=0 || number(attackSeconds)<=0) return null;
 const hits=Math.ceil(h/d),seconds=hits*number(attackSeconds)/a;
 return {hits,seconds,killsPerHour:3600/seconds,expPerHour:number(exp)*3600/seconds,oneHit:d>=h};
}
export function scrollOdds(chance, slots, minimum) {
 const p=clamp(chance,0,100)/100,n=clamp(slots,0,10),m=clamp(minimum,0,n);let sum=0;
 const choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;};
 for(let k=m;k<=n;k++)sum+=choose(n,k)*p**k*(1-p)**(n-k);return {probability:sum,expected:n*p};
}
export function simulateScroll(chance,slots,destroyOnFail=0,rng=Math.random) { const result=[];let destroyed=false;for(let i=0;i<slots&&!destroyed;i++){const success=rng()<chance/100;destroyed=!success&&rng()<destroyOnFail/100;result.push(success?'success':destroyed?'destroyed':'fail');}return {result,successes:result.filter(x=>x==='success').length,destroyed}; }
export function shuffle(names, random = Math.random) {const a=[...names];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function shortestPath(edges, start, goal) { const q=[[start]],seen=new Set([start]);while(q.length){const path=q.shift(),node=path.at(-1);if(node===goal)return path;for(const e of edges){const next=e[0]===node?e[1]:e[1]===node?e[0]:null;if(next&&!seen.has(next)){seen.add(next);q.push([...path,next]);}}}return null; }
export function parseMarketCsv(text) { const rows=text.trim().split(/\r?\n/); const out=[];for(const [idx,line] of rows.entries()){const c=line.split(/[\t,]/).map(x=>x.trim());if(idx===0&&/item|아이템/i.test(c[0]))continue;if(c.length<2||!Number.isFinite(Number(c[1]))||Number(c[1])<=0)throw new Error(`${idx+1}행의 아이템 ID와 단가를 확인해 주세요.`);out.push({id:`import-${Date.now()}-${idx}`,itemId:c[0],price:Number(c[1]),type:['buy','sell','sold'].includes(c[2])?c[2]:'sell',source:c[3]||'직접 입력',at:c[4]&&!isNaN(Date.parse(c[4]))?new Date(c[4]).toISOString():new Date().toISOString(),quantity:1});}return out; }
