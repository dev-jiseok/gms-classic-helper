# 공략 정확성 재검토 · 2026-10-21

대상은 앱의 공략23개(1차4계열·2차10직업·시작/판단 안내5개·출시 공지4개), 스킬 계획, 돈퀘스트·사냥·장비 추천의 근거입니다. 전체 목록과 대조 URL은 [검토 목록](guide-accuracy-review-2026-10-21.json)에 있습니다. 원문과의 사실 대조를 수행했으며 실제 게임 플레이에서 최적 효율을 검증한 결과는 아닙니다.

| 발견한 문제·차이 | 처리 |
| --- | --- |
| 공략이 일반적인 “측정·확인하세요” 안내에 치우치고, 사실과 작성자의 판단이 구분되지 않음 | 모든 공략에 근거·적용 상황·대조일·확인 범위 표시. 각 단계도 사실 참조/공식 조건/판단 방법으로 구분 |
| Wiki의 오래된 설명과 최신 공략이 충돌 | 충돌을 숨기지 않고 출처 양쪽을 표시. 읽은 날짜를 해당 서버 버전의 실검증 날짜로 취급하지 않음 |
| SP 차수 규칙: Wiki는 하위 사용 가능, NiaMeowDB는 차수별 분리 | 기본 계획·공유 빌드는 차수별 분리. 하위 사용은 실제 게임에서 확인한 사용자의 명시적 선택으로만 허용. 공식 출시 공지에서 세부 SP 규칙은 확인하지 못함 |
| 기본 SP 초안이 검증된 공략처럼 받아들여질 수 있음 | 사용자 우선순위 초안과 출처 공략 예시 버튼을 분리. 전사·도적(표창)·궁수1차, 파이터·어쌔신·헌터2차 예시를 스킬 ID·최대치·선행·각 레벨 SP에 대조 |
| 전사 HP 증가를 옛 메이플의 누적 HP 방식과 혼동할 위험 | 현재 커뮤니티 설명의 비율 증가 방식과 “늦게 투자하면 영구 손해”를 구분. 수치/투자 순서는 출처 예시로 표시 |
| 궁수는 더블 샷·표도는 크리티컬 우선 등 과거 관행이 자동 최적처럼 보일 위험 | 현재 예시의 애로우 블로우·넉백 대안, 어쌔신 마스터리/부스터 선행, 헌터 광역 우선 대안을 명시 |
| 30+ 안내가 원문 확인 범위70을 넘어100까지 적용됨 | 직업 공략 범위를30–70으로 제한.70 이후 자동 배분을 만들지 않음. 파이터의 마지막 여유1SP도 임의 배분하지 않음 |
| 테스트 서버·미래 지역을 출시일 추천으로 읽을 위험 | 공식 공지의 Forgotten Hollow 출시일 미개방·11월 추가 예정을 시작 공략에 명시. 앱의 참조 도감 존재가 현재 개방을 뜻하지 않음 |
| 돈퀘·드롭 시세 추천이 확정 수익으로 읽힐 위험 | 재료 소모·조건·시간·가격 누락은 미확인 유지. 표본 드롭과 실제 서버 확률, 호가와 판매 관찰, 미판매 전리품과 지갑 수익을 구분 |
| EXP50 이후 | NiaMeowDB는1–99 표와 공식을 제공하지만 Wiki 원천은49 이후 미확인을 명시. 이번에는 자동 기록 계산에 새 추정치를 넣지 않고 기존1–49 범위와 직접 입력을 유지 |

공식 사실은 [Nexon 정식 출시 공지](https://www.nexon.com/maplestory/news/general/46506/grand-launch-release-notes)와 공개 CMS `https://g.nexonstatic.com/maplestory/cms/v1/news/46506`의 실제 본문으로 다시 확인했습니다. 웹 리더에서 원문 접근이 실패해도 공개 CMS는 정상 JSON을 반환했습니다. 본문 해시와 길이는 로컬 `research/output/official-guide-review-evidence.json`에 남겼습니다. 전직10/30, 상한100, 거래15달성 후24시간, 잎사귀30개/계정 일일, 파퀘CH3–12, 주택 조건을 대조했습니다.

직업별 배분은 [NiaMeowDB 공략 목록](https://meowdb.com/msclassic/ko/guides)의 각 직업 원문을 읽고, 특히 [전사](https://meowdb.com/msclassic/ko/guides/warrior-class-guide), [도적](https://meowdb.com/msclassic/ko/guides/thief-class-guide), [궁수](https://meowdb.com/msclassic/ko/guides/bowman-class-guide), [파이터](https://meowdb.com/msclassic/ko/guides/fighter-class-guide), [어쌔신](https://meowdb.com/msclassic/ko/guides/assassin-class-guide), [헌터](https://meowdb.com/msclassic/ko/guides/hunter-class-guide)의 숫자 배분 예시를 계획기에 연결했습니다. 이것은 커뮤니티 작성자의 선택이며 전 직업·모든 장비에서 최적이라고 주장하지 않습니다.

충돌 원문은 [Wiki SP 규칙](https://mapleclassic.wiki/wiki/Skill_points), [Wiki EXP 원천](https://mapleclassic.wiki/wiki/Module:ExperienceCurve), [NiaMeowDB EXP 표](https://meowdb.com/msclassic/ko/guides/exp-table-level-1-to-100)에 있습니다. Wiki의 일부 페이지는 여전히 pre-launch/0.9.0 표시를 사용합니다. 확인되지 않은50+ EXP·차수 간 SP·공략의 실제 효율을 완료된 실게임 검증으로 표현하지 않습니다.
