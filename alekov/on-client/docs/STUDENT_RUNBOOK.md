# 케셰브 — 학생용 실행 설명서 및 시스템 구성도 (21단계)

> 문서 범위: 현재 저장소의 소스·설정 안내를 읽어 작성한 학생 문서. 작성자가 사용자 PC에서 명령을 실행하거나 실제 연결을 검증한 것은 아닙니다. 실행 결과는 **미확인**입니다. 제공 문서는 변경하지 않습니다.

## 1. 목적과 지원 범위

케셰브는 사용자 로그인·기기·세션, 업무 앱 접근 판정, 접속·XDR 보안 기록, AI 설명과 조치 요청 상태, 설치 패키지 취약점 조회 상태를 **표시**하는 로컬 보안 Agent입니다. 화면에 표시된 상태는 제공 서버·연동 시스템이 전달한 범위에서만 해석합니다. AI 설명과 제안 자체는 보안 조치를 실행하지 않습니다.

- 소스에서 확인한 앱 버전: `package.json`의 `0.2.11` (실제 실행 버전 확인은 미확인).
- 지원 운영 환경: Windows PowerShell을 사용하는 학생 실행 도구. Node.js 22~24를 검사하며 수업 기준 버전은 **24.19.0**입니다. **사용자 PC의 설치 버전은 미확인**입니다.
- `package.json`에는 외부 npm 의존성이 없고 `start`, `demo`, `check` 스크립트가 있습니다. 현재 GitHub의 `on-client/package-lock.json`은 확인되지 않았습니다. 설치된 `node_modules`의 상태도 미확인입니다.
- 기본 실행은 로컬 서버만 켭니다. SDP·ALEPH 계정·CLCO AI 연결이 자동으로 확인되는 것은 아닙니다. 운영자가 제공한 별도 설정과 승인이 필요합니다.

## 2. 작업 위치와 파일

Git 저장소: `JoYJ125/alekov` (저장소의 실제 로컬 위치는 PC에서 확인 필요).

```text
<Git 저장소 최상위>/
└── alekov/
    └── on-client/                 ← 앱 실행 위치
        ├── package.json           ← 앱 버전·Node 요구 버전·npm 명령
        ├── tools/start-alekov.ps1  ← Windows 실행 도구
        ├── src/server.mjs          ← 제공 로컬 HTTP 서버
        ├── src/engine.mjs          ← 기존 보안 엔진 연결 경계
        ├── src/ai/service.mjs      ← AI 설명 서비스
        ├── src/vulnerabilities/project-scan.mjs ← 패키지 조회 처리
        ├── public/index.html      ← 제공 브라우저 화면
        ├── public/app.js          ← 제공 UI·요청 처리
        ├── student/extension.mjs   ← 학생 작성 화면 함수
        └── docs/STUDENT_RUNBOOK.md ← 이 학생 문서
```

위 `<Git 저장소 최상위>`는 실제 경로가 아닌 자리표시자입니다. 파일 탐색기에서 `alekov/on-client` 폴더를 찾고, 주소 표시줄에 `powershell`을 입력해 **그 폴더에서** 새 PowerShell 창을 엽니다. VS Code에서는 해당 폴더를 연 뒤 통합 터미널의 현재 위치를 확인합니다.

## 3. 설치·실행·종료·재실행

아래 명령은 **제공 스크립트·package.json에 존재함을 소스로 확인**했습니다. 학생 PC에서 실제 실행 성공 여부는 **미확인**입니다.

1. 새 PowerShell 창에서 현재 폴더를 확인합니다.
   ```powershell
   Get-Location
   Test-Path .\package.json
   Test-Path .\tools\start-alekov.ps1
   node --version
   ```
   두 `Test-Path` 결과가 `True`인지 확인합니다. `node --version`의 실제 출력값은 아직 미확인입니다.
2. `on-client` 폴더에서 제공 실행 도구를 시작합니다.
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
   ```
   이 명령은 전역 실행 정책을 변경하지 않습니다. 스크립트는 앱 폴더, Node 버전, 포트 사용 여부를 검사한 후 서버 응답을 확인합니다. `npm start`도 `node src/server.mjs`을 실행하지만 동일한 사전 점검을 제공하지 않습니다.
3. **예상 시작 신호**(사용자 PC에서 관측한 결과 아님):
   ```text
   케셰브가 켜졌습니다. 브라우저에서 http://127.0.0.1:5189/ 을 여세요.
   서버가 응답한 것만 확인했습니다. AI 연결 상태는 화면에서 따로 확인해 주세요.
   ```
4. 브라우저에서 `http://127.0.0.1:5189/`을 열어 `보호 현황` 화면과 상태 표시를 확인합니다. 주소는 **자신의 PC에서만 사용하는 loopback 주소**입니다. 페이지가 보이더라도 SDP·AI 연결 성공은 아닙니다.
5. 종료는 서버를 실행한 PowerShell 창에서 `Ctrl+C`입니다. 다시 실행할 때는 **같은 `on-client` 폴더**에서 2번 명령을 다시 실행합니다. 종료·재실행의 실제 관측은 미확인입니다.

