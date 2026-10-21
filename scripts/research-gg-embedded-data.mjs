// Read-only artifact inspection. Parse source as text; never execute its code.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parse} from '@babel/parser';
function walk(node,visit){if(!node||typeof node!=='object')return;visit(node);for(const [key,value] of Object.entries(node)){if(['loc','extra','comments'].includes(key))continue;if(Array.isArray(value))for(const child of value)walk(child,visit);else if(value&&typeof value==='object')walk(value,visit);}}
function shape(value){if(Array.isArray(value))return {type:'array',count:value.length,firstFields:value[0]&&typeof value[0]==='object'?Object.keys(value[0]).slice(0,35):[]};if(value&&typeof value==='object')return {type:'object',count:Object.keys(value).length,keys:Object.keys(value).length<=30?Object.keys(value):[]};return {type:typeof value,...(typeof value==='number'?{value}:{})};}
const report={at:new Date().toISOString(),reaEvidence:['ev_47eec1404dc58216156b661098af3136a75d37c845f3868bc542c38e899c33f4','ev_0d8e15c61615457a70b29ec4ba3c74244502604da2abce72b596a0bda976188e'],scope:'Static source literal transformation only, no bundle/bootstrap execution, no full dataset export',artifacts:[],embedded:[]};
for(const [file,chunk] of [['shared2752.js','2752-15f563b5d9d92f25.js'],['codex7940.js','7940.56bce85b283cd1ca.js'],['shared2589.js','2589.8c56662766bc5594.js']]){
const path=new URL('../research/output/gg-public-assets-20261021/'+file,import.meta.url),bytes=await readFile(path),text=bytes.toString('utf8'),ast=parse(text),modules=ast.program.body[0].expression.arguments[0].elements[1].properties;
report.artifacts.push({file,sourceUrl:'https://xn--bj0bv7uo4la196f.com/_next/static/chunks/'+chunk,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
for(const mod of modules){
 const body=mod.value?.body?.body;if(!body)continue;
 const declarations=body.filter(x=>x.type==='VariableDeclaration').flatMap(x=>x.declarations);
 const attribution=declarations.find(x=>x.init?.type==='StringLiteral'&&x.init.value.includes('codex data: MapleClassic Wiki'))?.init?.value;
 const encoded=declarations.find(x=>x.init?.type==='StringLiteral'&&x.init.value!==attribution)?.init?.value;
 if(!attribution?.includes('codex data: MapleClassic Wiki')||!encoded)continue;
 let alphabet=null;walk(mod.value,n=>{if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.property.name==='charCodeAt'&&n.callee.object.type==='StringLiteral'&&n.callee.object.value.length===95)alphabet=n.callee.object.value;});
 if(!alphabet)throw Error('Unrecognized decoder');
 let shift=0;for(let i=0;i<attribution.length;i++)shift=(31*shift+attribution.charCodeAt(i))%11172;shift=shift||1;
 const decoded=Array.from({length:encoded.length},(_,i)=>{const c=encoded.charCodeAt(i);return String.fromCharCode(c>31&&c<127?alphabet.charCodeAt(c-32):c>=44032&&c<55204?44032+(c-44032+11172-shift)%11172:c);}).join('');
 const value=JSON.parse(decoded),root=shape(value),collections=value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,shape(v)])):{};
 const urls=[...new Set([...decoded.matchAll(/https?:\/\/[^"\s\\]+/g)].map(x=>x[0]))];
 report.embedded.push({file,module:String(mod.key.value),sourceRange:{start:mod.start,end:mod.end},attribution,...(typeof value.updated==='string'?{updated:value.updated}:{}),decodedSha256:createHash('sha256').update(decoded).digest('hex'),decodedBytes:Buffer.byteLength(decoded),root,collections,sourceHosts:[...new Set(urls.map(u=>{try{return new URL(u).host;}catch{return 'invalid';}}))],referenceUrls:urls.filter(u=>!u.includes('/wiki/')).slice(0,8)});
}
}
await writeFile(new URL('../research/output/gg-embedded-data-shapes-20261021.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
