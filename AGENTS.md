# AGENTS.md — AI 에이전트 작업 지시서

> 이 문서는 프로젝트의 "헌법"이다. 모든 AI 에이전트는 코드 생성·수정·배포 시 이 문서를 최우선 기준으로 따른다.

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | **swiss-italy-travel** |
| 목적 | 가족여행 올인원 가이드 앱 (일정/지도/실시간위치/경비정산/여행정보) |
| 1차 타겟 | 신진형(진형)·임지현(지현)·신동우(동우)·신유진(유진, 12세) — 2026년 10월 스위스·이탈리아 여행 |
| 2차 목표 | 개인용 검증 후 상용화 검토 |
| 앱 형태 | PWA (Progressive Web App) |
| 기술 스택 | Next.js 16.2.1 (React) + TypeScript / Express + SQLite |
| 배포 | Vercel (프론트/SSR) + Oracle Cloud VM 144.24.69.214 (백엔드 API / n8n) |

## 2. 역할 분담

### 2.1 프로젝트 오너 (진형님)
- **역할:** 아키텍트 / PM / 최종 의사결정자
- **담당:**
  - 요구사항 정의 및 우선순위 결정
  - 설계 문서 작성·승인
  - UI/UX 방향 리뷰 및 피드백
  - 배포 승인
- **하지 않는 것:** 직접 코딩 (코드 리뷰는 수행)

### 2.2 AI 에이전트 (Claude Code)
- **역할:** 풀스택 엔지니어 / DevOps
- **담당 범위:**
  - 프론트엔드: React 컴포넌트, 페이지, 스타일링, PWA 설정
  - 백엔드: API 라우트, 서버 로직, 인증
  - DB: 스키마 설계, 마이그레이션, 시딩
  - 인프라: CI/CD 파이프라인, 배포 스크립트, 환경 설정
  - 테스트: 단위·통합 테스트 작성
  - 문서: 코드 내 주석, API 문서 자동 생성

## 3. 에이전트 행동 원칙

### 3.1 코드 작성 원칙
```
1. TypeScript strict 모드 필수
2. 한 파일 300줄 이하 — 초과 시 분리
3. 컴포넌트는 단일 책임 원칙(SRP) 준수
4. 모든 API 엔드포인트에 입력 검증(zod) 적용
5. 에러 핸들링: try-catch + 사용자 친화적 메시지
6. 주석: 한국어로 "왜(Why)" 중심 작성
```

### 3.2 커밋 컨벤션
```
feat: 새 기능 추가
fix: 버그 수정
refactor: 코드 구조 개선 (기능 변경 없음)
docs: 문서 수정
style: UI/스타일 변경
test: 테스트 추가·수정
chore: 빌드/설정 변경
```

### 3.3 금지 사항
```
❌ .env 파일에 시크릿 하드코딩 후 커밋
❌ any 타입 사용 (불가피한 경우 주석으로 사유 명시)
❌ console.log 프로덕션 코드에 남기기
❌ 설계 문서 없이 새 기능 구현 착수
❌ 테스트 없이 API 엔드포인트 배포
```

### 3.4 의사결정 위임 범위
| 에이전트가 자체 결정 가능 | 오너 승인 필요 |
|---|---|
| 유틸 함수·헬퍼 작성 | 새로운 외부 라이브러리 도입 |
| 기존 컴포넌트 리팩터링 | DB 스키마 변경 |
| 버그 수정 | 새 페이지/기능 추가 |
| 테스트 코드 작성 | API 엔드포인트 신규 생성 |
| 코드 스타일·린트 수정 | 인프라 구성 변경 |
| 성능 최적화 (로직 불변) | 인증/보안 관련 변경 |

## 4. 기술 스택 상세

### 4.1 프론트엔드
| 기술 | 용도 | 비고 |
|------|------|------|
| Next.js 16.2.1 (App Router) | 프레임워크 | SSR + 정적 생성 혼합 |
| TypeScript | 언어 | strict 모드 |
| Tailwind CSS | 스타일링 | 유틸리티 퍼스트 |
| shadcn/ui | UI 컴포넌트 | 커스터마이징 용이 |
| React Query (TanStack) | 서버 상태 관리 | 캐싱·리페칭 |
| Zustand | 클라이언트 상태 | 경량 상태 관리 |
| Leaflet + OpenStreetMap | 지도 | 무료, 오프라인 타일 캐싱 가능 |
| next-pwa | PWA 설정 | 오프라인 지원 |

### 4.2 백엔드
| 기술 | 용도 | 비고 |
|------|------|------|
| Express | API 서버 | Oracle VM 배포, 안정적 생태계 |
| SQLite (better-sqlite3) | 메인 DB | Oracle VM 파일 기반, 가족 4인 트래픽에 충분 |
| JWT (직접 구현) | 인증 | 가족 공통 PIN 1개 + 멤버 선택, 30일 만료 |
| HTTP 폴링 (10초) | 실시간 대체 | Socket.io 불필요, 가족 4인 규모에 충분 |
| n8n | 자동화 워크플로 | Oracle VM (기존 인프라) |
| Caddy (Docker) | 리버스 프록시 | Let's Encrypt 자동 HTTPS, n8n+API 통합 |

