"""Build the public, attributed MCW catalog from saved public API responses.

Public Wiki table facts and descriptions are attributed under CC BY-NC-SA 4.0;
editorial guides are separately authored. No GG/private database is copied.
Game assets remain Nexon's property. Use the companion collector to refresh
reproducibly. Unknowns stay null.
"""
from pathlib import Path
import json, html, re, os, hashlib
from collections import defaultdict
from public_catalog_helpers import TABLE_NAMES,plain,typed_record,boolean,relation_index,step_record,merge_enrichment,source_entity,npc_at_map

ROOT=Path(__file__).resolve().parents[1]
INPUT=Path(os.environ.get('MCW_REFERENCE_DIR','/private/tmp'))
VERIFIED_AT=os.environ.get('MCW_VERIFIED_AT','2026-10-21')
OUTPUT=Path(os.environ.get('MCW_OUTPUT_DIR',str(ROOT/'content')))
manifest_path=INPUT/'manifest.json'
manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
if not manifest or manifest.get('status')!='complete':raise ValueError('Refusing missing/incomplete public source snapshot; set MCW_REFERENCE_DIR to a completed collector run')
for entry in [*manifest.get('indices',{}).values(),*(page for table in manifest.get('tables',{}).values() for page in table.get('pages',[]))]:
    saved=INPUT/entry['file']
    if saved.parent.resolve()!=INPUT.resolve() or hashlib.sha256(saved.read_bytes()).hexdigest()!=entry.get('sha256'):raise ValueError('Public source response digest mismatch: '+str(saved))
unresolved=[]
def read(name,default=None):
    p=INPUT/('mcw-'+name+'.json')
    return json.loads(p.read_text()) if p.exists() else default
def cargo(name):
    paths=list(INPUT.glob('mcw-'+name+'-*.json'))
    if not paths:
        obj=read(name,{})
        if obj.get('error'):raise ValueError(str(obj['error']))
        return [{k:html.unescape(v) if isinstance(v,str) else v for k,v in x['title'].items()} for x in obj.get('cargoquery',[])]
    out=[]
    for p in sorted(paths,key=lambda p:int(p.stem.rsplit('-',1)[1])):
        obj=json.loads(p.read_text())
        if obj.get('error'):raise ValueError(str(obj['error']))
        out.extend({k:html.unescape(v) if isinstance(v,str) else v for k,v in x['title'].items()} for x in obj.get('cargoquery',[]))
    return out
def num(v):
    if v is None or v=='':return None
    try:return float(v) if '.' in str(v) else int(v)
    except (TypeError,ValueError):return None
def clean(s):return plain(s) or ''
def key(s):return clean(s).lower().replace('’',"'")
def wiki_url(page):return 'https://mapleclassic.wiki/wiki/'+str(page).replace(' ','_')
def api_url(kind,id=None):return 'https://maplestory.io/api/MCW/1/'+kind+(('/'+str(id)) if id is not None else '')
def wiki_base(r):return {'sourceId':'mapleclassic-wiki','sourceUrl':wiki_url(r.get('page') or r.get('name en')),'verifiedAt':VERIFIED_AT,'dataVersion':r.get('game version'),'confidence':'community-reference'}
def base(kind,r):return {'id':str(r['id']),'name':r.get('name') or str(r['id']),'en':r.get('name') or str(r['id']),'clientIndexName':r.get('name'),'type':kind.rstrip('s'),'sourceId':'maplestory-io','sourceUrl':api_url({'monsters':'mob','items':'item','maps':'map','npcs':'npc','quests':'quest'}[kind],r['id']),'verifiedAt':VERIFIED_AT,'confidence':'public-client-reference','availability':'client-entry-unverified'}
seed=json.loads((ROOT/'content/seed-data.json').read_text())
source_tables={'schemaVersion':1,'snapshotId':manifest.get('snapshotId'),'checkedAt':manifest.get('completedAt') or VERIFIED_AT,'license':'CC BY-NC-SA 4.0','tables':{}}
for source_name,source_table in TABLE_NAMES.items():
    entry=manifest.get('tables',{}).get(source_table,{})
    schema=entry.get('schema',{}).get('fields',[])
    rows=[typed_record(r,schema) for r in cargo(source_name)]
    if not schema or not entry.get('complete') or entry.get('rows')!=len(rows):raise ValueError('Incomplete public table/schema: '+source_table)
    source_tables['tables'][source_table]={'sourceUrl':'https://mapleclassic.wiki/wiki/Special:CargoTables/'+source_table,'confidence':'community-reference','fields':schema,'rows':rows,'sourceRows':entry.get('rows',len(rows)),'storedRows':len(rows),'complete':entry.get('complete',False),'sha256':entry.get('aggregate',{}).get('sha256')}
