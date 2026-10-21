import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:1050},locale:'ko-KR'});page.setDefaultTimeout(8000);page.setDefaultNavigationTimeout(12000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const go=async route=>{await page.goto('http://127.0.0.1:5187/#'+route);await page.waitForTimeout(350);};
 await go('today');await page.getByText('브라우저에 저장',{exact:false}).last().waitFor();
 await page.locator('.account-button').click();await page.getByLabel('닉네임',{exact:true}).fill('컴패스 테스트');await page.getByLabel('현재 레벨',{exact:true}).fill('25');await page.getByRole('button',{name:'프로필 저장',exact:true}).click();
 await page.locator('.account-button').filter({hasText:'컴패스 테스트'}).waitFor();results.push('profile edit');
 await go('quests');const quest=page.locator('.quest-card').first();const questName=await quest.locator('h3').innerText();await page.getByLabel(questName+' 완료',{exact:true}).click();await page.reload();await page.waitForTimeout(800);assert.equal(await page.locator('.quest-card h3').filter({hasText:questName}).count(),0);results.push('quest completion persists');
 await go('codex');await page.getByLabel('도감 검색',{exact:true}).fill('ㅊㄹㅂㅅ');assert.equal(await page.locator('.codex-card').count(),1);await page.locator('.codex-open').click();await page.locator('dialog h2').filter({hasText:'초록버섯'}).waitFor();assert.ok((await page.locator('dialog').innerText()).includes('드롭 아이템'));await page.getByRole('button',{name:'닫기',exact:true}).click();results.push('Korean initial search and linked monster detail');
 await go('hunt');await page.getByLabel('사냥터',{exact:true}).fill('헤네시스 QA');await page.getByLabel('획득 경험치',{exact:true}).fill('1000');await page.getByLabel('획득 메소 (지출 전)',{exact:true}).fill('500');await page.getByLabel('물약 · 탄환 · 충전 비용',{exact:true}).fill('100');await page.getByRole('button',{name:'사냥 기록 저장',exact:true}).click();await page.locator('td strong').filter({hasText:'헤네시스 QA'}).waitFor();
 await go('training');await page.getByText('헤네시스 QA',{exact:true}).waitFor();assert.ok((await page.locator('main').innerText()).includes('6,000'));assert.ok((await page.locator('main').innerText()).includes('2,400'));results.push('hunt record and measured recommendation');
 await go('today');await page.locator('.party-profile').filter({hasText:'표도 친구'}).click();await page.locator('.account-button').filter({hasText:'표도 친구'}).waitFor();await go('training');assert.equal(await page.getByText('헤네시스 QA',{exact:true}).count(),0);results.push('separate character progress');
 await go('liveTranslate');await page.locator('textarea').fill('Hello adventurer');await page.getByRole('button',{name:'기기 내 번역',exact:true}).waitFor({state:'visible'});results.push('OCR/translation screen renders; real game OCR not tested');
 await go('today');await page.screenshot({path:'research/output/app-desktop-20261021.png',timeout:10000});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await page.screenshot({path:'research/output/app-mobile-20261021.png',timeout:10000});console.log(JSON.stringify(await page.evaluate(()=>['body','.main-shell','.page-content','.home-welcome','.hero','.hero-copy'].map(s=>{const e=document.querySelector(s);const r=e.getBoundingClientRect();return {s,x:r.x,w:r.width,scroll:e.scrollWidth}}))));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.getByRole('button',{name:'메뉴 열기',exact:true}).click();await page.locator('.sidebar.open').waitFor();await page.locator('.sidebar.open').getByRole('button',{name:'도감',exact:true}).click();await page.getByRole('heading',{name:'우리의 도감',exact:true}).waitFor();results.push('mobile navigation and no horizontal overflow');
 assert.deepEqual(errors,[]);const report={at:new Date().toISOString(),results,errors};await writeFile('research/output/app-qa-20261021.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
} finally {await browser.close();}
