import {chromium} from 'playwright-core';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {initialState} from '../web/lib/engine.mjs';
const origin=process.env.COMPASS_QA_ORIGIN??'http://127.0.0.1:5187';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Loopback only');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report={at:new Date().toISOString(),errors:[],screenshots:[],checks:[],images:[]};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1050},locale:'ko-KR',timezoneId:'Asia/Seoul'});
 let memory=initialState(),revision=0;
 await context.route('**/api/state',async route=>{if(route.request().method()==='PUT'){memory=route.request().postDataJSON().state;revision++;return route.fulfill({json:{revision}});}return route.fulfill({json:{state:memory,revision}});});
 await context.route('**/api/**',async route=>{if(new URL(route.request().url()).pathname==='/api/state')return route.fallback();if(!['GET','HEAD'].includes(route.request().method()))return route.fulfill({status:403,json:{error:'QA blocks writes'}});return route.fallback();});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(origin+'/signin-with-chatgpt?return_to=/');await page.goto(origin+'/');
 await page.locator('.classic-home').waitFor();await page.locator('.classic-release-board').waitFor();await page.waitForTimeout(4000);
 assert.equal(await page.locator('.classic-feature-card').count(),6);report.checks.push('six image feature cards');
 const bg=await page.locator('.classic-village-hero').evaluate(async element=>{const src=getComputedStyle(element).backgroundImage.match(/url\("?([^\")]+)/)?.[1];const image=new Image();image.src=src;await image.decode();return {width:image.naturalWidth,height:image.naturalHeight};});
 assert(bg.width>1500);report.checks.push({hero:bg});
 const desktop=new URL('../research/output/classic-home-desktop.png',import.meta.url).pathname;await page.screenshot({path:desktop,fullPage:true});report.screenshots.push(desktop);
 await page.locator('.classic-home-search').click();await page.locator('dialog').waitFor();report.checks.push('hero search opens real global search');await page.keyboard.press('Escape');
 await page.locator('.classic-next-row input').first().check();await page.waitForTimeout(1500);assert.equal(Object.values(memory.tasks[memory.profiles[0].id]??{}).filter(Boolean).length,1);report.checks.push('home tasks persist in isolated state');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(500);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const mobile=new URL('../research/output/classic-home-mobile.png',import.meta.url).pathname;await page.screenshot({path:mobile,fullPage:true});report.screenshots.push(mobile);
 report.images=await page.locator('.classic-home .game-visual img').evaluateAll(images=>images.map(i=>({src:i.src,loaded:i.complete&&i.naturalWidth>0})));
 assert.equal(report.errors.length,0);report.checks.push('desktop/mobile no JS errors or horizontal overflow');
 await writeFile(new URL('../research/output/classic-home-qa-20261021.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,images:report.images.length,errors:report.errors}));
}finally{await browser.close();}
