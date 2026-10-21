# 실제 게임 이미지와 대체 경로

2026-10-21 확인. 게임 자산의 권리는NEXON에 있으며, 고유 로고·삽화나 다른 몬스터 그림으로 자료의 빈칸을 채우지 않는다.

`GameVisual`은 기존 아이템/NPC/맵의 직접 IO 이미지 로딩을 유지한다. 몬스터는 보이는 카드에서만 실제 `framebooks`를 확인해 stand→move→fly 포즈를 고른다. 브라우저 문맥에서 metadata 요청3개 동시 제한·중복제거·6시간 성공/5분 실패 캐시를 사용한다. 상세가404이거나 직접 이미지가 실패하면 고정된 `/api/game-media?kind=monster&id=9` 대체 경로를 쓴다. ID·이름·도감 관계는 유지한다.

대체 경로는 현재 공개 카탈로그의 숫자ID만 허용한다. `kind`는 item/monster/npc/map, `animate=1`은 몬스터의 동일 포즈 GIF를 요청한다. `info=1`은 실제 이미지의 ID·크기·원문URL·선택 방법·ETag만 반환한다. 임의 upstream URL이나 다른 호스트를 전달하는 프록시는 제공하지 않는다.

복구 순서:

- 몬스터: 일반 상세의 실제 framebooks, 없으면 `Mob/_Canvas/{7자리 ID}.img`의 실제 포즈 노드 → PNG → 같은 포즈의 원 WZ PNG. 움직임을 요청하면 동일 포즈 GIF를 먼저 시도한다.
- NPC: icon → 실제 NPC 포즈 → 원 WZ 프레임.
- 아이템: icon → 상세 `metaInfo.icon/iconRaw` → 숫자ID에 해당하는 장비 폴더의 WZ icon.
- 맵: minimap → 상세 `miniMap.canvas`.

원 WZ는 파일 노드type1·이미지 노드type12를 확인한다. 빈type0 응답이나 미확인 포즈를 실제 이미지로 취급하지 않는다. 정상 IO PNG/GIF에는 파일 종료 뒤 좌표 JSON이 붙기도 한다. 컨테이너를 파싱해 실제 IEND/GIF trailer까지 검증하고 이미지 바이트만 반환한다. Content-Type과 시그니처·크기·가로세로를 함께 검사하며 HTML/JSON 오류를 이미지로 내보내지 않는다.

한 응답은4MB, 확인은 전체22초·개별 요청7초로 제한한다. 같은 요청 내부 대체 조회의 시작 간격은250ms다. 429의 Retry-After를 따르고 성공 이미지는24시간·실패는5분 캐시한다. Worker의 **완료된 바이트/포즈만 공유**하며 다른 요청의 pending Promise·스트림·타이머를 재사용하지 않는다. 마지막 정상 이미지가 있으면 연결 실패에도 원래 확인 시각을 유지해 재사용한다. 브라우저는 고정 크기 스켈레톤·lazy 로딩을 사용하고, 끝내 확인되지 않은 이미지는 이름과 원본 미확인 설명을 표시한다. 이미지 요청이 영구 대기 상태로 남지 않도록 화면 대기도 제한한다.

실제 확인 예:

- 달팽이2: 일반 상세404여도 WZ stand 존재, 같은ID PNG37×26/GIF 정상.
- 주황버섯9: 정적 render404여도 원 WZ PNG63×58 및 같은 포즈 GIF 정상.
- NPC1=Heena/히나, NPC2=Sera/세라. 이름이 비슷하다는 이유로 ID를 바꾸지 않는다.

검증은 `node --test tests/game-media*.test.mjs`, 루트의 `node scripts/qa-game-media-fallback.mjs`를 사용한다. 실제 표본은 몬스터5·NPC2·아이템5·맵3개이며, 동시 Worker 요청4개·2개 브라우저 탭·390px 모바일·직접 이미지 실패 후 복구·ETag304·허용하지 않은 URL400을 확인한다. 이것을 전체7천여 이미지의 개별 확인 완료로 확대하지 않는다. 원문에도 없는 이미지의 존재나 Wiki 전용 항목의 MCW 이미지를 보장하지 않는다.