포트 5189가 사용 중이라면 기존 프로그램을 종료하지 말고, 동일 폴더에서 제공된 `-Port 5190` 옵션으로 실행하고 브라우저에서도 `http://127.0.0.1:5190/`을 사용합니다. 해당 옵션은 코드에서 확인했으며 실제 실행은 미확인입니다.

문법 확인만 필요한 경우 `npm run check`는 `node --check student/extension.mjs`를 실행합니다. 이 검사는 앱 기능·연동 성공을 확인하지 않습니다. `npm run demo`는 예제 데이터이며 실제 사용자 정보나 실제 연결이 아닙니다.

## 4. 시스템 구성도 (글로 작성)

```text
[브라우저 — http://127.0.0.1:5189/]
    제공 화면: public/index.html, public/app.js
    학생 표시: student/extension.mjs
                    │ 로컬 HTTP /api/*
                    ▼
[케셰브 로컬 앱 서버 — src/server.mjs]
          ├── [접근 제어·XDR 연동 경계]
          │     src/engine.mjs
          │     src/engine/sdp-host.mjs
          │     └─ 운영자 SDP 설정이 있어야 실제 원천 조회 가능
          │        실제 원천 주소·연결 성공: 미확인
          │
          ├── [AI 게이트웨이(CLCO) 연동 경계]
          │     src/ai/service.mjs
          │     src/connection/manager.mjs
          │     └─ 계정 연결·AI 앱 승인·권한 검증 필요
          │        실제 게이트웨이 주소·모델 응답: 미확인
          │
          └── [공개 패키지 OSV 조회]
                src/vulnerabilities/project-scan.mjs
                └─ 운영자 허용 대상 및 확인 가능한 설치 버전 필요
                   실제 조회 결과: 미확인
```

브라우저는 `public/app.js`에서 `student/extension.mjs`의 표시 함수를 사용합니다. 로컬 서버는 `/api/me`, `/api/apps`, `/api/events`, `/api/devices`, `/api/sessions`, `/api/ai/explain` 등 제공 API를 처리합니다. 실제 접속 판정·보안 기록은 SDP 연동 경계에서, AI 설명은 별도의 계정·AI 권한 경계에서 확인되어야 합니다. **로컬 서버 시작은 이 두 연동의 성공을 증명하지 않습니다.**

## 5. 제공 코드와 학생 작성 코드의 경계

| 구분 | 파일·함수 | 역할 |
|---|---|---|
| 제공 | `src/server.mjs`, `src/engine.mjs`, `src/ai/service.mjs` | 로컬 API·연동·AI 서비스 처리 |
| 제공 | `src/vulnerabilities/project-scan.mjs` | 설치 패키지 및 공개 취약점 조회 처리 |
| 제공 | `public/index.html`, `public/app.js` | 화면·사용자 조작·요청 흐름 |
| 제공 | `tools/start-alekov.ps1` | 앱 시작·Node/포트 확인 |
| 학생 | `student/extension.mjs`의 `renderIdentity` | 로그인·기기·세션 상태를 확인 불가와 구분해 표시 |
| 학생 | `renderDecision` | 업무 앱 접근 판정·사유·시각 표시 |
| 학생 | `renderEvents` | 접속·XDR 기록과 사건별 근거·상태 표시 |
| 학생 | `renderAiConnection` | AI 연결 점검·권한·모델 수 및 오류 표시 |
| 학생 | `renderExplanation` | 선택 사건의 AI 요약·근거·규칙·확인 불가 상태 표시 |
| 학생 | `renderAction` | 조치 준비·접수(ACK)·관측된 효과를 구분해 표시 |
| 학생 | `renderVulnerabilities` | 정확한 설치 버전·OSV 조회 상태·부분 실패·취약점 ID 표시 |

학생 표시 함수는 입력된 데이터를 보여 주며 인증 티켓을 만들거나 조치를 직접 실행하지 않습니다. 제공 파일·판정 코드·인증 설정은 학생 작성 범위에 포함되지 않습니다.

## 6. 오류와 확인·복구 순서

