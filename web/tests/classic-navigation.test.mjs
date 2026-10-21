import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CLASSIC_NAV_GROUPS,CLASSIC_MOBILE_LINKS,classicGroupForRoute} from '../lib/classic-navigation.mjs';

test('all42 existing features have one home in the six primary navigation groups',async()=>{
 const source=await readFile(new URL('../lib/catalog.ts',import.meta.url),'utf8');
 const features=[...source.split('export const FEATURES = [')[1].split('];')[0].matchAll(/\{id:'([^']+)'/g)].map(row=>row[1]);
 const routes=CLASSIC_NAV_GROUPS.flatMap(group=>group.ids);
 assert.equal(CLASSIC_NAV_GROUPS.length,6);assert.equal(routes.length,42);assert.equal(new Set(routes).size,42);
 assert.deepEqual([...routes].sort(),[...features].sort());
 for(const route of features)assert.ok(classicGroupForRoute(route));
});
test('mobile quick navigation leads to existing groups without hiding full navigation',()=>{
 assert.deepEqual(CLASSIC_MOBILE_LINKS.map(link=>link.id),['today','codex','tools','party','market']);
 for(const link of CLASSIC_MOBILE_LINKS)assert.ok(CLASSIC_NAV_GROUPS.some(group=>group.ids.includes(link.id)));
 for(const route of ['training','gear','money'])assert.equal(classicGroupForRoute(route),'guides');
 assert.equal(classicGroupForRoute('unrecognized'),null);
});
