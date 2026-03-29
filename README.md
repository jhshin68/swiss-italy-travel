# swiss-italy-travel

> 2026년 10월 스위스·이탈리아 가족 여행을 위한 올인원 PWA 앱

## 개요

가족 4인(진형·지현·동우·유진)이 여행 중 일정 확인, 실시간 위치 공유, 경비 공동 정산을 한 앱에서 해결합니다.

| 항목 | 내용 |
|------|------|
| 여행 기간 | 2026년 10월 8일(목) ~ 10월 19일(월) · 11박 12일 |
| 여행지 | 스위스 → 이탈리아 |
| 인원 | 신진형·임지현·신동우·신유진(12세) |

## 서비스 URL

| 구분 | URL |
|------|-----|
| 프론트엔드 | https://swiss-italy-travel.vercel.app |
| 백엔드 API | https://slp-travel.duckdns.org |
| GitHub | https://github.com/jhshin68/swiss-italy-travel |

## 기술 스택

| 계층 | 기술 |
|------|------|
| 프론트엔드 | Next.js 16.2.1 (App Router) · TypeScript · Tailwind CSS · shadcn/ui |
| 상태 관리 | Zustand · TanStack Query |
| 지도 | Leaflet + OpenStreetMap |
| PWA | next-pwa (Workbox) |
| 백엔드 | Node.js 20 · Express · SQLite (better-sqlite3) |
| 인증 | JWT (httpOnly cookie) · 가족 공통 PIN 4자리 |
| 인프라 | Vercel (프론트) · Oracle Cloud VM (백엔드, IP는 GitHub Secret 관리) |
| 리버스 프록시 | Caddy (Docker) · Let's Encrypt 자동 HTTPS |
| 자동화 | n8n (환율 갱신, 날씨 알림, 경비 리포트) |
| CI/CD | GitHub Actions (lint → build → Vercel + Oracle VM 자동 배포) |

## 로컬 개발 환경 설정

```bash
# 1. 의존성 설치
npm install          # 프론트엔드
cd backend && npm install  # 백엔드

# 2. 환경변수 설정
cp backend/.env.example backend/.env
# backend/.env 파일에서 실제 값 입력

# 3. DB 마이그레이션
cd backend && npm run migrate

# 4. 개발 서버 실행
npm run dev          # 프론트엔드 (http://localhost:3000)
cd backend && npm run dev  # 백엔드 (http://localhost:3001)
```

## 디렉토리 구조

```
swiss-italy-travel/
├── src/                    # Next.js 프론트엔드
│   ├── app/                # App Router 페이지
│   ├── components/         # UI 컴포넌트
│   ├── data/               # 정적 데이터 (itinerary.ts 등)
│   ├── hooks/              # 커스텀 훅
│   ├── stores/             # Zustand 스토어
│   └── types/              # TypeScript 타입 정의
├── backend/                # Express API 서버
│   ├── src/
│   │   ├── db/             # SQLite 스키마·마이그레이션
│   │   ├── routes/         # API 라우터
│   │   └── middleware/     # 인증·에러 핸들러
│   └── .env.example        # 환경변수 템플릿
├── docs/                   # 설계 문서 (26개)
│   ├── PRODUCT_SENSE.md    # 제품 비전·페르소나
│   ├── DESIGN.md           # UI/UX 디자인 가이드
│   ├── FRONTEND.md         # 프론트엔드 코딩 규칙
│   ├── design-docs/        # 핵심 설계 결정 기록 (ADR)
│   └── product-specs/      # 기능별 상세 스펙
├── .github/workflows/      # GitHub Actions CI/CD
├── AGENTS.md               # AI 에이전트 행동 규칙
└── ARCHITECTURE.md         # 시스템 아키텍처
```

## 주요 기능

- **일정 뷰** — 12일 · 108개 장소 타임라인, 오프라인 열람
- **실시간 위치 공유** — HTTP 폴링(10초), 가족 지도 표시
- **경비 공동 정산** — CHF/EUR → KRW 환율 자동 변환, 누가 누구에게 얼마 계산
- **오프라인 퍼스트** — Service Worker + IndexedDB, 인터넷 없이 일정·비상정보 접근
- **4자리 PIN 인증** — 가족 공통 PIN + 멤버(진형/지현/동우/유진) 선택

## 배포

`main` 브랜치 push 시 GitHub Actions가 자동으로:
1. 프론트엔드 린트 + 타입 체크
2. 백엔드 린트 + 마이그레이션 스모크 테스트
3. Vercel 프론트엔드 배포
4. Oracle VM SSH 접속 → 백엔드 git pull + 빌드 + PM2 재시작

> 시크릿 설정 및 Oracle VM 최초 설정 방법: `.github/workflows/README.md` 참조

---

> **버전:** v0.2 · **최종 수정:** 2026-03-29