| 증상·코드 | 뜻 | 확인·복구 순서 |
|---|---|---|
| `Node.js 가 없습니다`, `지금 Node.js 는 vXX 입니다` | Node 없음·버전 불일치 | `node --version` 확인 → 지원 버전(22~24, 기준 24.19.0) 확인 → 새 PowerShell 창에서 다시 실행 |
| `포트 5189 를 다른 프로그램이 쓰고 있습니다` | 포트 충돌 | 다른 프로그램은 유지 → `-Port 5190`으로 실행 → 브라우저 포트 일치 확인 |
| `앱 폴더가 아닙니다`, `시작 틀 폴더가 아닙니다` | 잘못된 작업 위치 | `Get-Location`과 `Test-Path` 확인 → 실제 `on-client` 폴더에서 실행 |
| `ENGINE_NOT_CONNECTED`, 연결 없음 | SDP·기존 서버 연결이 없음 | 로컬 앱 시작과 SDP 연결을 구분 → 담당자에게 개인 설정·연동 상태 확인 요청 |
| `CONTRACT_MISMATCH`, 확인 불가 | 서버 응답 계약 검증 실패 | 정상·안전으로 간주하지 않음 → `보호 현황`의 `도움정보 불러오기`로 비밀 없는 진단 확인 |
| `ALEKOV_CONNECT_NOT_MOUNTED`, `ALEKOV_CONNECT_UNAVAILABLE` | AI 계정 연결 경로 없음 | 담당자가 제공하는 native 설정 확인. 설정 파일 직접 작성·복사 금지 |
| `ON_AI_PROVISIONING_PENDING` | AI 권한 준비 중 | 연결 완료로 판단하지 않음 → 담당자에게 계정·앱 권한 준비 여부 확인 |
| `ALEKOV_CONNECT_NETWORK` | 연결 요청 실패 | 앱 실행 창과 네트워크 확인 → 필요하면 화면에서 직접 상태 재확인 |
| AI 설명 실패 | 설명 조회 실패·근거 미확인 | 기존 보안 기록을 유지 → 사건·근거·권한 상태 확인. 유료 AI 요청 반복 금지 |
| 조치 `pending`, `unknown` | 접수 또는 결과 불명 | ACK를 효과로 보지 않음 → 제공 화면의 연동 시스템 결과 재조회 기능으로 상태 확인. 실제 집행 시험 금지 |
| OSV `not_configured`, `not_checked` | 조회 대상 미설정·미조회 | 취약점 없음으로 판단하지 않음 → 운영자에게 승인된 공개 조회 대상 설정 확인 |
| OSV `partial`, `unverifiable` | 일부 실패·lock 검증 불가 | 확인된 ID만 보존 → lock 정보·조회 오류 확인. 패키지 버전 임의 변경 금지 |

추가 코드별 조치는 제공 `docs/CONNECTION_TROUBLESHOOT.md`, `docs/AI_SETUP_GUIDE.md`, `docs/SDP_HOST_CONNECTION.md`를 참고합니다. 설정 파일·비밀키·토큰·비밀번호를 문서나 Git에 기록하지 않습니다.

## 7. 확인 결과와 기다림(UNV)

| 항목 | 현재 증거 |
|---|---|
| 소스의 실행 명령·지원 Node 버전·기본 주소 | **코드 확인**: `package.json`, `tools/start-alekov.ps1` |
| 로컬 API와 학생 화면의 파일 경계 | **코드 확인**: `src/server.mjs`, `public/app.js`, `student/extension.mjs` |
| 새 PowerShell에서 앱 실행·종료·재실행 | **미확인**: 학생 PC에서 직접 실행 필요 |
| 실제 Node.js 설치 버전 | **미확인**: `node --version` 출력 확인 필요 |
| 실제 SDP 로그인·업무 앱 판정·XDR 기록 | **기다림(UNV)**: 개인 연결·원천 확인 필요 |
| 실제 ALEPH 계정 연결·AI 앱 승인·모델 호출 | **기다림(UNV)**: 담당자 설정·실제 계정 확인 필요 |
| 실제 AI 사건 설명·근거 일치 | **기다림(UNV)**: 유료 호출 반복하지 않음 |
| 실제 조치 집행·효과 재조회 | **기다림(UNV)**: 현재 연결 미준비, 임의 실행 금지 |
| 실제 OSV 조회·정확한 설치 버전 대조 | **미확인**: 공개 대상 허용 설정 및 설치 메타데이터 확인 필요 |
| 공식 21단계 판정·진도 기록 | **미확인**: 제출하지 않음 |

## 8. 21단계 제출 전 확인 사항 (제출 실행하지 않음)

21단계는 현재 워크벤치의 13~20단계용 `포털 제출 준비` 대상이 아닙니다. **최신 과제 화면**에서 저장소 주소와 제출할 **40자리 커밋**을 직접 입력합니다. 커밋 전 `git status`와 `git diff`로 기존 작업을 확인하고, 학생 문서 및 이번 단계의 변경만 같은 커밋에 포함합니다. 비공개 저장소를 공개로 전환하지 않습니다.

