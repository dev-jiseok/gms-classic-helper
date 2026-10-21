import { JOBS as JOB_DEFS, SKILLS as SKILL_DEFS } from './job-data.mjs';
export { JOB_IDS, JOB_REFERENCE, FUTURE_JOBS, getJobFamily } from './job-data.mjs';
export type JobDefinition = {id:string;name:string;en:string;family:string;tier:number;path:string;color:string;short:string;icon:string;town:string;summary:string;available:boolean;firstAdvancementLevel:number;secondAdvancementLevel:number;thirdAdvancementAvailable:boolean;sourceUrl:string;verifiedAt:string;confidence:string;advancementNote?:string};
export type SkillRequirement = {id:string;level:number;name?:string};
export type SkillDefinition = {id:string;name:string;en:string;max:number;tier:number;mpCost:string|null;sourceUrl:string;verifiedAt:string;confidence:string;requires?:SkillRequirement;prerequisites?:SkillRequirement[];effects:{damagePercent:number|null;hits:number|null;targets:number|null;element:string|null;scope:string}};
export const JOBS:Record<string,JobDefinition> = JOB_DEFS;
export const SKILLS:Record<string,SkillDefinition[]> = SKILL_DEFS;
export const FEATURES = [
  {id:'today',name:'오늘의 모험',group:'모험',icon:'compass',description:'우리 캐릭터에 맞는 다음 행동과 진행도'},
  {id:'guides',name:'육성 공략',group:'모험',icon:'book',description:'직업별 성장 루트 · 상황별 우선순위'},
  {id:'quests',name:'퀘스트',group:'모험',icon:'scroll',description:'선행 퀘스트와 재료 · 완료 기록'},
  {id:'money',name:'돈 버는 퀘스트',group:'모험',icon:'coins',description:'보상과 재료 가치로 비교하는 돈퀘'},
  {id:'expQuests',name:'성장 추천 퀘스트',group:'모험',icon:'sparkles',description:'선행과 요구 조건을 반영한 경험치 퀘스트'},
  {id:'training',name:'사냥터 추천',group:'모험',icon:'mountain',description:'경험치 · 메소 · 내 사냥 기록으로 비교'},
  {id:'codex',name:'도감',group:'세계',icon:'library',description:'아이템 · 몬스터 · 퀘스트 통합 검색'},
  {id:'items',name:'아이템 도감',group:'세계',icon:'shield',description:'전체 아이템 · 옵션 · 획득처 · 제작과 시세'},
  {id:'monsters',name:'몬스터 도감',group:'세계',icon:'leaf',description:'몬스터 수치 · 드롭 · 출현 맵'},
  {id:'maps',name:'월드맵',group:'세계',icon:'map',description:'마을과 사냥터 · 출현 몬스터'},
  {id:'npcs',name:'NPC · 상점',group:'세계',icon:'store',description:'마을별 NPC와 상점 바로가기'},
  {id:'market',name:'시세 노트',group:'거래',icon:'chart',description:'공개 관찰 시세 · 옵션 매물 · 가격 이력'},
  {id:'owl',name:'미네르바의 부엉이',group:'거래',icon:'search',description:'등록한 매물의 가격·채널·위치 찾기'},
  {id:'trade',name:'아이템 거래소',group:'거래',icon:'handshake',description:'우리 공간의 삽니다 · 팝니다'},
  {id:'shop',name:'묶어팔기 상점',group:'거래',icon:'store',description:'묶음 상품 구성과 총 판매가'},
  {id:'party',name:'파티 구인·구직',group:'함께',icon:'users',description:'사냥 · 파티퀘스트 모집과 연락 메모'},
  {id:'messages',name:'우리 쪽지',group:'함께',icon:'message',description:'함께 남기는 모험 메모'},
  {id:'nickname',name:'닉네임 게시판',group:'함께',icon:'tag',description:'닉네임 관련 게시물과 연락 메모'},
  {id:'tools',name:'모든 편의도구',group:'도구',icon:'grid',description:'계산 · 제작 · 스킬 · 번역 · 타이머'},
  {id:'calculator',name:'원컷 · 처치 계산',group:'전투',icon:'swords',description:'실측 데미지로 처치 타수와 이론 상한 계산'},
  {id:'accuracy',name:'명중 기록',group:'전투',icon:'target',description:'적중·빗나감 실측과 목표 명중 비교'},
  {id:'hunt',name:'사냥 기록',group:'전투',icon:'activity',description:'시간당 경험치와 순수익 · 물약 사용'},
  {id:'exp',name:'경험치 계산',group:'전투',icon:'chart',description:'남은 경험치와 실측 속도로 예상 시간'},
  {id:'skills',name:'스킬 · SP 배분',group:'성장',icon:'sparkles',description:'전 직업·무기별 SP 배분 · 레벨별 계획'},
  {id:'gear',name:'장비 교체 추천',group:'성장',icon:'shield',description:'예산 안에서 체감 효과가 큰 업그레이드'},
  {id:'buildnotes',name:'캐릭터 빌드 노트',group:'성장',icon:'notebook',description:'레벨·스탯·장비와 육성 메모'},
  {id:'crafting',name:'제작 비용',group:'성장',icon:'hammer',description:'재료 구매와 완제품 가격 비교'},
  {id:'scroll',name:'주문서 시뮬레이터',group:'성장',icon:'wand',description:'성공 확률 · 파괴 조건 · 강화 실험'},
  {id:'dressing',name:'코디룸',group:'생활',icon:'shirt',description:'우리 캐릭터의 색과 장비 스타일 꾸미기'},
  {id:'route',name:'이동 경로',group:'생활',icon:'route',description:'빅토리아 마을 연결을 따라 경로 찾기'},
  {id:'timer',name:'버프 · 파티 타이머',group:'생활',icon:'timer',description:'버프 만료 · 재사용 · 파티 일정'},
  {id:'order',name:'전리품 순서 뽑기',group:'생활',icon:'shuffle',description:'우리 파티 획득 순서 추첨'},
  {id:'chat',name:'영어 채팅 도우미',group:'소통',icon:'languages',description:'거래 · 파티 영어 문장 만들고 복사'},
  {id:'liveTranslate',name:'화면 읽기 · 번역',group:'소통',icon:'scan',description:'화면 공유와 기기 내 번역 지원 확인'},
  {id:'megaphone',name:'확성기 노트',group:'소통',icon:'megaphone',description:'붙여넣은 고확에서 거래와 가격 검색'},
  {id:'citizenship',name:'시민권 루트',group:'공략',icon:'flag',description:'마을 선택 · 일일 인사 · 주간 기부 체크'},
  {id:'pq',name:'파티퀘스트 공략',group:'공략',icon:'users',description:'커닝 파퀘 준비와 단계별 체크'},
  {id:'start',name:'게임 시작 가이드',group:'공략',icon:'play',description:'계정 · 설치 · 접속 · 첫 전직 준비'},
  {id:'errors',name:'실행 오류 해결',group:'공략',icon:'help',description:'런처 · 접속 · 언어 · 화면 점검'},
  {id:'events',name:'이벤트 · 일정',group:'모험',icon:'calendar',description:'공식 소식 바로가기와 나의 마감 체크'},
  {id:'ranking',name:'캐릭터 랭킹',group:'세계',icon:'trophy',description:'ClassicRank 공개 API로 캐릭터 조회'},
  {id:'settings',name:'내 공간 · 백업',group:'관리',icon:'settings',description:'프로필 · 저장 · 데이터 가져오기와 내보내기'},
];
export const LINKS = [
 {name:'글클메 지지',url:'https://xn--bj0bv7uo4la196f.com/',description:'통합 공략 · 도감 · 시세'},
 {name:'NiaDB',url:'https://meowdb.com/msclassic/ko',description:'데이터베이스 · 공식 · 빌드'},
 {name:'클래식 허브',url:'https://planet-helper.com/gmsclassic/ko/',description:'공략 · 도구 · DB'},
 {name:'메소워치',url:'https://meso.watch/',description:'판매 관찰 기반 시세'},
 {name:'메이플 마켓',url:'https://maplestory.market/items',description:'자유시장 검색 · 특가'},
 {name:'클래식마켓',url:'https://classicmarket.kr/',description:'한국어 거래 · 인증 시세'},
 {name:'고확 검색',url:'https://gmscmegaphone.com/',description:'확성기 검색'},
 {name:'ClassicRank',url:'https://classicrank.com/',description:'캐릭터 랭킹'},
];
export const NPCS = [
 {name:'루카스',en:'Lucas',region:'메이플 아일랜드',role:'초반 퀘스트'}, {name:'마이',en:'Mai',region:'메이플 아일랜드',role:'사냥 훈련'},
 {name:'주먹펴고 일어서',en:'Dances with Balrog',region:'페리온',role:'전사 전직 교관'}, {name:'다크로드',en:'Dark Lord',region:'커닝시티',role:'도적 전직 교관'},
 {name:'헬레나',en:'Athena Pierce',region:'헤네시스',role:'궁수 전직 교관'}, {name:'하인즈',en:'Grendel the Really Old',region:'엘리니아',role:'마법사 전직 교관'},
 {name:'제인',en:'Jane',region:'리스항구',role:'퀘스트 · 주문서'}, {name:'슈미',en:'Shumi',region:'커닝시티',role:'점프 퀘스트'},
 {name:'요정 아르웬',en:'Arwen the Fairy',region:'엘리니아',role:'유리구두 퀘스트'}, {name:'사비트라마',en:'Sabitrama',region:'슬리피우드',role:'퀘스트'},
];
export const TOWN_EDGES = [['리스항구','헤네시스'],['리스항구','커닝시티'],['헤네시스','엘리니아'],['헤네시스','슬리피우드'],['엘리니아','페리온'],['페리온','커닝시티'],['커닝시티','슬리피우드']];
export const START_STEPS = ['공식 서비스 지역과 접속 가능 여부 확인','넥슨 또는 Steam 계정과 보안 설정 확인','공식 런처에서 Classic World 설치','게임 실행 · 언어와 화면 설정','캐릭터 생성 · 친구 닉네임 기록','섬 퀘스트를 진행하고 10레벨 전직 준비'];
