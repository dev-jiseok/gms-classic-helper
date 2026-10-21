import test from 'node:test';
import assert from 'node:assert/strict';
import {FEATURE_PATHS,pathForRoute,routeForPath,routeForLocation} from '../lib/site-routes.mjs';
test('all feature URLs round-trip; public aliases and old shared hash links remain usable',()=>{
 assert.equal(Object.keys(FEATURE_PATHS).length,42);
 for(const [id,path] of Object.entries(FEATURE_PATHS)){assert.equal(pathForRoute(id),path);assert.equal(routeForPath(path),id);assert.equal(routeForPath(path+'/'),id);assert.equal(routeForLocation('/','#'+id),id);}
 assert.equal(routeForPath('/leveling'),'guides');assert.equal(routeForPath('/moneyquests'),'money');
 assert.equal(routeForLocation('/market','#gear'),'gear');assert.equal(routeForLocation('/quests','#page-content'),'quests');
});
test('unknown routes and encoded lookalikes do not become server-rendered feature pages',()=>{
 for(const path of ['/api','/unknown','/market/123','//market','/m%61rket'])assert.equal(routeForPath(path),null);
 assert.equal(pathForRoute('constructor'),'/');
});
