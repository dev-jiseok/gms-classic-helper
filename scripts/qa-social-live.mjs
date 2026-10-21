import assert from 'node:assert/strict';
import {initialState}from'../web/lib/engine.mjs';
import {priceOfCart}from'../web/lib/social.mjs';

// This script intentionally supplies local test identities to a built Worker.
// Never send these headers or fixture mutations to a hosted site.
const origin=process.env.COMPASS_TEST_ORIGIN??'http://127.0.0.1:5188';
const parsedOrigin=new URL(origin);
assert.ok(parsedOrigin.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(parsedOrigin.hostname),'Social fixtures may run only against a loopback HTTP built-worker preview.');
const run=crypto.randomUUID().slice(0,12),actors=Object.fromEntries(['a','b','c','d'].map(k=>[k,`qa-social-${run}-${k}`]));
const checks=[];
function check(name,pass,detail=''){checks.push({name,pass:!!pass,...(!pass?{detail}: {})});}
async function call(actor,path='/api/community',body=null,extraHeaders={}){
 const headers={...(actor?{'oai-authenticated-user-id':actors[actor]}:{}),...(body?{'Content-Type':'application/json',Origin:origin}:{}),...extraHeaders};
 const response=await fetch(origin+path,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{})});
 let data;try{data=await response.json();}catch{data={error:'Response was not JSON'};}
 return {status:response.status,data};
}
const action=(actor,room,name,payload={})=>call(actor,'/api/community',{room,action:name,author:`검증 ${actor.toUpperCase()}`,...payload});
const snapshot=async(actor,room)=>call(actor,'/api/community?room='+encodeURIComponent(room));
const must=async promise=>{const result=await promise;assert.equal(result.status,200,`Fixture setup failed with ${result.status}: ${result.data.error??'unknown'}`);return result.data;};
const anon=await call(null);check('anonymous community denied',anon.status===401);
const self=await must(call('a'));assert.equal(self.userId,actors.a,'Preview must preserve the explicit local QA identity. Do not run against a dev auth shim.');
const made=await must(action('a','our-party','space.create',{name:'개발 검증 공간 '+run})),room=made.space.id;
const second=await must(action('a','our-party','space.create',{name:'교차 공간 검증 '+run})),room2=second.space.id;
check('nonmember cannot read space',(await snapshot('b',room)).status===403);
for(const actor of ['b','c','d']){await must(action(actor,'our-party','space.join',{code:made.space.inviteCode}));await must(action(actor,'our-party','space.join',{code:second.space.inviteCode}));}
const joined=await must(snapshot('b',room));check('invited member can join and read',joined.members.length===4&&joined.userId===actors.b);
check('member snapshot does not reveal owner invite code',joined.spaces.every(s=>!s.inviteCode));
const crossOrigin=await call('a','/api/community',{room,action:'post.create',kind:'sell',payload:{title:'차단되어야 하는 글',price:10}},{Origin:'https://unrelated.invalid'});check('cross-origin writes rejected',crossOrigin.status===403);
const post=await must(action('a',room,'post.create',{kind:'sell',payload:{title:'검증용 장갑',itemId:'1082002',price:1000,quantity:1,options:{attack:5,slots:0},contact:'검증 메모'}}));
const memberRead=await must(snapshot('b',room));check('shared post visible to member',memberRead.posts.some(p=>p.id===post.post.id&&!p.mine));
let result=await action('b',room,'post.edit',{id:post.post.id,revision:1,payload:{title:'권한 없는 수정',price:1}});check('nonowner cannot edit post',result.status===403);
result=await action('b',room,'post.close',{id:post.post.id});check('nonowner cannot close post',result.status===403);
result=await action('a',room2,'post.edit',{id:post.post.id,revision:1,payload:post.post.payload});check('cross-room edit rejected',[403,404].includes(result.status),`status ${result.status}`);
result=await action('a',room,'post.edit',{id:post.post.id,revision:1,payload:{...post.post.payload,title:'검증용 장갑 수정'}});check('owner edit with current revision succeeds',result.status===200,`status ${result.status}`);
result=await action('a',room,'post.edit',{id:post.post.id,revision:1,payload:post.post.payload});check('stale post revision rejected',result.status===409,`status ${result.status}`);
const privatePost=await must(action('a','our-party','post.create',{kind:'sell',payload:{title:'개인 가격 기록 검증',price:10}}));const privateB=await must(snapshot('b','our-party'));check('personal room isolated between accounts',!privateB.posts.some(p=>p.id===privatePost.post.id));
const party=await must(action('a',room,'post.create',{kind:'party',payload:{title:'정원 검증 파티',capacity:2}}));
const applyB=await must(action('b',room,'party.apply',{postId:party.post.id,note:'검증 신청'})),applyC=await must(action('c',room,'party.apply',{postId:party.post.id,note:'검증 신청'}));
result=await action('d',room2,'party.apply',{postId:party.post.id});check('cross-room party application rejected',[403,404].includes(result.status));
const decisions=await Promise.all([action('a',room,'party.decide',{id:applyB.request.id,accept:true}),action('a',room,'party.decide',{id:applyC.request.id,accept:true})]);
const afterParty=await must(snapshot('a',room)),partyRow=afterParty.posts.find(p=>p.id===party.post.id),partyRequests=afterParty.requests.filter(r=>r.postId===party.post.id);
check('concurrent accepts cannot exceed party capacity',partyRow.payload.members.length===2&&partyRequests.filter(r=>r.status==='accepted').length===1&&decisions.filter(r=>r.status===200).length===1,`statuses ${decisions.map(r=>r.status).join(',')}`);
check('capacity conflict is reported as client conflict',decisions.every(r=>[200,400,409].includes(r.status)),`statuses ${decisions.map(r=>r.status).join(',')}`);
const accepted=partyRequests.find(r=>r.status==='accepted');result=await action('a',room,'party.decide',{id:accepted.id,accept:true});check('processed party decision cannot be replayed',result.status===409);
const repeatedParty=await must(action('a',room,'post.create',{kind:'party',payload:{title:'중복 신청 검증 파티',capacity:4}}));
const repeated=await Promise.all([1,2,3].map(()=>action('b',room,'party.apply',{postId:repeatedParty.post.id})));
const repeatedSnapshot=await must(snapshot('a',room));check('concurrent duplicate party applications are deduplicated',repeated.filter(r=>r.status===200).length===1&&repeatedSnapshot.requests.filter(r=>r.postId===repeatedParty.post.id&&r.userId===actors.b&&r.status==='pending').length===1,`successes ${repeated.filter(r=>r.status===200).length}`);
const message=await must(action('a',room,'message.send',{recipientId:actors.b,subject:'검증 쪽지',body:'이 내용은 송신자와 수신자만 조회합니다.'}));
const inboxA=await must(snapshot('a',room)),inboxB=await must(snapshot('b',room)),inboxC=await must(snapshot('c',room));
check('message visible only to sender and recipient',inboxA.messages.some(m=>m.id===message.message.id)&&inboxB.messages.some(m=>m.id===message.message.id)&&!inboxC.messages.some(m=>m.id===message.message.id));
await action('c',room,'message.read',{id:message.message.id});const unread=await must(snapshot('b',room));check('third party cannot mark another message read',unread.messages.find(m=>m.id===message.message.id).readAt==null);
result=await action('b',room2,'message.read',{id:message.message.id});check('cross-room message read rejected',[403,404].includes(result.status),`status ${result.status}`);
await must(action('b',room,'message.read',{id:message.message.id}));const readMessage=await must(snapshot('b',room));check('recipient can mark message read',!!readMessage.messages.find(m=>m.id===message.message.id).readAt);
const shop=await must(action('a',room,'post.create',{kind:'shop',payload:{title:'재고 검증 상점',items:[{id:'red',name:'빨간 포션',itemId:'2000000',price:15,quantity:10},{id:'blue',name:'파란 포션',itemId:'2000001',price:30,quantity:5}]}}));
const shopSeen=(await must(snapshot('b',room))).posts.find(p=>p.id===shop.post.id);check('shop product unit prices and stock preserved',shopSeen.payload.items.length===2&&shopSeen.payload.items[0].quantity===10&&shopSeen.payload.items[0].price===15);
check('cart total clamps requests to actual stock',priceOfCart(shopSeen.payload.items,{red:100,blue:2.9})===210);
const timer=await must(action('a',room,'timer.save',{name:'검증 버프',duration:120,running:true}));result=await action('b',room,'timer.save',{id:timer.timer.id,name:'권한 없는 변경',duration:5,running:true});check('nonowner cannot alter shared timer',result.status===403);
await action('b',room,'timer.delete',{id:timer.timer.id});const keptTimer=await must(snapshot('b',room));check('nonowner cannot remove shared timer',keptTimer.timers.some(t=>t.id===timer.timer.id));
await must(action('a',room,'timer.delete',{id:timer.timer.id}));check('owner can remove own timer',!(await must(snapshot('a',room))).timers.some(t=>t.id===timer.timer.id));
const stateResponse=await call('a','/api/state');assert.equal(stateResponse.status,200);const state=initialState();state.profiles[0].name='검증 캐릭터';const saveState=async(actor,revision,bodyState=state,originValue=origin)=>{const response=await fetch(origin+'/api/state',{method:'PUT',headers:{'oai-authenticated-user-id':actors[actor],'Content-Type':'application/json',Origin:originValue},body:JSON.stringify({revision,state:bodyState})});return {status:response.status,data:await response.json()};};
let saved=await saveState('a',stateResponse.data.revision);check('authenticated profile state saves',saved.status===200);const stale=await saveState('a',stateResponse.data.revision);check('state CAS blocks stale writes',stale.status===409);const otherState=await call('b','/api/state');check('state private to each account',otherState.data.state==null);check('state cross-origin writes denied',(await saveState('a',saved.data.revision,state,'https://unrelated.invalid')).status===403);
await must(action('c',room,'space.leave'));check('leaving member loses space read access',(await snapshot('c',room)).status===403);
const publicPost=await must(action('a','public','post.create',{kind:'buy',payload:{title:'공동 공간 검증 매수',price:10}}));check('site member can read common public posts',(await must(snapshot('b','public'))).posts.some(p=>p.id===publicPost.post.id));
// Finish active fixture posts. Account IDs and invite codes remain only in this
// local database; logs contain check names and counts, never credentials/codes.
for(const [postRoom,id]of [[room,post.post.id],['our-party',privatePost.post.id],[room,party.post.id],[room,repeatedParty.post.id],[room,shop.post.id],['public',publicPost.post.id]])await action('a',postRoom,'post.close',{id});
const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({total:checks.length,passed:checks.length-failed.length,failed},null,2));if(failed.length)process.exitCode=1;
