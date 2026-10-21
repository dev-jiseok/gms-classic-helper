const BASE='https://maplestory.io/api/MCW/1';
const TYPES={items:'item',monsters:'monster',mob:'monster',npcs:'npc',maps:'map'};

export function gameMediaKind(kind){return TYPES[kind]??kind;}
export function gameMediaId(id){const value=String(id??'');return /^\d{1,10}$/.test(value)?value:null;}

/** MCW mob icons are not exposed for every mob. Select a pose actually present. */
export function selectMonsterPose(framebooks){
  if(!framebooks||typeof framebooks!=='object'||Array.isArray(framebooks))return null;
  const valid=Object.entries(framebooks).filter(([name,count])=>/^[a-zA-Z]\w*$/.test(name)&&Number.isInteger(count)&&count>0);
  for(const pose of ['stand','move','fly','stand1','move1','fly1'])if(valid.some(([name])=>name===pose))return pose;
  return valid.find(([name])=>/^(stand|move|fly)\d*$/.test(name))?.[0]??null;
}

/** @param {{kind?:string,id?:string|number|null,framebooks?:any,animated?:boolean}} [options] */
export function gameMediaUrl({kind,id,framebooks,animated=false}={}){
  const type=gameMediaKind(kind),safe=gameMediaId(id);
  if(safe===null)return null;
  if(type==='item')return `${BASE}/item/${safe}/icon`;
  if(type==='npc')return `${BASE}/npc/${safe}/icon`;
  if(type==='map')return `${BASE}/map/${safe}/minimap`;
  if(type==='monster'){
    const pose=selectMonsterPose(framebooks);
    return pose?`${BASE}/mob/${safe}/render/${animated?'animated/':''}${pose}${animated?'':'/0'}`:null;
  }
  return null;
}

export function monsterMetadataUrl(id){const safe=gameMediaId(id);return safe===null?null:`${BASE}/mob/${safe}`;}

/** @param {{kind?:string,id?:string|number|null,animated?:boolean}} [options] */
export function gameMediaProxyUrl({kind,id,animated=false}={}){
  const type=gameMediaKind(kind),safe=gameMediaId(id);
  return safe!==null&&['item','monster','npc','map'].includes(type)?`/api/game-media?kind=${type}&id=${safe}${animated?'&animate=1':''}`:null;
}

/** WZ children prove a pose exists even when the normal mob detail is missing. */
export function selectWzPose(kind,children){
  if(!Array.isArray(children))return null;
  const frames=Object.fromEntries(children.filter(name=>typeof name==='string').map(name=>[name,1]));
  if(gameMediaKind(kind)==='monster')return selectMonsterPose(frames);
  return ['stand','default','smile0','smile1'].find(name=>Object.hasOwn(frames,name))??null;
}

export function gameWzCanvasRoot(kind,id){
  const safe=gameMediaId(id),type=gameMediaKind(kind),folder=type==='monster'?'Mob':type==='npc'?'Npc':null;
  return safe!==null&&folder?`https://maplestory.io/api/wz/MCW/1/${folder}/_Canvas/${safe.padStart(7,'0')}.img`:null;
}

export function itemWzIconUrl(id){
  const safe=gameMediaId(id);if(safe===null)return null;
  const prefix=Math.floor(Number(safe)/10000),folders={100:'Cap',101:'Accessory',102:'Accessory',103:'Accessory',104:'Coat',105:'Longcoat',106:'Pants',107:'Shoes',108:'Glove',109:'Shield',110:'Cape',111:'Ring',112:'Accessory',113:'Accessory',114:'Accessory',115:'Accessory',116:'Accessory',117:'Accessory',118:'Accessory',119:'Accessory'};
  const folder=folders[prefix]??(prefix>=130&&prefix<=159?'Weapon':null);
  return folder?`https://maplestory.io/api/wz/MCW/1/Character/${folder}/${safe.padStart(8,'0')}.img/info/icon`:null;
}

/** Verify the response media type, file signature and bounded dimensions. */
export function inspectGameImage(bytes,contentType){
  if(!(bytes instanceof Uint8Array)||bytes.length<14)return null;
  const type=String(contentType??'').split(';')[0].trim().toLowerCase();
  let width,height,byteLength=0;
  if(type==='image/png'){
    if(bytes.length<45||![137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n)||String.fromCharCode(...bytes.slice(12,16))!=='IHDR')return null;
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);width=view.getUint32(16);height=view.getUint32(20);let at=8,hasPixels=false;
    while(at+12<=bytes.length){const length=view.getUint32(at),chunk=String.fromCharCode(...bytes.slice(at+4,at+8)),end=at+12+length;if(end>bytes.length)return null;if(chunk==='IDAT')hasPixels=true;if(chunk==='IEND'){if(length!==0||!hasPixels)return null;byteLength=end;break;}at=end;}
  }else if(type==='image/gif'){
    if(!['GIF87a','GIF89a'].includes(String.fromCharCode(...bytes.slice(0,6))))return null;
    width=bytes[6]|bytes[7]<<8;height=bytes[8]|bytes[9]<<8;let at=13+(bytes[10]&128?3*(2**((bytes[10]&7)+1)):0),hasPixels=false;
    const blocks=()=>{while(at<bytes.length){const count=bytes[at++];if(count===0)return true;at+=count;if(at>bytes.length)return false;}return false;};
    while(at<bytes.length){const block=bytes[at++];if(block===59){if(hasPixels)byteLength=at;break;}if(block===33){at++;if(!blocks())return null;}else if(block===44){if(at+9>bytes.length)return null;const packed=bytes[at+8];at+=9;if(packed&128)at+=3*(2**((packed&7)+1));at++;if(!blocks())return null;hasPixels=true;}else return null;}
  }else return null;
  // IO appends service metadata JSON after valid PNG/GIF data. Parse the real
  // image boundary rather than rejecting those images or treating JSON as art.
  return byteLength>0&&width>0&&height>0&&width<=16384&&height<=16384&&width*height<=16_000_000?{contentType:type,width,height,byteLength}:null;
}

/** Only canonical NPC IDs are used; a translated NPC name is not an asset ID. */
export function questGiverId(row){return gameMediaId(row?.npcId??row?.startNpcId);}

export function catalogMedia(kind,row={}){
  if(kind==='quests')return {kind:'npc',id:questGiverId(row),name:row.npc||row.name};
  if(kind==='recipes')return {kind:'item',id:row.outputItemId,name:row.name};
  if(kind==='shops')return {kind:'item',id:row.itemId,name:row.itemName||row.name};
  return {kind:gameMediaKind(kind),id:row.id,name:row.name||row.en,framebooks:row.framebooks??row.rawDetail?.framebooks};
}
