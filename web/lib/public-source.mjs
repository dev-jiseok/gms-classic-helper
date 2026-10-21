export const WIKI_API='https://mapleclassic.wiki/api.php';
export const WIKI_TABLES=Object.freeze([
 ['map-cargo','maps'],['portals','portals'],['spawns','monster_spawns'],
 ['monster-cargo','monsters'],['npc-cargo','npcs'],['map-npcs','map_npcs'],
 ['items-cargo','items'],['drops','monster_drops'],['shop-master','shops'],
 ['shops','shop_items'],['recipes','recipes'],['quest-cargo','quests'],
 ['quest-required','quest_required_items'],['quest-steps','quest_steps'],
 ['quest-rewards','quest_rewards'],['skill-cargo-full','skills'],['quest-enemies','quest_enemies'],
].map(([name,table])=>Object.freeze({name,table})));
export function parseCargoSchema(text,table){
 const section=text.match(/Table structure:<\/p>\s*<ol>([\s\S]*?)<\/ol>/)?.[1];
 if(!section)throw Error(`No public Cargo schema for ${table}`);
 const fields=[...section.matchAll(/<li><strong>([a-zA-Z_][a-zA-Z0-9_]*)<\/strong>\s*-\s*<tt>([\s\S]*?)<\/tt>/g)].map(([,name,type])=>({name,type:type.replace(/<[^>]*>/g,'').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&')}));
 if(!fields.length||new Set(fields.map(f=>f.name)).size!==fields.length)throw Error(`Invalid Cargo schema for ${table}`);
 const total=text.match(/This table has\s*<b>([\d,]+)<\/b>\s*rows altogether/);
 return{table,fields,declaredRows:total?Number(total[1].replaceAll(',','')):null};
}
export function cargoRequestUrl(table,fields,offset=0,limit=500){
 if(!/^[a-z_]+$/.test(table)||!fields.length||fields.some(f=>!/^\w+$/.test(f.name??f)))throw Error('Invalid public table/field identifier');
 if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1||limit>500)throw Error('Invalid Cargo pagination');
 const params=new URLSearchParams({action:'cargoquery',tables:table,fields:['_pageName=page',...fields.map(f=>f.name??f)].join(','),order_by:'_ID',limit:String(limit),offset:String(offset),format:'json'});
 return WIKI_API+'?'+params;
}
export function cargoRows(body){
 if(body?.error)throw Error('Public Cargo error: '+(body.error.code??'unknown'));
 if(!Array.isArray(body?.cargoquery)||body.cargoquery.some(row=>!row||typeof row.title!=='object'||row.title===null))throw Error('Invalid public Cargo response');
 return body.cargoquery.map(row=>row.title);
}
export function paginationComplete(count,requestedLimit){return Number.isSafeInteger(count)&&count>=0&&count<requestedLimit;}
