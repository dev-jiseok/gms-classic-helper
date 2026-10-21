"""Normalize the attributed CC BY-NC-SA skill reference captured with the public Cargo API.

Input: /private/tmp/mcw-skill-cargo-full.json. No game/private credentials are used.
The generated names and summaries are original Korean editorial labels; numbers and
prerequisites retain the wiki provenance and its community-reference status.
"""
import json, html, re, os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERIFIED_AT=os.environ.get('MCW_VERIFIED_AT','2026-10-21')
INPUT=Path(os.environ.get('MCW_REFERENCE_DIR','/private/tmp'))
rows = [r['title'] for r in json.loads((INPUT/'mcw-skill-cargo-full.json').read_text())['cargoquery']]
names = '''Amazon's Judgement|아마존의 심판
Arrow Blow|애로우 블로우
Arrow Bomb: Bow|애로우 봄 : 활
Axe Booster|액스 부스터
Axe Mastery|액스 마스터리
Bless|블레스
Blunt Weapon Booster|블런트 부스터
Blunt Weapon Mastery|블런트 마스터리
Bow Booster|보우 부스터
Bow Mastery|보우 마스터리
Claw Booster|자벨린 부스터
Claw Mastery|자벨린 마스터리
Cold Beam|콜드 빔
Critical Recovery|크리티컬 리커버리
Critical Shot|크리티컬 샷
Critical Throw|크리티컬 스로우
Crossbow Booster|크로스보우 부스터
Crossbow Mastery|크로스보우 마스터리
Dagger Booster|대거 부스터
Dagger Mastery|대거 마스터리
Dark Sight|다크 사이트
Disorder|디스오더
Double Shot|더블 샷
Double Stab|더블 스탭
Drain|드레인
Energy Bolt|에너지 볼트
Final Attack: Axe|파이널 어택 : 도끼
Final Attack: Blunt Weapon|파이널 어택 : 둔기
Final Attack: Bow|파이널 어택 : 활
Final Attack: Crossbow|파이널 어택 : 석궁
Final Attack: Polearm|파이널 어택 : 폴암
Final Attack: Spear|파이널 어택 : 창
Final Attack: Sword|파이널 어택 : 검
Fire Arrow|파이어 애로우
Focus|포커스
Haste|헤이스트
Heal|힐
Holy Arrow|홀리 애로우
Improved HP Recovery|HP 회복력 향상
Improved MP Recovery|MP 회복력 향상
Invincible|인빈서블
Iron Arrow: Crossbow|아이언 애로우 : 석궁
Iron Body|아이언 바디
Iron Will|아이언 월
Keen Eyes|킨 아이즈
Lucky Seven|럭키 세븐
Magic Armor|매직 아머
Magic Claw|매직 클로
Magic Guard|매직 가드
Max HP Increase|최대 HP 증가
Max MP Increase|최대 MP 증가
Meditation|메디테이션
MP Eater|MP 이터
Nimble Body|님블 바디
Nimble Feet|민첩한 몸놀림
Nimble Recovery|님블 리커버리
Poison Breath|포이즌 브레스
Polearm Booster|폴암 부스터
Polearm Mastery|폴암 마스터리
Power Knockback|파워 넉백
Power Strike|파워 스트라이크
Precise Strikes|정밀 일격
Rage|분노
Recovery|회복
Rush|러시
Savage Blow|새비지 블로우
Slash Blast|슬래시 블래스트
Slow|슬로우
Soul Arrow: Bow|소울 애로우 : 활
Soul Arrow: Crossbow|소울 애로우 : 석궁
Spear Booster|스피어 부스터
Spear Mastery|스피어 마스터리
Steal|스틸
Sword Booster|소드 부스터
Sword Mastery|소드 마스터리
Teleport|텔레포트
The Eye of Amazon|아마존의 눈
Threaten|위협
Three Snails|달팽이 세 마리
Thunder Bolt|선더 볼트'''
ko = dict(line.split('|') for line in names.splitlines())
legacy = {'Power Strike':'power','Precise Strikes':'precision','Slash Blast':'slash','Max HP Increase':'hp','Improved HP Recovery':'recovery','Iron Body':'body','Lucky Seven':'lucky','Nimble Body':'nimble','Keen Eyes':'keen','Disorder':'disorder','Dark Sight':'dark','Double Stab':'double','Arrow Blow':'arrow','Double Shot':'double','Critical Shot':'critical','The Eye of Amazon':'eye','Focus':'focus','Power Knockback':'power','Rage':'rage','Haste':'haste','Critical Throw':'critical','Arrow Bomb: Bow':'bomb'}
def sid(name):
    return legacy.get(name, re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-'))
def number(value):
    return None if value is None or value == '' else float(value) if '.' in str(value) else int(value)

jobs = {}
specs = [
 ('beginner','초보자','Beginner','beginner','#9b927b','새싹','leaf','', '스탯과 진로를 정하고 섬 퀘스트로 출발합니다.'),
 ('warrior','전사','Warrior','warrior','#d4874b','전사','sword','페리온','근접 공격과 체력 중심. 검·도끼·둔기·창·폴암 중 진로를 고릅니다.'),
 ('fighter','파이터','Fighter','warrior','#d4874b','전사','sword','페리온','검 또는 도끼를 골라 마스터리·부스터에 투자합니다.'),
 ('page','페이지','Page','warrior','#bd8a69','페이지','shield','페리온','검 또는 둔기와 위협을 활용합니다.'),
 ('spearman','스피어맨','Spearman','warrior','#bd7652','창전사','sword','페리온','창·폴암 선택과 아이언 월을 비교합니다.'),
 ('magician','마법사','Magician','magician','#7c91c0','마법사','wand','엘리니아','INT 중심의 원거리 마법. HP와 MP 물약 비용을 함께 관리합니다.'),
 ('firePoison','위자드 (불·독)','Fire/Poison Wizard','magician','#c9785e','불독','wand','엘리니아','불·독 속성과 지속 피해에 맞는 몬스터를 비교합니다.'),
 ('iceLightning','위자드 (썬·콜)','Ice/Lightning Wizard','magician','#6c9db9','썬콜','wand','엘리니아','얼음 제어와 번개 범위 공격을 활용합니다.'),
 ('cleric','클레릭','Cleric','magician','#a18bbd','클레릭','sparkles','엘리니아','힐과 파티 지원, 언데드 상대 실측 효율을 비교합니다.'),
 ('bowman','궁수','Bowman','bowman','#69986b','궁수','bow','헤네시스','DEX 중심의 원거리 물리 공격. 활과 석궁의 진로를 고릅니다.'),
 ('hunter','헌터','Hunter','bowman','#69986b','활궁수','bow','헤네시스','활·애로우 봄과 사거리·지형을 함께 고려합니다.'),
 ('crossbowman','사수','Crossbowman','bowman','#5e8e84','석궁','bow','헤네시스','석궁·아이언 애로우와 직선 지형을 비교합니다.'),
 ('thief','도적','Thief','thief','#8b79b9','도적','sparkles','커닝시티','LUK 중심. 표창과 단검의 진로를 고릅니다.'),
 ('assassin','어쌔신','Assassin','thief','#8b79b9','표도','sparkles','커닝시티','아대·표창을 사용하며 재충전·물약 비용을 계산합니다.'),
 ('bandit','시프','Bandit','thief','#a17fa5','단도','sword','커닝시티','단검·새비지 블로우와 접근·이동 시간을 함께 비교합니다.'),
]
families={'warrior':'전사','magician':'마법사','bowman':'궁수','thief':'도적','beginner':'초보자'}
for id,name,en,family,color,short,icon,town,summary in specs:
    tier=0 if id=='beginner' else 1 if id==family else 2
    jobs[id]={'id':id,'name':name,'en':en,'family':family,'tier':tier,'path': '초보자' if tier==0 else '초보자 → '+families[family]+(' → '+name if tier==2 else ''),'color':color,'short':short,'icon':icon,'town':town,'summary':summary,'available':True,'firstAdvancementLevel':10,'secondAdvancementLevel':30,'thirdAdvancementAvailable':False,'sourceUrl':'https://mapleclassic.wiki/wiki/'+('Jobs' if tier==0 else 'Skills/'+{'warrior':'Warrior','magician':'Magician','bowman':'Bowman','thief':'Thief'}[family]),'verifiedAt':VERIFIED_AT,'confidence':'community-reference'}
    if family=='magician':jobs[id]['advancementNote']='Classic World의 현재 참조 자료는 마법사도 10레벨 전직입니다. 과거 메이플의 8레벨 전직 정보와 구분하세요.'

skills={}
for jid,job in jobs.items():
    family = next((x[2] for x in specs if x[0]==job['family']), 'Beginner')
    selected=[r for r in rows if html.unescape(r['job'])==job['en'] or (job['tier']==2 and r['job']==family)]
    out=[]
    for r in selected:
        en=html.unescape(r['page']); tier=int(r['tier'] or 0)
        skill={'id':sid(en),'name':html.unescape(r.get('name ko') or '') or ko.get(en,en),'en':en,'max':int(r['max level']),'tier':tier,'mpCost':r.get('mp cost'),'sourceUrl':'https://mapleclassic.wiki/wiki/'+en.replace(' ','_'),'verifiedAt':VERIFIED_AT,'confidence':'community-reference','effects':{'damagePercent':number(r.get('atk damage')),'hits':number(r.get('atk hits')),'targets':number(r.get('atk targets')),'element':r.get('atk element'),'scope':'요약 참조값 · 레벨별 효과표 아님'}}
        # Preserve the first published planner's IDs only where the skill is the same.
        if tier==2 and en in ['Sword Mastery','Claw Mastery','Bow Mastery']:skill['id']='mastery'
        if tier==2 and en in ['Sword Booster','Claw Booster','Bow Booster']:skill['id']='booster'
        if tier==2 and jid=='page' and en in ['Sword Mastery','Sword Booster']:skill['id']='mastery' if en.endswith('Mastery') else 'booster'
        prereqs=re.findall(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]\s*Lv\s*(\d+)',html.unescape(r.get('prereq') or ''))
        if prereqs:
            skill['prerequisites']=[{'id':sid(p),'level':int(n),'name':ko.get(p,p)} for p,n in prereqs]
        out.append(skill)
    # Resolve prereq IDs after the compatible aliases above are chosen.
    by_en={s['en']:s['id'] for s in out}
    for s in out:
        for p in s.get('prerequisites',[]):
            en=next((k for k in by_en if ko.get(k,k)==p['name']),None)
            if en:p['id']=by_en[en]
        if s.get('prerequisites'):s['requires']=s['prerequisites'][0]
    skills[jid]=sorted(out,key=lambda s:(s['tier'],s['name']))

meta={'source':'MapleClassic Wiki contributors','sourceUrl':'https://mapleclassic.wiki/wiki/Skills','license':'CC BY-NC-SA 4.0','licenseUrl':'https://creativecommons.org/licenses/by-nc-sa/4.0/','verifiedAt':VERIFIED_AT,'scope':'출시 당시 초보자·1차 4계열·2차 10직업. 3차 이후와 해적은 구현되지 않은 진로입니다.','skillRows':len(rows),'uniqueSkills':len({html.unescape(r['page']) for r in rows}),'notes':['정규화·한국어 표기·배열 구성은 이 프로젝트에서 편집했습니다.','Wiki는 커뮤니티 참조 자료이며 현재 게임 확인이 우선합니다.','개별 레벨의 데미지·지속시간 공식은 이 요약 자료에 없습니다.']}
target=ROOT/'lib/job-data.mjs'
target.write_text('// Attributed adapted reference data: CC BY-NC-SA 4.0. See JOB_REFERENCE.\nexport const JOB_REFERENCE = '+json.dumps(meta,ensure_ascii=False,indent=2)+';\nexport const JOBS = '+json.dumps(jobs,ensure_ascii=False,indent=2)+';\nexport const JOB_IDS = Object.freeze(Object.keys(JOBS));\nexport const SKILLS = '+json.dumps(skills,ensure_ascii=False,indent=2)+';\nexport const FUTURE_JOBS = '+json.dumps([{'name':'3차·4차 전직','available':False,'note':'출시 버전에서 제공되지 않으며 과거 메이플 수치로 계산하지 않습니다.'},{'name':'해적 계열','available':False,'note':'현재 출시 직업 목록에 없습니다.'}],ensure_ascii=False,indent=2)+';\nexport function getJobFamily(id) { return JOBS[id]?.family || "beginner"; }\n')
print(f'Wrote {target}: {len(jobs)} jobs, {len(rows)} source rows, {meta["uniqueSkills"]} distinct skills')
