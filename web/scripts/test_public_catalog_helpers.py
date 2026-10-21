import unittest,os,tempfile,subprocess
from pathlib import Path
from public_catalog_helpers import plain,typed_record,relation_index,source_entity,npc_at_map,step_record,merge_enrichment

def client(id,name):return {'id':id,'en':name,'name':name,'clientIndexName':name,'sourceId':'maplestory-io'}

class PublicCatalogTests(unittest.TestCase):
    def test_zero_false_and_missing_are_distinct(self):
        fields=[{'name':'count','type':'Integer'},{'name':'enabled','type':'Boolean'}]
        self.assertEqual(typed_record({'count':'0','enabled':'0'},fields),{'count':0,'enabled':False})
        self.assertEqual(typed_record({'count':'','enabled':None},fields),{'count':None,'enabled':None})
    def test_markup_is_plain_without_erasing_game_map_brackets(self):
        self.assertEqual(plain('[[Jane|&lt;span class="npc"&gt;Jane&lt;/span&gt;]]'),'Jane')
        self.assertEqual(plain('1st Accompaniment <Bonus>'),'1st Accompaniment <Bonus>')
    def test_explicit_id_requires_matching_name(self):
        rows={'1':client('1','Olaf'),'2':client('2','Blackbull')}
        found,mapping=source_entity(rows,{'id':'1','name en':'Blackbull','page':'Blackbull'})
        self.assertEqual(found['id'],'2');self.assertEqual(mapping['method'],'unique-exact-name')
    def test_unrelated_id_is_reference_only(self):
        found,mapping=source_entity({'1':client('1','Olaf')},{'id':'1','name en':'Jane','page':'Jane'})
        self.assertIsNone(found);self.assertEqual(mapping['reason'],'id-name-conflict')
    def test_duplicate_names_are_not_last_row_wins(self):
        rows={'1':client('1','Red Potion'),'2':client('2','Red Potion')}
        found,mapping=source_entity(rows,{'id':'999','name en':'Red Potion','page':'Red Potion'})
        self.assertIsNone(found);self.assertEqual(mapping['reason'],'ambiguous-client-name')
    def test_unique_legacy_name_preserves_actual_client_id(self):
        found,mapping=source_entity({'1':client('1','Heena')},{'id':'2101','name en':'Heena','page':'Heena'})
        self.assertEqual(found['id'],'1');self.assertEqual(mapping['sourceId'],'2101')
    def test_map_bracket_formatting_is_equivalent_without_ignoring_stage(self):
        rows={'1':client('1','1st Accompaniment <1st Stage>')}
        self.assertEqual(source_entity(rows,{'id':'1','name en':'1st Accompaniment (1st Stage)'})[0]['id'],'1')
        self.assertIsNone(source_entity(rows,{'id':'1','name en':'1st Accompaniment (2nd Stage)'})[0])
    def test_unqualified_monster_article_selects_normal_not_instance(self):
        rows=[{**client('1','Slime'),'wikiPage':'Slime','variant':None},{**client('2','Slime'),'wikiPage':'Slime','variant':'KPQ'}]
        self.assertEqual(relation_index(rows)('Slime')['id'],'1')
    def test_explicit_map_disambiguates_same_named_npc(self):
        maps=relation_index([client('10','Henesys'),client('20','Kerning City')])
        npcs=[{**client('235','Community Board'),'mapName':'Henesys'},{**client('431','Community Board'),'mapName':'Kerning City'}]
        self.assertEqual(npc_at_map('Community Board','20',npcs,maps)['id'],'431')
        self.assertIsNone(npc_at_map('Community Board',None,npcs,maps))
        self.assertIsNone(npc_at_map('Community Board','10',npcs+[npcs[0]],maps))
    def test_step_does_not_guess_phase_item_quantity_or_location_from_prose(self):
        resolvers={kind:relation_index([]) for kind in ['maps','npcs','monsters','items']}
        step=step_record({'title':'Bring 30 branches','description':'Go to Henesys','step number':'0'},resolvers,'https://example.test','2026-10-21')
        self.assertEqual(step['step'],0);self.assertIsNone(step['phase']);self.assertIsNone(step['destinationMapId']);self.assertNotIn('quantity',step)
    def test_enrichment_preserves_source_relations_and_known_stats(self):
        row={'steps':[{'step':1}],'wikiFields':{'id':1},'wikiId':1,'stats':{'attack':12,'str':2}}
        merged=merge_enrichment(row,{'steps':[],'wikiFields':{},'wikiId':99,'stats':{'attack':None,'str':0}})
        self.assertEqual(merged['steps'],row['steps']);self.assertEqual(merged['wikiId'],1);self.assertEqual(merged['stats'],{'attack':12,'str':0})
    def test_missing_manifest_cannot_replace_any_output(self):
        with tempfile.TemporaryDirectory() as temporary:
            out=Path(temporary)/'public-catalog.json';out.write_text('sentinel')
            result=subprocess.run(['python3',str(Path(__file__).with_name('build-public-catalog.py'))],env={**os.environ,'MCW_REFERENCE_DIR':temporary,'MCW_OUTPUT_DIR':temporary},capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0);self.assertIn('missing/incomplete',result.stderr);self.assertEqual(out.read_text(),'sentinel')

if __name__=='__main__':unittest.main()
