import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {initialState} from '../web/lib/engine.mjs';
const origin=process.env.COMPASS_QA_ORIGIN??'http://127.0.0.1:5187';
const u=new URL(origin);if(u.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Refusing non-loopback browser QA');
const catalog=await readFile(new URL('../web/lib/catalog.ts',import.meta.url),'utf8'),featureBlock=catalog.split('export const FEATURES = [')[1]?.split('];')[0];
const features=[...featureBlock.matchAll(/\{id:'([^']+)',name:'([^']+)'/g)].map(([,id,name])=>({id,name}));assert.equal(features.length,42);
const output=new URL('../research/output/',import.meta.url);await mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),origin,scope:'Render smoke only; real metadata/market/news/rank/community GETs, isolated in-memory /api/state; other mutation requests blocked',desktop:[],mobile:[],pageErrors:[],consoleErrors:[],failedRequests:[],blockedMutations:[],state:{reads:0,writes:0,realStateRequests:0},screenshots:[]};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
let current='startup';
try{
 const context=await browser.newContext({viewport:{width:1440,height:1050},locale:'ko-KR',timezoneId:'Asia/Seoul'});
 let memory={...initialState(),updatedAt:new Date().toISOString()};memory.profiles=memory.profiles.map((p,i)=>i? p:{...p,name:'QA 브라우저 전용',level:35,currentJob:'fighter',mesos:500000});let revision=0;
 await context.route('**/api/**',async route=>{const req=route.request(),url=new URL(req.url());if(url.pathname==='/api/state'){
  if(req.method()==='PUT'){const body=req.postDataJSON();if(body.revision!==revision)return route.fulfill({status:409,json:{error:'QA revision conflict'}});memory=body.state;revision++;report.state.writes++;return route.fulfill({json:{revision,updatedAt:new Date().toISOString()}});}
  report.state.reads++;return route.fulfill({json:{state:memory,revision}});
 }
 if(!['GET','HEAD','OPTIONS'].includes(req.method())){report.blockedMutations.push({route:current,path:url.pathname,method:req.method()});return route.fulfill({status:403,json:{error:'Read-only browser QA blocks mutations'}});}return route.continue();});
 const page=await context.newPage();page.setDefaultTimeout(12000);page.setDefaultNavigationTimeout(20000);
 page.on('pageerror',e=>report.pageErrors.push({route:current,message:e.message}));
 page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push({route:current,message:m.text().slice(0,350)});});
 page.on('requestfailed',r=>{if(!r.failure()?.errorText?.includes('ERR_ABORTED'))report.failedRequests.push({route:current,path:new URL(r.url()).pathname,failure:r.failure()?.errorText});});
 async function scan(feature,mode){current=mode+':'+feature.id;const before=report.pageErrors.length,start=Date.now();let failure=null;
  try{await page.goto(origin+'/#'+feature.id,{waitUntil:'domcontentloaded'});await page.waitForFunction(name=>document.querySelector('.breadcrumb strong')?.textContent===name,feature.name);await page.locator('main h1').first().waitFor({state:'visible'});await page.waitForTimeout(['market','ranking','gear','training','money'].includes(feature.id)?1100:350);}catch(e){failure=e.message.slice(0,400);}
  const dimensions=await page.evaluate(()=>{const vw=innerWidth,root=document.documentElement;return {viewport:vw,document:root.scrollWidth,body:document.body.scrollWidth,offenders:root.scrollWidth>vw+1?[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.right>vw+2&&s.position!=='fixed'&&s.display!=='none';}).slice(0,8).map(e=>({tag:e.tagName,class:e.className,left:Math.round(e.getBoundingClientRect().left),width:Math.round(e.getBoundingClientRect().width)})):[]};});
  const text=await page.locator('main').innerText().catch(()=>''),headings=await page.locator('main h1, main h2').allTextContents();
  const result={id:feature.id,name:feature.name,rendered:!failure&&headings.length>0,heading:headings[0]??null,milliseconds:Date.now()-start,overflow:dimensions.document>dimensions.viewport+1,dimensions,pageErrors:report.pageErrors.length-before,failure,visibleNotice:text.match(/(?:공급원[^\n]{0,90}(?:지연|연결)|자료를 불러오[^\n]{0,80}|로그인[^\n]{0,60})/g)?.slice(0,3)??[]};
  report[mode].push(result);if(result.failure||result.overflow||result.pageErrors)console.log(JSON.stringify({issue:current,result}));
 }
 await page.goto(origin+'/signin-with-chatgpt?return_to=/');
 const source=await (await context.request.get(origin+'/api/game-data?kind=coverage')).json();
 assert.equal(source.complete,true);assert.equal(source.tables.length,17);assert.equal(source.normalizedCounts.questSteps,837);
 const sourceTable=await (await context.request.get(origin+'/api/game-data?kind=sourceTable&table=quest_steps&limit=20')).json();
 assert.equal(sourceTable.total,837);assert.equal(sourceTable.rows.length,20);assert.ok(sourceTable.fields.some(f=>f.name==='destination_map'));
 const invalid=await context.request.get(origin+'/api/game-data?kind=sourceTable&table=__proto__');assert.equal(invalid.status(),400);
 await page.goto(origin+'/settings');await page.getByRole('heading',{name:'도감 데이터 · 출처',exact:true}).waitFor();
 await page.getByRole('button',{name:'퀘스트 진행 단계 ↗',exact:true}).click();await page.locator('dialog .source-data-cards details').first().waitFor();
 await page.getByLabel('원천 자료에서 검색',{exact:true}).fill('Jane and the Mushroom');
 await page.waitForFunction(()=>document.querySelectorAll('dialog .source-data-cards details').length===4||document.querySelectorAll('dialog .source-data-cards details').length===6);
 await page.locator('dialog .source-data-cards details').first().locator('summary').click();assert.match(await page.locator('dialog').innerText(),/destination_map/);
 await page.getByRole('button',{name:'닫기',exact:true}).click();
 report.sourceCoverage={tables:source.tables.length,steps:source.normalizedCounts.questSteps,complete:true,rawTableSearch:true};
 await page.goto(origin+'/market');await page.getByRole('button',{name:'글클메지지 시세',exact:true}).click();
 await page.getByRole('heading',{name:'글클메지지 확성기 · 거래소 시세',exact:true}).waitFor();
 await page.getByRole('button',{name:'연결 확인',exact:true}).waitFor();
 const gg=await (await context.request.get(origin+'/api/market/glclme')).json();assert.ok(['connected','cached','backoff','unchanged','waiting'].includes(gg.provider?.status));
 if(gg.provider.httpStatus===403){assert.equal(gg.stale,true);assert.match(await page.locator('main').innerText(),/403/);}
 report.ggConnection={status:gg.provider.status,httpStatus:gg.provider.httpStatus,hasActualData:!!gg.data};
 await page.getByRole('button',{name:'시세 기록',exact:true}).click();
 const quote=page.locator('.market-item-name').first();
 if(await quote.count()){await quote.click();await page.getByRole('button',{name:'아이템 도감',exact:true}).click();await page.locator('.catalog-detail-title-items').waitFor();await page.getByRole('button',{name:'닫기',exact:true}).click();report.fullCatalogMarketLink=true;}
 await page.goto(origin+'/moneyQuests');await page.getByLabel('퀘스트 추천 기준',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('퀘스트 추천 기준',{exact:true}).inputValue(),'money');
 await page.getByLabel('퀘스트 추천 기준',{exact:true}).selectOption('exp');await page.locator('.classic-app[data-route=expQuests]').waitFor();
 assert.equal(await page.getByLabel('퀘스트 추천 기준',{exact:true}).inputValue(),'exp');
 await page.getByLabel('퀘스트 추천 기준',{exact:true}).selectOption('money');await page.locator('.classic-app[data-route=money]').waitFor();report.questGoalRoutes=true;
 const desktop=[...features.filter(f=>f.id!=='money'),features.find(f=>f.id==='money')];
 for(const feature of desktop){await scan(feature,'desktop');if(feature.id==='market'){const path=new URL('routes-smoke-desktop.png',output);await page.screenshot({path:path.pathname});report.screenshots.push(path.pathname);}if(report.desktop.length%10===0)console.log(`Desktop ${report.desktop.length}/${features.length}`);}
 await page.setViewportSize({width:390,height:844});
 for(const id of ['today','quests','market','skills','hunt','gear','money'])await scan(features.find(f=>f.id===id),'mobile');
 const mobilePath=new URL('routes-smoke-mobile.png',output);await page.screenshot({path:mobilePath.pathname,fullPage:false});report.screenshots.push(mobilePath.pathname);
 report.finishedAt=new Date().toISOString();report.summary={desktopRoutes:report.desktop.length,mobileRoutes:report.mobile.length,renderFailures:[...report.desktop,...report.mobile].filter(r=>!r.rendered).length,horizontalOverflows:[...report.desktop,...report.mobile].filter(r=>r.overflow).length,javascriptErrors:report.pageErrors.length,isolatedState:true};
 await writeFile(new URL('routes-smoke-20261021.json',output),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));
 assert.equal(report.summary.renderFailures,0);assert.equal(report.summary.javascriptErrors,0);assert.equal(report.summary.horizontalOverflows,0);
}finally{await browser.close();}
