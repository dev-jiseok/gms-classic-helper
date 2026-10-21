import {WIKI_TABLES} from './public-source.mjs';
const finiteCount=n=>Number.isSafeInteger(n)&&n>=0;
/** Verify reported totals against stored rows, rather than declaring a fetch complete by its HTTP code. */
export function catalogCoverage(snapshot,sourceTables,counts={}){
 const inventories=(snapshot?.sources??[]).flatMap(source=>(source.tables??[]).map(t=>({...t,sourceId:source.id})));
 const tables=inventories.map(info=>{
  const table=Object.hasOwn(sourceTables?.tables??{},info.name)?sourceTables.tables[info.name]:null,storedRows=Array.isArray(table?.rows)?table.rows.length:0;
  const sourceRows=info.sourceRows,complete=info.complete===true&&table?.complete===true&&finiteCount(sourceRows)&&sourceRows===storedRows&&info.storedRows===storedRows;
  return {name:info.name,sourceId:info.sourceId,sourceUrl:info.sourceUrl??table?.sourceUrl,sourceRows,storedRows,complete,fieldCount:info.fieldCount??table?.fields?.length??0,sha256:info.sha256};
 });
 const names=new Set(tables.map(t=>t.name)),missingTables=WIKI_TABLES.map(t=>t.table).filter(name=>!names.has(name));
 return {snapshotId:snapshot?.snapshotId??null,checkedAt:snapshot?.checkedAt??null,complete:!missingTables.length&&names.size===tables.length&&tables.every(t=>t.complete),missingTables,tables,indices:(snapshot?.sources??[]).flatMap(s=>s.indices??[]),normalizedCounts:counts,unresolvedRelations:snapshot?.unresolvedRelations??[],sources:(snapshot?.sources??[]).map(({id,url,version,confidence,license,checkedAt})=>({id,url,version,confidence,license,checkedAt}))};
}
export function sourceTablePage(sourceTables,name,{q='',offset=0,limit=20}={}){
 if(!Object.hasOwn(sourceTables?.tables??{},name))return {error:'지원하지 않는 원천 자료입니다.'};
 const table=sourceTables.tables[name],query=String(q).slice(0,120).trim().toLocaleLowerCase(),all=table.rows??[];
 const rows=query?all.filter(row=>Object.values(row).some(v=>v!=null&&String(typeof v==='object'?JSON.stringify(v):v).toLocaleLowerCase().includes(query))):all;
 const start=Math.max(0,Math.min(100_000,Math.floor(Number(offset)||0))),size=Math.max(1,Math.min(100,Math.floor(Number(limit)||20)));
 return {table:name,rows:rows.slice(start,start+size),total:rows.length,offset:start,limit:size,fields:table.fields,sourceUrl:table.sourceUrl,complete:table.complete===true,checkedAt:sourceTables.checkedAt};
}
