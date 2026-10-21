export const CLASSIC_STEAM_NEWS='https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=216150&count=100&maxlength=0&feeds=steam_community_announcements';
export function plainSteamText(value){return String(value??'').replace(/\[img[^\]]*\][\s\S]*?\[\/img\]/gi,' ').replace(/<[^>]*>/g,' ').replace(/\[[^\]]*\]/g,' ').replace(/https?:\/\/\S+/g,' ').replace(/\s+/g,' ').trim();}
export function isClassicAnnouncement(item){
 const title=String(item.title??''),body=String(item.contents??''),text=plainSteamText(body);
 if(!/classic world/i.test(title+' '+body))return false;
 // The same app contains modern MapleStory. A casual Classic mention in a
 // modern update, generic Fest invitation or legal memo is not a Classic event.
 return /classic world/i.test(title)||/generic-banners-for-classic-world|all maplestory classic world game servers/i.test(body)||(/classic world/i.test(text.slice(0,350))&&/grand launch|founder[’']?s access|closed online test|classic world faq/i.test(title));
}
export function officialNewsLink(item){
 const body=String(item.contents??'');const links=[...body.matchAll(/https:\/\/(?:www\.)?nexon\.com\/maplestory\/news\/[a-z]+\/\d+\/[a-z0-9-]+/gi)].map(m=>m[0]);
 // FAQ, cash shop and promotional links inside an announcement are not its
 // original article. Prefer a Nexon article only when its slug matches title.
 const words=String(item.title??'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>3&&!['maplestory','classic','world','global','with','from','this','that'].includes(w));
 const matching=links.find(link=>words.filter(w=>link.toLowerCase().split('/').at(-1).includes(w)).length>=2);
 if(matching)return matching;
 try{const url=new URL(item.url);if(url.protocol==='https:'&&['steamcommunity.com','store.steampowered.com','steamstore-a.akamaihd.net'].includes(url.hostname))return url.href;}catch{}
 return 'https://steamcommunity.com/app/216150/announcements/';
}
export function normalizeNews(item){
 if(!isClassicAnnouncement(item)||!Number.isFinite(Number(item.date))||!String(item.gid??'').match(/^\d+$/))return null;
 const title=String(item.title).slice(0,250),body=String(item.contents??''),kind=/maintenance/i.test(title)||(/all maplestory classic world game servers/i.test(body)&&/maintenance/i.test(body))?'maintenance':/release notes|patch/i.test(title)?'patch':/event/i.test(title)?'event':'notice';
 return {id:`steam-${item.gid}`,title,publishedAt:new Date(Number(item.date)*1000).toISOString(),sourceUrl:officialNewsLink(item),source:'Nexon · Steam 공식 공지',kind,scope:'Global MapleStory Classic World',completed:/\[completed\]/i.test(title),summary:kind==='maintenance'?'클래식 월드 점검 공지입니다. 변경된 일정과 완료 여부는 공식 원문에서 확인해 주세요.':kind==='patch'?'클래식 월드 업데이트 안내입니다. 적용된 내용과 참여 조건은 공식 원문에서 확인해 주세요.':'클래식 월드에 관한 공식 발표입니다. 자세한 내용은 연결된 원문을 확인해 주세요.',period:null};
}
export function createNewsReader({fetchFn=fetch,clock=Date.now}={}){
 let cache=null,pending=null,retryAt=0,failures=0;
 const read=async()=>{
  const now=clock(),envelope=(extra={})=>({articles:cache?.articles??[],fetchedAt:cache?.fetchedAt??null,source:'Steam 공식 게임 공지 API',sourceUrl:'https://partner.steamgames.com/doc/webapi/ISteamNews',intervalSeconds:900,nextPollAt:new Date(Math.max(retryAt,(cache?.checkedAt??now)+900_000)).toISOString(),stale:!cache||now-cache.checkedAt>1800_000,...extra});
  if(now<retryAt)return envelope({error:'공식 공지 공급원의 재시도를 기다리고 있어요.'});
  if(cache&&now-cache.checkedAt<900_000)return envelope({cached:true});
  if(pending)return pending;
  pending=(async()=>{try{
   const response=await fetchFn(CLASSIC_STEAM_NEWS,{headers:{Accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(10_000)});
   if(!response.ok)throw new Error('Official news provider HTTP '+response.status);
   if(Number(response.headers.get('content-length'))>3_000_000)throw new Error('News response too large');
   const data=await response.json();if(!Array.isArray(data?.appnews?.newsitems))throw new Error('Unexpected news schema');
   const seen=new Set(),articles=data.appnews.newsitems.map(normalizeNews).filter(a=>{if(!a||seen.has(a.id))return false;seen.add(a.id);return true;}).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
   cache={articles,checkedAt:clock(),fetchedAt:new Date(clock()).toISOString()};failures=0;retryAt=0;return envelope();
  }catch{failures++;retryAt=clock()+Math.min(3600_000,60_000*2**Math.min(failures,6));return envelope({error:'공식 공지를 새로 확인하지 못했어요. 원본 사이트에서 최신 내용을 확인해 주세요.'});}finally{pending=null;}})();return pending;
 };
 return read;
}
