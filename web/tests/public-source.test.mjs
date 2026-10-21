import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {WIKI_TABLES,parseCargoSchema,cargoRequestUrl,cargoRows,paginationComplete} from '../lib/public-source.mjs';

test('public schema extracts every field and declared zero without a copied subset',()=>{
 const schema=parseCargoSchema('Table structure:</p><ol><li><strong>id</strong> - <tt>Integer</tt></li><li><strong>description</strong> - <tt>Wikitext</tt></li></ol>This table has <b>0</b> rows altogether','quests');
 assert.deepEqual(schema.fields,[{name:'id',type:'Integer'},{name:'description',type:'Wikitext'}]);assert.equal(schema.declaredRows,0);
 assert.throws(()=>parseCargoSchema('Forbidden','quests'),/schema/);
});
test('Cargo requests carry all fields, stable ordering and a bounded exact offset',()=>{
 const url=new URL(cargoRequestUrl('quest_steps',[{name:'quest_id'},{name:'notes'}],500));
 assert.equal(url.searchParams.get('fields'),'_pageName=page,quest_id,notes');assert.equal(url.searchParams.get('order_by'),'_ID');assert.equal(url.searchParams.get('offset'),'500');
 assert.throws(()=>cargoRequestUrl('quests;DELETE',['id']),/identifier/);assert.throws(()=>cargoRequestUrl('quests',['id'],-1),/pagination/);
});
test('full pages never imply complete coverage, including an exact 500-row total',()=>{
 assert.equal(paginationComplete(500,500),false);assert.equal(paginationComplete(0,500),true);assert.equal(paginationComplete(499,500),true);
 assert.throws(()=>cargoRows({error:{code:'ratelimited'}}),/ratelimited/);assert.throws(()=>cargoRows({cargoquery:[null]}),/response/);
 assert.deepEqual(cargoRows({cargoquery:[{title:{quantity:'0',unknown:null}}]}),[{quantity:'0',unknown:null}]);
});
test('all 17 required public tables are uniquely included',()=>{
 assert.equal(WIKI_TABLES.length,17);assert.equal(new Set(WIKI_TABLES.map(r=>r.table)).size,17);
 for(const name of ['quest_steps','shops','shop_items','quest_rewards','monster_spawns'])assert.ok(WIKI_TABLES.some(r=>r.table===name));
});
test('shipped source snapshot retains every schema column and complete public row count',async()=>{
 const tables=JSON.parse(await readFile(new URL('../content/source-tables.json',import.meta.url)));
 const meta=JSON.parse(await readFile(new URL('../content/catalog-sources.json',import.meta.url)));
 assert.equal(meta.status,'complete');assert.equal(Object.keys(tables.tables).length,17);
 for(const entry of Object.values(tables.tables)){
  assert.equal(entry.complete,true);assert.equal(entry.rows.length,entry.sourceRows);assert.equal(entry.rows.length,entry.storedRows);assert.match(entry.sha256,/^[a-f0-9]{64}$/);
  for(const row of entry.rows)for(const field of entry.fields)assert.ok(Object.hasOwn(row,field.name),field.name+' missing');
 }
 assert.equal(tables.tables.quest_steps.rows.length,837);assert.equal(tables.tables.shops.rows.length,30);
});
