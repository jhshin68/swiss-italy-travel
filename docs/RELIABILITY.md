# RELIABILITY.md — 안정성·모니터링 정책

> 여행 중 앱이 죽으면 안 된다. 가족 4인이라 SLA 99.9%는 과도하지만, "안 되면 안 됨"은 확보.

## 1. 가용성 목표

| 구분 | 목표 | 사유 |
|------|------|------|
| 프론트 (Vercel) | 99.9% | Vercel 자체 SLA |
| 백엔드 API | 99% | Oracle VM 무료 티어, 단일 인스턴스 |
| 오프라인 기능 | 100% | 네트워크 무관하게 동작 |

## 2. 모니터링

### 무료 도구 활용
| 도구 | 용도 | 비용 |
|------|------|------|
| UptimeRobot | API 헬스체크 (5분 간격) | 무료 |
| Vercel Analytics | 프론트 성능 | 무료 티어 |
| Express 로그 + SQLite 로그 | DB/API 에러 추적 | 내장 |
| n8n 알림 | 장애 시 카톡/이메일 알림 | 기존 인프라 |

### 헬스체크 엔드포인트
```
GET /api/health
응답: {
  status: "ok",
  db: "connected",
  uptime: 12345,
  timestamp: "2026-10-05T09:00:00Z"
}

UptimeRobot → 5분마다 호출 → 실패 시 이메일 알림
```

## 3. 백업·복구

```
SQLite:
  - 매일 03:00 KST: cp /app/data/travel.db /backup/sqlite/daily/travel_YYYYMMDD.db
  - 매주 일요일: → Oracle Object Storage
  - 보관: 로컬 7일, 원격 30일
  - 복구 목표: RPO 24시간, RTO 10분

복구 절차:
  1. Oracle Object Storage에서 최신 백업 다운로드
  2. cp travel_YYYYMMDD.db /app/data/travel.db 로 파일 복사
  3. Express 서버 재시작
```

## 4. 장애 대응

```
앱 장애 시 가족 커뮤니케이션:
  1차: 앱 자체 오프라인 모드 (자동 전환)
  2차: 카카오톡 가족 그룹 (백업 채널)
  3차: 전화 (최후 수단)

장애 우선순위:
  P1 (즉시): 로그인 불가, 일정 표시 안 됨
  P2 (1일 내): 경비 동기화 실패, 지도 안 뜸
  P3 (여행 후): UI 깨짐, 통계 오류
```

## 5. 에러 핸들링 전략

```
프론트:
  - Error Boundary로 페이지별 격리
  - 에러 시 "다시 시도" 버튼 제공
  - 오프라인 fallback 자동 전환

백엔드:
  - 글로벌 에러 핸들러 (Express errorHandler 미들웨어)
  - 구조화된 에러 로그 (JSON 형식)
  - 에러 코드 체계: TRIP_001, EXPENSE_001 등

DB (SQLite):
  - better-sqlite3 동기 API — 연결 실패 자체가 드물고 즉시 감지
  - 파일 잠금 오류 시 Express 서버 재시작으로 복구 (10분 이내)
```

---

> **버전:** v0.1
> **최종 수정:** 2026-03-29
