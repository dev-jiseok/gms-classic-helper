export const PRIVATE_ROOM = 'our-party';
export const PUBLIC_ROOM = 'public';
export const POST_KINDS = ['sell','buy','party','message','nickname','shop'];
export function cleanText(value,max=100){return String(value??'').trim().slice(0,max);}
export function safeAmount(value,min=0,max=2147483647){const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)throw new Error('가격과 수량을 확인해 주세요.');return n;}
export function validatePost(input){
 if(!POST_KINDS.includes(input.kind))throw new Error('게시물 종류를 확인해 주세요.');
 const raw=input.payload??{},title=cleanText(raw.title);if(!title)throw new Error('제목을 입력해 주세요.');
 const items=Array.isArray(raw.items)?raw.items.slice(0,50).map(i=>({id:cleanText(i.id||crypto.randomUUID(),80),itemId:cleanText(i.itemId,80),name:cleanText(i.name),price:safeAmount(i.price),quantity:Math.floor(safeAmount(i.quantity??1,1,999999)),options:i.options??{}})):[];
 if(input.kind==='shop'&&!items.length)throw new Error('상점에 판매할 상품을 한 개 이상 추가해 주세요.');
 return {kind:input.kind,payload:{...raw,title,description:cleanText(raw.description,3000),price:safeAmount(raw.price??0),quantity:Math.floor(safeAmount(raw.quantity??1,1,999999)),capacity:Math.floor(safeAmount(raw.capacity??4,2,30)),items,channel:cleanText(raw.channel,20),location:cleanText(raw.location,100),contact:cleanText(raw.contact,150),members:Array.isArray(raw.members)?raw.members.slice(0,30):[]}};
}
export function canReadRoom(room,userId,members=[]){return room===PRIVATE_ROOM||room===PUBLIC_ROOM||members.some(m=>m.spaceId===room&&m.userId===userId);}
export function canReadPost(post,userId,member=false){return post.room===PRIVATE_ROOM?post.ownerId===userId:post.room===PUBLIC_ROOM||member;}
export function acceptPartyMember(payload,member){const members=Array.isArray(payload.members)?payload.members:[];if(members.some(m=>(typeof m==='string'?m:m.userId)===member.userId))return {...payload,members};if(members.length>=Number(payload.capacity??4))throw new Error('파티 정원이 찼어요.');return {...payload,members:[...members,member]};}
export function priceOfCart(items,cart){return items.reduce((total,i)=>total+Number(i.price||0)*Math.max(0,Math.min(Number(i.quantity||0),Math.floor(Number(cart[i.id])||0))),0);}
