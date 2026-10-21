"""Original structured facts from Nexon's public Grand Launch notes (46506).
No article prose or images are bundled. Refresh these dated facts against the source.
"""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
source='https://www.nexon.com/maplestory/news/general/46506/grand-launch-release-notes'
facts={'source':'Nexon · Grand Launch Release Notes','sourceUrl':source,'apiSourceUrl':'https://g.nexonstatic.com/maplestory/cms/v1/news/46506','publishedAt':'2026-10-20T17:50:48Z','verifiedAt':'2026-10-21','launchAt':'2026-10-21T18:00:00Z','levelCap':100,'firstAdvancementLevel':10,'secondAdvancementLevel':30,'availableJobTiers':[0,1,2],'charactersPerAccount':3,'tradeRestriction':{'minimumLevel':15,'hoursAfterLevelReached':24,'scope':'account'},'partyQuest':{'name':'First Time Together','minimumLevel':21,'maximumLevel':None,'channels':list(range(3,13)),'npc':'Lakelis','maximumLevelNote':'이번 공식 공지는 상한 레벨을 명시하지 않습니다.'},'housing':{'minimumCitizenshipGrade':2,'gradeName':'Visitor','maximumHomes':1,'sharedByAccount':True,'npcs':{'Henesys':'Bianca','Kerning City':'Scarlett'}},'newMonsterNames':['Ghost Stump','Wooden Mask','Rocky Mask','Skeledog','Mummydog','Skeleton Soldier','Officer Skeleton','Commander Skeleton'],'notes':['공식 출시 공지에서 직접 확인한 사실입니다. 이후 점검·수정 공지가 우선합니다.','레벨100 상한은 EXP1–49 검증표가 100까지 확인됐다는 뜻이 아닙니다.','현재3차 전직은 출시 직업 목록에 없으며 개방으로 간주하지 않습니다.']}
end='2026-11-18T23:59:00Z'
events=[]
def event(id,title,en,start,minLevel,summary,steps,rewards,**extra):
    events.append({'id':id,'title':title,'en':en,'start':start,'end':end,'minLevel':minLevel,'summary':summary,'steps':steps,'rewards':rewards,'sourceUrl':source,'source':'Nexon 공식 출시 공지','verifiedAt':'2026-10-21','eligibilityNote':'게임 내 참여·수령 조건을 마지막으로 확인하세요.',**extra})
event('journey-begins','모험의 시작 · 일일 출석','The Journey Begins',facts['launchAt'],10,'사냥과 함께 잎사귀를 모아 누적14회 출석 보상을 받습니다.',['메이플 운영자에게 이벤트 퀘스트를 먼저 받습니다.','10레벨 이상 몬스터에게 얻은 Maple Leaf30개를 교환합니다.','계정당 하루1회입니다. 빠진 날은 다음 보상부터 이어집니다.'],['1회차: Snail펫 + 펫 먹이30개 + 빨간/파란 포션 각30개','4·12회차: 일반 상점 개설권(7일)','14회차: 아이템 확성기2개(7일)'],repeat='daily-account',requiredItemCount=30,requiredMonsterLevel=10,rewardDays=14,resetTimeUtc=None,important='1회차 펫은11월19일08:59 KST 만료·부활 불가입니다. 상점권도 수령 후7일이므로 실제 사용할 때 확인하세요.',petExpiresAt=end)
event('marks-left-behind','우리가 남긴 흔적 · 탐색 퀘스트','The Marks We Leave Behind','2026-10-21T00:00:00Z',25,'헤네시스 제이의 단서를 따라 빅토리아 아일랜드를 탐색합니다.',['헤네시스 Jay에게 이벤트 퀘스트를 받습니다.','퀘스트가 주는 단서를 순서대로 확인합니다.'],['공식 공지의 보물 단서를 게임에서 확인'],repeat='quest-chain')
event('classic-beginners','클래식의 첫걸음 · 테스트 참가 보상','To Classic Beginners','2026-10-21T00:00:00Z',None,'과거 테스트 이벤트 조건을 충족한 계정의 우편 보상입니다.',['비공개 테스트1·2회차의 지정 이벤트 퀘스트 완료 이력을 확인합니다.','해당 계정 우편함의 명찰·말풍선 반지를 확인합니다.'],['테스트1회 조건 충족: 반지 종류별1개','테스트2회 모두 조건 충족: 반지 종류별2개'],betaRequired=True,repeat='account-claim',eligibilityNote='처음 시작하는 신규 계정은 대상이 아닙니다. 지정 테스트 퀘스트 완료 이력이 필요합니다.')
event('halloween-candies','트릭 오어 트릿 · 할로윈 사탕','Trick or Treat','2026-10-28T00:00:00Z',10,'사탕을 모으고 숨겨진 후속 임무를 완료하면 무기를 받습니다.',['헤네시스·커닝시티 Malady에게 이벤트 퀘스트를 받습니다.','10레벨 이상 몬스터에게 Halloween Candies100개를 모아 전달합니다.','이어지는 숨겨진 임무를 완료합니다.'],['펌킨 바스켓: 한손검, 무기공격27·이동속도3·업그레이드7회·Fast','월드 내 교환 가능·영구'],requiredItemCount=100,requiredMonsterLevel=10,repeat='quest-chain')
event('orange-slimes','슬라임의 습격','Slime Attack','2026-10-28T00:00:00Z',10,'주요 마을의 오렌지 슬라임을 처치해 이벤트 전리품을 얻습니다.',['헤네시스·엘리니아·커닝시티·페리온에 등장하는 오렌지 슬라임을 찾습니다.','보상은 확률 획득이며 개별 확률은 공지에 없습니다.'],['할로윈 사탕: 이벤트 종료 시 만료','빨간 사탕:HP600 / 파란 사탕:MP450 / 초록 사탕:HP300+MP300'],repeat='monster-event')
for id,title,en,start,stop,minutes,summary in [
 ('gm-fitness','GM 이벤트 · 체력 단련','Physical Fitness','2026-10-22T00:00:00Z','2026-10-22T02:00:00Z',15,'제한15분 점프 퀘스트'),
 ('gm-coconuts','GM 이벤트 · 코코넛 수확','Coconut Harvest','2026-11-06T00:00:00Z','2026-11-06T02:00:00Z',5,'근접 공격만 사용하는5분 팀전'),
 ('gm-up-and-up','GM 이벤트 · 위로 위로','Up and Up','2026-12-19T00:00:00Z','2026-12-19T02:00:00Z',6,'제한6분의3단계 포털·사다리 도전')]:
    event(id,title,en,start,None,summary,['GM이 문을 연 라운드에 리스항구 Paul을 통해 입장합니다.','Scroll of Secrets 보유 중이거나 최근24시간 GM이벤트 참가 이력이 있으면 참여할 수 없습니다.','방이 가득 차면 다음 라운드를 확인합니다.'],['참가: Event Trophy','도전 성공 또는 팀 승리: Scroll of Secrets'],end=stop,repeat='gm-rounds',gmEligibilityRequired=True,roundMinutes=minutes,eligibilityNote='레벨 조건은 이 공지에 명시되지 않았습니다. GM 개방·정원·기존 참가 이력을 게임에서 확인하세요.')
