import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogMedia,gameMediaUrl,monsterMetadataUrl,questGiverId,selectMonsterPose} from '../lib/game-media.mjs';

test('actual MCW Ribbon Pig framebooks select stand rather than unavailable mob icon',()=>{
 const framebooks={die1:3,hit1:1,move:3,stand:3};
 assert.equal(selectMonsterPose(framebooks),'stand');
 assert.equal(gameMediaUrl({kind:'monster',id:'10',framebooks}),'https://maplestory.io/api/MCW/1/mob/10/render/stand/0');
 assert.equal(gameMediaUrl({kind:'monsters',id:10,framebooks,animated:true}),'https://maplestory.io/api/MCW/1/mob/10/render/animated/stand');
});
test('Tutorial Jr Sentinel has no stand: choose its actual move frames',()=>{
 assert.equal(selectMonsterPose({die1:5,hit1:1,move:3}),'move');
 assert.equal(selectMonsterPose({fly:4,attack1:8}),'fly');
 assert.equal(selectMonsterPose({die1:5,hit1:1} ),null);
 assert.equal(selectMonsterPose({stand:0,move:3}),'move');
 assert.equal(gameMediaUrl({kind:'monster',id:10}),null);
});
test('noncanonical or unsafe IDs never become image requests',()=>{
 for(const id of ['wiki:Meso','ribbon-pig','2/../3','1?x=y','uuid-123',null,undefined]){
  assert.equal(gameMediaUrl({kind:'item',id}),null);assert.equal(monsterMetadataUrl(id),null);
 }
});
test('quest and recipe artwork uses actual giver/output IDs without guessing a name match',()=>{
 assert.equal(questGiverId({npc:'히나',npcId:'1'}),'1');
 assert.equal(questGiverId({npc:'히나'}),null);
 assert.deepEqual(catalogMedia('quests',{id:'1000',npc:'히나',npcId:'1'}),{kind:'npc',id:'1',name:'히나'});
 assert.deepEqual(catalogMedia('recipes',{id:'92050000:1',name:'가넷',outputItemId:'4020100'}),{kind:'item',id:'4020100',name:'가넷'});
});
test('NPC, map and item assets keep the MCW catalog ID namespace',()=>{
 assert.equal(gameMediaUrl({kind:'npcs',id:1}),'https://maplestory.io/api/MCW/1/npc/1/icon');
 assert.equal(gameMediaUrl({kind:'maps',id:10000000}),'https://maplestory.io/api/MCW/1/map/10000000/minimap');
 assert.equal(gameMediaUrl({kind:'items',id:4000010}),'https://maplestory.io/api/MCW/1/item/4000010/icon');
});
