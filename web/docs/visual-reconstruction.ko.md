# 글클메지지 화면 구조 재현 · 0.4.0

2026-10-21. 사용자의 기준은 글클메지지의 화면·이미지·사용 흐름을 재현하고 그 위에 개인 효율 도구를 추가하는 것입니다. 기존의 녹색 사이드바 대시보드에서 가로 메뉴와 게임 창 형태로 재구성했습니다.

## 재현한 공개 구조

- 상단 가로 6개 분류, 펼침 메뉴, 기능 검색과 캐릭터 선택
- 마을 배경의 홈, 오른쪽 출시 안내판, 이미지 기능 카드 6개와 바로가기
- 아이콘 시세표와 선택 아이템 상세·7/30일 가격 이력의 데스크톱 2단 구성
- 몬스터·NPC·아이템·맵 이미지, 퀘스트의 재료·보상과 연결된 상세
- 이미지 공략 카드, 목재 외곽선·크림 패널·오렌지/청색 게임 버튼·공식 메이플스토리 글꼴
- 하단 캐릭터 레벨·EXP·메소 표시, 모바일 전체 메뉴와 5개 하단 탭
- `/market`, `/codex`, `/moneyQuests` 등 기능별 주소. 기존 `/#market` 공유 주소도 유지

39개 기존 기능의 진입점과 개인 계정 저장·직업별 진행도·추천 엔진을 유지합니다. 추가한 사냥·장비·돈퀘 추천은 관련 메뉴와 홈의 다음 모험에서 연결합니다. 가격은 관찰 시각과 단가를 표시하며 원본과 같은 모양을 만들기 위해 존재하지 않는 변동률·거래·호가·사용자를 채우지 않습니다.

## 분석 근거와 한계

관찰 대상은 [글클메지지](https://xn--bj0bv7uo4la196f.com/)의 공개 홈·메뉴·도감·공략·시세 화면입니다. 앞선 성공한 REA DOM/접근성 자료와 공개 정적 스타일의 배치·치수·색상 사실을 대조해 코드를 새로 작성했습니다. 이번 재확인 중 일부 새 브라우저 요청은403이어서 성공한 기존 Evidence를 함께 사용했습니다. 원본 CSS·HTML·스크립트를 앱으로 복사하지 않았습니다.

이것은 공개 화면의 재구성입니다. 원본 서버 코드·회원·게시물·비공개 API 데이터베이스를 이전한 결과가 아니며 원본 로그인 이후의 전체 동작 일치도는 미검증입니다. 원본의 고유 삽화도 재배포하지 않습니다. 게임 데이터·자체 계정과 공개 공급원은 별도로 연결합니다. 기능별 실제 범위는 [기능 대조표](feature-coverage.ko.md)에 있습니다.

## 이미지와 글꼴

게임 이미지는 MCW/1 공개 리소스의 실제 아이템·NPC·몬스터 포즈·맵 미니맵을 사용합니다. 몬스터는 실제 메타데이터에 있는 포즈만 선택하고 오류 시 이름으로 대체합니다. 보이는 항목만 이미지를 읽고, 몬스터 메타데이터는 중복을 합쳐 최대3개씩 요청합니다. API 색인에 존재해도 개별 이미지가 없을 수 있습니다.

홈 배경 파일은 [`public/art/classic-village-hero.png`](../public/art/classic-village-hero.png)입니다. 기본 내장 `image_gen` 도구로 생성한 별도 삽화이며 실제 게임 맵 이미지로 표시하지 않습니다. 결과2172×724 PNG를 프로젝트에 복사했습니다. 생성 프롬프트:

> Use case: illustration-story. Asset type: panoramic illustrated background for a nostalgic Korean classic MMORPG community website homepage. Create a polished original wide 3:1 illustration, 2304x768 if possible. A lush enchanting beginner village nestled in huge leafy trees, cheerful orange and yellow mushroom-roof cottages with wooden doors, grassy floating cliffs, a small cascading waterfall, a rope footbridge, soft distant hills, blue sky and warm sunlight, a few fluttering autumn maple leaves. Charming richly painted 2D fantasy game environment, crisp hand-painted details, cozy and adventurous. The village spans the whole image; left-center has quieter sky/foliage space to support overlaid UI heading, buildings clustered lower center/right, bridge and waterfall to far right. Bright greens, golden wood, warm oranges, cool blue atmospheric depth. No characters, no text, no lettering, no logos, no UI, no watermark. This is a standalone original background illustration, not a screenshot or a mockup.

글꼴은 [넥슨 공식 메이플스토리 서체](https://maplestory.nexon.com/Media/Font) 원형 TTF입니다. 이용조건·원본 출처·해시는 `public/fonts/`에 함께 보존했습니다. 게임 이미지와 글꼴 권리는 NEXON에 있습니다.

## 검증

계산·조건·미디어·URL 단위테스트, TypeScript, 배포 빌드를 확인합니다. 실제 Chrome에서 전체 메뉴·뒤로/앞으로·직접 주소 새로고침·기존 hash·모바일·프로필 전환·검색·체크리스트·시세 상세·60초 갱신을 확인합니다. 브라우저 QA의 개인 상태는 메모리 fixture로 분리하고 외부 읽기 응답과 실제 이미지 여부를 별도로 기록합니다. 결과와 스크린샷은 로컬 `research/output/`에 보관합니다.
