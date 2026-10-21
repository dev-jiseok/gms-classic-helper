/** Fair bounded scans: every enabled explicit item ID gets a turn. */
export function selectWatchBatch(watches,cursor=0,size=6){
 const enabled=watches.filter(w=>w.enabled!==false),ids=[...new Set(enabled.filter(w=>/^\d{1,10}$/.test(String(w.itemId))).map(w=>String(w.itemId)))];
 const start=ids.length?Math.max(0,Math.floor(cursor))%ids.length:0,count=Math.min(Math.max(1,size),ids.length);
 const selected=Array.from({length:count},(_,i)=>ids[(start+i)%ids.length]);
 return {ids:selected,nextCursor:ids.length?(start+count)%ids.length:0,totalItems:ids.length,batches:Math.ceil(ids.length/Math.max(1,size)),queryOnly:enabled.filter(w=>!/^\d{1,10}$/.test(String(w.itemId))).length};
}
