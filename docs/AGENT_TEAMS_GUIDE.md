# Claude Code 에이전트 팀 가이드

> 에이전트 팀을 구성하고 운영하기 위한 참고 가이드.
> 출처: [Claude Code 공식 문서](https://code.claude.com/docs/ko/agent-teams) + [Subagent 문서](https://code.claude.com/docs/ko/sub-agents)

---

## 목차

1. [에이전트 팀이란?](#1-에이전트-팀이란)
2. [사전 준비](#2-사전-준비)
3. [팀 시작하기](#3-팀-시작하기)
4. [팀원 정의 파일 작성](#4-팀원-정의-파일-작성)
5. [팀 운영](#5-팀-운영)
6. [작업(Task) 관리](#6-작업task-관리)
7. [프롬프트 예시 모음](#7-프롬프트-예시-모음)
8. [모범 사례](#8-모범-사례)
9. [문제 해결](#9-문제-해결)
10. [제한 사항](#10-제한-사항)

---

## 1. 에이전트 팀이란?

여러 Claude Code 인스턴스가 **공유 작업 목록**과 **메시징 시스템**을 통해 함께 작동하는 구조.

- **팀 리더**: 팀을 만들고, 팀원을 생성하며, 작업을 조율하는 메인 세션
- **팀원**: 각각 자신의 컨텍스트 윈도우에서 독립적으로 작동하는 별도 Claude Code 인스턴스
- **작업 목록**: 팀원들이 요청하고 완료하는 공유 작업 항목
- **메일박스**: 에이전트 간 직접 통신을 위한 메시징 시스템

### Subagent와의 차이

| 항목 | Subagent | 에이전트 팀 |
|------|----------|-----------|
| **컨텍스트** | 자신의 윈도우, 결과를 호출자에게 반환 | 자신의 윈도우, 완전히 독립적 |
| **통신** | 메인 에이전트에게만 보고 | 팀원끼리 직접 메시지 교환 |
| **조율** | 메인 에이전트가 모든 작업 관리 | 공유 작업 목록으로 자체 조율 |
| **최적 용도** | 결과만 중요한 집중 작업 | 논의·협업이 필요한 복잡한 작업 |
| **토큰 비용** | 낮음 (결과가 요약됨) | 높음 (각 팀원이 별도 인스턴스) |

### 언제 사용하는가?

- **연구 및 검토**: 여러 팀원이 문제의 다양한 측면을 동시 조사
- **새 모듈/기능**: 팀원들이 각각 별도 부분을 담당
- **경쟁 가설로 디버깅**: 다양한 이론을 병렬 테스트
- **교차 계층 조율**: 프론트엔드·백엔드·테스트를 각 팀원이 담당

### 사용하지 않는 경우

- 순차적 작업 (앞 작업 결과가 다음 작업의 입력)
- 동일 파일을 여러 팀원이 편집해야 하는 경우
- 단순하고 빠른 작업 (단일 세션이 더 효율적)

---

## 2. 사전 준비

### 2.1 버전 확인

```bash
claude --version
# v2.1.32 이상 필요
```

### 2.2 환경변수 설정

`~/.claude/settings.json`에 추가:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### 2.3 권한 모드

팀 작업 시 매번 승인하기 번거로우면:

```bash
claude --dangerously-skip-permissions
```

> 주의: 리더가 이 모드로 실행하면 모든 팀원도 동일 권한을 갖는다.

### 2.4 표시 모드 설정 (선택)

`~/.claude.json`에서 설정:

```json
{
  "teammateMode": "in-process"
}
```

| 모드 | 설명 | 요구사항 |
|------|------|---------|
| `in-process` | 메인 터미널에서 모든 팀원 실행. Shift+Down으로 순환 | 없음 (기본) |
| `tmux` | 각 팀원이 분할 창에서 실행. 모든 출력을 한눈에 볼 수 있음 | tmux 또는 iTerm2 |
| `auto` | tmux 세션이면 분할, 아니면 in-process | 기본값 |

---

## 3. 팀 시작하기

### 3.1 자연어로 팀 생성

Claude에게 에이전트 팀을 만들도록 요청하고, 원하는 작업과 팀 구조를 설명한다.

```
3명의 에이전트 팀을 만들어줘:
- 백엔드 담당: Express API 구현
- 프론트엔드 담당: Next.js 화면 구현
- 테스트 담당: 코드 검증 및 품질 확인

backend/src/routes/expenses.ts와 src/app/expense/page.tsx를 병렬로 작업해줘.
```

### 3.2 기존 subagent 유형을 팀원으로 사용

`.claude/agents/`에 정의된 subagent를 팀원으로 참조할 수 있다:

```
agent-backend 에이전트 유형을 사용해서 팀원을 생성해줘.
인증 모듈을 감사하도록 해줘.
```

### 3.3 모델 지정

```
4명의 팀원을 만들어서 이 모듈들을 병렬로 리팩터링해줘.
각 팀원은 Sonnet을 사용해.
```

---

## 4. 팀원 정의 파일 작성

`.claude/agents/` 폴더에 마크다운 파일로 정의한다. YAML frontmatter로 설정, 본문이 시스템 프롬프트가 된다.

### 4.1 기본 구조

```markdown
---
name: agent-name
description: 이 에이전트의 역할 설명 (Claude가 위임 시기 판단에 사용)
tools: Read, Grep, Glob, Bash, Edit, Write
model: sonnet
---

시스템 프롬프트 내용 (에이전트의 행동 지침)
```

### 4.2 지원 frontmatter 필드

| 필드 | 필수 | 설명 |
|------|------|------|
| `name` | O | 소문자·하이픈 고유 식별자 |
| `description` | O | Claude가 위임 시기 판단에 사용하는 설명 |
| `tools` | X | 사용 가능한 도구 목록. 생략 시 모든 도구 상속 |
| `disallowedTools` | X | 거부할 도구 목록 |
| `model` | X | `sonnet`, `opus`, `haiku`, `inherit` 또는 전체 모델 ID |
| `permissionMode` | X | `default`, `acceptEdits`, `auto`, `bypassPermissions`, `plan` |
| `maxTurns` | X | 최대 에이전트 턴 수 |
| `skills` | X | 시작 시 컨텍스트에 로드할 스킬 목록 |
| `mcpServers` | X | 이 에이전트에서 사용할 MCP 서버 |
| `hooks` | X | 라이프사이클 훅 정의 |
| `memory` | X | 지속적 메모리 범위: `user`, `project`, `local` |
| `background` | X | `true`이면 항상 백그라운드에서 실행 |
| `effort` | X | 노력 수준: `low`, `medium`, `high`, `max` |
| `isolation` | X | `worktree`이면 임시 git worktree에서 실행 |
| `color` | X | 표시 색상: `red`, `blue`, `green`, `yellow` 등 |
| `initialPrompt` | X | 주 세션 에이전트로 실행 시 자동 제출 프롬프트 |

### 4.3 도구(tools) 목록

자주 사용하는 도구 조합:

```yaml
# 읽기 전용 (코드 리뷰, 탐색)
tools: Read, Grep, Glob, Bash

# 구현 (코드 작성 포함)
tools: Read, Edit, Write, Bash, Grep, Glob

# 전체 (subagent 생성 포함)
tools: Read, Edit, Write, Bash, Grep, Glob, Agent

# 특정 subagent만 생성 허용
tools: Agent(worker, researcher), Read, Bash
```

### 4.4 MCP 서버 연동

```yaml
---
name: browser-tester
description: Playwright로 브라우저 테스트
mcpServers:
  - playwright:
      type: stdio
      command: npx
      args: ["-y", "@playwright/mcp@latest"]
  - github
---
```

### 4.5 훅(hooks) 정의

```yaml
---
name: safe-coder
description: 안전한 코드 작성 에이전트
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
---
```

### 4.6 지속적 메모리

```yaml
---
name: code-reviewer
description: 코드 리뷰 전문가
memory: project
---
```

| 범위 | 저장 위치 | 용도 |
|------|----------|------|
| `user` | `~/.claude/agent-memory/<name>/` | 모든 프로젝트 공유 |
| `project` | `.claude/agent-memory/<name>/` | 프로젝트별, 버전관리 가능 |
| `local` | `.claude/agent-memory-local/<name>/` | 프로젝트별, 버전관리 제외 |

### 4.7 에이전트 정의 범위 (우선순위)

| 위치 | 범위 | 우선순위 |
|------|------|---------|
| 관리되는 설정 | 조직 전체 | 1 (최고) |
| `--agents` CLI 플래그 | 현재 세션 | 2 |
| `.claude/agents/` | 현재 프로젝트 | 3 |
| `~/.claude/agents/` | 모든 프로젝트 | 4 |
| 플러그인 agents/ | 플러그인 범위 | 5 (최저) |

### 4.8 CLI에서 임시 에이전트 정의

```bash
claude --agents '{
  "code-reviewer": {
    "description": "코드 리뷰 전문가",
    "prompt": "코드 품질, 보안, 모범 사례에 집중하여 리뷰한다.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  },
  "debugger": {
    "description": "디버깅 전문가",
    "prompt": "오류를 분석하고 근본 원인을 찾아 수정한다."
  }
}'
```

---

## 5. 팀 운영

### 5.1 팀원과 직접 대화

**In-process 모드:**
- `Shift+Down`: 팀원 순환
- `Enter`: 팀원 세션 보기
- `Escape`: 현재 턴 중단
- `Ctrl+T`: 작업 목록 토글

**분할 창 모드:**
- 팀원의 창을 클릭하여 직접 상호작용

### 5.2 계획 승인 요구

복잡하거나 위험한 작업은 팀원이 구현 전에 계획을 제출하도록 할 수 있다:

```
architect 팀원을 생성해서 인증 모듈을 리팩터링해줘.
변경 전에 계획 승인을 요구해.
```

리더가 계획을 검토하고 승인하거나 피드백과 함께 거부한다.

### 5.3 팀원 종료

```
researcher 팀원을 종료해줘.
```

### 5.4 팀 정리

모든 작업 완료 후:

```
팀을 정리해줘.
```

> 반드시 리더를 통해 정리한다. 팀원이 정리하면 리소스가 일관성 없는 상태로 남을 수 있다.

### 5.5 Hooks로 품질 게이트 적용

| Hook 이벤트 | 실행 시점 | 종료 코드 2의 효과 |
|-------------|----------|-----------------|
| `TeammateIdle` | 팀원이 유휴 상태가 되려 할 때 | 피드백 보내고 계속 작동 |
| `TaskCreated` | 작업 생성 시 | 생성 방지 |
| `TaskCompleted` | 작업 완료 표시 시 | 완료 방지 |

---

## 6. 작업(Task) 관리

### 6.1 공유 작업 목록

작업 상태: **대기 중** → **진행 중** → **완료됨**

작업은 다른 작업에 종속될 수 있다. 종속 작업이 완료되면 차단된 작업이 자동 해제된다.

### 6.2 할당 방식

- **리더 할당**: 리더에게 어느 작업을 어느 팀원에게 줄지 지시
- **자체 요청**: 팀원이 작업을 마치면 다음 미할당·미차단 작업을 자동 선택

### 6.3 저장 위치

- 팀 구성: `~/.claude/teams/{team-name}/config.json`
- 작업 목록: `~/.claude/tasks/{team-name}/`

> 이 파일들은 런타임 상태를 보유하므로 수동 편집하지 않는다.

---

## 7. 프롬프트 예시 모음

### 7.1 병렬 코드 리뷰

```
에이전트 팀을 만들어서 PR #142를 리뷰해줘. 3명의 리뷰어:
- 보안 영향 분석 담당
- 성능 영향 확인 담당
- 테스트 커버리지 검증 담당
각자 리뷰 후 발견 사항을 보고해줘.
```

### 7.2 경쟁 가설로 디버깅

```
사용자가 앱에서 한 번 메시지 후 연결이 끊긴다고 보고했어.
5명의 에이전트 팀원을 생성해서 다른 가설을 조사해줘.
서로 대화하면서 상대방의 이론을 반박하려고 해봐.
합의가 나오면 findings 문서에 업데이트해줘.
```

### 7.3 교차 계층 기능 구현

```
경비 관리 기능을 에이전트 팀으로 구현해줘:
- 백엔드 팀원: backend/src/routes/expenses.ts API 구현
- 프론트엔드 팀원: src/app/expense/page.tsx 화면 구현
- 테스트 팀원: API와 화면 모두 검증

백엔드 API가 완성된 후 프론트엔드가 연동하도록 작업 순서를 조율해줘.
```

### 7.4 팀원 대기 요청

리더가 직접 작업을 시작하려 할 때:

```
팀원들이 작업을 완료할 때까지 기다려줘.
```

### 7.5 기존 subagent 유형 활용

```
agent-backend 에이전트 유형으로 팀원을 생성해서 인증 모듈을 구현해줘.
agent-frontend 에이전트 유형으로 팀원을 생성해서 로그인 화면을 구현해줘.
agent-test 에이전트 유형으로 팀원을 생성해서 완료 후 검증해줘.
```

---

## 8. 모범 사례

### 8.1 적절한 팀 크기

- **3~5명**으로 시작 (병렬 작업과 조율의 균형)
- 팀원당 **5~6개 작업** 유지
- 3명의 집중된 팀원이 5명의 산만한 팀원보다 낫다

### 8.2 충분한 컨텍스트 제공

팀원은 리더의 대화 기록을 상속하지 않는다. 생성 프롬프트에 작업별 세부 사항을 포함:

```
보안 리뷰 팀원을 생성해줘. 프롬프트:
"src/auth/ 인증 모듈의 보안 취약점을 리뷰해줘.
토큰 처리, 세션 관리, 입력 검증에 집중해.
앱은 JWT 토큰을 httpOnly 쿠키에 저장해.
심각도별로 이슈를 보고해줘."
```

### 8.3 작업 크기 적절히 조정

| 크기 | 문제점 |
|------|--------|
| 너무 작음 | 조율 오버헤드가 이점 초과 |
| 너무 큼 | 체크인 없이 너무 오래 작동, 낭비 위험 |
| 적절함 | 함수·테스트 파일·리뷰 같은 자체 포함된 단위 |

### 8.4 파일 충돌 방지

두 팀원이 동일 파일을 편집하면 덮어쓰기가 발생한다. 각 팀원이 다른 파일 집합을 소유하도록 작업을 나눈다.

### 8.5 모니터링

팀을 무인으로 너무 오래 실행하지 않는다. 진행 상황을 확인하고, 작동하지 않는 접근 방식을 재지정한다.

### 8.6 연구/검토부터 시작

처음이면 코드 작성이 필요 없는 작업부터 시작: PR 리뷰, 라이브러리 연구, 버그 조사.

---

## 9. 문제 해결

### 팀원이 나타나지 않음

- In-process: `Shift+Down`으로 활성 팀원 확인
- 작업이 팀을 보증할 만큼 복잡한지 확인
- 분할 창: `which tmux`로 tmux 설치 확인

### 너무 많은 권한 프롬프트

권한 설정에서 일반 작업을 사전 승인하거나, `--dangerously-skip-permissions`로 실행.

### 팀원이 오류에서 중지

- `Shift+Down` (in-process) 또는 창 클릭 (분할)으로 출력 확인
- 직접 추가 지시 제공
- 대체 팀원 생성

### 리더가 작업 완료 전에 종료

```
계속해줘. 팀원들이 완료될 때까지 기다려.
```

### 고아 tmux 세션

```bash
tmux ls
tmux kill-session -t <session-name>
```

---

## 10. 제한 사항

| 제한 | 설명 |
|------|------|
| 세션 재개 불가 | `/resume`, `/rewind`로 in-process 팀원 복원 불가. 새 팀원 생성 필요 |
| 작업 상태 지연 | 팀원이 작업 완료를 표시하지 못할 수 있음. 수동 확인 필요 |
| 종료 지연 | 현재 요청/도구 호출 완료 후 종료되므로 시간 소요 |
| 세션당 한 팀 | 새 팀 시작 전 현재 팀 정리 필요 |
| 중첩 불가 | 팀원은 자신의 팀/팀원 생성 불가 |
| 리더 고정 | 팀 생성 세션이 수명 동안 리더. 리더십 이전 불가 |
| 권한 상속 | 모든 팀원이 리더의 권한 모드로 시작 |
| 분할 창 제한 | VS Code 통합 터미널, Windows Terminal, Ghostty에서 미지원 |

> CLAUDE.md는 정상 작동한다. 팀원들은 작업 디렉토리의 CLAUDE.md를 읽으므로 프로젝트 지침이 모든 팀원에게 적용된다.

---

## 참고 링크

- [에이전트 팀 공식 문서](https://code.claude.com/docs/ko/agent-teams)
- [Subagent 공식 문서](https://code.claude.com/docs/ko/sub-agents)
- [권한 모드](https://code.claude.com/docs/ko/permission-modes)
- [Hooks](https://code.claude.com/docs/ko/hooks)
- [MCP 서버](https://code.claude.com/docs/ko/mcp)

---

> **버전:** v1.0
> **작성일:** 2026-04-09
> **출처:** Claude Code 공식 문서 (code.claude.com)
