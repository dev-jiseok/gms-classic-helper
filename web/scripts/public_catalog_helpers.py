"""Pure normalization of licensed public Cargo facts; never executes markup."""
import html, re
from collections import defaultdict

TABLE_NAMES={'map-cargo':'maps','portals':'portals','spawns':'monster_spawns','monster-cargo':'monsters','npc-cargo':'npcs','map-npcs':'map_npcs','items-cargo':'items','drops':'monster_drops','shop-master':'shops','shops':'shop_items','recipes':'recipes','quest-cargo':'quests','quest-required':'quest_required_items','quest-steps':'quest_steps','quest-rewards':'quest_rewards','skill-cargo-full':'skills','quest-enemies':'quest_enemies'}

def plain(value):
    if value is None:return None
    value=html.unescape(str(value))
    value=re.sub(r'</?(?:a|abbr|b|br|cite|code|div|em|font|h[1-6]|i|li|ol|p|s|small|span|strong|sup|sub|table|tbody|td|th|tr|u|ul)(?:\s[^>]*|\s*/?)>','',value,flags=re.I)
    value=re.sub(r'\[\[([^\]|]+)(?:\|([^\]]*))?\]\]',lambda m:m[2] if m[2] is not None else m[1],value)
    value=re.sub(r'\[(https?://[^\s\]]+)\s+([^\]]+)\]',lambda m:m[2],value)
    return value.strip()

def numeric(value):
    if value is None or value=='':return None
    try:return float(value) if '.' in str(value) else int(value)
    except (TypeError,ValueError):return None

def boolean(value):
    if value is None or value=='':return None
    if value in [True,1,'1','true','yes']:return True
    if value in [False,0,'0','false','no']:return False
    return None

def typed_record(row,fields):
    types={f['name']:f['type'] for f in fields}
    out={}
    for raw_name,value in row.items():
        name=raw_name.replace(' ','_')
        kind=types.get(name)
        if kind in ['Integer','Float']:out[name]=numeric(value)
        elif kind=='Boolean':out[name]=boolean(value)
        else:out[name]=plain(value) if isinstance(value,str) else value
    return out

def relation_index(rows):
    """An explicit Wiki page beats a duplicate display name. No fuzzy matching."""
    ids={str(r['id']):r for r in rows};pages=defaultdict(list);names=defaultdict(list)
    def key(v):return plain(v or '').lower().replace('’',"'").replace('_',' ')
    for row in rows:
        if row.get('wikiPage'):pages[key(row['wikiPage'])].append(row)
        for name in set([row.get('en'),row.get('name')]):
            if name:names[key(name)].append(row)
    def unique(values):
        seen={str(v['id']):v for v in values}
        if len(seen)==1:return next(iter(seen.values()))
        # A Wiki article can hold a normal monster plus explicit job/PQ
        # variants. Its unqualified Page relation denotes the sole normal row.
        normal=[v for v in seen.values() if not v.get('variant')]
        return normal[0] if len(normal)==1 else None
    def resolve(value):
        if value is None or value=='':return None
        text=plain(value)
        if text in ids:return ids[text]
        candidates=pages.get(key(text),[])
        if candidates:return unique(candidates)
        return unique(names.get(key(text),[]))
    return resolve

def source_entity(rows,source):
    """Keep client IDs authoritative; legacy Wiki IDs live in their own namespace.

    A unique exact client name is an attributed cross-source identity match,
    not proof that the source's older numeric ID is a current client ID.
    """
    source_id=numeric(source.get('id'))
    source_id=str(source_id) if source_id is not None else None
    def identity_key(value):
        # Angle/round brackets are alternative API/Wiki map-name formatting;
        # punctuation, words and stage numbers otherwise remain significant.
        return ' '.join(plain(value or '').replace('<','(').replace('>',')').replace('’',"'").casefold().split())
    name=identity_key(source.get('name en') or source.get('page'))
    matched=rows.get(source_id)
    if matched and identity_key(matched.get('en'))==name:
        return rows[source_id],{'method':'explicit-id','sourceId':source_id,'confidence':'source-reference'}
    exact=[r for r in rows.values() if r.get('clientIndexName') and identity_key(r.get('clientIndexName'))==name]
    if len(exact)==1 and not source.get('variant'):
        return exact[0],{'method':'unique-exact-name','sourceId':source_id,'clientId':exact[0]['id'],'confidence':'cross-source-reference'}
    return None,{'method':'wiki-reference-only','sourceId':source_id,'confidence':'community-reference','reason':'id-name-conflict' if matched else 'ambiguous-client-name' if exact else 'no-client-match','conflictingClientName':matched.get('clientIndexName') if matched else None}

def npc_at_map(npc_name,map_id,npcs,map_resolver):
    """Disambiguate only an explicit NPC name + explicit destination map fact."""
    if not npc_name or not map_id:return None
    def key(value):return plain(value or '').casefold().replace('_',' ')
    candidates=[]
    for npc in npcs:
        if key(npc_name) not in {key(npc.get('en')),key(npc.get('name')),key(npc.get('wikiPage'))}:continue
        explicit_map=map_resolver(npc.get('wikiFields',{}).get('map') or npc.get('mapName'))
        if str(map_id) in [str(v) for v in npc.get('mapIds',[])] or (explicit_map and str(explicit_map['id'])==str(map_id)):candidates.append(npc)
    return candidates[0] if len(candidates)==1 else None

def step_record(row,resolvers,source_url,verified_at):
    def link(kind,field):
        value=row.get(field);found=resolvers[kind](value)
        return (str(found['id']) if found else None,found.get('name') if found else plain(value))
    map_id,map_name=link('maps','destination map');npc_id,npc_name=link('npcs','target npc');monster_id,monster_name=link('monsters','target monster');item_id,item_name=link('items','required item')
    return {'step':numeric(row.get('step number')),'title':plain(row.get('title ko') or row.get('title')),'description':plain(row.get('description ko') or row.get('description')),'titleEn':plain(row.get('title')),'descriptionEn':plain(row.get('description')),'destinationMapId':map_id,'destinationMapName':map_name,'targetNpcId':npc_id,'targetNpcName':npc_name,'targetMonsterId':monster_id,'targetMonsterName':monster_name,'requiredItemId':item_id,'requiredItemName':item_name,'notes':plain(row.get('notes')),'phase':None,'sourceId':'mapleclassic-wiki','sourceTable':'quest_steps','sourceUrl':source_url,'sourceConfidence':'community-reference','verifiedAt':verified_at,'sourceFields':{k.replace(' ','_'):plain(v) if isinstance(v,str) else v for k,v in row.items()}}

def merge_enrichment(row,patch):
    """Explicit client zero wins; absent client stats do not erase Wiki facts."""
    merged={**row,**patch}
    for field in ['stats','statRequirements','fieldOrigins']:
        if isinstance(row.get(field),dict) or isinstance(patch.get(field),dict):
            values={**row.get(field,{})}
            for key,value in patch.get(field,{}).items():
                if value is not None or key not in values:values[key]=value
            merged[field]=values
    # These are newer whole-source relations, absent from old enrichment caches.
    for field in ['steps','wikiFields','wikiFieldSource','sourceRows','wikiPage','wikiId','idMapping']:
        if field in row:merged[field]=row[field]
    return merged