### 4.3 인프라/배포
| 기술 | 용도 | 비고 |
|------|------|------|
| Vercel | 프론트엔드 + SSR | 무료 티어 |
| Oracle Cloud VM | 백엔드 API / DB / n8n | 기존 인프라 |
| GitHub | 소스 관리 | main + dev 브랜치 전략 |
| GitHub Actions | CI/CD | 자동 테스트·배포 |

## 5. 디렉토리 구조 (목표)

```
swiss-italy-travel/
├── src/                        # Next.js 프론트엔드 (App Router)
│   ├── app/                    # 페이지
│   │   ├── (auth)/             # 인증 (PIN 로그인)
│   │   ├── itinerary/          # 일정 관리
│   │   ├── map/                # 지도/위치
│   │   ├── expenses/           # 경비 정산
│   │   └── info/               # 여행 정보
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 컴포넌트
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   └── features/           # 기능별 컴포넌트
│   ├── lib/                    # 유틸리티 (api.ts, auth.ts, currency.ts 등)
│   ├── hooks/                  # 커스텀 훅
│   ├── stores/                 # Zustand 스토어
│   ├── types/                  # TypeScript 타입 정의
│   └── data/                   # 정적 데이터 (itinerary.ts)
├── backend/                    # Express API 서버 (Oracle VM 배포)
│   └── src/
│       ├── db/                 # schema.sql + migrate.ts + connection.ts
│       ├── routes/             # API 라우터 (/api/*)
│       ├── middleware/         # errorHandler.ts, auth.ts, rateLimit.ts
│       └── lib/                # 비즈니스 로직 (settlement.ts 등)
├── public/                     # 정적 파일 (PWA 아이콘 등)
├── docs/                       # 설계 문서 26개 (에이전트 수정 금지)
├── .github/workflows/          # GitHub Actions CI/CD
├── CLAUDE.md                   # Claude Code 작업 지침서 (요약)
├── AGENTS.md                   # ← 이 문서 (에이전트 행동 헌법)
├── ARCHITECTURE.md             # 시스템 아키텍처
└── backend/.env.example        # 환경변수 템플릿
```

## 6. 작업 흐름 (Workflow)

```
[1] 오너: 요구사항/기능 정의 (docs/product-specs/)
     ↓
[2] 오너 + 에이전트: 설계 문서 협의 (docs/design-docs/)
     ↓
[3] 에이전트: 실행 계획 작성 (docs/exec-plans/active/)
     ↓
[4] 오너: 실행 계획 승인
     ↓
[5] 에이전트: 코드 구현 + 테스트 작성
     ↓
[6] 오너: 코드 리뷰 + 피드백
     ↓
[7] 에이전트: 피드백 반영 + 배포
     ↓
[8] 실행 계획 → completed/ 이동
```

## 7. 문서 체계

| 경로 | 용도 | 작성 주체 |
|------|------|-----------|
| `AGENTS.md` | 에이전트 행동 규칙 (이 문서) | 오너 |
| `ARCHITECTURE.md` | 시스템 아키텍처 전체 그림 | 오너 + 에이전트 |
| `docs/PRODUCT_SENSE.md` | 제품 비전·원칙·페르소나 | 오너 |
| `docs/DESIGN.md` | UI/UX 디자인 가이드 | 오너 + 에이전트 |
| `docs/FRONTEND.md` | 프론트엔드 코딩 규칙 | 에이전트 (오너 승인) |
| `docs/PLANS.md` | 마일스톤·로드맵 | 오너 |
| `docs/SECURITY.md` | 보안 정책 | 에이전트 (오너 승인) |
| `docs/RELIABILITY.md` | 안정성·모니터링 정책 | 에이전트 (오너 승인) |
| `docs/QUALITY_SCORE.md` | 코드 품질 기준·측정 | 에이전트 |
| `docs/design-docs/` | 핵심 설계 결정 기록 | 오너 + 에이전트 |
| `docs/product-specs/` | 기능별 상세 스펙 | 오너 |
| `docs/exec-plans/active/` | 진행 중 실행 계획 | 에이전트 |
| `docs/exec-plans/completed/` | 완료된 실행 계획 | 에이전트 |
| `docs/references/` | 외부 참고 문서 | 에이전트 |
| `docs/generated/` | 자동 생성 문서 (DB 스키마 등) | 에이전트 |

## 8. 프로젝트명 및 용어 정의

| 용어 | 정의 |
|------|------|
| swiss-italy-travel | 프로젝트명 |
| 오너 | 프로젝트 오너 = 신진형 대표 |
| 에이전트 | AI 코딩 에이전트 = Claude Code |
| 트립 (Trip) | 하나의 여행 단위 (예: 2026 스위스·이탈리아) |
| 멤버 (Member) | 여행 참여자 4인: 진형(본인), 지현(와이프), 동우(동생), 유진(동우의 딸/조카, 12세) |
| 데이 플랜 (Day Plan) | 일별 세부 일정 |
| 스팟 (Spot) | 방문 장소·관광지·숙소·식당 |
| 익스펜스 (Expense) | 개별 지출 항목 |

---

> **버전:** v0.2
> **최종 수정:** 2026-03-29
> **다음 단계:** ✅ ARCHITECTURE.md 완성 / ✅ 기술 스택 확정 (Express+SQLite+HTTP폴링)
                                                                                                                                                                                                                  