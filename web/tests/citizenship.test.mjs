import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {citizenshipBoardQuests} from '../lib/citizenship.mjs';
test('same board name resolves through sourced town instead of losing every quest',()=>{
 const rows=[{id:'h',npc:'Community Board',npcId:'235',citizenshipTown:'Henesys'},{id:'k',npc:'Community Board',npcId:'431',citizenshipTown:'Kerning City'},{id:'old',npc:'Community Board (Henesys)'},{id:'other',npc:'Rina',citizenshipTown:'Henesys'},{id:'wiki:k',npc:'Community Board',npcId:'431',citizenshipTown:'Kerning City',referenceOnly:true}];
 assert.deepEqual(citizenshipBoardQuests(rows,'Henesys').map(q=>q.id),['h','old']);
 assert.deepEqual(citizenshipBoardQuests(rows,'Kerning City').map(q=>q.id),['k']);
});
test('current real catalog retains both towns greeting candidates and separates donation variants',()=>{
 const {quests}=JSON.parse(readFileSync(new URL('../content/public-catalog.json',import.meta.url),'utf8'));
 for(const town of ['Henesys','Kerning City']){
  const rows=citizenshipBoardQuests(quests,town),greetings=rows.filter(q=>!String(q.en??q.name).includes('Donat'));
  assert.equal(greetings.length,18);assert.ok(rows.some(q=>q.en?.includes('Donating')));
  assert.equal(greetings.filter(q=>q.repeatable===false).length,9);
  assert.equal(greetings.filter(q=>q.repeatPeriod==='daily').length,9);
 }
 assert.equal(citizenshipBoardQuests(quests,'Henesys').find(q=>q.id==='506018').citizenshipGrade,5);
});