aliases={k:{key(r.get('en')):r for r in seed.get(k,[])} for k in ['items','monsters','maps','quests']}
raw={k:read(v,[]) for k,v in [('items','items'),('monsters','mobs'),('maps','maps'),('npcs','npcs'),('quests','quests')]}
tables={k:cargo(v) for k,v in [('items','items-cargo'),('monsters','monster-cargo'),('maps','map-cargo'),('npcs','npc-cargo'),('quests','quest-cargo')]}
data={}; page_maps={}
for kind in raw:
    rows={str(r['id']):base(kind,r) for r in raw[kind]}
    byname={key(r['name']):r for r in rows.values()}
    for r in tables[kind]:
        rid=str(num(r.get('id'))) if num(r.get('id')) is not None else None
        existing,mapping=source_entity(rows,r)
        if existing is None:
            existing={'id':'wiki:'+r['page']+(':'+r['variant'] if r.get('variant') else ''),'name':r.get('name en') or r['page'],'en':r.get('name en') or r['page'],'type':kind.rstrip('s')}
            rows[existing['id']]=existing
        existing['wikiId']=num(r.get('id'));existing['idMapping']=mapping
        existing.update(wiki_base(r));existing['wikiPage']=r['page'];existing['referenceOnly']=mapping['method']=='wiki-reference-only';existing['availability']='community-reference-only' if existing['referenceOnly'] else 'community-listed'
        source_table={'items':'items','monsters':'monsters','maps':'maps','npcs':'npcs','quests':'quests'}[kind]
        schema=manifest.get('tables',{}).get(source_table,{}).get('schema',{}).get('fields',[])
        existing['wikiFields']=typed_record(r,schema)
        existing['wikiFieldSource']={'sourceId':'mapleclassic-wiki','table':source_table,'sourceUrl':wiki_url(r['page']),'confidence':'community-reference','checkedAt':source_tables['checkedAt']}
        existing['description']=clean(r.get('description ko') or r.get('description en')) or None
        existing['name']=r.get('name ko') or existing['name'];existing['en']=r.get('name en') or existing['en']
        if kind=='items':
            existing.update({'category':r.get('category'),'subCategory':r.get('subcategory'),'requiredLevel':num(r.get('required level')),'level':num(r.get('required level')),'requiredJobs':[s.strip() for s in (r.get('job') or '').split(',') if s.strip()],'npcSell':num(r.get('sell price')),'npcPrice':num(r.get('sell price')),'slots':num(r.get('slots')),'stats':{k:num(r.get(v)) for k,v in {'str':'stat str','dex':'stat dex','int':'stat int','luk':'stat luk','attack':'stat weapon attack','magicAttack':'stat magic attack','accuracy':'stat accuracy'}.items()},'statRequirements':{k:num(r.get('required '+k)) for k in ['str','dex','int','luk']}})
            existing['stats'].update({k:num(r.get(v)) for k,v in {'hp':'stat hp','mp':'stat mp','physicalDefense':'stat weapon defense','magicDefense':'stat magic defense','avoidability':'stat avoidability','speed':'stat speed','jump':'stat jump','critRate':'stat crit rate','critDamage':'stat crit damage'}.items()})
            existing.update({'tradeable':boolean(r.get('tradeable')),'stackable':boolean(r.get('stackable')),'maxStack':num(r.get('max stack')),'attackSpeedText':r.get('attack speed'),'attackSpeedTier':num(r.get('attack speed tier')),'recoveryHp':num(r.get('recovery hp')),'recoveryMp':num(r.get('recovery mp')),'recoveryHpPercent':num(r.get('recovery hp pct')),'recoveryMpPercent':num(r.get('recovery mp pct')),'durationMinutes':num(r.get('duration minutes')),'rechargeCost':num(r.get('recharge cost'))})
        elif kind=='monsters':
            existing.update({k:num(r.get(v)) for k,v in {'level':'level','hp':'hp','mp':'mp','exp':'exp','accuracy':'accuracy','avoidability':'avoidability','attack':'weapon attack','physicalDefense':'physical defense','magicDefense':'magic defense'}.items()})
            existing.update({'isBoss':boolean(r.get('boss')),'undead':boolean(r.get('undead')),'region':r.get('region'),'dropChance':None,'released':r.get('released'),'variant':r.get('variant'),'variantLabel':r.get('variant label'),'magicAttack':num(r.get('magic attack')),'speed':num(r.get('speed')),'knockback':num(r.get('knockback')),'elementAttack':r.get('element attack'),'elementWeak':r.get('element weak'),'elementResist':r.get('element resist'),'respawnMinutes':num(r.get('respawn minutes'))})
        elif kind=='maps':existing.update({'region':r.get('region'),'mapType':r.get('map type'),'returnMapName':r.get('return map'),'nearestTown':r.get('nearest town'),'recommendedLevelMin':num(r.get('recommended level min')),'recommendedLevelMax':num(r.get('recommended level max')),'bgm':r.get('bgm'),'bgmFile':r.get('bgm file'),'wikiImage':r.get('image'),'imageOrigin':{'x':num(r.get('origin x')),'y':num(r.get('origin y'))},'renderWidth':num(r.get('render width')),'renderHeight':num(r.get('render height'))})
        elif kind=='npcs':existing.update({'region':r.get('region'),'role':r.get('role'),'mapName':r.get('map') or r.get('location')})
        elif kind=='quests':
            existing.update({'minLevel':num(r.get('required level')),'maxLevel':num(r.get('required level max')),'requiredJob':r.get('required job'),'npc':r.get('giver'),'turnIn':r.get('turn in'),'exp':num(r.get('exp reward')),'mesos':num(r.get('meso reward')),'fame':num(r.get('fame reward')),'repeatable':r.get('repeatable')=='1','repeatPeriod':r.get('repeat period'),'region':r.get('region') or r.get('area'),'questType':r.get('quest type'),'arc':r.get('arc'),'prerequisiteNames':[x.strip() for x in (r.get('prerequisite') or '').split(';') if x.strip()],'nextQuestName':r.get('next quest'),'requirementsComplete':False,'rewardsComplete':False})
            existing.update({'completeLevel':num(r.get('complete level')),'requiredFame':num(r.get('required fame')),'profession':r.get('profession'),'professionLevel':num(r.get('profession level')),'citizenshipTown':r.get('citizenship town'),'citizenshipGrade':num(r.get('citizenship grade')),'mesoCost':num(r.get('meso cost')),'availableFrom':r.get('available from'),'availableUntil':r.get('available until'),'startMode':r.get('start mode'),'conditionsComplete':False})
            existing['rotationPool']=bool(re.search(r'community board|daily|weekly',str(r.get('giver') or '')+' '+str(r.get('repeat period') or ''),re.I))
    # Fill API-only rows with known index metadata, never treating the mob index's
    # all-zero levels as genuine level-zero monsters.
    originals={str(r['id']):r for r in raw[kind]}
    for rid,r in rows.items():
        a=originals.get(rid,{})
        alias=aliases.get(kind,{}).get(key(r['en']))
        if alias and r['name']==r['en']:r['name']=alias.get('name') or r['name']
        if alias:r['legacyId']=alias['id']
        if kind=='items':
            r.setdefault('requiredLevel',a.get('requiredLevel'));r.setdefault('level',a.get('requiredLevel'));r.setdefault('requiredJobs',a.get('requiredJobs',[]));r.setdefault('category',a.get('typeInfo',{}).get('overallCategory'));r.setdefault('subCategory',a.get('typeInfo',{}).get('subCategory'));r['isCash']=a.get('isCash') if isinstance(a.get('isCash'),bool) else None;r['requiredGender']=a.get('requiredGender');r.setdefault('npcSell',None);r.setdefault('stats',{});r.setdefault('statRequirements',{});r.setdefault('slots',None)
            if r.get('referenceOnly'):r.update({'coreRequirementsComplete':False,'requirementsKnown':False,'wearingRequirementsComplete':False,'metadataConfidence':'community-reference','requirementUnknowns':['client-identity']})
        if kind=='monsters':r.setdefault('level',None);r.setdefault('hp',None);r.setdefault('exp',None);r.setdefault('dropChance',None)
        if kind=='maps':r.setdefault('region',a.get('streetName'))
        if kind=='quests':r.setdefault('minLevel',a.get('minLevel'));r.setdefault('requirementsComplete',False);r.setdefault('rewardsComplete',False)
    data[kind]=list(rows.values())
    page_maps[kind]={}
    # Several client item IDs share a display name (e.g. Red Potion). Canonical
    # Wiki page relations must resolve to its explicit ID, not the last duplicate.
    for r in sorted(rows.values(),key=lambda r:r.get('confidence')=='community-reference'):
        page_maps[kind][key(r.get('wikiPage') or r['en'])]=r
        page_maps[kind][key(r['en'])]=r
