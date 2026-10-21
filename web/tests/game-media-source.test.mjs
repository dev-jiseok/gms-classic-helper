import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameMediaReader}from'../lib/game-media-source.mjs';
import {gameMediaProxyUrl,gameWzCanvasRoot,inspectGameImage,selectWzPose}from'../lib/game-media.mjs';
const png64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlqFxoAAAAASUVORK5CYII=',png=Uint8Array.from(atob(png64),c=>c.charCodeAt(0));
const gif=Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),c=>c.charCodeAt(0));
const j=(data,status=200)=>Response.json(data,{status}),pic=(bytes=png,type='image/png')=>new Response(bytes,{headers:{'Content-Type':type}});
function reader(handler,other={}){const calls=[];return {calls,reader:createGameMediaReader({startIntervalMs:0,fetcher:async(url,options)=>{calls.push(String(url));assert.equal(new URL(url).origin,'https://maplestory.io');assert.equal(options.redirect,'manual');return handler(String(url));},...other})};}

test('mob2 detail404 uses verified WZ pose and completed caches without sharing request I/O',async()=>{
 const {reader:r,calls}=reader(url=>url.endsWith('/mob/2')?j({error:'missing'},404):url.endsWith('/0000002.img')?j({type:1,children:['die1','stand','move']}):url.endsWith('/mob/2/render/stand/0')?pic():j({},404));
 const [a,b]=await Promise.all([r.read({kind:'monster',id:'2'}),r.read({kind:'monster',id:2})]);
 assert.equal(a.id,'2');assert.equal(a.pose,'stand');assert.equal(a.method,'wz-pose-png');assert.equal(a.etag,b.etag);assert.equal(calls.length,6);assert.equal((await r.read({kind:'monster',id:2})).cached,true);assert.equal(calls.length,6);assert.ok(calls.every(url=>!url.includes('/10')));
});
test('mob9 missing static route recovers its actual type12 WZ PNG frame',async()=>{
 const {reader:r,calls}=reader(url=>url.endsWith('/mob/9')?j({error:'missing'},404):url.endsWith('/0000009.img')?j({type:1,children:['stand','move']}):url.endsWith('/stand/0')&&url.includes('/api/wz/')?j({type:12,children:[],value:png64}):j({},404));
 const data=await r.read({kind:'monster',id:'9'});assert.equal(data.method,'wz-frame');assert.equal(data.pose,'stand');assert.equal(data.contentType,'image/png');assert.equal(data.id,'9');assert.ok(data.sourceUrl.includes('/0000009.img/stand/0'));assert.ok(!calls.some(url=>url.includes('?bgColor=')));
});
test('animated mode uses the verified same-pose canonical GIF route and validates it',async()=>{
 const {reader:r}=reader(url=>url.endsWith('/mob/9')?j({error:'missing'},404):url.endsWith('/0000009.img')?j({type:1,children:['stand']}):url.endsWith('/mob/9/render/stand?bgColor=')?pic(gif,'image/gif'):j({},404));
 const data=await r.read({kind:'monster',id:9,animated:true});assert.equal(data.contentType,'image/gif');assert.equal(data.pose,'stand');assert.equal(data.id,'9');
});
test('an error page or wrong media type cannot be returned as a PNG',async()=>{
 assert.equal(inspectGameImage(new TextEncoder().encode('<html>Forbidden</html>'),'image/png'),null);assert.equal(inspectGameImage(png,'text/html'),null);assert.equal(inspectGameImage(gif,'image/png'),null);
 const {reader:r}=reader(url=>url.endsWith('/item/1332007/icon')?new Response('<html>error</html>',{headers:{'Content-Type':'image/png'}}):url.endsWith('/item/1332007')?j(null):url.endsWith('/Character/Weapon/01332007.img/info/icon')?j({type:12,value:png64}):j({},404));
 assert.equal((await r.read({kind:'item',id:1332007})).method,'wz-item-icon');
});
test('actual IO-style metadata after PNG/GIF is excluded at the parsed image boundary',async()=>{
 const meta=new TextEncoder().encode('{"origin":{"X":18,"Y":13}}'),joined=new Uint8Array(png.length+meta.length);joined.set(png);joined.set(meta,png.length);assert.equal(inspectGameImage(joined,'image/png').byteLength,png.length);
 const gifJoined=new Uint8Array(gif.length+meta.length);gifJoined.set(gif);gifJoined.set(meta,gif.length);assert.equal(inspectGameImage(gifJoined,'image/gif').byteLength,gif.length);
 const {reader:r}=reader(()=>pic(joined));assert.equal((await r.read({kind:'item',id:2000000})).bytes.length,png.length);
 assert.equal(inspectGameImage(png.slice(0,-5),'image/png'),null);assert.equal(inspectGameImage(gif.slice(0,-1),'image/gif'),null);
});
test('NPC and minimap fallback use the requested canonical ID and raw canvas',async()=>{
 const npc=reader(url=>url.endsWith('/npc/1')?j({id:2,framebooks:{cry:10}}):url.endsWith('/Npc/_Canvas/0000001.img')?j({type:1,children:['stand']}):url.endsWith('/npc/1/render/stand/0')?pic():j({},404));
 const a=await npc.reader.read({kind:'npc',id:1});assert.equal(a.id,'1');assert.equal(a.pose,'stand');assert.equal(a.method,'wz-pose-png');
 const map=reader(url=>url.endsWith('/map/10000000')?j({id:10000000,miniMap:{canvas:png64}}):j({},404));assert.equal((await map.reader.read({kind:'map',id:10000000})).method,'map-detail-minimap');
});
test('item metaInfo icon fallback and dimensions are validated',async()=>{
 const {reader:r}=reader(url=>url.endsWith('/item/2000000')?j({id:2000000,metaInfo:{icon:png64}}):j({},404));const value=await r.read({kind:'item',id:2000000});assert.equal(value.width,1);assert.equal(value.height,1);assert.equal(value.method,'item-detail-icon');
 const big=png.slice();new DataView(big.buffer).setUint32(16,20000);assert.equal(inspectGameImage(big,'image/png'),null);
});
test('a failed direct image transport can still recover a verified metadata PNG',async()=>{
 const {reader:r}=reader(url=>{if(url.endsWith('/icon'))throw new TypeError('image transport failed');return j({id:2000000,metaInfo:{icon:png64}});});assert.equal((await r.read({kind:'item',id:2000000})).method,'item-detail-icon');
});
test('empty WZ directory nodes are not verified poses and missing results are cached',async()=>{
 const {reader:r,calls}=reader(url=>url.endsWith('/0000002.img')?j({type:0,children:[]}):j({},404));await assert.rejects(()=>r.read({kind:'monster',id:2}),e=>e.code==='not-found');const count=calls.length;await assert.rejects(()=>r.read({kind:'monster',id:2}),e=>e.code==='not-found');assert.equal(calls.length,count);
 assert.equal(selectWzPose('monster',['die1','attack1']),null);assert.equal(selectWzPose('monster',['fly','die1']),'fly');
});
test('429 backs off the source and oversized responses stop within the byte budget',async()=>{
 const limited=reader(()=>new Response(null,{status:429,headers:{'Retry-After':'60'}}));await assert.rejects(()=>limited.reader.read({kind:'item',id:2000000}),e=>e.code==='backoff');await assert.rejects(()=>limited.reader.read({kind:'npc',id:1}),e=>e.code==='backoff');assert.equal(limited.calls.length,1);
 const large=reader(()=>new Response(new Uint8Array(0),{headers:{'Content-Type':'image/png','Content-Length':String(4*1024*1024+1)}}));await assert.rejects(()=>large.reader.read({kind:'item',id:2000000}),e=>e.code==='too-large');
});
test('temporary source failures preserve the last successful bytes and original resolution time',async()=>{
 let time=1000,working=true;const {reader:r}=reader(()=>working?pic():j({},503),{now:()=>time});const first=await r.read({kind:'item',id:2000000});working=false;time+=24*60*60*1000+1;const last=await r.read({kind:'item',id:2000000});assert.equal(last.stale,true);assert.equal(last.etag,first.etag);assert.equal(last.resolvedAt,first.resolvedAt);
});
test('the public image URL accepts only a canonical kind and numeric ID',()=>{
 assert.equal(gameMediaProxyUrl({kind:'monsters',id:9}),'/api/game-media?kind=monster&id=9');assert.equal(gameMediaProxyUrl({kind:'monster',id:'https://example.com/a'}),null);assert.equal(gameWzCanvasRoot('monster',2),'https://maplestory.io/api/wz/MCW/1/Mob/_Canvas/0000002.img');assert.equal(gameMediaProxyUrl({kind:'file',id:1}),null);
});
