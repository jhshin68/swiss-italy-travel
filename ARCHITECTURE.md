# ARCHITECTURE.md — 시스템 아키텍처

> swiss-italy-travel 프로젝트의 전체 시스템 구조를 정의한다.
> 모든 기술적 의사결정의 근거 문서.

## 1. 시스템 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 (가족 4인)                       │
│                    모바일 브라우저 / 데스크톱                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (프론트엔드)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Next.js App Router (SSR + Static + Client)         │    │
│  │  ├── 대시보드 (/) ─────── 여행 현황 한눈에            │    │
│  │  ├── 일정 (/itinerary) ── 일별 계획·타임라인          │    │
│  │  ├── 지도 (/map) ──────── 실시간 위치·경로            │    │
│  │  ├── 경비 (/expenses) ─── 지출 기록·정산              │    │
│  │  └── 정보 (/info) ──────── 여행 팁·비상연락처          │    │
│  └─────────────────────────────────────────────────────┘    │
│  PWA: Service Worker + 오프라인 캐시                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ API 호출 (HTTPS, HTTP 폴링)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Oracle Cloud VM (백엔드)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  API Server  │  │    SQLite    │  │     n8n      │      │
│  │  (Express)   │  │   (메인DB)   │  │  (자동화)     │      │
│  │              │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └────── 내부 통신 ─┴──────────────────┘              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Caddy (리버스 프록시, 포트 443)                        │  │
│  │  - slp-travel.duckdns.org → Express API (포트 3001)  │  │
│  │  - slpower-n8n.duckdns.org → n8n (포트 5678)         │  │
│  │  - Let's Encrypt 자동 HTTPS                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 2. 계층별 상세

### 2.1 프론트엔드 (Vercel)

| 항목 | 결정 | 근거 |
|------|------|------|
| **프레임워크** | Next.js 16.2.1 (App Router) | SSR + 정적 생성 혼합, Vercel 최적화 |
| **언어** | TypeScript (strict) | 타입 안전성, 에이전트 코드 품질 보장 |
| **스타일링** | Tailwind CSS + shadcn/ui | 빠른 개발, 일관된 디자인 시스템 |
| **상태 관리** | Zustand (클라이언트) + TanStack Query (서버) | 경량 + 캐시 관리 분리 |
| **지도** | Leaflet + OpenStreetMap | 무료, 오프라인 타일 캐싱 가능 |
| **PWA** | next-pwa (Workbox 기반) | 오프라인 일정 열람, 푸시 알림 |
| **다국어** | next-intl (P1) | 한국어 기본, 영어 보조는 P1에서 추가 |

#### PWA 오프라인 전략
```
오프라인에서 반드시 동작해야 하는 것 (Tier 1):
  ✅ 일정 열람 (전체 12일분 — 약 500KB로 제한할 이유 없음)
  ✅ 일정 수정 (오프라인 수정 → 온라인 복귀 시 동기화)
  ✅ 비상 연락처·숙소 정보
  ✅ 경비 기록 입력 (로컬 저장 → 온라인 복귀 시 동기화)
  ✅ 체크리스트

온라인에서만 동작하는 것 (Tier 3):
  ⚡ 실시간 위치 공유
  ⚡ 경비 정산 결과 동기화
  ⚡ 여행 정보 검색·업데이트
```

### 2.2 백엔드 API (Oracle Cloud VM)

| 항목 | 결정 | 근거 |
|------|------|------|
| **런타임** | Node.js 20 LTS | 프론트와 언어 통일, 에이전트 생산성 |
| **프레임워크** | Express | 안정성, 생태계, 직접 구현 완료 |
| **DB 접근** | better-sqlite3 | 동기 API, 가족 4인 트래픽에 충분 |
| **인증** | JWT + 가족 공통 PIN 1개 + 멤버 선택 | 가족 4인 한정 → 무거운 OAuth 불필요 |
| **실시간** | HTTP 폴링 (10초 간격) | Socket.io 불필요 — 가족 4인 규모에 충분 |
| **API 스타일** | REST | GraphQL·WebSocket은 이 규모에 과도 |