resolvers={kind:relation_index(rows) for kind,rows in data.items()}
def lookup(kind,name):return resolvers[kind](name)
def relation(kind,value,table,field):
    result=lookup(kind,value)
    if value not in [None,''] and result is None:unresolved.append({'table':table,'relationField':field,'value':clean(value)})
    return result
def ref(kind,name):
    found=lookup(kind,name)
    return {'id':found['id'] if found else 'wiki:'+name,'name':found['name'] if found else name,'en':found['en'] if found else name,'sourceUrl':found['sourceUrl'] if found else wiki_url(name)}

# Structured relationships preserve direction, gates and observed uncertainty.
for m in data['monsters']:m.update({'mapIds':[],'dropItemIds':[],'drops':[]})
for m in data['maps']:m.update({'mobIds':[],'spawns':[],'portals':[],'npcIds':[]})
for n in data['npcs']:n.update({'shopItems':[],'shopIds':[],'shopDetails':[]})
data['monsterSpawns']=[]
for s in cargo('spawns'):
    if s.get('variant'):
        variants=[m for m in data['monsters'] if key(m.get('wikiPage') or m.get('en'))==key(s.get('monster id')) and key(m.get('variant'))==key(s.get('variant'))]
        mob=variants[0] if len(variants)==1 else None
        if mob is None:unresolved.append({'table':'monster_spawns','relationField':'monster_id+variant','value':clean(s.get('monster id'))+' / '+clean(s.get('variant'))})
    else:mob=relation('monsters',s.get('monster id'),'monster_spawns','monster_id')
    mp=relation('maps',s.get('map id'),'monster_spawns','map_id')
    spawn={'monsterId':mob['id'] if mob else None,'monsterName':mob['name'] if mob else clean(s.get('monster id')),'mapId':mp['id'] if mp else None,'mapName':mp['name'] if mp else clean(s.get('map id')),'count':num(s.get('spawn count')),'respawnSeconds':num(s.get('respawn seconds')),'variant':s.get('variant'),'sourceUrl':wiki_url(s.get('page') or s.get('map id')),'sourceFields':typed_record(s,manifest.get('tables',{}).get('monster_spawns',{}).get('schema',{}).get('fields',[]))}
    data['monsterSpawns'].append(spawn)
    if mob and mp:
        if mp['id'] not in mob['mapIds']:mob['mapIds'].append(mp['id'])
        if mob['id'] not in mp['mobIds']:mp['mobIds'].append(mob['id'])
        mp['spawns'].append(spawn)
