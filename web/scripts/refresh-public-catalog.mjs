#!/usr/bin/env node
/** Complete public-source snapshot. No authentication or GG database copying. */
import {mkdir,writeFile,readFile,rename,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {WIKI_TABLES,parseCargoSchema,cargoRequestUrl,cargoRows,paginationComplete} from '../lib/public-source.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),args=process.argv.slice(2),startedAt=new Date().toISOString(),snapshotId=startedAt.replace(/[:.]/g,'-');
const destination=resolve(root,'work/public-catalog-input',snapshotId),api='https://maplestory.io/api/MCW/1';
const reuse=args.find(a=>a.startsWith('--reuse-indices-from='))?.slice(21),noBuild=args.includes('--no-build');
const manifest={schemaVersion:1,snapshotId,startedAt,completedAt:null,status:'collecting',sources:{wiki:{id:'mapleclassic-wiki',url:'https://mapleclassic.wiki/',license:'CC BY-NC-SA 4.0'},mcw:{id:'maplestory-io',url:api,version:'MCW/1'}},indices:{},tables:{},errors:[]};
await mkdir(destination,{recursive:true});console.log(JSON.stringify({destination,snapshotId,noBuild}));
const sleep=ms=>new Promise(done=>setTimeout(done,ms));let lastStart=0;
const sha=text=>createHash('sha256').update(text).digest('hex');
async function checkpoint(){const path=resolve(destination,'manifest.json');await writeFile(path+'.tmp',JSON.stringify(manifest,null,2)+'\n');await rename(path+'.tmp',path);}
async function request(url){
 for(let attempt=0;attempt<3;attempt++){
  await sleep(Math.max(0,lastStart+150-Date.now()));lastStart=Date.now();
  const response=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'error',headers:{'User-Agent':'MapleCompassPersonalHelper/0.3 (public Wiki factual catalog; no authentication)'}});
  if(response.status===429||response.status>=500){if(attempt===2)throw Error('Public source HTTP '+response.status);const retry=response.headers.get('retry-after'),delay=retry&&Number.isFinite(Number(retry))?Number(retry)*1000:1000*(attempt+1);await sleep(Math.min(60000,delay));continue;}
  if(!response.ok)throw Error('Public source HTTP '+response.status+' '+new URL(url).pathname);
  const text=await response.text();if(Buffer.byteLength(text)>12_000_000)throw Error('Public source response exceeds12MB bound');
  return{url,text,status:response.status,fetchedAt:new Date().toISOString(),sha256:sha(text),bytes:Buffer.byteLength(text),contentType:response.headers.get('content-type')};
 }
}
async function saveResponse(file,response){await writeFile(resolve(destination,file),response.text);return{file,url:response.url,status:response.status,fetchedAt:response.fetchedAt,sha256:response.sha256,bytes:response.bytes,digestOf:'decoded response body bytes'};}
try{
 // Public schemas replace copied column subsets. Every table is paged to an
 // observed short page; a limit or failed query never means complete coverage.
 for(const {name,table} of WIKI_TABLES){
  const schemaResponse=await request('https://mapleclassic.wiki/wiki/Special:CargoTables/'+table),schema=parseCargoSchema(schemaResponse.text,table);
  const entry=manifest.tables[table]={name,table,sourceUrl:schemaResponse.url,confidence:'community-reference',schema:{...schema,...await saveResponse('schema-'+table+'.html',schemaResponse)},pages:[],rows:0,complete:false},all=[];
  for(let page=0;;page++){
   if(page>=1000)throw Error('Cargo pagination exceeded explicit1000-page bound for '+table);
   const offset=page*500,response=await request(cargoRequestUrl(table,schema.fields,offset)),body=JSON.parse(response.text),rows=cargoRows(body);
   if(rows.length>500)throw Error('Cargo page exceeds requested limit for '+table);
   entry.pages.push({...await saveResponse('mcw-'+name+'-'+offset+'.json',response),offset,limit:500,rows:rows.length});all.push(...rows);entry.rows=all.length;await checkpoint();
   if(paginationComplete(rows.length,500)){entry.complete=true;break;}
  }
  entry.declaredRows=schema.declaredRows;entry.countMatchesDeclaration=schema.declaredRows===null?null:entry.rows===schema.declaredRows;
  if(entry.countMatchesDeclaration===false)throw Error(`${table}: declared${schema.declaredRows}, collected${entry.rows}`);
  const aggregate=JSON.stringify({cargoquery:all.map(title=>({title}))});await writeFile(resolve(destination,'mcw-'+name+'.json'),aggregate);entry.aggregate={file:'mcw-'+name+'.json',sha256:sha(aggregate),bytes:Buffer.byteLength(aggregate)};
  console.log(JSON.stringify({table,rows:entry.rows,fields:schema.fields.length,pages:entry.pages.length,complete:entry.complete}));await checkpoint();
 }
 for(const [name,endpoint] of [['items','item'],['mobs','mob'],['maps','map'],['npcs','npc'],['quests','quest']]){
  if(reuse){
   const path=resolve(reuse,'mcw-'+name+'.json'),text=await readFile(path,'utf8'),rows=JSON.parse(text);if(!Array.isArray(rows)||!rows.length)throw Error('Invalid reused public index '+name);
   await writeFile(resolve(destination,'mcw-'+name+'.json'),text);manifest.indices[name]={file:'mcw-'+name+'.json',url:api+'/'+endpoint,rows:rows.length,sha256:sha(text),bytes:Buffer.byteLength(text),reused:true,reusedFrom:path,fetchedAt:(await stat(path)).mtime.toISOString(),fetchedAtBasis:'source file modification time; not a new network verification',complete:true};
  }else{const response=await request(api+'/'+endpoint),rows=JSON.parse(response.text);if(!Array.isArray(rows)||!rows.length)throw Error('Invalid public index '+name);manifest.indices[name]={...await saveResponse('mcw-'+name+'.json',response),rows:rows.length,complete:true};}
  await checkpoint();
 }
 const params=new URLSearchParams({action:'parse',page:'Module:ExperienceCurve',prop:'wikitext',format:'json'}),exp=await request('https://mapleclassic.wiki/api.php?'+params),body=JSON.parse(exp.text);if(body.error||!body.parse)throw Error('Invalid public EXP module');manifest.expModule=await saveResponse('mcw-exp-module.json',exp);
 manifest.completedAt=new Date().toISOString();manifest.status='complete';await checkpoint();
 if(!noBuild){const env={...process.env,MCW_REFERENCE_DIR:destination,MCW_VERIFIED_AT:manifest.completedAt.slice(0,10)};for(const script of ['build-job-reference.py','build-experience-reference.py','build-public-catalog.py']){const result=spawnSync('python3',[resolve(root,'scripts',script)],{cwd:root,env,stdio:'inherit'});if(result.status!==0)throw Error('Builder failed: '+script);}}
 console.log(JSON.stringify({destination,manifest:resolve(destination,'manifest.json'),status:manifest.status,tables:Object.fromEntries(Object.entries(manifest.tables).map(([k,v])=>[k,{rows:v.rows,fields:v.schema.fields.length,complete:v.complete}])),built:!noBuild}));
}catch(error){manifest.status='failed';manifest.completedAt=new Date().toISOString();manifest.errors.push({message:error.message,at:manifest.completedAt});await checkpoint();console.error(JSON.stringify({destination,status:'failed',error:error.message}));process.exitCode=1;}
