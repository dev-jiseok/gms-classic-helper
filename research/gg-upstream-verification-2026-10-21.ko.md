# 글클메 지지와 비교할 공개 데이터 원천 검증

확인: 2026-10-21 08:47–08:55 UTC. 이번 작업은 공개 문서·무인증 GET·기존 앱 소스의 읽기 전용 조사다. 앱은 변경하지 않았다. 28개 실제 요청의 상태·응답 형식·크기·해시는 [검증 JSON](gg-upstream-verification-2026-10-21.json)에 보존했다.

## 판단

우리 앱은 이미 **MapleStory.io MCW/1의 게임 색인·이미지, MapleClassic Wiki의 구조화 관계·관찰 수치, Cozy의 자체 상점 OCR 시세**를 사용한다. 별도 GG bundle 조사에서 정적 테이블과 Wiki·CC BY-NC-SA4.0 출처가 직접 확인됐다. 따라서 **주요 정적 도감·관계 데이터는 같은 Wiki 원천에서 직접 다시 구축할 수 있다는 근거가 있다**. GG의 모든 데이터가 IO·Wiki·Cozy 세 API에서 나온다고 확대하지는 않는다.

GG `shared2589.js`의 정적 module92589는 maps/portals/monster_spawns/items/quests/skills 등의 테이블과 Wiki·라이선스 표기를 담는다. 부모 에이전트가 AST를 통해 실행 없이 리터럴만 검사한 [테이블 형태 보고서](output/gg-embedded-data-shapes-20261021.json)를 결합했다. 예를 들어 GG/우리 앱은 포털536·상점품목555·레시피348·표본드롭158행이 일치하고, 우리 수집기의 공개 Cargo 테이블명도 대응한다. 이것이 GG 고유 번역·공략 글·삽화나 자체 시장 DB의 이용 권한까지 의미하지는 않는다.

기존 GG 공개 화면은 스킬 자료에 MapleClassic Wiki·테스트 클라이언트 확인을 표시했고, 시세는 자체 게임 확성기 수집 및 자체 거래소 매물이라고 설명했다. GG의 시세는 Cozy와 같은 원천이라고 확인되지 않았다. 기존 근거는 [사이트 비교](site-comparison-2026-10-21.ko.md)의 `ev_f47ea95aab93cdec98518c5c83c8f2035dfbe99d1e938fe80dd4b0bf832ed447`, `ev_82afceae8bf8ce8270eb85bd6327deb5d20d575574e33c976493d6ba372f1a0a`다.

## 원천별 실제 제공 범위

