# 공개 게임 자료와 검증 범위

확인일: 2026-10-21. 이 프로젝트는 글클메지지·NiaDB·시세 서비스의 비공개 데이터베이스나 인증을 복제하지 않습니다. 공개 MCW/1 API 색인과 이용 조건이 표시된 Wiki의 구조화 사실을 정규화하고, 별도의 한국어 안내를 직접 작성합니다.

## 자료 출처와 이용 조건

- [MapleStory.io MCW/1](https://maplestory.io/api/MCW/1/item): 공개 클라이언트 색인·아이템/맵/퀘스트/NPC 메타데이터. 이미지·게임 내용의 권리는 NEXON에 있습니다. 서비스의 [권리 안내](https://maplestory.io/)와 [공개 API 명세](https://maplestory.io/swagger/V3/swagger.json)를 따릅니다.
- [MapleClassic Wiki](https://mapleclassic.wiki/wiki/Main_Page): 기여자들이 기록한 구조화 사실. 정규화·한국어 이름·연결 관계를 편집한 참조 자료에는 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)을 유지합니다. 각 항목에 원문 링크·확인일·데이터 버전·신뢰 상태를 표시합니다.
- 육성·상황별 행동 가이드는 직접 작성했습니다. 특정 장비·사냥터·스킬 배분이 모든 상황에서 최적이라고 단정하지 않습니다.

## 현재 색인과 관계

| 자료 | 공개 API 원색인 | 앱 색인/관계 | 범위 |
| --- | ---: | ---: | --- |
| 아이템 | 7,432 | 7,484 | ID·영문명을 교차 확인한 클라이언트 항목과 별도 Wiki 참조52개. 출시·획득 가능 여부는 별도입니다. |
| 몬스터 | 101 | 102 | Wiki의 일반형 수치가 있는 항목만 HP·EXP 등을 채웁니다. API의 일괄 레벨 0은 미확인으로 바꿉니다. |
| 맵 | 318 | 321 | 클라이언트와 연결을 확인하지 못한 Wiki 참조3개 포함. |
| NPC | 226 | 241 | Wiki 전용·부연명 등 미확인 참조15개를 현재 클라이언트 ID와 분리합니다. |
| 퀘스트 | 316 | 358 | 클라이언트와 연결되지 않은 Wiki 참조42개 포함. 이름이 다른 원천 ID는 같은 퀘스트로 합치지 않습니다. |
| 방향성 포털 | — | 536 | 원자료 537개 중 출발 맵이 색인에 없는 1개는 경로에서 제외합니다. 역방향을 자동으로 만들지 않습니다. |
| 몬스터 출현 관계 | — | 698 | 일반형/인스턴스 변형·출현 수·재생성 참조를 유지합니다. |
| 관찰 드롭 행 | — | 158 | 표본 킬 수·획득 수·관찰일·구간을 유지합니다. 확정 서버 확률이 아닙니다. |
| NPC 판매 행 | — | 555 | 일반가·주민가·시민권·수량 제한을 분리합니다. |
| 상점 기본 정보 / 퀘스트 진행 단계 | — | 30 / 837 | 판매 행과 상점 본체, 퀘스트 시작·진행 순서를 각각 보존합니다. |
| 제작 레시피 | — | 348 | 6개 제작 직업, 재료·생산 수량·수수료·숙련 EXP·촉매 참조. |
| 퀘스트 보상 행 | — | 943 | 선택·랜덤·직업/성별 조건부 보상을 일반 보상에서 분리합니다. |
| 퀘스트 재료/처치 관계 | — | 264 / 83 | 공란을 필요 없음이나 수량 0으로 단정하지 않습니다. |
| 직업 / 스킬 | — | 15 / 93 | 초보자+1차 4계열+2차 10진로. 스킬은 직업별 원자료 행 93개, 고유 스킬 80개입니다. |
| 직접 작성한 가이드 | — | 23 | 전 직업·시세 기회비용·제작·NPC 할인·사냥 실측·공식 출시/출석/거래/주거 안내. |

현재 공개 자료에서 3차 이후와 해적 계열은 출시 진로로 제공하지 않습니다. 전직 레벨은 현재 MCW 참조의 10/30을 사용하며, 과거 메이플의 마법사 8레벨 전직과 구분합니다. 공식 Grand Launch 공지(46506)로 현재 레벨 상한100·1차10·2차30을 확인했습니다. EXP 검증표는 여전히1–49만 제공하며, 상한100 확인을 EXP50–99 검증으로 확대하지 않습니다.

EXP 필요량은 [Wiki의 공개 모듈](https://mapleclassic.wiki/wiki/Module:ExperienceCurve)이 확인한 1~49레벨만 사용합니다. 50레벨 이상의 다음 레벨 필요 EXP는 `null`이고, 기존 메이플 공식으로 자동 채우지 않습니다.

## 도감 API와 클라이언트 사용

`GET /api/game-data?kind=items&q=빨간&offset=0&limit=40`은 한국어·영어·초성·ID 검색과 정확한 서버 페이지 수를 제공합니다. `kind`는 `items`, `monsters`, `maps`, `quests`, `npcs`, `shops`, `recipes`, `portals`, `drops`입니다. 페이지 크기의 상한은 200개입니다.

`id=2000000&detail=1`을 붙이면 고정된 공개 MCW API의 상세를 필요한 시점에 불러옵니다. 상세 호출은 6시간 동안 서버 메모리에 보관하고 실패하면 참조 자료와 실패 상태를 함께 표시합니다. 외부 URL을 임의로 전달하는 프록시는 아닙니다.

`kind=bundle&sets=monsters,maps,quests`는 필요한 묶음만 반환합니다. React 화면에서는 `useGameBundle(['monsters','maps'])`로 공통 메모리 캐시를 사용합니다. 큰 전체 아이템 색인을 브라우저 저장소에 중복 저장하지 않습니다.

`kind=route&from=10000000&to=10001000&level=10`은 확인된 방향성 포털 수를 최소화합니다. `conditional=1`, `transport=1`은 조건부/수송 관계를 포함할 때만 지정합니다. 전체 이동 시간·요금의 최적해는 아닙니다.

`kind=atlas&map=WorldMap001` 또는 `WorldMap000`은 공개 MCW의 실제 월드맵 PNG와 지점 좌표를 반환합니다. 빅토리아 56개, 메이플 아일랜드 11개의 원자료 지점 그룹을 선택해 연결 맵을 엽니다. 이미지·좌표는 최대 6시간 캐시하며, 실패해도 전체 맵 목록과 포털 검색을 사용할 수 있습니다. 맵 상세의 미니맵도 실제 클라이언트 PNG입니다.

퀘스트의 `eligibleLevel`, `job`, `exclude` 필터는 페이지 분할 전에 적용합니다. 프로필이 1레벨 파이터 목표라면 현재 직업은 초보자로 판단합니다. 현재 회차를 모르는 일일·주간 후보 전체를 오늘 활성화된 퀘스트라고 표시하지 않습니다.

Wiki에 있는 시민권 마을·단계, 제작 직업·레벨, 완료 가능 레벨, 명성, 필요 메소, 참여 기간도 보존합니다. 공개 WZ의 시작·완료 검사 전체가 해석된 일반 퀘스트는 `client-reference` 조건 참조를 제공하고, 명시된 스크립트와 미해석 조건은 구분합니다. 일일·주간 게시판 후보는 `rotationPool`로 구분하고 실제 회차 선택 여부는 게임에서 확인해야 합니다.

## 제작과 코디에서의 정확성

제작 비용은 이번 시도의 현금 지출과 보유 재료의 판매 기회비용을 분리합니다. 재료 가격을 모르면 제작비·차익을 0으로 계산하지 않습니다. 시장 구매 단가는 최근 1시간의 자료를 사용하고, 오래된 값은 현재 단가에서 제외합니다. NPC 시민권·주민 할인·구매 제한은 사용자가 실제 조건을 확인했을 때 적용합니다. 성공률·수수료는 표시된 사용자 가정이며 촉매의 랜덤 옵션 가치는 자동으로 확정하지 않습니다.

코디룸은 공개 MCW의 실제 PNG/GIF 렌더링을 사용합니다. 피부 2000/2001, 기본 헤어·얼굴·옷 조합과 애니메이션 응답을 실제로 확인했습니다. 공유 링크에는 검증한 숫자 아이템 ID·허용된 포즈 등의 코디 정보만 들어갑니다. 지원하지 않는 조합은 오류를 표시하며 임의의 SVG 캐릭터로 대신 보여 주지 않습니다.

## 자료 갱신과 검증

```sh
cd web
node scripts/refresh-public-catalog.mjs
npm run check
npm test
```

갱신 스크립트는 공개 API를 순차 호출하고 Cargo 테이블을 끝까지 페이지 처리합니다. 원 응답은 게시되지 않는 `web/work/public-catalog-input/<실행 시각>/`에 저장합니다. 확인일·직업/스킬·EXP·전체 카탈로그가 함께 갱신됩니다. 새로운 버전에서 필드·행 수·스킬 상한이 달라지면 테스트와 출처를 재검토해야 합니다.

## 공개 원천표 전체 수집

2026-10-21T09:13:13Z 완료 스냅샷 `2026-10-21T09-12-50-502Z`에서 Wiki 공개17개 테이블의 선언된278개 열을 모두 수집했습니다. [공개 Cargo 구조 페이지](https://mapleclassic.wiki/wiki/Special:CargoTables)에서 각 테이블의 실제 열·타입·선언 행 수를 확인하고, [Wiki API](https://mapleclassic.wiki/api.php)는500행씩 `_ID` 순서로 조회하여 마지막 짧은 페이지까지 읽습니다. 합계가 선언 행 수와 다르거나 한 페이지라도 실패하면 전체 완료로 표시하지 않습니다.

| 원천표 | 행 수 | 공개 열 수 |
| --- | ---: | ---: |
| maps | 278 | 19 |
| portals | 537 | 11 |
| monster_spawns | 698 | 8 |
| monsters | 74 | 34 |
| npcs | 186 | 12 |
| map_npcs | 174 | 4 |
| items | 2,513 | 48 |
| monster_drops | 158 | 16 |
| shops | 30 | 13 |
| shop_items | 555 | 9 |
| recipes | 348 | 13 |
| quests | 276 | 39 |
| quest_required_items | 264 | 5 |
| quest_steps | 837 | 10 |
| quest_rewards | 943 | 10 |
| skills | 93 | 22 |
| quest_enemies | 83 | 5 |

`content/source-tables.json`은 모든 행과 열을 타입에 맞는 평문 사실로 보존합니다. HTML을 실행하지 않으며 숫자0·Boolean false·미확인 null을 구분합니다. Wiki에 있는 테스트/템플릿 행도 이 원천표에는 남습니다. 출발 맵이 `Module:MapView`인 포털1개 등은 실제 게임 경로에 연결하지 않습니다. `content/catalog-sources.json`은 스냅샷 시각, 원천 URL, 행·열 수, 완료 상태, 응답 SHA256, 미해결 관계를 기록합니다. 일반 카탈로그의 `wikiFields`와 `wikiFieldSource`, 공통 `meta.schemaOrigins`로 각 공개 열의 출처를 찾을 수 있습니다. 공통 출처 객체를 모든 필드마다 복제하지 않습니다.

Wiki의 일부 `pre-launch` ID는 현재 MCW/1과 다릅니다. ID와 영문명이 함께 일치할 때만 직접 병합하고, 이름의 HTML 엔티티·공백·맵 괄호 표기만 정규화합니다. 그 외에는 유일한 정확 영문 이름을 별도 매핑 근거와 함께 연결하거나 `wiki:페이지명` 참조로 분리합니다. 예를 들어 Heena의 Wiki2101은 유일한 현재 클라이언트 Heena1과 연결하되 원본2101도 `wikiId`에 남깁니다. 동일 ID인데 다른 이름인 소비 아이템·여러 개 존재하는 동명 캐시 아이템은 임의로 합치지 않습니다. 별도 참조의 `referenceOnly:true`는 실제 MCW 이미지 ID나 확정 착용 조건으로 쓰지 않습니다. 원천표 전체 수집 완료가 실제 출시·서버 조건의 완전성을 뜻하지 않습니다.

퀘스트 `steps`는837개 전체 원천행에서 순서·제목·설명·명시된 목적 맵/NPC/몬스터/재료·비고를 연결합니다. 문장에 적힌 장소나 제목의 수량에서 ID·수량·시작/완료 단계를 추측하지 않습니다. 동명 Community Board는 단계의 명시 목적 맵과 NPC 원천의 명시 맵이 유일하게 일치한35개만 구분했습니다. 현재16개 관계 참조가 미해결이며 원표에서 확인할 수 있습니다. 그중 테스트 행4개를 비롯해 이름이 모호하거나 누락된 참조는 임의 연결하지 않습니다.

이번 스냅샷의 IO5개 색인은 기존 응답 파일을 재사용했습니다. 개별 metadata의 `reused:true`와 `checkedAtBasis`가 파일 수정시각임을 표시하며, Wiki를 새로 조회한 시각을 IO의 새 검증시각으로 표시하지 않습니다. 원 응답·구조 HTML·페이지별 URL/시각/해시는 `work/public-catalog-input/<스냅샷>/manifest.json`에 남습니다.

검토용으로 수집과 출력을 분리할 수 있습니다:

```sh
node scripts/refresh-public-catalog.mjs --no-build
MCW_REFERENCE_DIR=work/public-catalog-input/<완료된-스냅샷> MCW_VERIFIED_AT=2026-10-21 python3 scripts/build-public-catalog.py
python3 -m unittest discover -s scripts -p test_public_catalog_helpers.py
node --test tests/public-source.test.mjs tests/equipment-data.test.mjs tests/quest-evidence.test.mjs
```

`MCW_OUTPUT_DIR=/검토용/디렉터리`를 추가하면 게시용 content를 건드리지 않고 미리보기3개 파일을 생성합니다. 빌더는 manifest가 없거나 미완료이면 거부하고, 저장된 응답 해시·행수·스키마를 확인한 뒤 원자적으로 파일을 교체합니다. 현재 JSON 크기는 일반 카탈로그 약17.6MB, 전체 원천표 약4.3MB, 출처 현황 약18KB입니다. 원천표는 서버 API가 요청 시 읽도록 분리합니다. 기존 장비·퀘스트 보강은 안정된 클라이언트 ID로 병합하며, 새 진행 단계나 원천표 열을 과거 보강 캐시로 덮어쓰지 않습니다.

실제 입력·저장·공유·렌더링·390px 모바일 검증은 프로젝트 루트의 `node scripts/qa-world-tools.mjs`로 실행합니다. 보고서와 스크린샷은 게시하지 않는 `research/output/`에 기록합니다.

## 공식 출시 일정 보정

[공식 Grand Launch 원문](https://www.nexon.com/maplestory/news/general/46506/grand-launch-release-notes)을 정상 브라우저로 확인하고 실제 공개 CMS JSON(`https://g.nexonstatic.com/maplestory/cms/v1/news/46506`) HTTP200을 확인했습니다. REA 증거: `ev_3faa01bf0331466e173fc7acea98a4562f03d3d92738435bef71b832acc85c59`. 신규 계정 거래는 계정 내 캐릭터15레벨 도달24시간 뒤, PQ는21레벨 이상·CH3–12이며 상한은 해당 공지에 명시되지 않았습니다. 주거는 시민권Visitor(2등급) 이상·한 집·계정 공유입니다.

`build-launch-data.py`는 원문을 복제하지 않고 공식 사실·이벤트8개(기간5개+GM3개)를 `launch-events.json`과 `launch-data.mjs`로 생성합니다. 공식 원문의 UTC 기간을 저장하고 UI에서KST를 명시합니다. 출시18:00UTC 전에00:00UTC로 이미 시작된 이벤트도 서버 입장 전으로 구분합니다. 출석은 계정당 일일1회이나 일일 초기화 시각은 공지에 없으므로 생성하지 않습니다. 개인 일정 추가는 사용자 버튼으로만 하며 동일 이벤트ID는 중복 저장하지 않습니다.

공략은23개·직업별 체크포인트99개입니다. 공식 출시 조건을 반영한4개 가이드는 모든 출시 직업에 연결합니다. 헤네시스506018은 Wiki 개별 페이지가 시민권 일일 의뢰 절로 리다이렉트되어 Cargo행이 없는 관계를 보정했습니다. NPC·도시·일일 회차 관계에 이어 공개 WZ에서 시민권5등급 조건도 확인했습니다. 누락된 보상/전체 조건을 완전하다고 표시하지 않습니다. `build-public-catalog.py`와 현재 스냅샷에 같은 보정이 적용됩니다.

## EXP50 이상 재확인

2026-10-21 추가 확인에서도 [Wiki의 관찰 기반 ExperienceCurve](https://mapleclassic.wiki/wiki/Module:ExperienceCurve)는1–49만 검증 범위로 남아 있습니다. [MapleEXP의 표](https://mapleexp.com/guide/en/experience.html)는50–100을 과거/클라이언트 자료에 맞춘 값으로 구분하므로 현재 Classic 서버의 관찰 검증으로 취급하지 않습니다. 공개 MCW/1 Etc 색인의69개 엔트리에도 EXP 테이블은 확인하지 못했습니다. 공식100레벨 상한과 각 레벨 필요 EXP의 확인은 별개이며,50 이상은 게임에서 확인한 수동 입력을 계속 사용합니다.

## 장비 착용 조건·기본 능력치 보강

2026-10-21 공개 MCW/1 Item API와 원시 WZ 필드를 실제 조회했습니다. 일반 장비는1,203개 모두 메타데이터를 확보했고, 레벨·STR/DEX/INT/LUK·직업의 기본 착용 조건은1,202개가 명시값으로 채워졌습니다. 예외는 Inkwell Hat(1002998)1개로, API에 요구 스탯4개가 없어 null과 미확인 상태를 유지합니다. 현재 최적화 엔진의 슬롯 분류 기준으로는1,201개 중1,200개가 기본 조건을 충족합니다. 이 수치는 획득 가능·상점 재고·현재 출시 여부의 보장이 아닙니다.

공개 색인에서 `Equip`·비캐시로 분류된1,452행 중249행은 얼굴·헤어·머리 외형이라 착용 장비 수에 포함하지 않았습니다. 전체 색인 보강은1,437행이며, 메타데이터가 없는 나머지15행도 피부/얼굴 외형입니다. 원 Item API가 HTTP200 JSON null을 반환하는 실제 옷34개는 [공개 WZ API](https://maplestory.io/swagger/V3/swagger.json)의 `Character/{폴더}/{8자리 ID}.img/info`와 그 자식 필드로 복구했습니다. 원문 값이 없는 필드를0으로 채우지 않습니다.

실제값 예:

- [Iron Dagger1332007](https://maplestory.io/api/MCW/1/item/1332007): Lv25·도적·DEX20·LUK40·STR0·INT0·업그레이드7회. 프리런치 Wiki의 전사/도적·STR20 조건보다 현재 클라이언트 명시값을 우선합니다.
- [Dark Brown Stealer1040046 WZ](https://maplestory.io/api/wz/MCW/1/Character/Coat/01040046.img/info): Lv30·도적·DEX20·LUK50, STR3·물리방어40. Item API null 때문에 누락됐던 조건과 능력치를 복구했습니다.
- [Sabre의 incWAT](https://maplestory.io/api/wz/MCW/1/Character/Weapon/01302002.img/info/incWAT)는32입니다. `metaInfo.attack=1`은 공격 동작 자료여서 무기 공격력으로 쓰지 않습니다. 기본 공격력은 `incWAT`/`incPAD`, 마력은 `incMAD`/`incMAT`의 명시값을 사용합니다. 알려진 기본 공격력203개·마력22개이며 다른 빈 능력치는 미확인으로 남습니다.

명성 조건이10 또는20으로 명시된 장비15개는 `extraRequirements.fame`으로 보존합니다. API에 없는 명성·특수 직업 조건은 `extraRequirementUnknowns`에 남기고, 기본 조건의 완전성(`coreRequirementsComplete`)과 전체 추가 조건 확인(`wearingRequirementsComplete`)을 구분합니다. 기본 조건이 확인되었다고 게임의 모든 착용 검사가 검증됐다는 뜻은 아닙니다. 알려진 양수 명성 조건은 최적화에서 별도로 충족해야 합니다.

`lib/equipment-data.mjs`는 순수 정규화와 커버리지 계산을 제공합니다. `content/equipment-metadata.json`은 보강 스냅샷이며 `build-public-catalog.py`가 아이템에만 병합합니다. 개별 항목에 API/WZ 출처·원시 필드명·실제 수집 시각·미확인 조건을 보존합니다. `metadataFormat:scalar-properties-reassembled`는 개별 WZ 필드를 다시 구성한 자료라는 표시입니다. 기존 Wiki 능력치가 남으면 해당 능력치의 Wiki 출처도 유지합니다.

재현은 `web/`에서 실행합니다:

```sh
node scripts/enrich-equipment.mjs --write
node scripts/enrich-equipment.mjs --cache-only --write
node scripts/enrich-equipment.mjs --ids=1302002,1332007 --refresh --write
node --test tests/equipment-data.test.mjs
```

수집기는 고정 공개 호스트·최대3개 동시 작업·요청 시작250ms 간격을 사용합니다.429/서버 오류를 재시도하며 `Retry-After`를 따릅니다. 원자료에서 이미지·동작 프레임을 제외한 메타데이터와 필요한 WZ 수치만 `web/work/equipment-cache/MCW-1/`에 보관합니다. 버전 변경 뒤에는 명시적 `--refresh`로 다시 확인합니다. 마지막에 최신 카탈로그를 다시 읽어 아이템만 병합하고 파일을 원자적으로 교체하므로 퀘스트·공략 행은 보강 스냅샷으로 덮어쓰지 않습니다.

검증: 정규화·0/미확인 구분·직업 마스크·동작 필드와 무기 공격력 구분·WZ 출처·현재 데이터 커버리지 회귀8개, TypeScript 검사, 로컬 실제 API의1332007/1040046 응답을 확인했습니다.

## 퀘스트의 실제 검사·소비·보상 근거

2026-10-21 [MCW/1 퀘스트 API](https://maplestory.io/api/MCW/1/quest/1009)와 [원시 WZ QuestData](https://maplestory.io/api/wz/MCW/1/Quest/QuestData/1009.img)를 조회했습니다. 색인318개 중 공개 클라이언트 숫자ID316개를 시도해315개를 보강했습니다. 1005는 HTTP404이며 Wiki 전용2개와 함께 기존 참조 자료를 보존합니다. 전체315개에서 `Check/0`, `Check/1`, `Act/1`의 실제 자식 필드명을 확인하고, 추가 검사163개 퀘스트의 값과 필요한 보상 원문 필드를 별도로 수집했습니다. 빈 배열만 있는 WZ `type:0`은 존재하지 않는 속성의 응답이므로 검증된 빈 검사로 취급하지 않습니다.

현재 공개 검사 범위가 해석된 퀘스트는184개이며, 회차·시민권·전문기술·시간대·방문 이력 등 추가 확인이 필요 없는 일반 조건 참조는63개입니다. `conditionsComplete/clientConditionsComplete`와 `sourceConfidence:client-reference`는 이 공개 클라이언트 범위의 의미이고, 실제 서버 전체를 보장하지 않습니다(`serverBehaviorVerified:false`). 명시된 스크립트가 있는23개와 미해석 `order`122개 등의 구체적 미확인 사유는 유지합니다. `order`가 UI 순서라는 1차 근거를 찾지 못했으므로 임의로 무시하지 않습니다. 일반적인 서버 차이 가능성만으로 모든 퀘스트의 조건을 다시 미확인 처리하지 않습니다.

시민권 마을 코드와 등급121개를 보존했습니다. 실제 WZ의 [506018 마을 코드1](https://maplestory.io/api/wz/MCW/1/Quest/QuestData/506018.img/Check/0/citizenshipTown)·[5등급](https://maplestory.io/api/wz/MCW/1/Quest/QuestData/506018.img/Check/0/citizenshipGrade), [506101 마을 코드2](https://maplestory.io/api/wz/MCW/1/Quest/QuestData/506101.img/Check/0/citizenshipTown)를 [이름이 명시된 Wiki 의뢰](https://mapleclassic.wiki/wiki/Citizenship)와 교차 확인해 Henesys / Kerning City에 연결했습니다. 원시 코드·각 필드 출처도 남깁니다. 시작·완료 NPC ID는311/305개이며, 일치하는 NPC만 실제 이름으로 연결합니다.

보유 검사와 소비 액션은 다릅니다. 완료 보유 재료는 `requirements`, 시작 보유 재료는 `startRequirements`, 음수 아이템 액션은 양의 절대 수량으로 바꾼 `consumedItems`에 단계와 출처를 보존합니다(182개 퀘스트). 두 목록을 더해 소비량으로 만들지 않습니다. 시작 시 지급된50개 퀘스트의 아이템도 `clientStartItems`에 보존하되 지급 방식이 확인되지 않은 목록을 확정 지급으로 계산하지 않습니다. 명시된 양수·음수 메소 액션은 `clientMesoActions`로 따로 남깁니다. 클라이언트 조건의 완전성만으로 `costsConfirmed/consumptionComplete`를 참으로 올리지 않습니다.

API는 보상 아이템의 `prop`를 평탄화 과정에서 잃습니다. 실제 Jane10002의14종 보상 원문에는 `prop:1`이 있으며 이를1% 또는100%로 해석하지 않습니다. `rawProp/rawFields/rawSourceUrl`로만 보존하고 Wiki의 랜덤 보상 그룹을 확정 보상과 합산하지 않습니다. WZ 자식 이름이 `0,1,10,…,2` 사전순이라 API 배열 위치와 원시 숫자 위치를 구분합니다. Wiki 고정 보상과 실제 ID·수량 및 원시 필드를 교차 확인한 경우만 고정 보상으로 유지합니다. 공개 완료 액션의 보상 범위가 확인된151개 중 명시 스크립트가 없는128개만 일반 보상 완전성 플래그를 제공합니다.

API나 WZ에 없는 메소는0으로 만들지 않습니다(현재44개 미확인). [공개 IO 파서의 nullable Meso](https://github.com/crrio/maplestory.io/blob/82f03dd85919f77d2869d65fd2a37b9dbc541310/maplestory.io/Data/Quests/QuestRewards.cs#L21)와 [실제 읽기](https://github.com/crrio/maplestory.io/blob/82f03dd85919f77d2869d65fd2a37b9dbc541310/maplestory.io/Data/Quests/QuestRewards.cs#L52)에도 누락값을0으로 만드는 계약은 없습니다. 이 공개 소스는 과거 WZ 구조를 읽으므로 현재 MCW 배포 코드와 동일하다고 주장하지 않으며, 실제 응답·원시 WZ를 함께 확인했습니다.

재현은 `web/`에서 실행합니다:

```sh
node scripts/enrich-quests.mjs --write
node scripts/enrich-quests.mjs --cache-only --write
node scripts/enrich-quests.mjs --ids=1009,10002 --refresh --write
node --test tests/quest-evidence.test.mjs
```

원자료는 게시하지 않는 `work/quest-cache/MCW-1/`에 보관합니다. 최대3개 동시 작업·요청 시작250ms 간격·15초 요청 제한·429/서버 오류 재시도와 `Retry-After`를 적용합니다. 성공0개면 카탈로그와 보강 manifest 어느 것도 덮어쓰지 않습니다. 부분 재시도는 ID별 병합하며, 최신 카탈로그를 다시 읽어 퀘스트만 갱신합니다. `build-public-catalog.py`도 `quest-metadata.json`을 같은 ID에 병합합니다. 개별 상세 API는 저장된 원문 증거를 현재 API payload가 동일할 때만 재사용합니다.

검증은 실제 MCW 응답을 줄인 오프라인 fixture로 조건·직업·NPC·소비·랜덤 원시값·위치 매핑·시민권5등급·payload 변경·성공0개 보존을 확인합니다. 퀘스트/카탈로그/추천/묶음 플래너 타깃69개와 TypeScript 검사를 통과했습니다.
