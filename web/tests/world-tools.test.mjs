import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_GAME_LOOK, decodeGameLook, encodeGameLook, equipmentSlot, equipGameLook, evaluateRecipe, gameCharacterUrl, normalizeGameLook, npcPurchasePrice } from '../lib/world-tools.mjs';

test('real game item slots and outfit layer conflicts are normalized',()=>{
  assert.equal(equipmentSlot({id:'30000',subCategory:'Hair'}),'hair');
  assert.equal(equipmentSlot({id:'20000',subCategory:'Face'}),'face');
  assert.equal(equipmentSlot({id:'1302000',subCategory:'One-Handed Sword'}),'weapon');
  assert.equal(equipmentSlot({id:'2000000',subCategory:'Potion'}),null);
  const overall=equipGameLook(DEFAULT_GAME_LOOK,{id:'1050000'});
  assert.equal(overall.slots.top,undefined);assert.equal(overall.slots.bottom,undefined);assert.equal(overall.slots.overall,'1050000');
  const top=equipGameLook(overall,{id:'1040002'});assert.equal(top.slots.overall,undefined);assert.equal(top.slots.top,'1040002');
});
test('game render URLs stay on the verified MCW host and sanitize imported poses',()=>{
  const look=normalizeGameLook({skinId:2001,pose:'../../private',frame:-4,slots:{hat:'https://attacker.invalid',hair:'30000',face:'20000'}});
  const url=gameCharacterUrl(look);
  assert.ok(url.startsWith('https://maplestory.io/api/MCW/1/Character/2001/30000,20000/stand1/0'));
  assert.equal(look.slots.hat,undefined);assert.equal(look.frame,0);
  const animated=gameCharacterUrl({...look,animated:true,pose:'walk1'});assert.ok(animated.includes('/Character/animated/2001/'));
});
test('share links round-trip only validated look data',()=>{
  const before=normalizeGameLook({...DEFAULT_GAME_LOOK,flip:true,animated:true});
  assert.deepEqual(decodeGameLook(encodeGameLook(before)),before);
  assert.throws(()=>decodeGameLook('bad!payload'));
  assert.throws(()=>decodeGameLook(btoa(JSON.stringify({version:9,slots:{}})).replace(/=/g,'')));
});
test('NPC prices respect resident qualification, grade and finite stock',()=>{
  const shops=[{itemId:'ore',price:100,residentPrice:80,currency:'Mesos',npcName:'Town'},{itemId:'ore',price:1,residentPrice:1,citizenshipGrade:5,purchaseLimit:1,currency:'Mesos',npcName:'Limited'}];
  assert.equal(npcPurchasePrice(shops,'ore').unitPrice,100);
  assert.equal(npcPurchasePrice(shops,'ore',{resident:true}).unitPrice,80);
  assert.equal(npcPurchasePrice(shops,'ore',{resident:true,grade:5}).unitPrice,80);
  assert.equal(npcPurchasePrice(shops,'ore',{resident:true,grade:5,includeLimited:true}).unitPrice,1);
});
const recipe={id:'smith:1',level:1,mesoCost:100,outputItemId:'ingot',outputCount:1,craftExp:3,ingredientsComplete:true,ingredients:[{itemId:'ore',name:'Ore',quantity:5}]};
const items=[{id:'ore',name:'Ore',category:'etc',npcSell:10},{id:'ingot',category:'etc',npcSell:20}];
const shops=[{itemId:'ore',price:100,currency:'Mesos',npcName:'Shop'},{itemId:'ingot',price:800,currency:'Mesos',npcName:'Finished Shop'}];
test('owned materials lower cash need while retaining an opportunity cost',()=>{
  const result=evaluateRecipe({recipe,items,shops,inventory:{ore:2},characterLevel:10,professionLevel:1});
  assert.equal(result.rows[0].needed,3);
  assert.equal(result.cashRequired,400); // 3 new ore *100 +100 fee.
  assert.equal(result.economicCost,420); // Owned2 *NPCsale10 included.
  assert.equal(result.buyVsBuildSavings,380);
  assert.equal(result.gates.character,true);
});
test('missing prices never silently turn crafting into free production',()=>{
  const result=evaluateRecipe({recipe,items,shops:[],inventory:{},characterLevel:1,professionLevel:0});
  assert.equal(result.cashRequired,null);assert.equal(result.economicCost,null);assert.equal(result.costPerExpectedUnit,null);assert.equal(result.gates.character,false);assert.equal(result.gates.profession,false);assert.ok(result.missing.length);
});
test('success and tax assumptions apply once to expected output, not inputs',()=>{
  const result=evaluateRecipe({recipe,items,shops,batches:2,manualPrices:{ore:20},outputSalePrice:1000,successPercent:50,taxPercent:10,characterLevel:10,professionLevel:1});
  assert.equal(result.economicCost,400);assert.equal(result.outputUnits,2);assert.equal(result.expectedUnits,1);assert.equal(result.expectedRevenue,900);assert.equal(result.expectedProfit,500);assert.equal(result.expectedXP,3);assert.equal(result.costPerExpectedUnit,400);
});
test('stale market asks cannot supply an apparently current crafting purchase price',()=>{
  const now=Date.parse('2026-10-21T12:00:00Z');
  const result=evaluateRecipe({recipe,items,shops:[],prices:[{itemId:'ore',price:1,type:'sell',at:'2026-10-21T10:00:00Z'}],now});
  assert.equal(result.rows[0].purchase.price,null);assert.equal(result.cashRequired,null);
});