drops=[]
for d in cargo('drops'):
    mob=lookup('monsters',d.get('monster id'))
    if not mob:continue
    item=ref('items',d['item id']) if d.get('item id') else None
    row={'monsterId':mob['id'],'itemId':item['id'] if item else None,'itemName':item['name'] if item else None,'category':d.get('category'),'observedRatePercent':num(d.get('drop rate')),'minQuantity':num(d.get('min quantity')),'maxQuantity':num(d.get('max quantity')),'sampleKills':num(d.get('sample kills')),'sampleDrops':num(d.get('sample drops')),'confidenceLowPercent':num(d.get('rate low')),'confidenceHighPercent':num(d.get('rate high')),'observedOn':d.get('observed on'),'questOnly':d.get('quest flag')=='1','confidence':'community-observed','gameVersion':d.get('game version'),'sourceUrl':mob['sourceUrl']}
    mob['drops'].append(row);drops.append(row)
    if item and item['id'] not in mob['dropItemIds']:mob['dropItemIds'].append(item['id'])
portals=[]
for p in cargo('portals'):
    frm=lookup('maps',p.get('page'));to=lookup('maps',p.get('to map'))
    if not frm:continue
    row={'fromId':frm['id'],'toId':to['id'] if to else None,'toName':to['name'] if to else p.get('to map'),'portalName':p.get('portal name'),'direction':p.get('direction'),'portalType':p.get('portal type'),'requiresLevel':num(p.get('requires level')),'requiresQuest':p.get('requires quest'),'requiresItem':p.get('requires item'),'x':num(p.get('x')),'y':num(p.get('y')),'sourceUrl':frm['sourceUrl']}
    frm['portals'].append(row);portals.append(row)
