import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CLASSIC_LAUNCH as L,LAUNCH_EVENTS as E,launchEventStatus,launchEventEligibility,launchPriority} from '../lib/launch-data.mjs';

test('official launch facts keep cap, PQ channels and account trade conditions separate',()=>{
 assert.equal(L.levelCap,100);assert.equal(L.firstAdvancementLevel,10);assert.equal(L.secondAdvancementLevel,30);
 assert.equal(L.partyQuest.minimumLevel,21);assert.equal(L.partyQuest.maximumLevel,null);
 assert.deepEqual(L.partyQuest.channels,[3,4,5,6,7,8,9,10,11,12]);
 assert.deepEqual(L.tradeRestriction,{minimumLevel:15,hoursAfterLevelReached:24,scope:'account'});
 assert.equal(L.housing.sharedByAccount,true);assert.equal(L.housing.maximumHomes,1);
});
test('event period is actual UTC, never the article publication date or premature game access',()=>{
 const journey=E.find(e=>e.id==='journey-begins'),marks=E.find(e=>e.id==='marks-left-behind');
 assert.equal(journey.start,'2026-10-21T18:00:00Z');assert.equal(journey.end,'2026-11-18T23:59:00Z');
 assert.equal(launchEventStatus(journey,'2026-10-21T17:59:59Z'),'upcoming');
 assert.equal(launchEventStatus(marks,'2026-10-21T05:00:00Z'),'launch-pending');
 assert.equal(launchEventStatus(journey,'2026-10-21T18:00:00Z'),'active');
 assert.equal(launchEventStatus(journey,'2026-11-19T00:00:00Z'),'ended');
 assert.equal(new Date(journey.start).toLocaleString('en-CA',{timeZone:'Asia/Seoul',hour12:false}).includes('03:00'),true);
});
test('level, past beta participation and GM admission are independent eligibility gates',()=>{
 const journey=E[0],beta=E.find(e=>e.betaRequired),gm=E.find(e=>e.gmEligibilityRequired);
 assert.equal(launchEventEligibility(journey,{level:9}).status,'ineligible');
 assert.equal(launchEventEligibility(journey,{level:10}).status,'eligible');
 assert.equal(launchEventEligibility(journey,{}).status,'unknown');
 assert.equal(launchEventEligibility(beta,{level:100}).status,'unknown');
 assert.equal(launchEventEligibility(beta,{level:100},{betaEligible:false}).status,'ineligible');
 assert.equal(launchEventEligibility(gm,{level:100}).status,'unknown');
});
test('daily rewards retain expiry and unknown reset; UI priority does not invent optimal profit',()=>{
 const journey=E[0];assert.equal(journey.requiredItemCount,30);assert.equal(journey.requiredMonsterLevel,10);
 assert.equal(journey.repeat,'daily-account');assert.equal(journey.resetTimeUtc,null);assert.equal(journey.petExpiresAt,journey.end);
 assert.match(launchPriority({level:1},'2026-10-21T05:00:00Z').title,/10레벨/);
 assert.equal(launchPriority({level:20},'2027-01-01T00:00:00Z').eventId,null);
 assert.equal(E.length,8);assert.equal(new Set(E.map(e=>e.id)).size,8);
 for(const e of E)assert.ok(Date.parse(e.end)>Date.parse(e.start));
});
test('generated JSON, all-job official guides and missing Athena board relation stay consistent',async()=>{
 const structured=JSON.parse(await readFile(new URL('../content/launch-events.json',import.meta.url)));
 assert.deepEqual(structured.events,E);assert.deepEqual(structured.launch,L);
 const catalog=JSON.parse(await readFile(new URL('../content/public-catalog.json',import.meta.url)));
 const athena=catalog.quests.find(q=>q.id==='506018');assert.equal(athena.npc,'Community Board');assert.equal(athena.npcId,'235');assert.equal(athena.citizenshipTown,'Henesys');assert.equal(athena.citizenshipGrade,5);assert.equal(athena.conditionsComplete,false);
 for(const [town,npcId] of [['Henesys','235'],['Kerning City','431']])assert.equal(catalog.quests.filter(q=>q.npcId===npcId&&q.citizenshipTown===town&&!q.en.includes('Donating')).length,18);
 assert.equal(catalog.guides.filter(g=>g.sourceId==='nexon-official').length,4);
 assert.ok(catalog.guides.every(g=>g.maxLevel<=100));
});
