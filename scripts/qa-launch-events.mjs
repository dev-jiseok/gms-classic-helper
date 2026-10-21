import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {initialState} from '../web/lib/engine.mjs';
const origin=process.env.COMPASS_QA_ORIGIN??'http://127.0.0.1:5187';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))throw Error('Local QA only');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const checks=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'ko-KR'});
 let saved={...initialState(),updatedAt:new Date().toISOString()},revision=0;
 await context.route('**/api/state',async route=>{
  if(route.request().method()==='PUT'){saved=route.request().postDataJSON().state;revision++;await route.fulfill({json:{revision}});}
  else await route.fulfill({json:{state:saved,revision}});
 });
 const page=await context.newPage();
 page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/#events');
 const panel=page.locator('.launch-events-panel');await panel.getByRole('heading',{name:'출시 이벤트 · 공식 참여 일정',exact:true}).waitFor();
 assert.equal(await panel.locator('article').count(),5);
 assert.ok((await panel.innerText()).includes('서버 오픈 전'));
 const first=panel.locator('article').first();await first.getByRole('button',{name:'내 일정에 추가',exact:true}).click();
 await first.getByRole('button',{name:'내 일정에 추가됨',exact:true}).waitFor();
 await page.reload();await page.locator('.launch-events-panel article').first().getByRole('button',{name:'내 일정에 추가됨',exact:true}).waitFor();
 assert.equal(await page.locator('.event-row').filter({hasText:'모험의 시작 · 일일 출석'}).count(),1);checks.push('official event addition, account persistence and duplicate prevention');
 await panel.getByRole('button',{name:'GM 단기 이벤트3개도 보기',exact:true}).click();assert.equal(await panel.locator('article').count(),8);checks.push('five dated events and three GM windows');
 await page.goto(origin+'/#home');await page.locator('.classic-release-board').waitFor();
 await page.locator('.classic-release-board').getByRole('button',{name:'이벤트 · 참여 조건 확인',exact:false}).click();await panel.waitFor();checks.push('home release board links into event workflow');
 await page.goto(origin+'/#citizenship');await page.getByLabel('일일 의뢰',{exact:true}).locator('option').nth(18).waitFor({state:'attached'});assert.equal(await page.getByLabel('일일 의뢰',{exact:true}).locator('option').count(),19);checks.push('all eighteen Henesys daily candidates');
 await page.goto(origin+'/#pq');await page.getByText(/CH\.3–12/).waitFor();assert.ok((await page.locator('body').innerText()).includes('21'));checks.push('official PQ channel update');
 await page.setViewportSize({width:390,height:844});
 for(const route of ['events','home']){await page.goto(origin+'/#'+route);await page.waitForTimeout(300);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.screenshot({path:'research/output/launch-events-mobile.png',fullPage:true});checks.push('390px event and home pages without overflow');
 assert.deepEqual(errors,[]);const report={at:new Date().toISOString(),checks,errors};await writeFile('research/output/launch-events-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
