import test from 'node:test';
import assert from 'node:assert/strict';
import {rankRequest,createRankReader,RANK_API}from'../lib/rank-client.mjs';
import {isClassicAnnouncement,normalizeNews,createNewsReader,officialNewsLink}from'../lib/classic-news.mjs';
const NOW=Date.parse('2026-10-21T12:00:00Z');
test('ranking only builds fixed host paths and bounded documented keyless queries',()=>{
 assert.equal(rankRequest(new URLSearchParams('mode=jobs')).path,'/jobs');
 assert.equal(rankRequest(new URLSearchParams('mode=stats')).path,'/stats');
 const r=rankRequest(new URLSearchParams('mode=list&family=Warrior&job=Fighter&sort=fame&limit=25&page=2&verified=true&q=abc'));
 assert.ok(r.path.includes('family=Warrior'));assert.ok(r.path.includes('page=2'));
 for(const query of ['mode=list&limit=51','mode=list&limit=50&page=21','mode=list&sort=random','mode=list&family=Other','mode=list&tier=invalid&verified=maybe','mode=list&min_level=0'])assert.throws(()=>rankRequest(new URLSearchParams(query)));
 assert.ok(rankRequest(new URLSearchParams('name=a/b?x=y')).path.startsWith('/characters/a%2Fb%3Fx%3Dy?'));
});
test('ranking reader shares pending queries, caches and preserves source timestamps',async()=>{
 let calls=0,now=NOW;const read=createRankReader({clock:()=>now,fetchFn:async url=>{assert.ok(url.startsWith(RANK_API));calls++;await new Promise(r=>setTimeout(r,5));return Response.json({data:[{name:'One',level:30}]},{headers:{etag:'v1'}});}});
 const request=rankRequest(new URLSearchParams('mode=list'));await Promise.all([read(request),read(request)]);assert.equal(calls,1);const cached=await read(request);assert.equal(calls,1);assert.equal(cached.body._source.cached,true);now+=31_000;await read(request);assert.equal(calls,2);
});
test('ranking upstream 429 backs off and returns last normal data as stale',async()=>{
 let calls=0,now=NOW;const read=createRankReader({clock:()=>now,fetchFn:async()=>++calls===1?Response.json({data:[]}):new Response(null,{status:429,headers:{'retry-after':'120'}})}),request=rankRequest(new URLSearchParams('mode=list'));
 await read(request);now+=31_000;let result=await read(request);assert.equal(result.body._source.stale,true);now+=61_000;result=await read(request);assert.equal(result.body._source.stale,true);assert.equal(calls,2);
});
test('ranking absent character remains 404 and no synthetic rank is generated',async()=>{
 const result=await createRankReader({clock:()=>NOW,fetchFn:async()=>new Response(null,{status:404})})(rankRequest(new URLSearchParams('name=Unknown')));assert.equal(result.status,404);assert.ok(!result.body.data);
});
const announcement=(overrides={})=>({gid:'12345',title:'Grand Launch Release Notes',date:1792543795,contents:'[p]Grand Launch is here for Global MapleStory Classic World![/p][url="https://www.nexon.com/maplestory/news/general/46506/grand-launch-release-notes"]HERE[/url]',url:'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/12345',...overrides});
test('official feed filters modern Maple events and casual Classic mentions',()=>{
 assert.equal(isClassicAnnouncement(announcement()),true);
 assert.equal(isClassicAnnouncement(announcement({title:'MapleStory Fest 2026 is this Saturday!',contents:'Classic World Dev Panel and modern Maple winter showcase'})),false);
 assert.equal(isClassicAnnouncement(announcement({title:'Modern Maple Winter update',contents:'The future includes Classic World too.'})),false);
 assert.equal(isClassicAnnouncement(announcement({title:'Classic World Founder Packages'})),true);
 assert.equal(isClassicAnnouncement(announcement({title:'Scheduled Maintenance',contents:'All MapleStory Classic World game servers'})),true);
});
test('news uses verified official links and never invents an event period',()=>{
 const row=normalizeNews(announcement());assert.equal(row.kind,'patch');assert.equal(row.period,null);assert.equal(row.sourceUrl,'https://www.nexon.com/maplestory/news/general/46506/grand-launch-release-notes');
 assert.equal(normalizeNews(announcement({title:'[Completed] Scheduled Maintenance',contents:'All MapleStory Classic World game servers'})).completed,true);
 assert.equal(officialNewsLink(announcement({contents:'',url:'javascript:alert(1)'})),'https://steamcommunity.com/app/216150/announcements/');
 assert.equal(officialNewsLink(announcement({title:"Founder's Access Has Begun!",contents:'Global MapleStory Classic World [url="https://www.nexon.com/maplestory/news/general/45385/global-maple-story-classic-world-faq"]FAQ[/url]'})),announcement().url);
 assert.equal(normalizeNews(announcement({title:'Scheduled Grand Launch',contents:'Scheduled maintenance for all MapleStory Classic World game servers'})).kind,'maintenance');
});
test('official news API caches for 15 minutes, rejects irrelevant announcements and coalesces requests',async()=>{
 let calls=0,now=NOW;const read=createNewsReader({clock:()=>now,fetchFn:async()=>{calls++;await new Promise(r=>setTimeout(r,5));return Response.json({appnews:{newsitems:[announcement(),announcement({gid:'2',title:'Modern event',contents:'Happy modern Maple'})]}});}});
 const [a,b]=await Promise.all([read(),read()]);assert.equal(calls,1);assert.equal(a.articles.length,1);assert.equal(b.articles.length,1);await read();assert.equal(calls,1);now+=901_000;await read();assert.equal(calls,2);
});
test('official news connection failures remain explicit instead of displaying unrelated fallback events',async()=>{
 const result=await createNewsReader({clock:()=>NOW,fetchFn:async()=>new Response(null,{status:503})})();assert.equal(result.articles.length,0);assert.equal(result.stale,true);assert.match(result.error,/공식 공지/);
});
