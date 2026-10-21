/** Original grouping, with our extra planning functions kept in the same flows. */
export const CLASSIC_NAV_GROUPS=Object.freeze([
 {id:'start',name:'게임 시작',icon:'play',description:'처음 시작하는 클래식 월드',ids:['today','start','errors','events','ranking','settings']},
 {id:'guides',name:'육성 · 퀘스트 공략',icon:'book',description:'다음에 할 일부터 직업별 성장까지',ids:['guides','expQuests','money','training','skills','gear','buildnotes','citizenship','pq']},
 {id:'codex',name:'아이템 · 몬스터 도감',icon:'library',description:'아이템, 몬스터와 메이플 세계',ids:['codex','quests','monsters','items','maps','npcs','route']},
 {id:'tools',name:'편의도구',icon:'grid',description:'모험에 필요한 계산과 기록',ids:['tools','calculator','accuracy','hunt','exp','crafting','scroll','dressing','timer','order','chat','liveTranslate']},
 {id:'party',name:'파티 구인·구직',icon:'users',description:'함께할 모험가와 연락하기',ids:['party','messages','nickname']},
 {id:'market',name:'아이템 거래',icon:'handshake',description:'시세를 살피고 매물 찾기',ids:['market','owl','trade','shop','megaphone']},
]);
export const CLASSIC_MOBILE_LINKS=Object.freeze([
 {id:'today',name:'홈',icon:'compass'},
 {id:'codex',name:'도감',icon:'library'},
 {id:'tools',name:'편의도구',icon:'grid'},
 {id:'party',name:'파티',icon:'users'},
 {id:'market',name:'아이템 거래',icon:'handshake'},
]);
export function classicGroupForRoute(route){return CLASSIC_NAV_GROUPS.find(group=>group.ids.includes(route))?.id??null;}
