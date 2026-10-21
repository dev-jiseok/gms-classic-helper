import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {initialState} from '../web/lib/engine.mjs';

const origin=process.env.COMPASS_QA_ORIGIN??'http://127.0.0.1:5187';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))throw Error('Local QA only');
const q=(id,mesos,extra={})=>({id:`qa:${id}`,name:`QA ${id}`,jobs:['all'],minLevel:1,mesos,mesoCost:0,exp:10,requirements:[],rewardItems:[],requirementsComplete:true,rewardsComplete:true,costsConfirmed:true,conditionsComplete:true,estimatedMinutes:1,...extra});
// Deliberate fixtures isolate monetary objectives; these are never game evidence or server writes.
const quests=[q('gross',100000,{minLevel:10,mesoCost:99000}),q('net',90000,{mesoCost:100,estimatedMinutes:60}),q('fast',40000),q('mandatory',100,{minLevel:40,mandatory:true}),q('future',9999999,{minLevel:41})];
const report={at:new Date().toISOString(),scope:'Local browser with synthetic quest fixtures and isolated account state; no real account or catalog mutations.',checks:[],errors:[],blockedMutations:[]};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
let page;
try{
 const context=await browser.newContext({viewport:{width:1440,height:1050},locale:'ko-KR'});
 let memory=initialState(),revision=0;
 memory.profiles=memory.profiles.map(p=>({...p,level:40,currentJob:p.job,mesos:1000000}));
 memory.recommendations={fighter:{snapshots:{'quests-money':{generatedAt:new Date().toISOString(),dataSignature:'engine-7',result:{rows:[]}}}}};
 await context.route('**/api/**',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.origin===origin&&u.pathname==='/api/state'){
   if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.revision,revision);memory=body.state;revision++;return route.fulfill({json:{revision}});}
   return route.fulfill({json:{state:memory,revision}});
  }
  if(u.origin===origin&&u.pathname==='/api/game-data'&&u.searchParams.get('kind')==='bundle'){
   const data={meta:{version:'qa-fixtures',verifiedAt:new Date().toISOString(),coverage:'Synthetic regression fixtures'},sources:[]};
   for(const key of u.searchParams.get('sets').split(','))data[key]=key==='quests'?quests:[];
   return route.fulfill({json:data});
  }
  if(u.origin===origin&&!['GET','HEAD','OPTIONS'].includes(req.method())){report.blockedMutations.push(u.pathname);return route.fulfill({status:403,json:{error:'QA blocks mutations'}});}
  return route.continue();
 });
 page=await context.newPage();page.setDefaultTimeout(25000);page.on('pageerror',e=>report.errors.push(e.message));
 const check=text=>{report.checks.push(text);console.log(text);};
 const order=()=>page.locator('h2[data-quest-id]').evaluateAll(nodes=>nodes.map(e=>e.dataset.questId));
 const expected=ids=>ids.map(id=>'qa:'+id);
 async function sorted(ids){await page.waitForFunction(wanted=>JSON.stringify([...document.querySelectorAll('h2[data-quest-id]')].map(e=>e.dataset.questId))===JSON.stringify(wanted),expected(ids));assert.deepEqual(await order(),expected(ids));}
 async function go(){await page.goto(origin+'/moneyQuests',{waitUntil:'domcontentloaded'});await page.getByLabel('돈퀘스트 정렬',{exact:true}).waitFor();}
 await page.goto(origin+'/signin-with-chatgpt?return_to=/',{waitUntil:'domcontentloaded'});await go();
 await sorted(['gross','net','fast','mandatory']);
 assert.equal(await page.getByLabel('돈퀘스트 정렬',{exact:true}).inputValue(),'reward');
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('maple-compass-v1')).recommendations.fighter.snapshots['quests-money'].dataSignature.startsWith('engine-8:'));
 check('default common reward beats current-level mandatory quest; stale engine-7 snapshot refreshed; future-level quest hidden');
 await page.getByLabel('돈퀘스트 정렬',{exact:true}).selectOption('net');await sorted(['net','fast','gross','mandatory']);
 await page.getByLabel('돈퀘스트 정렬',{exact:true}).selectOption('hourly');await sorted(['fast','net','gross','mandatory']);
 await page.waitForTimeout(1600);assert.equal(memory.recommendations.fighter.settings.moneySort,'hourly');
 await page.reload({waitUntil:'domcontentloaded'});await sorted(['fast','net','gross','mandatory']);assert.equal(await page.getByLabel('돈퀘스트 정렬',{exact:true}).inputValue(),'hourly');
 check('net and hourly objectives reorder immediately and selected objective survives reload');
 await page.getByLabel('돈퀘스트 정렬',{exact:true}).selectOption('reward');await sorted(['gross','net','fast','mandatory']);
 for(const name of ['표도 친구','궁수 친구','나의 모험가']){
  await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();await page.getByRole('menuitem').filter({hasText:name}).first().click();await sorted(['gross','net','fast','mandatory']);
  const gross=await page.locator('h2[data-quest-id="qa:gross"]').locator('..').innerText();assert.match(gross,/공용 보상 가치 · 이 의뢰만\s*100,000/);
 }
 check('fighter, assassin and hunter show identical quest-local common reward order and100,000 value');
 // Completion removes its own card immediately, so verify the resulting list rather than a detached checkbox.
 await page.getByLabel('QA gross 완료',{exact:true}).click();await sorted(['net','fast','mandatory']);
 await page.getByLabel('조건이 부족하거나 확인되지 않은 계획도 보기',{exact:true}).check();await sorted(['net','fast','mandatory','future']);
 check('completion recomputes immediately; unavailable future reward stays after feasible quests');
 await page.locator('.classic-profile-button').click();await page.locator('dialog').getByLabel('현재 레벨',{exact:true}).fill('5');await page.getByRole('button',{name:'프로필 저장',exact:true}).click();await sorted(['net','fast','future','mandatory']);
 await page.getByLabel('조건이 부족하거나 확인되지 않은 계획도 보기',{exact:true}).uncheck();await sorted(['net','fast']);
 check('actual profile level controls feasibility rather than reward proximity');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await mkdir('research/output',{recursive:true});await page.screenshot({path:'research/output/money-ranking-mobile.png',fullPage:true});
 check('money controls and cards fit390px');assert.deepEqual(report.errors,[]);assert.deepEqual(report.blockedMutations,[]);
}catch(e){report.failure=e.stack;if(page){report.visibleOrder=await orderOnFailure(page);report.selected=await page.getByLabel('돈퀘스트 정렬',{exact:true}).inputValue().catch(()=>null);}throw e;}finally{
 await mkdir('research/output',{recursive:true});await writeFile('research/output/money-ranking-qa-20261021.json',JSON.stringify(report,null,2));for(const context of browser.contexts())await context.unrouteAll({behavior:'ignoreErrors'});await browser.close();
}
async function orderOnFailure(page){return page.locator('h2[data-quest-id]').evaluateAll(nodes=>nodes.map(e=>e.dataset.questId));}