for q in data['quests']:
    q.update({'prerequisiteIds':[ref('quests',n)['id'] for n in q.get('prerequisiteNames',[])],'requirements':[],'killRequirements':[],'rewardItems':[],'rewardChoices':[],'jobs':['all']})
    if q.get('requiredJob'):q['jobs']=[{'Beginner':'beginner','Warrior':'warrior','Magician':'magician','Bowman':'bowman','Thief':'thief'}.get(q['requiredJob'],q['requiredJob'])]
for r in cargo('quest-required'):
    q=lookup('quests',r['quest id'])
    if q:q['requirements'].append({'itemId':ref('items',r['item id'])['id'],'name':ref('items',r['item id'])['name'],'quantity':num(r['quantity'])})
for r in cargo('quest-enemies'):
    q=lookup('quests',r['quest id'])
    if q:q['killRequirements'].append({'monsterId':ref('monsters',r['monster id'])['id'],'name':ref('monsters',r['monster id'])['name'],'quantity':num(r['quantity'])})
for r in cargo('quest-rewards'):
    q=lookup('quests',r['quest id'])
    if not q or not r.get('item id'):continue
    reward={'itemId':ref('items',r['item id'])['id'],'name':ref('items',r['item id'])['name'],'quantity':num(r['quantity']),'choiceGroup':r.get('choice group'),'chancePercent':num(r.get('chance')),'job':r.get('job'),'gender':r.get('gender')}
    q['rewardChoices' if r.get('choice group') or r.get('chance') or r.get('job') or r.get('gender') else 'rewardItems'].append(reward)
data['questSteps']=[]
for q in data['quests']:q['steps']=[]
for r in cargo('quest-steps'):
    q=relation('quests',r.get('quest id'),'quest_steps','quest_id')
    step=step_record(r,resolvers,wiki_url(r.get('page') or r.get('quest id')),VERIFIED_AT)
    if not step['targetNpcId']:
        n=npc_at_map(r.get('target npc'),step['destinationMapId'],data['npcs'],resolvers['maps'])
        if n:step.update({'targetNpcId':n['id'],'targetNpcName':n['name'],'targetNpcRelationBasis':'exact-name-and-explicit-map'})
    step['questId']=q['id'] if q else None
    data['questSteps'].append(step)
    if q:q['steps'].append(step)
for q in data['quests']:q['steps'].sort(key=lambda s:(s['step'] is None,s['step'] if s['step'] is not None else 0))
data['shopCatalog']=[]
shop_by_page={}
for r in cargo('shop-master'):
    n=relation('npcs',r.get('npc'),'shops','npc');mp=relation('maps',r.get('map'),'shops','map')
    row={'id':str(num(r.get('id'))) if num(r.get('id')) is not None else 'wiki:'+r['page'],'name':r.get('name ko') or r.get('name en') or r['page'],'en':r.get('name en') or r['page'],'wikiPage':r['page'],'npcId':n['id'] if n else None,'npcName':n['name'] if n else clean(r.get('npc')),'mapId':mp['id'] if mp else None,'mapName':mp['name'] if mp else clean(r.get('map')),'town':r.get('town'),'region':r.get('region'),'shopType':r.get('shop type'),'currency':r.get('currency'),'sourceUrl':wiki_url(r['page']),'sourceConfidence':'community-reference','wikiFields':typed_record(r,manifest.get('tables',{}).get('shops',{}).get('schema',{}).get('fields',[]))}
    data['shopCatalog'].append(row);shop_by_page[key(r['page'])]=row
    if n:n['shopIds'].append(row['id']);n['shopDetails'].append(row)
