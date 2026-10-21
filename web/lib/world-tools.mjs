import { priceEvidence } from './recommendations.mjs';
const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
const nonnegative=v=>finite(v)&&Number(v)>=0;
const n=(v,fallback=0)=>finite(v)?Number(v):fallback;
const id=value=>String(value??'');
export const LOOK_SLOTS=['hair','face','hat','faceAccessory','eyeAccessory','earring','overall','top','bottom','gloves','shoes','cape','shield','weapon'];
export const LOOK_SLOT_LABELS={hair:'헤어',face:'얼굴',hat:'모자',faceAccessory:'얼굴 장식',eyeAccessory:'눈 장식',earring:'귀고리',overall:'한벌옷',top:'상의',bottom:'하의',gloves:'장갑',shoes:'신발',cape:'망토',shield:'방패',weapon:'무기'};
export const LOOK_POSES=['stand1','stand2','walk1','walk2','jump','alert','sit','prone','heal','shoot1','stabO1','swingO1'];
export const DEFAULT_GAME_LOOK={version:1,skinId:2000,pose:'stand1',frame:0,flip:false,animated:false,slots:{hair:'30000',face:'20000',top:'1040002',bottom:'1060002',shoes:'1072001'}};
export function equipmentSlot(item) {
  const category=String(item?.subCategory||item?.typeInfo?.subCategory||'').toLowerCase().replace(/^cash\s+/,'');
  if(category==='hair')return 'hair';if(category==='face')return 'face';
  const code=Math.floor(Number(item?.id)/10000);
  return ({100:'hat',101:'faceAccessory',102:'eyeAccessory',103:'earring',104:'top',105:'overall',106:'bottom',107:'shoes',108:'gloves',109:'shield',110:'cape'})[code]||(code>=121&&code<=170?'weapon':null);
}
export function normalizeGameLook(value={}) {
  const slots={};
  for(const slot of LOOK_SLOTS) {
    const selected=value.slots?.[slot];
    if(/^\d{4,7}$/.test(id(selected)))slots[slot]=id(selected);
  }
  if(!Object.keys(slots).length)Object.assign(slots,DEFAULT_GAME_LOOK.slots);
  if(slots.overall){delete slots.top;delete slots.bottom;}
  return {version:1,skinId:Math.max(2000,Math.min(2099,Math.floor(n(value.skinId,2000)))),pose:LOOK_POSES.includes(value.pose)?value.pose:'stand1',frame:Math.max(0,Math.min(15,Math.floor(n(value.frame)))),flip:value.flip===true,animated:value.animated===true,slots};
}
export function equipGameLook(look,item) {
  const normalized=normalizeGameLook(look),slot=equipmentSlot(item);
  if(!slot)throw new Error('이 아이템은 코디에 표시되는 장비가 아닙니다.');
  normalized.slots[slot]=id(item.id);
  if(slot==='overall'){delete normalized.slots.top;delete normalized.slots.bottom;}
  if(slot==='top'||slot==='bottom')delete normalized.slots.overall;
  return normalized;
}
export function gameCharacterUrl(look) {
  const value=normalizeGameLook(look);
  const items=LOOK_SLOTS.map(slot=>value.slots[slot]).filter(Boolean).join(',');
  const path=value.animated?'Character/animated/':'Character/';
  return `https://maplestory.io/api/MCW/1/${path}${value.skinId}/${items}/${value.pose}/${value.animated?0:value.frame}?padding=12&flipX=${value.flip}`;
}
export function encodeGameLook(look) {return btoa(JSON.stringify(normalizeGameLook(look))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export function decodeGameLook(encoded) {
  if(typeof encoded!=='string'||encoded.length>5000||!/^[a-zA-Z0-9_-]+$/.test(encoded))throw new Error('코디 링크 형식을 확인해 주세요.');
  const raw=JSON.parse(atob(encoded.replace(/-/g,'+').replace(/_/g,'/')));
  if(raw.version!==1||!raw.slots||typeof raw.slots!=='object')throw new Error('지원하지 않는 코디 링크입니다.');
  return normalizeGameLook(raw);
}
export function npcPurchasePrice(shops,itemId,{resident=false,grade=0,includeLimited=false}={}) {
  const eligible=(shops||[]).filter(s=>id(s.itemId)===id(itemId)&&(!s.currency||/^mesos?$/i.test(s.currency))&&(!s.citizenshipGrade||n(grade)>=s.citizenshipGrade)&&(!s.purchaseLimit||includeLimited));
  return eligible.map(s=>({...s,unitPrice:resident&&nonnegative(s.residentPrice)?Number(s.residentPrice):nonnegative(s.price)?Number(s.price):null})).filter(s=>s.unitPrice!==null).sort((a,b)=>a.unitPrice-b.unitPrice)[0]||null;
}
/** @param {any} input */
export function evaluateRecipe(input={}) {
  const {recipe,batches=1,items=[],prices=[],shops=[],inventory={},manualPrices={},outputSalePrice=null,outputBuyPrice=null,resident=false,grade=0,includeLimited=false,successPercent=100,taxPercent=0,professionLevel=0,characterLevel=0,now=Date.now()}=input;
  if(!recipe)return null;
  const count=Math.max(1,Math.min(10000,Math.floor(n(batches,1)))),success=Math.max(0,Math.min(100,n(successPercent,100)))/100,tax=Math.max(0,Math.min(100,n(taxPercent)))/100;
  const byId=new Map(items.map(i=>[id(i.id),i]));
  const missing=[];
  const rows=(recipe.ingredients||[]).map(ingredient=>{
    const item=byId.get(id(ingredient.itemId))||{},quantity=n(ingredient.quantity)*count,owned=Math.min(quantity,Math.max(0,n(inventory[ingredient.itemId]))),needed=quantity-owned;
    const manual=Object.prototype.hasOwnProperty.call(manualPrices,id(ingredient.itemId))&&nonnegative(manualPrices[ingredient.itemId])?Number(manualPrices[ingredient.itemId]):null;
    const equipment=['equip','equipment'].includes(String(item.category).toLowerCase());
    const market=priceEvidence(prices,ingredient.itemId,{purpose:'cost',now,maxAgeMs:60*60*1000,equipment});
    const shop=npcPurchasePrice(shops,ingredient.itemId,{resident,grade,includeLimited});
    const choices=[manual===null?null:{price:manual,basis:'manual',source:'직접 확인한 단가'},shop?{price:shop.unitPrice,basis:'npc-buy',source:shop.npcName,sourceUrl:shop.sourceUrl}:null,market.price===null?null:market].filter(Boolean).sort((a,b)=>a.price-b.price);
    // A manual override is an explicit user assumption, not an extra competing quote.
    const purchase=manual!==null?{price:manual,basis:'manual',source:'직접 확인한 단가'}:choices[0]||{price:null,basis:'unknown',source:null};
    const opportunity=manual!==null?{price:manual,basis:'manual',source:'직접 평가한 보유 가치'}:priceEvidence(prices,ingredient.itemId,{purpose:'revenue',now,npcSell:item.npcSell,equipment});
    if(needed>0&&purchase.price===null)missing.push(`${ingredient.name||ingredient.itemId}: 구매 단가 미확인`);
    if(owned>0&&opportunity.price===null)missing.push(`${ingredient.name||ingredient.itemId}: 보유 재료 가치 미확인`);
    return {...ingredient,item,quantity,owned,needed,purchase,opportunity,cashCost:needed===0?0:purchase.price===null?null:needed*purchase.price,economicCost:(owned===0||opportunity.price!==null)&&(needed===0||purchase.price!==null)?owned*n(opportunity.price)+needed*n(purchase.price):null,shop};
  });
  const fee=nonnegative(recipe.mesoCost)?Number(recipe.mesoCost)*count:null;
  if(fee===null)missing.push('제작 수수료 미확인');
  if(recipe.ingredientsComplete!==true)missing.push('재료 목록 완전성 미확인');
  const cash=fee!==null&&rows.every(r=>r.cashCost!==null)?rows.reduce((sum,r)=>sum+r.cashCost,fee):null;
  const economic=missing.length?null:rows.reduce((sum,r)=>sum+r.economicCost,fee);
  const output=byId.get(id(recipe.outputItemId))||{},equipment=['equip','equipment'].includes(String(output.category).toLowerCase());
  const outputMarketBuy=priceEvidence(prices,recipe.outputItemId,{purpose:'cost',now,maxAgeMs:60*60*1000,equipment}),outputNPC=npcPurchasePrice(shops,recipe.outputItemId,{resident,grade,includeLimited});
  const buy=nonnegative(outputBuyPrice)?{price:Number(outputBuyPrice),basis:'manual',source:'직접 확인한 완제품 가격'}:[outputMarketBuy,outputNPC?{price:outputNPC.unitPrice,basis:'npc-buy',source:outputNPC.npcName}:null].filter(p=>p&&p.price!==null).sort((a,b)=>a.price-b.price)[0]||{price:null,basis:'unknown'};
  const sale=nonnegative(outputSalePrice)?{price:Number(outputSalePrice),basis:'manual',source:'직접 평가한 판매 단가'}:priceEvidence(prices,recipe.outputItemId,{purpose:'revenue',now,npcSell:output.npcSell,equipment});
  const units=n(recipe.outputCount,1)*count,expectedUnits=units*success,expectedXP=n(recipe.craftExp)*count*success;
  const revenue=sale.price===null?null:expectedUnits*sale.price*(1-tax);
  const gates={profession:n(professionLevel)>=n(recipe.level,1),character:n(characterLevel)>=Math.max(10,5*n(recipe.level,1))};
  return {recipe,batches:count,rows,fee,cashRequired:cash,economicCost:economic,missing,successAssumption:success,outputUnits:units,expectedUnits,outputBuy:buy,outputSale:sale,expectedRevenue:revenue,expectedProfit:revenue!==null&&economic!==null?revenue-economic:null,costPerExpectedUnit:economic!==null&&expectedUnits>0?economic/expectedUnits:null,buyInsteadCost:buy.price===null?null:buy.price*expectedUnits,buyVsBuildSavings:buy.price!==null&&economic!==null?buy.price*expectedUnits-economic:null,expectedXP,costPerXP:expectedXP>0&&economic!==null?economic/expectedXP:null,netCostPerXP:expectedXP>0&&economic!==null&&revenue!==null?(economic-revenue)/expectedXP:null,gates};
}
