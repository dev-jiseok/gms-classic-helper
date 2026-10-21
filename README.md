# gms-classic-helper

## 메이플 컴패스 앱

실행 가능한 웹 앱은 [`web/`](web/README.md)에 있습니다. 현재 버전은 **0.5.0**이며, 파이터·표도·궁수의 Lv.1 기본 프로필과 전 직업 설정을 제공합니다.

```sh
npm --prefix web ci
npm run dev -- --hostname 127.0.0.1 --port 5187
```

루트의 dev 스크립트는 앱을 실행하고, 기존 REA 명령은 그대로 사용할 수 있습니다. 공개 원천17개 표·퀘스트 진행 단계837개와 시세·육성·사냥·장비 도구를 연결했습니다. [기능 대조표](web/docs/feature-coverage.ko.md)는 글클메지지 기준 구현 범위와 남은 제한을 구분합니다. 분석 보고서는 [사이트 비교](research/site-comparison-2026-10-21.ko.md), [API 조사](research/gg-api-findings-2026-10-21.ko.md)에 있습니다.

앱 검증은 `npm run check`, `npm test`로 실행합니다. 0.5.0 기준 자동 테스트243개가 통과했으며, 공개 데이터 갱신 방법과 출처는 [자료 설명](web/docs/public-data.ko.md)에 있습니다. 임시 원응답·브라우저 프로필·인증 정보는 저장소에 포함하지 않습니다.


웹사이트의 동작을 REA로 분석하고 서비스 구현에 활용하기 위한 작업 공간입니다.

## 설치된 환경

| 구성 | 확인한 버전 / 용도 |
| --- | --- |
| Node.js | 26.5.0 |
| npm | 11.17.0 |
| REA | 6.7.0, 프로젝트 개발 의존성으로 고정 |
| Google Chrome | 전용 프로필과 로컬 CDP 연결로 웹사이트 분석 |
| Codex MCP | `rea` 등록 및 207개 도구 응답 확인 |
| Ghidra / JDK | 12.1.4 / 21.0.13, 추가 네이티브 분석용 |

웹사이트 분석에는 Chrome과 REA를 사용합니다. 현재 페이지의 DOM, 공개 JavaScript,
네트워크 관찰과 화면을 근거로 동작을 분석하며, 서버 내부 코드는 관찰 범위에 포함되지 않습니다.

## 시작하기

```sh
npm ci
npm run rea:browser
```

열린 분석용 Chrome 창에서 대상 사이트를 엽니다. 바로 URL을 전달해도 됩니다.

```sh
npm run rea:browser -- https://example.com
```

실행할 때마다 `.local/chrome-rea-*`에 별도 프로필을 만듭니다. 기존 Chrome의 로그인과
프로필은 사용하지 않습니다. 필요하면 이 분석용 창 안에서 직접 로그인합니다.
출력되는 `endpoint`는 실행별로 달라지며 `.local/rea-browser.json`에도 저장됩니다.
분석이 끝나면 해당 Chrome 창을 닫으면 됩니다.

Chrome이 기본 위치에 없다면 `REA_CHROME_PATH`에 실행 파일의 절대 경로를 지정합니다.

## 웹사이트 분석

브라우저 실행 결과의 endpoint로 탭을 조회하고, 반환된 대상 탭 ID를 사용합니다.
아래 `PORT`, `TARGET_ID`를 실제 값으로 바꿉니다.

```sh
npm run rea -- list-browser-targets http://127.0.0.1:PORT --json

# 페이지 구조와 스크립트 소스를 JSON Evidence로 보관
node scripts/rea.mjs inspect-web-page http://127.0.0.1:PORT TARGET_ID \
  --include-script-sources --include-accessibility-text --json \
  > research/output/page.json

# 페이지의 JavaScript 번들 정적 분석
node scripts/rea.mjs analyze-web-bundle http://127.0.0.1:PORT TARGET_ID --json \
  > research/output/bundle.json

# 10초 동안 사용자가 수행하는 클릭·이동 등의 네트워크 동작 관찰
node scripts/rea.mjs observe-web-session http://127.0.0.1:PORT TARGET_ID \
  --observation-ms 10000 --json > research/output/session.json
```

