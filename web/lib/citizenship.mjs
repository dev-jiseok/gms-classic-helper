const text=value=>String(value??'').toLowerCase().replace(/[\s()]/g,'');
/** Current MCW board NPCs are 235/431; their shared name has no town suffix. */
export function citizenshipBoardQuests(quests,town) {
  const city=text(town),boardId=city==='henesys'?'235':city==='kerningcity'?'431':null;
  if(!boardId)return [];
  return quests.filter(quest=>{
    if(quest.referenceOnly===true||quest.availability==='community-reference-only')return false;
    const npc=text(quest.npc),named=quest.citizenshipTown;
    const board=String(quest.npcId)===boardId||npc.includes('communityboard');
    return board&&(named?text(named)===city:npc.includes(city==='henesys'?'henesys':'kerning'));
  });
}
