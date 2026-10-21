import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {FEATURE_PATHS} from '../web/lib/site-routes.mjs';
const origin=process.env.COMPASS_QA_ORIGIN??'http://127.0.0.1:5188';
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))throw Error('Local built Worker only');
const report={at:new Date().toISOString(),origin,routes:[],assets:[],unknown404:false,privateApi401:false};
for(const [id,path] of Object.entries(FEATURE_PATHS)){
 const r=await fetch(origin+path,{signal:AbortSignal.timeout(15000)});assert.equal(r.status,200,path);const html=await r.text();assert(html.includes('메이플 컴패스'));report.routes.push({id,path,status:r.status});
}
const unknown=await fetch(origin+'/not-a-feature');assert.equal(unknown.status,404);report.unknown404=true;
for(const path of ['/art/classic-village-hero.png','/fonts/maplestory-light.ttf','/fonts/maplestory-bold.ttf']){
 const response=await fetch(origin+path);assert.equal(response.status,200,path);const bytes=Buffer.from(await response.arrayBuffer()),disk=await readFile(new URL('../web/public'+path,import.meta.url));
 const hash=b=>createHash('sha256').update(b).digest('hex');assert.equal(hash(bytes),hash(disk));report.assets.push({path,bytes:bytes.length,sha256:hash(bytes)});
}
assert.equal((await fetch(origin+'/api/state')).status,401);assert.equal((await fetch(origin+'/api/market')).status,401);assert.equal((await fetch(origin+"/api/market/glclme")).status,401);report.privateApi401=true;
const coverage=await (await fetch(origin+"/api/game-data?kind=coverage")).json();assert.equal(coverage.complete,true);assert.equal(coverage.tables.length,17);assert.equal(coverage.normalizedCounts.questSteps,837);report.coverage={tables:17,steps:837,complete:true};
const q=await (await fetch(origin+"/api/game-data?kind=quests&id=80009")).json();assert.equal(q.row.steps.length,6);report.questSteps=6;
const media=await fetch(origin+"/api/game-media?kind=monster&id=2");assert.equal(media.status,200);assert.match(media.headers.get("content-type"),/image/);report.gameMedia=true;
await writeFile(new URL('../research/output/release-0.5.0-build-qa.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify({routes:report.routes.length,assets:report.assets.length,unknown404:report.unknown404,privateApi401:report.privateApi401}));
