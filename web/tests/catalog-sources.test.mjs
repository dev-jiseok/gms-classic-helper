import test from 'node:test';import assert from 'node:assert/strict';
import {catalogCoverage,sourceTablePage} from '../lib/catalog-sources.mjs';
import {WIKI_TABLES} from '../lib/public-source.mjs';
test('a downloaded table is not complete when storage lost a row or the API total is unknown',()=>{
 const names=WIKI_TABLES.map(t=>t.table),tables=Object.fromEntries(names.map(name=>[name,{complete:true,rows:[{id:1},{id:2}]}])),snapshot={sources:[{id:'wiki',tables:names.map(name=>({name,sourceRows:2,storedRows:2,complete:true}))}]};
 assert.equal(catalogCoverage(snapshot,{tables}).complete,true);tables.portals.rows.pop();assert.equal(catalogCoverage(snapshot,{tables}).complete,false);assert.equal(catalogCoverage(snapshot,{tables}).tables[1].storedRows,1);
 tables.portals.rows.push({id:2});snapshot.sources[0].tables[1].sourceRows=null;assert.equal(catalogCoverage(snapshot,{tables}).complete,false);
 snapshot.sources[0].tables[1].sourceRows=2;snapshot.sources[0].tables[1].name='maps';assert.equal(catalogCoverage(snapshot,{tables}).complete,false);assert.deepEqual(catalogCoverage(snapshot,{tables}).missingTables,['portals']);
});
test('source search preserves false, zero, null and raw relation names across pages',()=>{
 const data={tables:{quest_steps:{rows:[{quest_id:'a',step_number:0,note:null,active:false},{quest_id:'b',step_number:1,note:'Henesys'}],fields:[],complete:true}}};
 assert.deepEqual(sourceTablePage(data,'quest_steps',{limit:1}).rows[0],data.tables.quest_steps.rows[0]);assert.equal(sourceTablePage(data,'quest_steps',{q:'henesys'}).rows[0].quest_id,'b');assert.equal(sourceTablePage(data,'quest_steps',{offset:1,limit:1}).rows[0].quest_id,'b');assert.ok(sourceTablePage(data,'__proto__').error);
});