| 원천 | 실제 GET·응답 형식 | 우리 앱에서 받는 것 | 받지 못하거나 다른 것 |
| --- | --- | --- | --- |
| [MapleStory.io MCW/1](https://maplestory.io/swagger/V3/swagger.json) | `/api/MCW/1/item`, `/mob`, `/map`, `/npc`, `/quest`: JSON 배열. 상세는 ID별 객체. 모두 이번에 HTTP200으로 재확인. | 클라이언트 이름·ID·분류, 일부 착용 조건·맵/NPC/퀘스트 메타데이터, 원 WZ, 게임 PNG/GIF. | 실시간 시세·실제 서버 드롭 확률·모든 몬스터 수치·획득 가능 상태를 제공하는 서버 DB가 아니다. |
| [MapleClassic Wiki API](https://mapleclassic.wiki/api.php?action=cargoquery&tables=monsters&fields=id,name_en,level,hp,exp&where=id%3D2&limit=5&format=json) | `action=cargoquery` → `{cargoquery:[{title:{...}}]}`. 예: Snail ID2, Lv1, HP45, EXP2. 숫자는 문자열로 온다. | 한국어 이름, 몬스터 수치, 출현·포털·상점·제작·퀘스트 관계, 표본 드롭·스킬/EXP 참조. | 기여자 참조이며 패치·실게임과 차이가 날 수 있다. 확정 서버 수치나 실시간 매물 원장이 아니다. |
| [Cozy 자체 가격](https://cozy.markets/api/cozy-prices) | `{cozy:[...]}`, 이번 1,127행·368,964B·HTTP200. `last_sold_at` 있는904행. | 자체 OCR 마지막 판매 추정 가격·시각, 주간/일간 집계, 가장 낮은 관찰 호가와 그 원래 시각. | 장비 옵션 없는 집계를 같은 옵션 매물로 비교할 수 없다. 판매 추정은 확정 체결 기록이 아니다. |
| [Cozy 매물](https://cozy.markets/api/items/414/sightings?page=1&size=2&show=listed&sort=at&dir=desc) | `{rows,page,size,total,pages}`. 행에 `at,qty,stock,price,unit_price,confirmed,sold,stats,shop,channel,...`. | 실제 관찰 단가·묶음 총액·최소 수량·재고·옵션·위치. 개별 아이템 차트도 제공한다. | 관찰 후 매진/가격 변경 가능. 전체 서버 상점·확성기 전체를 포괄하지 않는다. |
| [Cozy 카탈로그](https://cozy.markets/api/catalog) | `{items:[...]}`, 5,236행. local414 → `info.iconKey:"4010001"` → Iron Ore. | 공급원 로컬 ID와 MCW 게임 ID의 연결. | `item_id:414`를 게임 ID414로 쓰면 틀린 항목이 된다. |

이번 Cozy 응답의 가장 최근 `last_sold_at`은 **2026-10-21T08:44:37.708Z**였다. HTTP 조회는08:48Z였으므로, 새 응답을 받았다고 모든 표본이 수초 전 자료라는 뜻은 아니다. Iron Ore의 집계 중앙값449, 마지막 판매 추정399, 최저 관찰 호가199는 서로 다른 필드이며 각각의 시각·의미를 유지한다. Cozy가 별도로 제공하는 `/api/fm-prices`는 About에 설명한 MeowDB 2주 참고값이므로 현재 자체 OCR 공급원에 섞지 않는다. [Cozy About](https://cozy.markets/about), [Privacy](https://cozy.markets/privacy)의 정상 렌더링 근거: `ev_5cb60c417ba70d4d9bea4ef9d0c6527830fa421e53aef338d467461cdbfe2c67`.

## 전체 색인은 이미 받고 있다

| 종류 | GG 정적 테이블 | 이번 IO 원색인 | 현재 앱 | 차이·갭 |
| --- | ---: | ---: | ---: | --- |
| 아이템 | 2,513 | 7,432 | 7,434 | Wiki 전용 참조2개 포함. 일반 장비1,203개는 별도 API/WZ 보강이 있으나 획득 가능 검증과는 다르다. |
| 몬스터 | 73 | 101 | 102 | Wiki 전용 참조 포함. API 색인은 레벨을 일괄0으로 반환하며 HP/EXP가 없어 Wiki 수치와 분리한다. |
| 맵 | 278 | 318 | 320 | Wiki 전용 참조 포함. 맵 상세·미니맵·월드맵을 별도로 조회할 수 있다. |
| NPC | 186 | 226 | 226 | 이름/ID 전체 색인. 상점·위치 관계는 Wiki와 상세 API를 결합한다. |
| 퀘스트 | 276 | 316 | 318 | Wiki 전용 참조 포함. 현재 숫자ID315개를 API/WZ로 보강했고311개에 시작 NPC ID가 있다. |

따라서 현재 주된 문제는 목록을 더 긁어오는 것이 아니라 **항목별 상세·이미지 커버리지, 출처 충돌, 미확인 조건의 처리**다. 현재 앱 관계는 상점555행·레시피348개·방향성 포털536개·표본 드롭158행이다. 상세 범위는 [공개 데이터 문서](../web/docs/public-data.ko.md), 시세 의미는 [시세 연동 문서](../web/docs/market-sources.ko.md)에 있다.

실제 상세 예:

- [Iron Dagger1332007](https://maplestory.io/api/MCW/1/item/1332007): `description.name`, `typeInfo`, `metaInfo` 객체. Lv25·DEX20·LUK40·reqJob8·업그레이드7회가 명시되어 있다. `metaInfo.attack=1`은 기본 무기 공격력이 아니라 동작 자료이며 WZ `incWAT` 등을 별도로 읽는다.
- [퀘스트1009](https://maplestory.io/api/MCW/1/quest/1009): `requirementToStart/Complete`, `rewardOnStart/Complete` 구조. 시작 Lv3·NPC11·선행1006, 처치3/4/5번10/10/5마리, 완료 EXP80·아이템2010002×10. 누락 메소는0으로 바꾸지 않는다.
- [리스항구10000000](https://maplestory.io/api/MCW/1/map/10000000): 포털·NPC·몹·미니맵·발판·경계 등이 있는 객체. 전체 응답186KB라 목록에서 매번 호출할 이유가 없다.
- [히나1](https://maplestory.io/api/MCW/1/npc/1): 이름·대사·상점 여부·실제 `framebooks` 목록을 제공한다.

## 몬스터2·9 이미지가 빠진 이유

**Wiki ID 오결합이라는 근거는 없다.** 이번 IO 원색인 자체가2=Snail,9=Orange Mushroom을 포함하고 Wiki Cargo도2=Snail을 반환했다. 문제는 IO의 엔드포인트별 커버리지가 다르다는 점이다.

| 경로 | 실제 결과 |
| --- | --- |
| `/api/MCW/1/mob/2`, `/mob/9` | HTTP404 JSON. 일반 상세를 받지 못함. |
| `/api/wz/MCW/1/Mob/_Canvas/0000002.img`, `0000009.img` | HTTP200, 둘 다 `stand/move/hit1/die1` 노드 존재. |
| 위 WZ 경로의 `/stand/0` | HTTP200, `type:12,value:<PNG base64>` 실제 원프레임. 각각37×26,63×58 픽셀. |
| `/api/MCW/1/mob/2/render/stand/0` | HTTP200 PNG. |
| `/api/MCW/1/mob/2/render/move/0` | HTTP404 JSON. |
| `/api/MCW/1/mob/9/render/stand/0` | HTTP404 JSON. |
| `/api/MCW/1/mob/9/render/animated/stand` | 301 후 `/render/stand?bgColor=` HTTP200 GIF. |

상세404만으로 이미지가 없다고 결론내리면 존재하는 자산을 놓친다. 개선은 다른 몬스터 ID 치환이 아니라, **실제 WZ 포즈 확인 → 정적 프레임 → 같은 포즈 GIF/원 WZ 프레임 대체** 순서다. 현재 GameVisual의 일반 상세 기반 포즈 선택에는 이 대체 경로가 아직 없으며, 이번 조사에서는 앱을 수정하지 않았다. HTTP200만 검사해 WZ의 빈 `type:0` 응답을 실제 이미지로 취급해서도 안 된다.

## 갱신·공개 범위

- IO 응답에서 `Cache-Control:max-age=86400`, `Last-Modified`를 관찰했다. 공식적으로 보장된 데이터 갱신 주기·SLA는 찾지 못했다. 고정 MCW/1이라는 주소가 현재 서버 패치를 항상 반영한다는 보장도 아니다. 서비스 자체는 커뮤니티 API이며 **Nexon이 운영하는 공식 게임 서버 API가 아니다**. [권리 안내](https://maplestory.io/)는 게임 이미지·설명·캐릭터 정보를Nexon 소유로 설명한다. 공개 Swagger/소스가 게임 자산의 무제한 재배포 라이선스를 뜻하지 않는다.
- IO 운영자 [공개 저장소](https://github.com/crrio/maplestory.io)는 이번 조회에서 archive 상태이며 README는 소스의 실행 가능성을 보장하지 않는다. 과거 공개 파서를 현재 배포 MCW 동작과 동일하다고 가정하지 않고 실제 응답을 우선한다.
- Wiki [siteinfo rightsinfo](https://mapleclassic.wiki/api.php?action=query&meta=siteinfo&siprop=rightsinfo%7Cgeneral&format=json)와 Main Page는 [CC BY-NC-SA4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)을 명시한다. 편집 참조는 기여자·원문·라이선스·변경 표시를 유지한다. Wiki 코드의 라이선스와 게임 이미지 권리를 동일하게 보지 않는다.
- Cozy는 무인증 공개 보드·가격 이력을 설명하며 이번 JSON도 쿠키 없이200이었다. robots `Allow:/`, 응답 cache15초를 재확인했다. 별도 API SLA·숫자 요청 한도·명시적 데이터 재배포 라이선스는 찾지 못했다. 이 조사 범위의 미발견을 무제한 허가로 확대하지 않는다.

## 합리적인 저장·증분 구조 제안

1. **정적 자료를 빌드 스냅샷으로 유지한다.** 현재의 `public-catalog.json`과 장비/퀘스트 보강 파일은 유효한 구조다. IO 원색인을 하루1회 조건부 조회하고 버전·Last-Modified·응답해시·스키마가 바뀐 종류만 정규화한다. 아이템 원색인만2.70MB라 D1 단일2MB행에 넣지 않고 파일/R2 또는 항목별 행으로 보관한다. 상세의 큰 이미지 base64·애니메이션은 게임 수치 JSON과 분리한다.
2. **Wiki는 실제 RecentChanges를 활용한다.** 이번 [recentchanges 요청](https://mapleclassic.wiki/api.php?action=query&list=recentchanges&rcprop=title%7Ctimestamp%7Cids&rclimit=3&format=json)이200 및 이어읽기 cursor를 반환했다. 시간당 변경 페이지·revision을 확인하고 해당 페이지의 Cargo 관계만 재조회하는 구조가 가능하다. 삭제·이동·Cargo 재생성 누락을 잡기 위한 주기적 전체 대조도 둔다. 이는 제안이며 현재 수집기는 전체 순차 페이지 갱신이다. [MediaWiki API 문서](https://www.mediawiki.org/wiki/API:RecentChanges).
3. **원천 키를 분리한다.** `mcw:1:mob:2`, Wiki page/revision, Cozy local414와 게임ID4010001 연결을 함께 보존한다. 같은 이름이라는 이유로 임의 결합하지 않는다. 필드마다 어느 원천을 우선했는지와 null/명시0을 남긴다.
4. **이미지 manifest를 따로 둔다.** 종류·ID·확인된 포즈·PNG/GIF URL·응답 상태·해시·확인 시각을 저장한다. 보이는 항목을 먼저 확인하고 누락 목록만 저속 재검사한다. 상세404와 실제 이미지404를 구분하고, 정확한 원프레임이 있을 때만 대체한다. 무관한 몬스터 그림을 대신 사용하지 않는다.
5. **시세는 별도 빠른 수집 경로를 유지한다.** Cozy 전체 피드1회/60초·카탈로그1회/24시간·공용 lease/중복제거·원 관찰시각 유지·30일 이력 구조는 이미 구현되어 있다. 전체 피드에 증분 cursor가 확인되지 않았으므로 해시/ETag로 변화를 판별하며, 매물은 선택/관심 아이템만 페이지 조회한다. 추천 재평가는 시간당 또는 사용자 조건 변경 시 수행할 수 있지만 가격 조회·신선도 표시는1분 경로와 분리한다.

위 구조로 GG 정적 테이블과 대응하는 공개 Wiki 원천을 직접 받아 저장하고 필요한 부분만 갱신할 수 있다. GG 고유 번역·글·삽화·자체 확성기/사용자 매물 DB까지 같은 자료로 확보됐다는 결론은 내리지 않는다. GG의 `quest_steps:837`처럼 현재 우리 카탈로그의 독립 테이블로 수집하지 않는 자료는 별도 커버리지 갭으로 남는다.