`about:blank`는 분석 가능한 HTTP(S) 탭이 아니므로 사이트를 연 다음 조회합니다.
수동 동작을 관찰하려면 관찰 명령이 시작된 후 해당 창에서 동작을 수행합니다.
자동 클릭 등은 `capture-browser-scenario`의 선언된 시나리오를 사용합니다.
검증 스크립트와 생성된 `research/output/web-scenario-input.json`이 작동 예제입니다.

`npm run`은 안내 문구도 출력하므로 JSON을 파일로 저장할 때는 위처럼
`node scripts/rea.mjs`를 직접 사용합니다.

## Codex 연결

현재 머신에는 다음 항목을 등록했습니다.

- `~/.codex/config.toml`: 이 프로젝트의 REA MCP 실행 경로 및 Ghidra·JDK 경로
- `~/.codex/config.toml.rea.backup`: REA 등록 전 설정 백업
- `~/.agents/skills/reverse-engineer-anything`: 설치된 REA와 일치하는 공식 작업 지침

**Codex를 재시작하거나 새 세션에서 MCP를 다시 연결해야 새 도구가 표시됩니다.**
실행 중인 기존 세션에서는 CLI를 사용할 수 있습니다.

프로젝트 위치나 Java 경로가 바뀌었거나 다른 머신에서 연결할 때:

```sh
npm run rea:setup:plan
# 출력된 경로와 변경 내용을 확인한 다음 적용
npm run rea:setup
```

이 명령은 사용자 설정과 개인 스킬 디렉터리를 변경합니다. REA 버전을 변경한 뒤에도
변경안을 확인하고 연결과 작업 지침을 갱신합니다.

## 검증

```sh
# 웹 분석: Chrome → 로컬 샘플 → DOM/스크립트/번들 → 클릭/API/스크린샷
npm run rea:web:verify

# 추가 분석 환경: Codex/Ghidra/스킬 진단 → JavaScript → C 디컴파일 → MCP 호출
npm run rea:verify

# 선택된 Codex/Ghidra/스킬 상태만 진단
npm run rea:doctor
```

웹 검증은 로컬 샘플 사이트와 테스트용 headless Chrome을 시작하고, 종료 시 둘 다 닫습니다.
결과는 `research/output/web-verification.json`, 원본 Evidence는 같은 폴더에 저장됩니다.
네이티브 검증은 macOS `xcrun clang`으로 직접 작성한 C 샘플을 컴파일하고 정적으로 분석합니다.
검증은 외부 사이트를 방문하거나 대상 바이너리를 실행하지 않습니다.

진단의 `healthy`는 지정한 범위의 준비 상태입니다. 사용하지 않는 선택적 분석 엔진이
미설치된 경우 전체 환경의 `environment_healthy`는 `false`일 수 있습니다.

## 폴더

| 경로 | 용도 |
| --- | --- |
| `scripts/` | REA 실행, Codex 등록, 분석 브라우저 실행, 환경 검증 |
| `research/fixtures/` | 직접 작성한 웹·JavaScript·C 검증 샘플 |
| `research/targets/` | 로컬 분석 대상 파일 |
| `research/output/` | Evidence JSON, 스크린샷 데이터와 분석 결과 |
| `.local/` | Chrome 프로필과 검증 빌드 파일 |

대상 파일, 분석 결과, 브라우저 프로필은 Git에서 제외합니다.

추가 네이티브 도구를 다른 macOS 머신에도 설치하려면 `brew install ghidra openjdk@21`을
실행합니다. 실행 스크립트가 Homebrew 경로를 자동 탐색하며, 명시한 `GHIDRA_INSTALL_DIR`,
`JAVA_HOME` 환경 변수를 우선 사용합니다. 현재 REA와 검증한 Ghidra 버전은 위 표와 같습니다.

공식 문서: [REA](https://github.com/morluto/rea),
[REA 설치](https://github.com/morluto/rea/blob/main/docs/installation.md),
[Codex MCP](https://developers.openai.com/codex/mcp).