for r in cargo('shops'):
    shop=shop_by_page.get(key(r['shop id']));n=next((x for x in data['npcs'] if shop and x['id']==shop['npcId']),None) or lookup('npcs',r['shop id']);item=ref('items',r['item id'])
    row={'shopId':shop['id'] if shop else None,'shopName':shop['name'] if shop else clean(r['shop id']),'npcId':n['id'] if n else 'wiki:'+r['shop id'],'npcName':n['name'] if n else r['shop id'],'mapId':shop['mapId'] if shop else None,'town':shop['town'] if shop else None,'itemId':item['id'],'itemName':item['name'],'price':num(r['price']),'residentPrice':num(r.get('resident price')),'citizenshipGrade':num(r.get('citizenship grade')),'purchaseLimit':num(r.get('purchase limit')),'currency':r.get('currency') or (shop['currency'] if shop else None),'sourceUrl':shop['sourceUrl'] if shop else wiki_url(r['shop id']),'sourceConfidence':'community-reference','sourceFields':typed_record(r,manifest.get('tables',{}).get('shop_items',{}).get('schema',{}).get('fields',[]))}
    if n:n['shopItems'].append(row)
    data.setdefault('shops',[]).append(row)
data['mapNpcRelations']=[]
for r in cargo('map-npcs'):
    mp=relation('maps',r.get('page'),'map_npcs','page');n=relation('npcs',r.get('npc'),'map_npcs','npc')
    data['mapNpcRelations'].append({'mapId':mp['id'] if mp else None,'npcId':n['id'] if n else None,'mapName':mp['name'] if mp else clean(r.get('page')),'npcName':n['name'] if n else clean(r.get('npc')),'x':num(r.get('x')),'y':num(r.get('y')),'sourceUrl':wiki_url(r.get('page'))})
    if mp and n:
        if n['id'] not in mp['npcIds']:mp['npcIds'].append(n['id'])
        n.setdefault('mapIds',[])
        if mp['id'] not in n['mapIds']:n['mapIds'].append(mp['id'])
data['recipes']=[]
for r in cargo('recipes'):
    # Cargo expands item links to safe text; parse item names and multiplicities,
    # never rendering its HTML/wikitext in the application.
    text=html.unescape(r.get('ingredients') or '')
    ingredients=[]
    for name,amount in re.findall(r'\[\[([^\]|]+)(?:\|.*?)?\]\]\s*(?:&times;|×|x)\s*([\d,]+)',text):
        item=ref('items',name);ingredients.append({'itemId':item['id'],'name':item['name'],'quantity':int(amount.replace(',',''))})
    output=ref('items',r['output item'])
    data['recipes'].append({'id':str(r.get('profession id'))+':'+str(r.get('recipe id')),'name':output['name'],'en':output['en'],'profession':r['profession'],'professionId':num(r.get('profession id')),'level':num(r.get('level')),'category':r.get('category'),'outputItemId':output['id'],'outputCount':num(r.get('output count')),'craftExp':num(r.get('craft exp')),'mesoCost':num(r.get('meso cost')),'catalyst':r.get('catalyst'),'catalystCount':num(r.get('catalyst count')),'ingredients':ingredients,'ingredientsComplete':bool(ingredients),'ingredientsText':clean(re.sub(r'\[\[([^\]|]+)\|.*?\]\]',r'\1',text)),'sourceId':'mapleclassic-wiki','sourceUrl':wiki_url(r['page']),'verifiedAt':VERIFIED_AT,'dataVersion':r.get('game version'),'confidence':'community-reference'})
# The Wiki quest page redirects to Citizenship#Henesys_daily_errands rather
# than emitting a Cargo row; preserve that verified board relation on its IO row.
# Source: https://mapleclassic.wiki/wiki/Asking_After_Athena_Pierce (2026-10-21).
for q in data['quests']:
    if q['id']=='506018' and q.get('en')=='Asking After Athena Pierce' and not q.get('npc'):
        q.update({'npc':'Community Board (Henesys)','turnIn':'Athena Pierce','citizenshipTown':'Henesys','rotationPool':True,'repeatable':True,'repeatPeriod':'daily','conditionsComplete':False,'relationSourceUrl':'https://mapleclassic.wiki/wiki/Citizenship#Henesys_daily_errands'})
