# swiss-italy-travel — Claude Code 프로젝트 헌법

> 이 프로젝트에서 Claude Code가 지켜야 할 규칙의 요약본이다.
> 전체 규칙은 AGENTS.md와 docs/ 하위 문서에 있다.

---

## 프로젝트 한 줄 요약

가족 4인(진형·지현·동우·유진)의 2026년 10월 스위스·이탈리아 여행을 위한 **PWA 올인원 앱**.
Next.js(Vercel) + Express + SQLite(Oracle VM) 풀스택 구조.

---

## 핵심 정보

- 여행 기간: 2026년 10월 8일(목) ~ 10월 19일(월), 11박 12일
- 여행자: 신진형(진형) · 임지현(지현) · 신동우(동우) · 신유진(유진, 12세)
- 항공편: KE917(인천→취리히 10/8 12:25) / KE932(로마→인천 10/19 21:25)
- 예약번호: FLTZFS
- 숙박: 취리히 1박 → 그린델발트 3박 → 체르마트 2박 → 피렌체 3박 → 로마 2박

---

## 서비스 URL

- 프론트엔드: https://swiss-italy-travel.vercel.app
- 백엔드 API: https://slp-travel.duckdns.org
- GitHub: https://github.com/jhshin68/swiss-italy-travel
- Oracle VM: 140.245.76.255 (포트 22 SSH, 포트 3001 API)

---

## 멤버 정보 (중요)

- 진형(👨): 본인, 관리자(admin) 권한, IT 전문가
- 지현(👩): 와이프, 멤버 권한
- 동우(👦): 진형의 동생, 멤버 권한
- 유진(👧): 동우의 딸/진형의 조카, 12세 150cm, 멤버 권한

---

## 기술 스택 (변경 금지)

- 프론트: Next.js 16.2.1 App Router, TypeScript strict, Tailwind CSS v4, shadcn/ui
- 상태관리: Zustand(클라이언트) + TanStack Query(서버)
- 지도: Leaflet + OpenStreetMap
- 백엔드: Node.js 20, Express, SQLite(better-sqlite3), JWT
- 인증: 가족 공통 PIN 6자리 + 멤버 선택, JWT 30일, httpOnly cookie
- 실시간: HTTP 폴링 10초 간격 (Socket.io 사용 금지)
- 배포: Vercel(프론트) + Oracle VM(백엔드, PM2)

---

## 핵심 파일 읽기 순서 (작업 시작 전 필수)

```
1. AGENTS.md               ← 역할·행동 원칙·의사결정 위임 범위
2. ARCHITECTURE.md         ← 시스템 전체 구조
3. docs/PLANS.md           ← 현재 마일스톤 위치 확인
4. docs/DEV_GUIDE.md       ← 단계별 개발 가이드 + 프롬프트 템플릿
5. 해당 기능 스펙 파일      ← docs/product-specs/ 또는 docs/design-docs/
```

---

## 설계 문서 위치 (필독)

- `ARCHITECTURE.md` — 시스템 전체 구조
- `AGENTS.md` — 에이전트 행동 규칙
- `docs/DEV_GUIDE.md` — 단계별 개발 가이드 (STEP 0~20)
- `docs/product-specs/` — 기능별 상세 스펙 (인증·일정·경비·지도·비상정보)
- `docs/design-docs/` — 핵심 설계 결정 기록 (ADR 6개)
- `docs/DESIGN.md` — UI/UX 디자인 가이드 (색상·폰트·컴포넌트)

---

## 코딩 규칙 (필수)

```
언어:          TypeScript strict 모드 (any 금지)
파일 크기:      300줄 이하 — 초과 시 분리
컴포넌트:      named export (default export 금지, page.tsx 제외)
명명:          파일 kebab-case / 컴포넌트 PascalCase / 함수 camelCase
주석:          한국어, "왜(Why)" 중심
API 검증:      모든 엔드포인트에 zod 스키마 필수
에러 메시지:   한국어, 사용자 친화적 톤
로그:          console.log 프로덕션 코드에 남기지 않음 (logger 사용)
```

---

## 구글맵 연동

