# Classic World 시세 API 추가 조사

확인: 2026-10-21 05:25–05:33 UTC / 14:25–14:33 KST. 공개 페이지·정상 브라우저 요청·인증 없는 GET·공개 저장소를 확인했다. 로그인, 접근 차단 우회, 계정 생성, 운영자 연락은 하지 않았다. 실시간 수치는 아래 조회 시점의 스냅샷이다.

## 결론

**Cozy Market의 자체 OCR 공개 JSON이 실제 작동하는 새 공급원이다.** 05:28:27 UTC 응답에 05:28:08.653 UTC의 관찰이 있었다. 원래 제시된 사이트들이 모두 동일한 공식 가격 API를 쓰는 구조라는 근거는 찾지 못했다. 자체 상점 OCR·확성기 수집, 사용자 등록 매물, 타 사이트 참조 중간값이 섞여 있다.

이번 확인 범위에서 Cozy의 자동 읽기를 금지하는 문구나 인증 요구는 발견하지 못했다. 사용자 개인 도우미에서는 자체 OCR 자료를 서버에서 60–120초 캐시하고 출처·관찰 시각을 보존하는 연동이 가능하다. 이것은 공식 연동 계약이나 무제한 수집 허가가 확인됐다는 뜻은 아니다. 오류·429·차단은 그대로 따르고, API 변경 시 마지막 정상 자료의 시각을 유지한다.

## Cozy Market: 실제 연결 가능한 자체 OCR