#### 인증 설계 (가족 전용)
```
방식: 가족 공통 PIN 1개 + 멤버 선택
- 첫 접속: PIN 입력 → 멤버 선택 → JWT 발급 → 디바이스에 저장
- 이후: 자동 로그인 (토큰 30일, refresh 없음)
- 보안: 가족 4인 한정이므로 복잡한 인증 불필요
- 상용화 시: OAuth 2.0 / 소셜 로그인으로 교체 가능하도록 인증 레이어 분리
```

### 2.3 데이터베이스 (SQLite @ Oracle VM)

| 항목 | 결정 | 근거 |
|------|------|------|
| **DB** | SQLite (better-sqlite3) | 가족 4인 트래픽, 설치 없음, 파일 기반 단순 운영 |
| **파일 경로** | /app/data/travel.db | VM 내부 파일 시스템 |
| **백업** | cp travel.db 일 1회 → Oracle Object Storage 주 1회 | 데이터 유실 방지 |
| **ORM** | 없음 (better-sqlite3 직접 사용) | 경량, 동기 API로 충분 |

### 2.4 인프라 (Caddy @ Oracle VM)

| 항목 | 결정 | 근거 |
|------|------|------|
| **리버스 프록시** | Caddy (Docker) | Let's Encrypt 자동, n8n과 여행 API 통합 운영 |
| **포트** | 443 단독 (Caddy가 전담) | Nginx 없음, Caddy가 HTTPS 전담 |

```
Caddyfile 구성:
  slp-travel.duckdns.org {
    reverse_proxy localhost:3001
  }
  slpower-n8n.duckdns.org {
    reverse_proxy localhost:5678
  }
```

### 2.5 자동화 (n8n @ Oracle VM)

기존 Oracle VM에서 운영 중인 n8n을 활용:

| 워크플로 | 기능 |
|----------|------|
| **환율 업데이트** | 매일 CHF/EUR → KRW 환율 가져와서 DB 저장 |
| **날씨 알림** | 매일 오전 여행지 날씨 → 가족 단톡방 알림 |
| **일정 리마인더** | 당일 일정 요약 → 푸시 알림 |
| **경비 일일 리포트** | 하루 지출 요약 → 자동 생성 |

## 3. 데이터 모델 (핵심 엔티티)

```
Trip (여행)
  ├── id, name, startDate, endDate, currency[]
  │
  ├── Member (멤버) ──── id, name, emoji, color, role, avatarUrl
  │
  ├── TripAuth (인증) ── tripId, pinHash, jwtSecret
  │
  ├── DayPlan (일별 일정)
  │     ├── id, date, title, notes, country
  │     └── Spot (장소) ──── id, name, nameLocal, category,
  │                          lat, lng, address, startTime, endTime,
  │                          cost, currency, notes, bookingRef,
  │                          weatherAlternative, imageUrl, sortOrder
  │
  ├── Expense (지출)
  │     ├── id, amount, currency, amountKRW, exchangeRate,
  │     │   category, description, date, time, syncStatus
  │     ├── paidBy (Member), receiptUrl
  │     └── splits[] (Member + amount) ── 정산 분배
  │
  ├── Location (실시간 위치)
  │     ├── id, memberId, lat, lng, timestamp
  │     └── (최근 1시간만 보관, 이후 자동 삭제)
  │
  └── InfoCard (여행 정보)
        ├── id, category, title, content,
        │   phoneNumbers[], validFrom, validTo,
        │   sortOrder, isPinned
        └── (비상연락처, 교통카드, 팁, 주의사항 등)
```

## 4. API 엔드포인트 설계 (초안)

