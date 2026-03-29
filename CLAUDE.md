# CLAUDE.md — Claude Code 작업 지침서

> 이 프로젝트에서 Claude Code가 지켜야 할 규칙의 요약본이다.
> 전체 규칙은 AGENTS.md와 docs/ 하위 문서에 있다.

## 프로젝트 한 줄 요약

가족 4인(진형·지현·동우·유진)의 2026년 10월 스위스·이탈리아 여행을 위한 **PWA 올인원 앱**.
Next.js(Vercel) + Express + SQLite(Oracle VM) 풀스택 구조.

## 핵심 파일 읽기 순서 (작업 시작 전 필수)

```
1. AGENTS.md          ← 역할·행동 원칙·의사결정 위임 범위
2. ARCHITECTURE.md    ← 시스템 전체 구조
3. docs/PLANS.md      ← 현재 마일스톤 위치 확인
4. 해당 기능 스펙 파일 ← docs/product-specs/ 또는 docs/design-docs/
```

## 코딩 규칙 (핵심만)

```
언어:          TypeScript strict 모드 (any 금지)
파일 크기:      300줄 이하 — 초과 시 분리
컴포넌트:      named export (default export 금지, page.tsx 제외)
명명:          파일 kebab-case / 컴포넌트 PascalCase / 함수 camelCase
주석:          한국어, "왜(Why)" 중심
API 검증:      모든 엔드포인트에 zod 스키마 필수
에러 메시지:   한국어, 사용자 친화적 톤
```

## 디렉토리 구조

```
swiss-italy-travel/
├── src/                    # Next.js 프론트엔드 (App Router)
│   ├── app/                # 페이지 (auth/itinerary/map/expenses/info)
│   ├── components/         # ui/ layout/ features/
│   ├── lib/                # api.ts auth.ts currency.ts offline.ts
│   ├── hooks/              # use-*.ts 커스텀 훅
│   ├── stores/             # Zustand (auth/trip/ui)
│   └── types/              # TypeScript 타입 정의
├── backend/                # Express API 서버
│   └── src/
│       ├── db/             # schema.sql + migrate.ts + connection.ts
│       ├── routes/         # API 라우터 (/api/*)
│       ├── middleware/     # errorHandler.ts (추가: auth.ts, rateLimit.ts)
│       └── lib/            # settlement.ts 등 비즈니스 로직
├── docs/                   # 설계 문서 26개 (수정 금지, 읽기 전용)
├── AGENTS.md               # 에이전트 행동 헌법
├── ARCHITECTURE.md         # 시스템 아키텍처
└── CLAUDE.md               # ← 이 파일
```

## 금지 사항

```
❌ .env에 시크릿 하드코딩 후 git commit
❌ any 타입 사용 (불가피 시 // eslint-disable-next-line + 사유 주석)
❌ console.log를 프로덕션 코드에 남기기 (logger 사용)
❌ 설계 문서 없이 새 기능 구현 착수
❌ 테스트 없이 비즈니스 로직 API 배포
❌ docs/ 문서를 Claude Code가 임의로 수정
```

## 에이전트 자체 결정 가능 vs 오너 승인 필요

| 자체 결정 가능 | 오너 승인 필요 |
|---|---|
| 유틸 함수·헬퍼 | 새 외부 라이브러리 도입 |
| 기존 컴포넌트 리팩터링 | DB 스키마 변경 |
| 버그 수정 | 새 페이지/기능 추가 |
| 테스트 코드 | API 엔드포인트 신규 생성 |
| 성능 최적화 (로직 불변) | 인증/보안 관련 변경 |

## 커밋 컨벤션

```
feat:      새 기능
fix:       버그 수정
refactor:  구조 개선 (기능 변경 없음)
docs:      문서 수정
test:      테스트 추가·수정
chore:     빌드·설정 변경
```

## 로컬 개발 명령어

```bash
# 프론트엔드
npm run dev          # http://localhost:3000

# 백엔드
cd backend
npm run migrate      # DB 스키마 적용
npm run seed         # 초기 데이터 시딩 (Phase 1.4 완료 후)
npm run dev          # http://localhost:3001
npm run test         # Vitest 테스트 실행

# 품질 검사
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

## 현재 작업 위치 (2026-03-29 기준)

```
Phase 1 — 기반 구축 중
  ✅ 마일스톤 1.1: 프로젝트 셋업 완료
  ✅ 마일스톤 1.2: 백엔드 인프라 (부분 완료 — migrate, health 구현됨)
  □ 마일스톤 1.2 잔여: GitHub Actions CI/CD
  □ 마일스톤 1.3: 인증 + 앱 셸
  □ 마일스톤 1.4: 데이터 시딩
```

---

> **버전:** v1.0
> **최종 수정:** 2026-03-29