data['portals']=portals;data['drops']=drops
# Merge source-verified enrichment by stable ID; collectors read the latest
# catalog and only change their own kind. Never replace unrelated datasets.
equipment_path=ROOT/'content/equipment-metadata.json'
if equipment_path.exists():
    equipment={str(r['id']):r for r in json.loads(equipment_path.read_text()).get('items',[])}
    for item in data['items']:
        if item['id'] in equipment:item.update(merge_enrichment(item,equipment[item['id']]))
quest_metadata_path=ROOT/'content/quest-metadata.json'
if quest_metadata_path.exists():
    quest_metadata={str(r['id']):r for r in json.loads(quest_metadata_path.read_text()).get('items',[])}
    for quest in data['quests']:
        if quest['id'] in quest_metadata:quest.update(merge_enrichment(quest,quest_metadata[quest['id']]))
data['guides']=seed['guides'];data['checkpoints']=seed['checkpoints'];data['sources']=seed['sources']
data['meta']={'version':2,'verifiedAt':VERIFIED_AT,'scope':'MCW/1 공개 클라이언트 색인 + CC BY-NC-SA Wiki 구조화 참조 자료','license':'Adapted Wiki facts: CC BY-NC-SA 4.0; game assets: Nexon. Original editorial text separately authored.','licenseUrl':'https://creativecommons.org/licenses/by-nc-sa/4.0/','pricesLive':False,'dropChancesKnown':False,'counts':{k:len(v) for k,v in data.items() if isinstance(v,list) and k not in ['sources','guides','checkpoints']},'coverage':{'items':'공개 MCW/1 전체 색인과 Wiki 등록 사실. 클라이언트 항목은 실제 출시·획득 가능 여부와 다를 수 있습니다.','monsters':'전체 공개 색인. 수치는 Wiki에 등록된 일반형만 있으며 나머지는 미확인입니다.','quests':'전체 공개 색인 + Wiki 선행·재료·보상 참조. 선택·랜덤 보상은 확정 보상과 분리했습니다.','maps':'전체 공개 색인 + Wiki 방향성 포털. 퀘스트·수송 등 조건 있는 경로를 별도로 표시합니다.','drops':'관찰 표본과 신뢰구간이 있는 자료만 제공합니다. 실제 서버 확정 드롭 확률이 아닙니다.'},'notes':['클라이언트 색인에 있다는 사실만으로 현재 출시·획득 가능하다고 단정하지 않습니다.','빈 배열·null은 미등록 또는 미확인 값이며 0과 다릅니다.','Wiki 참조 자료의 정확성은 실제 게임과 패치 공지에서 재확인하세요.']}
if quest_metadata_path.exists():
    enriched=[q for q in data['quests'] if q.get('metadataVersion')=='MCW/1']
    data['meta']['questMetadata']={'enriched':len(enriched),'clientRequirementsComplete':sum(bool(q.get('clientRequirementsComplete')) for q in enriched),'clientConditionsComplete':sum(bool(q.get('clientConditionsComplete')) for q in enriched),'clientRewardsComplete':sum(bool(q.get('clientRewardsComplete')) for q in enriched),'scope':'public-client-reference','serverConditionsVerified':0}
# Shared table schemas express field provenance once, instead of copying the
# same origin object for every null field on thousands of entity rows.
data['meta']['schemaOrigins']={table:{'sourceId':'mapleclassic-wiki','sourceUrl':entry['sourceUrl'],'fields':[f['name'] for f in entry['fields']]} for table,entry in source_tables['tables'].items()}
rules={'maps':{'return_map':'maps','nearest_town':'maps'},'portals':{'page':'maps','to_map':'maps','requires_quest':'quests','requires_item':'items'},'monster_spawns':{'monster_id':'monsters','map_id':'maps'},'monsters':{'primary_location':'maps'},'npcs':{'map':'maps','location':'maps'},'map_npcs':{'page':'maps','npc':'npcs'},'shops':{'npc':'npcs','map':'maps'},'shop_items':{'shop_id':'shopCatalog','item_id':'items'},'recipes':{'output_item':'items','catalyst':'items'},'quests':{'giver':'npcs','turn_in':'npcs','next_quest':'quests','citizenship_town':'maps'},'quest_required_items':{'quest_id':'quests','item_id':'items'},'quest_steps':{'quest_id':'quests','destination_map':'maps','target_npc':'npcs','target_monster':'monsters','required_item':'items'},'quest_rewards':{'quest_id':'quests','item_id':'items'},'quest_enemies':{'quest_id':'quests','monster_id':'monsters'}}
resolvers['shopCatalog']=relation_index(data['shopCatalog'])
unresolved=[]
for table,fields in rules.items():
    for index,row in enumerate(source_tables['tables'][table]['rows']):
        for field,kind in fields.items():
            value=row.get(field)
            if value not in [None,''] and resolvers[kind](value) is None:
                if table=='quest_steps' and field=='target_npc':
                    destination=resolvers['maps'](row.get('destination_map'))
                    if destination and npc_at_map(value,destination['id'],data['npcs'],resolvers['maps']):continue
                unresolved.append({'table':table,'relationField':field,'value':value,'row':index})
