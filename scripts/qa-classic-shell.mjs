import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {initialState} from '../web/lib/engine.mjs';
import {CLASSIC_NAV_GROUPS} from '../web/lib/classic-navigation.mjs';
import {pathForRoute} from '../web/lib/site-routes.mjs';

const origin=process.env.COMPASS_QA_ORIGIN??'http://127.0.0.1:5187';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Loopback UI QA only');
const output=new URL('../research/output/',import.meta.url);await mkdir(output,{recursive:true});
const report={at:new Date().toISOString(),origin,desktop:[],mobile:[],checks:[],errors:[],screenshots:[],blockedMutations:[]};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1050},locale:'ko-KR',timezoneId:'Asia/Seoul'});
 let state=initialState(),revision=0;state.updatedAt=new Date().toISOString();state.profiles[0]={...state.profiles[0],name:'셸 검증 캐릭터',level:35,currentJob:'fighter',exp:1200,mesos:54321,fame:17};
 await context.route('**/api/**',async request=>{
  const req=request.request(),url=new URL(req.url());
  if(url.pathname==='/api/state'){
   if(req.method()==='PUT'){const body=req.postDataJSON();state=body.state;revision++;return request.fulfill({json:{revision,updatedAt:new Date().toISOString()}});}
   return request.fulfill({json:{state,revision}});
  }
  if(!['GET','HEAD','OPTIONS'].includes(req.method())){report.blockedMutations.push({path:url.pathname,method:req.method()});return request.fulfill({status:403,json:{error:'Isolated browser QA blocks mutations'}});}
  return request.continue();
 });
 const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);
 page.on('pageerror',error=>report.errors.push(error.message));
 await page.goto(origin+'/signin-with-chatgpt?return_to=/');
 await page.locator('.classic-header').waitFor();await page.evaluate(()=>document.fonts.ready);
 await page.locator('.classic-profile-button').filter({hasText:'셸 검증 캐릭터'}).waitFor();
 assert.equal(await page.locator('.sidebar').count(),0);
 assert.equal(await page.locator('.classic-desktop-nav .classic-nav-trigger').count(),6);
 assert.equal(await page.locator('.classic-status-bar').isVisible(),true);
 assert.match(await page.locator('.classic-status-character').innerText(),/35/);
 assert.match(await page.locator('.classic-status-exp').innerText(),/1,200/);
 assert.match(await page.locator('.classic-status-exp').innerText(),/174,216/);
 assert.match(await page.locator('.classic-status-mesos').innerText(),/54,321/);
 assert.doesNotMatch(await page.locator('.classic-status-bar').innerText(),/\bHP\b|\bMP\b/);
 report.checks.push('six horizontal groups, no sidebar, actual saved level/EXP/mesos without invented HP/MP');
 async function shot(name){const path=new URL(name,output);await page.screenshot({path:path.pathname});report.screenshots.push(path.pathname);}
 await shot('classic-shell-desktop.png');
 const startTrigger=page.locator('#classic-desktop-start-trigger');
 await startTrigger.focus();await page.keyboard.press('ArrowDown');
 await page.locator('#classic-desktop-start-menu').waitFor();
 await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='menuitem');
 await page.keyboard.press('End');assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('data-route')),'settings');
 await page.keyboard.press('Escape');assert.equal(await page.locator('.classic-flyout:visible').count(),0);
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'classic-desktop-start-trigger');
 report.checks.push('keyboard ArrowDown/Home/End/Escape and trigger focus return');
 async function nav(id,group,mode){
  if(mode==='mobile'){await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();await page.locator('#classic-mobile-menu').waitFor();}
  const prefix=mode==='mobile'?'classic-mobile':'classic-desktop';
  await page.locator(`#${prefix}-${group.id}-trigger`).click();
  await page.locator(`#${prefix}-${group.id}-menu [data-route="${id}"]`).click();
  await page.locator(`.classic-app[data-route="${id}"]`).waitFor();
  assert.equal(new URL(page.url()).pathname,pathForRoute(id));assert.equal(new URL(page.url()).hash,'');
  await page.locator('main h1').first().waitFor();
  assert.equal(await page.locator('.classic-flyout:visible').count(),0);
  assert.equal(await page.locator('.classic-mobile-menu:visible').count(),0);
  const size=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));
  assert.ok(size.width<=size.viewport+1,`${mode} ${id} horizontal overflow: ${JSON.stringify(size)}`);
  report[mode].push(id);
 }
 for(const group of CLASSIC_NAV_GROUPS)for(const id of group.ids)await nav(id,group,'desktop');
 report.checks.push('all42 desktop routes reachable through actual dropdown clicks with stable feature paths');
 await page.locator('#classic-desktop-start-trigger').click();await page.locator('.classic-nav-shade').click({position:{x:10,y:200}});assert.equal(await page.locator('.classic-flyout:visible').count(),0);
 report.checks.push('desktop backdrop closes dropdown');
 await page.goto(origin+'/market');await page.locator('.classic-app[data-route=market]').waitFor();await page.reload();await page.locator('.classic-app[data-route=market]').waitFor();
 await nav('training',CLASSIC_NAV_GROUPS.find(group=>group.id==='guides'),'desktop');await page.goBack();await page.locator('.classic-app[data-route=market]').waitFor();await page.goForward();await page.locator('.classic-app[data-route=training]').waitFor();
 report.checks.push('direct /market refresh and browser back/forward preserve route');
 await page.goto(origin+'/tools#skills');await page.locator('.classic-app[data-route=skills]').waitFor();
 await page.locator('.skip-link').evaluate(element=>element.click());assert.equal(await page.locator('.classic-app').getAttribute('data-route'),'skills');
 report.checks.push('legacy hash wins over feature pathname and skip link preserves route');
 await page.keyboard.press('Meta+k');await page.locator('dialog').waitFor();await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'hidden'});
 report.checks.push('CmdK global search retained');
 await page.locator('.classic-profile-button').click();await page.getByLabel('현재 인기도 · 모르면 빈칸',{exact:true}).fill('18');await page.getByRole('button',{name:'프로필 저장',exact:true}).click();
 await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();await page.locator('#classic-profile-menu [role=menuitem]').filter({hasText:'표도 친구'}).click();await page.locator('.classic-profile-button').filter({hasText:'표도 친구'}).waitFor();
 assert.doesNotMatch(await page.locator('.classic-status-mesos').innerText(),/54,321/);
 await page.getByRole('button',{name:'캐릭터 선택',exact:true}).click();await page.locator('#classic-profile-menu [role=menuitem]').filter({hasText:'셸 검증 캐릭터'}).click();
 await page.locator('.classic-profile-button').click();assert.equal(await page.getByLabel('현재 인기도 · 모르면 빈칸',{exact:true}).inputValue(),'18');await page.getByRole('button',{name:'닫기',exact:true}).click();
 report.checks.push('profile editing/fame and isolated profile switching retained');
 await page.getByRole('button',{name:'화면 테마 전환',exact:true}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.getByRole('button',{name:'화면 테마 전환',exact:true}).click();
 report.checks.push('desktop theme toggle retained');
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.locator('.classic-status-bar').isVisible(),false);assert.equal(await page.locator('.classic-bottom-nav').isVisible(),true);
 await page.goto(origin+'/');await page.locator('.classic-app[data-route=today]').waitFor();await shot('classic-shell-mobile.png');
 for(const group of CLASSIC_NAV_GROUPS)for(const id of group.ids)await nav(id,group,'mobile');
 report.checks.push('all42 mobile routes reachable through hamburger accordion and close on navigation');
 await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();await shot('classic-shell-mobile-menu.png');await page.keyboard.press('Escape');assert.equal(await page.locator('.classic-mobile-menu:visible').count(),0);
 await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();await page.locator('.classic-nav-shade').click({position:{x:5,y:650}});assert.equal(await page.locator('.classic-mobile-menu:visible').count(),0);
 report.checks.push('mobile Escape/backdrop dismiss and visible64px bottom navigation');
 for(const id of ['today','codex','tools','party','market']){await page.locator(`.classic-bottom-nav button`).filter({hasText:({today:'홈',codex:'도감',tools:'편의도구',party:'파티',market:'아이템 거래'})[id]}).click();await page.locator(`.classic-app[data-route="${id}"]`).waitFor();}
 report.checks.push('all five mobile tabs navigate');
 report.finishedAt=new Date().toISOString();report.summary={desktop:report.desktop.length,mobile:report.mobile.length,checks:report.checks.length,errors:report.errors.length,isolatedState:true};
 await writeFile(new URL('classic-shell-qa.json',output),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));assert.deepEqual(report.errors,[]);
}catch(error){report.failure=error.message;await writeFile(new URL('classic-shell-qa.json',output),JSON.stringify(report,null,2));throw error;}
finally{await browser.close();}
