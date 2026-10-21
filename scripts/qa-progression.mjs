import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {initialState} from '../web/lib/engine.mjs';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const errors=[],checks=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'ko-KR'});
 let state={...initialState(),updatedAt:new Date().toISOString()},revision=0;
 await page.route('**/api/**',async route=>{const req=route.request(),url=new URL(req.url());if(url.pathname==='/api/state'){if(req.method()==='PUT'){state=req.postDataJSON().state;revision++;return route.fulfill({json:{revision}});}return route.fulfill({json:{state,revision}});}if(!['GET','HEAD','OPTIONS'].includes(req.method()))return route.fulfill({status:403,json:{error:'Isolated QA blocks mutations'}});return route.continue();});
 page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5187/#citizenship');
 await page.getByRole('heading',{name:'시민권 · 일일·주간 계획',exact:true}).waitFor();
 const weekly=page.getByLabel('주간 기부',{exact:true});
 await weekly.locator('option').nth(10).waitFor({state:'attached'});
 assert.ok(await weekly.locator('option').count()>10);
 assert.equal(await page.getByLabel('일일 의뢰',{exact:true}).locator('option').count(),19);
 assert.equal(await weekly.locator('option[value^="wiki:"]').count(),0);
 const value=await weekly.locator('option').nth(1).getAttribute('value');await weekly.selectOption(value);
 await page.getByRole('button',{name:'재료·보상·선행 확인',exact:true}).click();
 await page.locator('dialog').waitFor();await page.getByRole('button',{name:'닫기',exact:true}).click();
 await page.getByLabel('이 마을에 주민 등록했어요',{exact:true}).check();
 const gradeSaved=page.waitForResponse(response=>response.url().endsWith('/api/state')&&response.request().method()==='PUT'&&response.request().postDataJSON().state.citizenship?.[state.activeProfile]?.Henesys?.grade===3);
 await page.getByLabel('게임에서 확인한 시민권 등급',{exact:true}).fill('3');await gradeSaved;
 await page.reload();await page.getByRole('heading',{name:'시민권 · 일일·주간 계획',exact:true}).waitFor();
 await weekly.locator('option[value="'+value+'"]').waitFor({state:'attached'});
 assert.equal(await page.getByLabel('게임에서 확인한 시민권 등급',{exact:true}).inputValue(),'3');assert.equal(await weekly.inputValue(),value);checks.push('citizenship selection, linked quest and saved grade');
 await page.getByRole('button',{name:'커닝시티',exact:true}).click();assert.ok(await weekly.locator('option').count()>10);assert.equal(await page.getByLabel('일일 의뢰',{exact:true}).locator('option').count(),19);assert.equal(await weekly.locator('option[value^="wiki:"]').count(),0);checks.push('both towns retain18 greeting candidates without reference-only duplicates');
 await page.goto('http://127.0.0.1:5187/#pq');await page.getByRole('heading',{name:'커닝 파티퀘스트 · 진행 도우미',exact:true}).waitFor();
 await page.getByRole('button',{name:'새 판 시작 · 30분',exact:true}).click();
 await page.getByRole('button',{name:'2단계 · 4곳 중 3',exact:true}).click();assert.ok((await page.locator('body').innerText()).includes('남은 조합 4개'));
 await page.getByRole('button',{name:'1-2-3',exact:true}).click();assert.ok((await page.locator('body').innerText()).includes('남은 조합 3개'));
 await page.reload();await page.getByText('남은 조합 3개',{exact:true}).waitFor();checks.push('PQ timer, combinations and persistence');
 await page.setViewportSize({width:390,height:844});
 for(const route of ['citizenship','pq']){await page.goto('http://127.0.0.1:5187/#'+route);await page.waitForTimeout(500);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 checks.push('mobile progression pages without overflow');assert.deepEqual(errors,[]);
 const report={at:new Date().toISOString(),checks,errors};await writeFile('research/output/progression-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