비공개 원문이 필요하면 해당 단계 화면의 `비공개 저장소 원문 준비 방법`을 펼쳐 `원문 전달 도구 받기`로 받은 ZIP을 **프로젝트 밖**에 풉니다. 별도의 프로젝트 밖 JSON 출력 폴더를 만듭니다. Git 최상위 폴더에서 과제 화면에 표시된 `student-source-cli.mjs` 명령을 **본인 PC의 실제 도구·출력 경로와 40자리 커밋**으로 수정해 실행합니다. 도구 명령의 정확한 인수와 로컬 경로는 현재 미확인이라 여기에 추측해 적지 않습니다. 생성 JSON은 같은 단계의 `비공개 저장소 원문 묶음`에서 선택합니다. 원문 전달 완료는 AI 검토 통과와 다르며, 제출과 공식 판정은 아직 수행하지 않았습니다.

## 9. 직접 확인 순서

**첫 번째 확인만 진행:** 기존 작업을 보존한 채 `on-client`에서 새 PowerShell 창을 열고 3장의 `Get-Location`, `Test-Path`, `node --version`을 실행합니다. 실제 출력으로 경로와 환경을 확인한 뒤에만 실행 도구 명령을 진행합니다. 아직 확인하지 않은 단계는 미확인으로 유지합니다.


## 로컬 PC 관제 대시보드 (추가 작업 브랜치)
- 기존 실행: `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1`, 접속 `http://127.0.0.1:5189/`.
- 보호 현황 상단에 CPU 사용률(%), 시스템 메모리 사용량(GB), 프로젝트 볼륨 디스크 여유 공간(GB), 보안 연결 상태 네 카드를 표시합니다.
- `GET /api/pc-status`는 로컬 OS만 읽습니다. 관리자 권한이나 외부 서비스, 설치 패키지를 요구하지 않습니다. 측정 시각은 ISO 8601로 반환합니다.
- CPU는 약 350ms 동안의 논리 프로세서 사용 시간 변화율, 메모리는 시스템 전체 (total - free), 디스크는 프로젝트가 있는 볼륨의 statfs 가용 공간입니다. 소수점 반올림을 적용합니다.
- 새로 측정 버튼을 누르면 이전 실제 측정값과 CPU 추이를 비교합니다. 추이는 현재 브라우저 세션 메모리에만 남으며 재시작하면 사라집니다.
- 측정 실패는 확인 불가와 실패 이유를 표시합니다. 예시 수치는 표시하지 않습니다. 보안 서버 연결은 PC 측정과 별도로 확인합니다.
- 재현: 서버 실행 → 보호 현황 → 4개 카드 및 시각 확인 → 새로 측정 2회 → 추이/기록 확인 → 보안 연결 상태가 실제로 연결되었는지 별도 확인.
- 이 문서와 브랜치의 변경은 PC에서 실행 검증되지 않았습니다. 실제 테스트는 사용자가 로컬에서 수행해야 합니다.


## Windows 상태 진단 (읽기 전용 추가)
- 실행: `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1` → `http://127.0.0.1:5189/` → 보호 현황의 **Windows 상태 조회**.
- `GET /api/windows-status`는 일반 권한에서 OS 네트워크 인터페이스 및 DNS 서버, `Get-NetFirewallProfile`의 프로필별 활성 여부, `Get-WinEvent`의 최근 24시간 System·Application 경고(Level 3)·오류(Level 2) 건수를 읽습니다. 방화벽·보안 설정 변경 명령은 실행하지 않습니다.
- 각 항목은 실제 조회 시각과 단위(개/건)를 표시하며, 실패·권한 부족 시 **확인 불가** 및 이유를 표시합니다. 예시 수치는 사용하지 않습니다.
- **이벤트 경고·오류 건수는 침해·공격 탐지 건수가 아닙니다.** 로그 권한 또는 수집 실패는 0건으로 간주하지 않습니다.
- SDP 서버 연결은 별도 확인 항목입니다. 실제 SDP 연결 검증이 없으면 **SDP 미연결**로 표시합니다. 로컬 Windows 조회 성공은 SDP 연결 성공을 뜻하지 않습니다.
- 검증 순서: Windows 상태 조회 → 네트워크/방화벽/이벤트 시각과 실패 이유 확인 → SDP 미연결 표시 확인 → Windows 이벤트 통계 안내문 확인 → 기존 CPU/메모리/디스크 기능 확인.
- 관리자 권한 요청, 방화벽 변경, 공격 시뮬레이션, 포장 명령을 수행하지 않습니다. Windows 로컬 실행 검증은 사용자 PC에서 별도 확인이 필요합니다.