1차 출처: [About](https://cozy.markets/about), [Privacy](https://cozy.markets/privacy), [공개 보드](https://cozy.markets/market), [robots.txt](https://cozy.markets/robots.txt), [sitemap](https://cozy.markets/sitemap.xml).

About는 플레이어가 방문한 상점을 FM Overlay로 읽어 공유하는 길드 보드라고 설명한다. 계정 없는 열람을 허용하며, 재스캔한 상점의 가격은 새 정보로 대체한다. Privacy는 아이템·가격·재고·옵션·상점·채널을 공개 보드와 가격 이력에 저장한다고 설명한다. robots는 `Allow: /`다. 확인한 내비게이션·sitemap·배포 앱의 전체 라우트에 About/Privacy 외 별도 API 약관·쿼터 문서는 없었다. 앱 배포 파일에서 자동 수집·스크래핑·재배포 금지 문구도 발견하지 못했다. 이를 명시적 재배포 라이선스로 확대 해석하지 않는다.

브라우저 1차 증거:

- About: `ev_68a09b69065cc5d2589a0911da12e08960afca5025cc207b96d0b9c53fcb71c0`
- Privacy: `ev_db3adac58cd0c17989819d8c61c35241716b99490c8fce3c1369b5631e735de1`

| GET 주소 | 관찰 결과 | 용도·주의 |
| --- | --- | --- |
| [`/api/overview`](https://cozy.markets/api/overview) | HTTP 200, 05:28:27 UTC | `kpis`, `activity`, `most_listed`, `fallers`, `risers`, `recent_sales`. 최근 판매 추정 관찰 05:28:08.653 UTC. |
| [`/api/cozy-prices`](https://cozy.markets/api/cozy-prices) | HTTP 200, 05:28:29 UTC, 1,127행 | Cozy 자체 OCR의 요약. 921행 usual, 1,022행 low/low_at, 903행 last_sold_at. |
| [`/api/catalog`](https://cozy.markets/api/catalog) | HTTP 200, 5,236개 | 로컬 ID→이름→`info.iconKey` 게임 ID. 자체 가격 1,127행 전부 숫자 게임 ID에 매핑됨. |
| [`/api/items?page=1&size=2&q=Iron%20Ore`](https://cozy.markets/api/items?page=1&size=2&q=Iron%20Ore) | HTTP 200 | 검색·페이지네이션. `fm_source:cozy`와 별도 `meow` 값을 구분한다. |
| [`/api/items/414`](https://cozy.markets/api/items/414) | HTTP 200 | Iron Ore 상세. 집계·관찰 차트가 있어 응답이 약350KB. 목록 조회마다 반복 호출할 필요 없음. |
| [`/api/items/414/sightings?page=1&size=3&sort=at&dir=desc&show=listed`](https://cozy.markets/api/items/414/sightings?page=1&size=3&sort=at&dir=desc&show=listed) | HTTP 200, 재확인한 최신3행 모두 `sold:false` | `show`는 빈 값/`listed`/`sold`. 최초 확인 요청의 미지원 `show=available`은 판매 행도 반환했으므로 사용하지 않는다. |
| [`/api/fm-prices`](https://cozy.markets/api/fm-prices) | HTTP 200, 5,236행 | **자체 OCR 아님.** About에 MeowDB의 최근 2주 사용자 보고 중간값이라고 명시. 자체 공급원에 혼합하지 않는다. |

JSON 응답은 `Cache-Control: max-age=15, public`, 일부 ETag를 보냈다. 인증·쿠키 없이 읽혔다. CORS 허용 헤더는 관찰하지 못했고 CORP는 same-origin이므로 브라우저 직접 교차 출처 fetch보다 고정 주소 서버 조회가 맞다. 숫자로 문서화된 요청 한도는 확인하지 못했다.

05:28:27 UTC의 보드 KPI: 누적 관찰208,239, 추적 아이템1,137, 알려진 상점14,369, 최근24시간 관찰77,204. 보드 KPI와 개별 API의 집계 기간·필터가 다를 수 있으므로 행 수의 일치를 강제하지 않는다.

### 키·단가·시각

`/api/cozy-prices`는 `{cozy:[...]}`를 반환하며 키는 다음과 같다.

```text
item_id, usual, basis, listings, sales, listed_median, sold_median,
last_sold, last_sold_at, low, low_at, low_stock, low_shop,
low_channel, low_fm_room, low_map, trend, trend_pct
```

`item_id`는 게임 ID가 아니다. 예를 들어 로컬414=Iron Ore=`info.iconKey:4010001`, 로컬2=One-Handed Axe Attack Scroll: Greater=2043102, 로컬1368=Squishy Shoes=1072128이다.

로컬 공개 게임 카탈로그와도 1,127개 모두 ID가 일치했고 미매핑0개(0%), 같은 게임 ID 중복0개였다. 이름만 비교하면11개가 달랐다: Burgonet/Burgernet 철자3개, Female 접미사6개, 쿠폰 이름1개, 반지 Alt 접미사1개. 이 경우 이름 문자열 대신 확인된 게임 ID를 사용한다.

집계 `basis`의 앱 설명은 `sold`=최근1주 판매 추정 중간값, `day`=최근1일 등록 중간값, `week`=최근1주 등록 중간값이다. 당시 sold475/day287/week159/null206행이었다. `usual` 자체에 정확한 집계 생성 시각은 없다. 최신 조회 시각을 각 가격의 관찰 시각으로 바꾸면 안 된다.

원본 관찰 예시:

```json
{"at":1792560378.001,"qty":1,"stock":100,"price":599,"unit_price":599.0,"confirmed":true,"sold":false,"stats":null,"shop":"CrazyGods","channel":18,"fm_room":3,"map_name":"Free Market <3>"}
```

앱은 Price와 Each를 따로 표시하며 scanner 검증에서 `price / qty`를 쓴다. `qty`는 한 번에 구매하는 묶음, `stock`은 별도 재고다. 집계의 `low_stock`을 최소 구매 수량으로 쓰면 안 된다. `confirmed`는 OCR 인식 측 확인이며 실제 체결 보증이 아니다. `sold`도 회색으로 표시된 상점 행을 읽은 판매 추정이다.

Iron Ore의 원본 집계 예: usual449 / sold_median449 / last_sold359@05:25:09.978 UTC / low99@전날08:39:46.271 UTC. **약19초 전 새 관찰이 있어도 최저99 매물은 약21시간 전 관찰**이었다. 최저 관찰·상점 재고·최근 판매 추정·파생 중간값을 각각 표시하고 오래된 최저가를 현재 구매 가능한 확정 매물로 부르지 않는다. 장비 옵션이 없는 집계 가격으로 옵션이 같은 최저 장비라고 판단하지 않는다.

재현용 임시 파일(배포 데이터 아님): `/private/tmp/cozy-{overview,cozy,catalog,items,item414,sightings414}.json` 및 대응 headers. 첫512개 원본 행을 보존한 `/private/tmp/cozy-prices-sample-512-20261021.json` SHA256=`e8e05f5bcd2364800e1f59424e06f7574f43e28cc08bbcff2477eb13432ce17d`.

## 공개 저장소와 다른 후보

| 후보 | 1차 근거·현재 확인 | 판단 |
| --- | --- | --- |
| [Minerva](https://github.com/itechify/minerva) | [ADR10](https://github.com/itechify/minerva/blob/main/docs/adr/0010-item-card-from-osms-item-files.md), [ADR13](https://github.com/itechify/minerva/blob/main/docs/adr/0013-market-imports-taken-in-while-minerva-runs.md), [ADR14](https://github.com/itechify/minerva/blob/main/docs/adr/0014-deal-finder-finds-the-player-shop-in-the-client-area.md) 원문 확인 | 중앙 라이브 가격을 주는 서비스가 아니다. 본인이 본 상점 OCR·사용자 기준가·외부 도구의 로컬 JSON 가져오기. 예전 Basil 자동 가격은10월11일 중단했다고 기록. MIT 코드와 시세 데이터 이용 권한을 혼동하지 않는다. |
| [MFM Tracker](https://github.com/jayee88/mfm-tracker) | 최신 [server README/API](https://github.com/jayee88/mfm-tracker/blob/main/server/README.md), [GPL-3.0](https://github.com/jayee88/mfm-tracker/blob/main/LICENSE) 확인 | 자기 상점/OCR 고확을 친구들과 공유하는 **자체 호스팅** 서버. 공개 공용 서버 주소는 제공하지 않는다. 서버 운영자가 만든 계정·Bearer 토큰 필요. `/api/v1/sightings?since=SEQ&limit=N`, `/megaphones?since=SEQ&hours=H` 증분 동기화 지원. 공개 완성 가격 feed가 아니라 우리 모임의 직접 관찰 수집 대안이다. |
| [Sleepywood](https://www.sleepywood.io/about) | [terms](https://www.sleepywood.io/terms)는 공개 API·자동 접근의 rate limit 준수를 명시. 실제 앱은 `api.sleepywood.io/api/marketplace/listings?type=wts&page=1&limit=20&sortBy=createdAt&sortDir=desc`, `/marketplace/stats`, `/marketplace/trending?limit=5` 요청 | stats 및 listings 무인증 GET이05:25 UTC 모두 HTTP404 `Application not found`(Railway). 인증 부족이 아닌 현재 배포 unavailable 증거다. `/docs`, `/api-docs`도404. 공개 계약 의도는 있으나 지금 작동하는 공급원 아님. REA=`ev_e0a1a0381fb753f9ed65c3f397c01af3c862f64fe9027ad94e6c12caf5e7b91b`. |
| [BasilMarket robots](https://www.basilmarket.net/robots.txt) | `/api/` 금지 직접 확인, Minerva ADR도 차단 설명 | API를 추가 호출하거나 User-Agent를 바꿔 우회하지 않았다. 자동 공급원 제외. |
| [MesoWise 공개 소스](https://github.com/DKJ-Solutions/dkj-maplestory-classic-mesowise) | 개인 효율 앱·공개 트리/README 확인 | 별도 검증된 라이브 가격 feed를 찾지 못함. 공용 공급원이라고 단정하지 않음. |
| [Nexon MapleStory Open API](https://openapi.nexon.com/game/maplestory/) | 공식 문서는 MapleStory 캐릭터 등 기존 게임 API | Classic World 메소 거래/자유시장 가격 API의 근거를 찾지 못함. 현대 메이플 데이터를 Classic 시세로 대체하지 않음. |
| [Steam Economy API](https://partner.steamgames.com/doc/webapi/IEconMarketService) | Steam Market 퍼블리셔 경제 API 문서 | Classic World 메소 시장이 Steam Community Market 상품이라는 근거 없음. Steam 뉴스 API와 가격 API는 별개다. |

Minerva의 시세 가져오기는 외부 도구가 `market-imports/`에 버전2 JSON을 쓰면2초마다 읽는 로컬 인터페이스다. MFM 자체 서버의 sighting은 `{uid,ts,item,price,qty,shop,seller,map,channel,sold,sold_ts,last_seen,notes}`이며 토큰 없이는 읽을 수 없다. 두 프로젝트가 같은 외부 중앙 시세 API를 감추고 있다는 증거는 없다.

## 기존 대상과 다른 팀 조사 연결

원래8개 사이트의 기능·공개 요청은 [최초 비교 보고서](site-comparison-2026-10-21.ko.md), 현재 연결 정책은 [시세 연동 문서](../web/docs/market-sources.ko.md)를 함께 본다. 글클메 지지·MesoWatch의 수집 제한, 클래식마켓의 인증 시세, GMSC Megaphone의 HTTP402 등은 별도 관찰 결과이며 Cozy의 접근 가능성과 혼동하지 않는다. MapleMarket의 문서화된 API 키 경로, MapleHelper, HubCW, Mesoplox는 병렬 담당자가 확인한 근거를 연결 문서에 반영한다.

공통 구현 원칙: 자체 OCR와 타 사이트 참조값을 출처별로 분리하고, 서버 조회 시각과 실제 관찰 시각을 분리한다. 추정 판매는 실제 거래 원장으로 부르지 않는다. 새 공급원의 전체 카탈로그를 확보했어도 관찰이 없는 아이템 가격을0 또는 가상 시세로 채우지 않는다.
