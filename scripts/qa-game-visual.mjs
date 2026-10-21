import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {initialState} from '../web/lib/engine.mjs';
const origin=process.env.COMPASS_QA_ORIGIN??'http://127.0.0.1:5187',base=new URL(origin);
if(base.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(base.hostname))throw Error('Loopback QA only');
const output=new URL('../research/output/',import.meta.url);await mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),scope:'Actual public game PNG/GIFs and local app; isolated in-memory profile state',pages:[],errors:[],images:[],screenshots:[]};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
let page;
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'ko-KR',timezoneId:'Asia/Seoul'});
 let memory=initialState(),revision=0;memory.profiles[0]={...memory.profiles[0],level:35,currentJob:'fighter',name:'이미지 QA 전용'};
 await context.route('**/api/**',async route=>{const req=route.request(),url=new URL(req.url());if(url.origin===base.origin&&url.pathname==='/api/state'){
  if(req.method()==='PUT'){const body=req.postDataJSON();memory=body.state;revision++;return route.fulfill({json:{revision,updatedAt:new Date().toISOString()}});}
  return route.fulfill({json:{state:memory,revision}});
 }if(url.origin===base.origin&&!['GET','HEAD','OPTIONS'].includes(req.method()))return route.fulfill({status:403,json:{error:'Read-only QA'}});return route.continue();});
 page=await context.newPage();page.setDefaultTimeout(25000);
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith('https://maplestory.io/api/MCW/1/')&&/(?:render|icon|minimap)/.test(r.url()))report.images.push({url:r.url(),status:r.status(),type:r.headers()['content-type']??null});});
 await page.goto(origin+'/signin-with-chatgpt?return_to=/');
 async function visit(route,kind,query){console.log('Visit '+route+' '+query);await page.goto(origin+'/#'+route,{waitUntil:'domcontentloaded'});const search=page.locator('input[aria-label="'+kind+' 전체 검색"]');await search.waitFor();if(query)await search.fill(query);await page.waitForFunction(()=>document.querySelector('.catalog-grid')?.getAttribute('aria-busy')==='false');await page.locator('.catalog-entry-main').first().waitFor();await page.waitForTimeout(600);}
 async function sample(name){await page.waitForTimeout(350);const stats=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,ready:[...document.querySelectorAll('.catalog-entry .game-visual.is-ready img')].filter(i=>i.naturalWidth>0).length,broken:[...document.querySelectorAll('.game-visual img')].filter(i=>i.complete&&i.naturalWidth===0&&getComputedStyle(i).display!=='none').length,dialogReady:[...document.querySelectorAll('dialog[open] .game-visual.is-ready img')].filter(i=>i.naturalWidth>0).length}));report.pages.push({name,...stats});assert.ok(stats.width<=stats.viewport+1,`${name}: overflow`);assert.equal(stats.broken,0,`${name}: visible broken image`);return stats;}
 await visit('codex','몬스터','Ribbon Pig');await page.locator('.catalog-entry-monsters .game-visual.is-ready').first().waitFor();await sample('desktop monster card');
 await page.locator('.catalog-entry-main').first().click();await page.locator('dialog[open] .catalog-detail-title .game-visual.is-ready').waitFor();await sample('desktop monster detail');
 let path=new URL('game-visual-monster-desktop.png',output);await page.screenshot({path:path.pathname});report.screenshots.push(path.pathname);
 await page.getByRole('button',{name:'닫기',exact:true}).click();
 await visit('quests','퀘스트','Bringing a Mirror to Heena');await page.locator('.catalog-entry-quests .game-visual.is-ready').first().waitFor();await page.locator('.catalog-entry-main').first().click();await page.locator('dialog[open] .catalog-detail-title .game-visual.is-ready').waitFor();await page.locator('dialog[open] .catalog-required-row .game-visual.is-ready').first().waitFor();await sample('desktop quest giver and item');
 path=new URL('game-visual-quest-desktop.png',output);await page.screenshot({path:path.pathname});report.screenshots.push(path.pathname);
 await page.setViewportSize({width:390,height:844});await sample('mobile quest detail');path=new URL('game-visual-quest-mobile.png',output);await page.screenshot({path:path.pathname});report.screenshots.push(path.pathname);await page.getByRole('button',{name:'닫기',exact:true}).click();await sample('mobile quest list');
 await visit('npcs','NPC · 상점','Heena');await page.locator('.catalog-entry-npcs .game-visual.is-ready').first().waitFor();await sample('mobile NPC card');
 await visit('maps','맵','Lith Harbor');await page.locator('.catalog-entry-maps .game-visual.is-ready').first().waitFor();await page.locator('.catalog-entry-main').first().click();await page.locator('dialog[open] .catalog-minimap .game-visual.is-ready').waitFor();await sample('mobile map minimap');path=new URL('game-visual-map-mobile.png',output);await page.screenshot({path:path.pathname});report.screenshots.push(path.pathname);
 // A source failure must keep a named, fixed-size placeholder rather than a
 // broken image, an endless skeleton, or an unusable catalog entry.
 await page.getByRole('button',{name:'닫기',exact:true}).click();await context.route('https://maplestory.io/api/MCW/1/npc/1/icon',route=>route.abort());await context.route('**/api/game-media?kind=npc&id=1*',route=>route.abort());
 await visit('npcs','NPC · 상점','Heena');await page.locator('.catalog-entry-npcs .game-visual.is-fallback').first().waitFor();assert.match(await page.locator('.catalog-entry-npcs .game-visual-fallback').first().innerText(),/히나|Heena/);await sample('mobile missing image named fallback');
 assert.equal(report.errors.length,0);assert.ok(report.images.some(r=>r.status===200&&r.url.includes('/mob/10/render/')));assert.ok(report.images.some(r=>r.status===200&&r.url.includes('/npc/')));assert.ok(report.images.some(r=>r.status===200&&r.url.includes('/item/')));assert.ok(report.images.some(r=>r.status===200&&r.url.includes('/map/10000000/minimap')));
 report.finishedAt=new Date().toISOString();await writeFile(new URL('game-visual-qa-20261021.json',output),JSON.stringify(report,null,2));console.log(JSON.stringify({pages:report.pages.length,errors:report.errors.length,successfulImages:report.images.filter(r=>r.status===200).length,report:new URL('game-visual-qa-20261021.json',output).pathname}));
}catch(e){if(page){await page.screenshot({path:new URL('game-visual-qa-failure.png',output).pathname});report.failure={message:e.message,text:(await page.locator('body').innerText()).slice(-6000),visuals:await page.locator('dialog[open] .game-visual').evaluateAll(els=>els.map(el=>({label:el.getAttribute('aria-label'),classes:el.className,img:el.querySelector('img')?.src}))).catch(()=>[])};await writeFile(new URL('game-visual-qa-20261021.json',output),JSON.stringify(report,null,2));}throw e;}finally{await browser.close();}