```
[인증]
POST   /api/auth/login          ── PIN 로그인 + 멤버 선택 → JWT 발급

[여행]
GET    /api/trips/:id           ── 여행 상세
PUT    /api/trips/:id           ── 여행 정보 수정

[일정]
GET    /api/trips/:id/days      ── 전체 일정
GET    /api/trips/:id/days/:date ── 특정 일자 일정
PUT    /api/trips/:id/days/:date ── 일정 수정
POST   /api/trips/:id/spots     ── 장소 추가
PUT    /api/spots/:id           ── 장소 수정
DELETE /api/spots/:id           ── 장소 삭제

[경비]
GET    /api/trips/:id/expenses          ── 지출 목록
POST   /api/trips/:id/expenses          ── 지출 추가
PUT    /api/expenses/:id                ── 지출 수정
DELETE /api/expenses/:id                ── 지출 삭제
GET    /api/trips/:id/expenses/summary  ── 정산 요약
GET    /api/trips/:id/expenses/settle   ── 최종 정산 결과

[위치] (HTTP 폴링, 10초 간격)
POST   /api/trips/:id/locations  ── 내 위치 업데이트
GET    /api/trips/:id/locations  ── 멤버 현재 위치 조회

[여행 정보]
GET    /api/trips/:id/info      ── 정보 카드 목록
POST   /api/trips/:id/info      ── 정보 카드 추가
PUT    /api/info/:id            ── 정보 카드 수정

[유틸]
GET    /api/exchange-rates      ── 현재 환율
GET    /api/weather/:location   ── 날씨 정보
GET    /api/health              ── 헬스체크

[동기화]
GET    /api/sync?since={ts}     ── 마지막 동기화 이후 변경 데이터
```

## 5. 배포 아키텍처

```
GitHub Repository
  │
  ├── push to main ──→ GitHub Actions
  │                      ├── lint + type-check + test
  │                      ├── Vercel 자동 배포 (프론트)
  │                      └── SSH → Oracle VM 배포 (백엔드)
  │
  └── push to dev ───→ Vercel Preview 배포 (리뷰용)

도메인 구성:
  - 프론트:  swiss-italy-travel.vercel.app
  - API:     https://slp-travel.duckdns.org  (Oracle VM → Caddy 리버스 프록시)
  - n8n:     slpower-n8n.duckdns.org (Caddy 통합 운영)
```

## 6. 보안 고려사항

| 영역 | 대책 |
|------|------|
| **전송** | HTTPS 전 구간 (Vercel 기본 + Oracle VM Caddy Let's Encrypt) |
| **인증** | JWT (httpOnly cookie) + 가족 공통 PIN |
| **API** | Rate limiting, 입력 검증 (zod), CORS 제한 |
| **DB** | SQLite 파일 접근 VM 내부만, 외부 포트 없음 |
| **위치 데이터** | 1시간 이후 자동 삭제, 최소 수집 원칙 |
| **상용화 대비** | 인증 레이어 분리 설계 → 교체 용이하도록 |

## 7. 성능 목표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 첫 로딩 (FCP) | < 2초 | Lighthouse |
| 페이지 전환 | < 500ms | 체감 |
| API 응답 | < 300ms | 서버 로그 |
| 오프라인 전환 | 즉시 | PWA Service Worker |
| 위치 업데이트 | 10초 간격 | HTTP 폴링 |

## 8. 기술 부채 관리 원칙

```
1. 상용화 전환 시 교체 예정 항목은 TODO(COMMERCIAL) 주석으로 표기
2. 임시 구현(hack)은 TODO(HACK) + 사유 + 예상 교체 시점 기록
3. docs/exec-plans/tech-debt-tracker.md에 누적 관리
```

---

> **버전:** v0.3
> **최종 수정:** 2026-03-29
> **변경 이력:**
> - v0.1: 초안 (Fastify + PostgreSQL + Socket.io)
> - v0.2: Caddy 리버스 프록시 통합 확정
> - v0.3: Express + SQLite(better-sqlite3) + HTTP폴링 확정, Next.js 16.2.1, /api/auth/refresh 제거