grouped=defaultdict(list)
for row in unresolved:grouped[(row['table'],row['relationField'])].append(row)
unresolved_summary=[{'table':table,'relationField':field,'count':len(rows),'samples':list(dict.fromkeys(str(r['value']) for r in rows))[:3]} for (table,field),rows in sorted(grouped.items())]
table_summaries=[{k:v for k,v in {'name':name,'sourceRows':table['sourceRows'],'storedRows':table['storedRows'],'complete':table['complete'],'sha256':table['sha256'],'fieldCount':len(table['fields']),'fields':table['fields'],'sourceUrl':table['sourceUrl']}.items()} for name,table in source_tables['tables'].items()]
source_snapshot={'schemaVersion':1,'snapshotId':manifest.get('snapshotId'),'checkedAt':manifest.get('completedAt') or VERIFIED_AT,'status':manifest.get('status','legacy-unverified'),'sources':[{'id':'mapleclassic-wiki','url':'https://mapleclassic.wiki/','version':None,'confidence':'community-reference','license':'CC BY-NC-SA 4.0','checkedAt':manifest.get('completedAt') or VERIFIED_AT,'tables':table_summaries},{'id':'maplestory-io','url':'https://maplestory.io/api/MCW/1','version':'MCW/1','confidence':'public-client-reference','checkedAt':None,'indices':[{'name':name,'sourceRows':entry['rows'],'storedRows':len(raw[{'mobs':'monsters','items':'items','maps':'maps','npcs':'npcs','quests':'quests'}[name]]),'complete':entry.get('complete',False),'sha256':entry.get('sha256'),'checkedAt':entry.get('fetchedAt'),'reused':entry.get('reused',False),'checkedAtBasis':entry.get('fetchedAtBasis','network response timestamp')} for name,entry in manifest.get('indices',{}).items()]}],'unresolvedRelations':unresolved_summary,'normalizedCounts':data['meta']['counts'],'notes':['전테이블의 공란과0을 구분하며 모든 공개 열을 별도 원천표에 보존합니다.','구조화 원천표 전체 수집과 현재 서버의 완전성·출시 여부는 다릅니다.','해결하지 못한 이름 관계는 원천표에 남고 임의의 ID를 연결하지 않습니다.','재사용한 IO색인의 수정시각은 새 네트워크 검증시각이 아닙니다.']}
data['meta']['sourceSnapshot']={k:source_snapshot[k] for k in ['snapshotId','checkedAt','status']}
data['meta']['sourceSnapshot'].update({'tableCount':len(table_summaries),'publicFieldCount':sum(t['fieldCount'] for t in table_summaries),'complete':bool(manifest) and all(t['complete'] and t['sourceRows']==t['storedRows'] for t in table_summaries),'unresolvedRelationCount':len(unresolved)})
OUTPUT.mkdir(parents=True,exist_ok=True)
artifacts={}
for name,value in [('public-catalog',data),('source-tables',source_tables),('catalog-sources',source_snapshot)]:
    out=OUTPUT/(name+'.json');temporary=out.with_suffix('.json.tmp');temporary.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n');temporary.replace(out);artifacts[name]={'path':str(out),'bytes':out.stat().st_size}
print(json.dumps({'artifacts':artifacts,'counts':data['meta']['counts'],'sourceSnapshot':data['meta']['sourceSnapshot'],'unresolvedRelations':unresolved_summary},ensure_ascii=False))