out={'launch':facts,'events':events}
(ROOT/'content/launch-events.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
(ROOT/'lib/launch-data.mjs').write_text('// Original factual summary. See sourceUrl; article prose is not reproduced.\nexport const CLASSIC_LAUNCH = '+json.dumps(facts,ensure_ascii=False,indent=2)+';\nexport const LAUNCH_EVENTS = '+json.dumps(events,ensure_ascii=False,indent=2)+';\n'+'''export function launchEventStatus(event, now=Date.now()) {
 const at=typeof now==='number'?now:Date.parse(now);
 if(at>Date.parse(event.end))return 'ended';
 if(at<Date.parse(event.start))return 'upcoming';
 if(at<Date.parse(CLASSIC_LAUNCH.launchAt))return 'launch-pending';
 return 'active';
}
export function launchEventEligibility(event, profile={}, context={}) {
 if(event.betaRequired)return context.betaEligible===true?{status:'eligible',reason:'테스트 조건 충족 기록을 확인했어요.'}:context.betaEligible===false?{status:'ineligible',reason:'지정 테스트 퀘스트 이력이 필요해요.'}:{status:'unknown',reason:'테스트 퀘스트 완료 이력을 확인해야 해요.'};
 if(event.minLevel!=null&&(!Number.isFinite(Number(profile.level))||Number(profile.level)<1))return {status:'unknown',reason:'캐릭터 레벨을 먼저 확인하세요.'};
 if(event.minLevel!=null&&Number(profile.level)<event.minLevel)return {status:'ineligible',reason:`${event.minLevel}레벨부터 참여할 수 있어요.`};
 if(event.gmEligibilityRequired)return {status:'unknown',reason:'GM 개방·정원·지난24시간 참가·비밀의 주문서를 확인하세요.'};
 return {status:'eligible',reason:'기록한 레벨 조건을 충족해요. 퀘스트·계정 수령 이력은 게임에서 확인하세요.'};
}
export function launchPriority(profile={}, now=Date.now()) {
 const event=LAUNCH_EVENTS[0],status=launchEventStatus(event,now);
 if(status==='ended')return {title:'다음 공식 이벤트를 확인하세요',text:'출시 출석 이벤트의 공지 기간이 끝났어요.',eventId:null};
 if(Number(profile.level)<10)return {title:'10레벨 전직과 일일 보상을 준비해요',text:'10레벨부터 잎사귀30개 출석에 참여할 수 있어요. 계정당 하루1회이며 첫 보상 펫은 기간제예요.',eventId:event.id};
 return {title:status==='active'?'오늘의 잎사귀30개 출석을 확인해요':'출시 후 잎사귀30개 출석을 준비해요',text:'운영자에게 퀘스트를 받고10레벨 이상 몬스터를 사냥해요. 1회차 기간제 펫·4회차7일 상점권을 확인하세요.',eventId:event.id};
}
''')
print(f'Wrote official launch facts and {len(events)} dated events')