- 구글 내 지도 mid: `1wDSiv4V92oqttHnxOT25WmZxmq9usPg`
- `itinerary.ts`는 108개 장소 완성본 — **절대 임의 수정 금지**

---

## DB 테이블 목록 (11개)

```
trips, members, trip_auth, day_plans, spots,
expenses, expense_splits, locations, info_cards,
exchange_rates, sync_log
```

---

## 디렉토리 구조

```
swiss-italy-travel/
├── src/                    # Next.js 프론트엔드 (App Router)
│   ├── app/                # 페이지 (auth/itinerary/map/expenses/info)
│   ├── components/         # ui/ layout/ features/
│   ├── lib/                # api.ts auth.ts currency.ts offline.ts
│   ├── hooks/              # use-*.ts 커스텀 훅
│   ├── stores/             # Zustand (auth/trip/ui)
│   ├── types/              # TypeScript 타입 정의
│   └── data/               # itinerary.ts (108개 장소 — 수정 금지)
├── backend/                # Express API 서버 (Oracle VM 배포)
│   └── src/
│       ├── db/             # schema.sql + migrate.ts + connection.ts
│       ├── routes/         # API 라우터 (/api/*)
│       ├── middleware/     # errorHandler.ts, auth.ts, rateLimit.ts
│       └── lib/            # settlement.ts 등 비즈니스 로직
├── docs/                   # 설계 문서 (수정 금지, 읽기 전용)
│   └── DEV_GUIDE.md        # 단계별 개발 가이드 (STEP 0~20)
├── AGENTS.md               # 에이전트 행동 헌법
├── ARCHITECTURE.md         # 시스템 아키텍처
└── CLAUDE.md               # ← 이 파일
```

---

## 금지 사항

```
❌ .env에 시크릿 하드코딩 후 git commit
❌ any 타입 사용 (불가피 시 // eslint-disable-next-line + 사유 주석)
❌ console.log를 프로덕션 코드에 남기기 (logger 사용)
❌ 설계 문서 없이 새 기능 구현 착수
❌ 테스트 없이 비즈니스 로직 API 배포
❌ docs/ 문서를 Claude Code가 임의로 수정
❌ Socket.io 도입 (HTTP 폴링으로 충분)
❌ itinerary.ts 임의 수정
```

---

## 에이전트 자체 결정 가능 vs 오너 승인 필요

| 자체 결정 가능 | 오너 승인 필요 |
|---|---|
| 유틸 함수·헬퍼 | 새 외부 라이브러리 도입 |
| 기존 컴포넌트 리팩터링 | DB 스키마 변경 |
| 버그 수정 | 새 페이지/기능 추가 |
| 테스트 코드 | API 엔드포인트 신규 생성 |
| 성능 최적화 (로직 불변) | 인증/보안 관련 변경 |

---

## 커밋 컨벤션

```
feat:      새 기능
fix:       버그 수정
refactor:  구조 개선 (기능 변경 없음)
docs:      문서 수정
test:      테스트 추가·수정
chore:     빌드·설정 변경
style:     UI/스타일 변경
```

---

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

---

## 현재 작업 위치 (2026-03-29 기준)

```
Phase 1 — 기반 구축 중
  ✅ STEP 1: 환경 설정 (Node.js, Git, Claude Code)
  ✅ STEP 2: CLAUDE.md 작성
  ✅ STEP 3: 설계 문서 26개 + DEV_GUIDE.md git 커밋
  ⏳ STEP 4: backend/.env 생성 완료 → FAMILY_PIN 설정 필요
  □  STEP 5~7: Oracle VM SSH 접속 + DB 마이그레이션
  □  STEP 8~9: 인증 기능 (PIN 로그인 + 멤버 선택)
  □  STEP 10~11: 데이터 시딩 (108개 장소)
```

---

> **버전:** v2.0
> **최종 수정:** 2026-03-29
> **변경 이력:**
> - v1.0: 초안 (기본 코딩 규칙 중심)
> - v2.0: 핵심 정보·서비스 URL·멤버·기술 스택·DEV_GUIDE 통합
