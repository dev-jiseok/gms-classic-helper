import { normalizeQuote, stableHash } from './market-core.mjs';
const marker=/\b(WTS|WTB|SELL(?:ING)?|BUY(?:ING)?)\b|(?:^|\s)([SB])\s*>|(팝니다|삽니다)/i;
export function parseTradePrice(value){
 const text=String(value??'').trim().toLowerCase().replace(/,/g,'');
 const match=text.match(/^(\d+(?:\.\d+)?)\s*(k|m|b|mil|million|mesos?|메소)?$/i);if(!match)return null;
 const unit=match[2]||'',multiplier=unit==='k'?1000:['m','mil','million'].includes(unit)?1_000_000:unit==='b'?1_000_000_000:1;
 const price=Number(match[1])*multiplier;return Number.isFinite(price)&&price>0&&price<=Number.MAX_SAFE_INTEGER?price:null;
}
export function parseTradeLine(line,{observedAt=new Date().toISOString(),confidence=null,source='paste'}={}){
 const raw=String(line??'').trim().slice(0,1500);if(!raw)return null;
 const action=marker.exec(raw);if(!action)return null;
 const type=/WTB|BUY|삽니다/i.test(action[0])||action[2]?.toUpperCase()==='B'?'buy':'sell';
 const content=raw.slice(action.index+action[0].length).trim();
 const priceMatches=[...content.matchAll(/(?<![\w.])(\d[\d,]*(?:\.\d+)?)\s*(million|mil|mesos?|메소|[kmb])(?![A-Za-z\d])/gi)].filter(m=>parseTradePrice(m[1]+m[2])!=null);
 const issues=[];
 if(priceMatches.length!==1)issues.push(priceMatches.length?'한 문장에 가격이 여러 개 있어요.':'k·m·메소 등의 단위가 붙은 가격을 찾지 못했어요.');
 const chosen=priceMatches.length===1?priceMatches[0]:null;
 const price=chosen?parseTradePrice(chosen[1]+chosen[2]):null;
 if(/\b(?:offer|c\.?o|a\.?w|current offer|auto win|bundle|all for|total|stack)\b|묶음|일괄|개당\s*\?/i.test(content))issues.push('입찰·즉구·묶음 가격인지 확인해야 해요.');
 if(/[;/]|\s\+\s|\band\b/i.test(content))issues.push('여러 아이템이 함께 적혔을 수 있어요.');
 const options={};
 const patterns={attack:/(\d+)\s*(?:wa|watt|att|atk)\b/i,magicAttack:/(\d+)\s*(?:ma|matt|matk)\b/i,str:/(\d+)\s*str\b/i,dex:/(\d+)\s*dex\b/i,int:/(\d+)\s*int\b/i,luk:/(\d+)\s*luk\b/i,accuracy:/(\d+)\s*(?:acc|accuracy)\b/i,slots:/(\d+)\s*(?:slots?|ug)\b/i};
 for(const[k,pattern]of Object.entries(patterns)){const value=content.match(pattern);if(value)options[k]=Number(value[1]);}
 const prefix=raw.slice(0,action.index).replace(/\[.*?\]/g,'').replace(/[:\s]+$/,'').trim();
 const channel=raw.match(/(?:\bch(?:annel)?\s*|채널\s*)(\d+)/i)?.[1]??'';
 let itemName=chosen?content.slice(0,chosen.index):content;
 for(const pattern of Object.values(patterns))itemName=itemName.replace(pattern,' ');
 itemName=itemName.replace(/\b(?:each|ea|for|selling|buying)\b/gi,' ').replace(/^[\s>:\-]+/,'').replace(/[\s\-:@]+$/g,'').replace(/\s+/g,' ').trim();
 if(!itemName)issues.push('아이템 이름을 직접 입력해 주세요.');
 if(confidence!=null&&Number(confidence)<80)issues.push('문자 인식 신뢰도가 낮아요. 숫자와 아이템 이름을 다시 확인해 주세요.');
 const fingerprint=stableHash(raw.toLowerCase().replace(/\s+/g,' '));
 return {id:`ocr-${fingerprint}`,fingerprint,raw,type,price,itemId:'',itemName,quantity:1,options,optionsComplete:false,seller:prefix.slice(0,80),channel,observedAt,confidence:confidence==null?null:Number(confidence),captureSource:source,issues,reviewed:false,priceBasis:'unknown'};
}
export function parseTradeText(text,metadata={}){const seen=new Set();return String(text??'').split(/\r?\n/).map(line=>parseTradeLine(line,metadata)).filter(row=>{if(!row||seen.has(row.fingerprint))return false;seen.add(row.fingerprint);return true;}).slice(0,150);}
export function mergeOcrCandidates(existing,incoming){const byId=new Map(existing.map(row=>[row.fingerprint,row]));for(const row of incoming)if(!byId.has(row.fingerprint))byId.set(row.fingerprint,row);return [...byId.values()].slice(-150);}
export function confirmOcrCandidate(candidate,{now=Date.now()}={}){
 if(!candidate?.reviewed)throw new Error('아이템·가격·수량·옵션을 검토한 뒤 확인 체크를 눌러 주세요.');
 if(candidate.priceBasis!=='unit')throw new Error('개당 가격인지 확인해 주세요. 묶음 전체 가격은 개당 가격으로 수정해야 합니다.');
 if(!String(candidate.itemId??'').trim()&&!String(candidate.itemName??'').trim())throw new Error('확인한 아이템 이름 또는 ID를 입력해 주세요.');
 const quote=normalizeQuote({...candidate,id:candidate.id,at:candidate.observedAt,source:candidate.captureSource==='screen'?'내 게임 화면 · OCR 확인':candidate.captureSource==='image'?'내 이미지 · OCR 확인':'내 확성기 원문 · 직접 확인',sourceId:'manual',verification:'user'}, {},now);
 if(!quote)throw new Error('양수 단가·수량과 실제 확인 시각을 확인해 주세요.');
 return {...quote,evidence:{kind:candidate.captureSource==='paste'?'pasted-game-text':'screen-ocr',confidence:candidate.confidence,raw:candidate.raw,observedAt:candidate.observedAt,userReviewed:true}};
}
