# DB 스키마 참조 문서

> 자동 생성 참조 문서 — 실제 스키마는 `backend/src/db/schema.sql` 이 정본(single source of truth)입니다.
> 이 파일은 스키마를 사람이 읽기 쉬운 형태로 요약합니다.

## 테이블 구조 요약

| # | 테이블 | 역할 | 주요 컬럼 |
|---|--------|------|-----------|
| 1 | `trips` | 여행 단위 | id, name, start_date, end_date, currencies |
| 2 | `members` | 여행 참여자 (4인) | id, trip_id, name, emoji, color, role(admin/member) |
| 3 | `trip_auth` | 가족 공통 PIN 인증 | trip_id, pin_hash(bcrypt), jwt_secret |
| 4 | `day_plans` | 일별 일정 | id, trip_id, date, title, country, city, hotel |
| 5 | `spots` | 방문 장소 | id, day_plan_id, name, category, lat, lng, start_time, end_time |
| 6 | `expenses` | 지출 항목 | id, trip_id, paid_by(member_id), amount, currency, amount_krw, category |
| 7 | `expense_splits` | 정산 분배 | expense_id, member_id, amount |
| 8 | `locations` | 실시간 위치 (1시간 보관) | trip_id, member_id, lat, lng, timestamp |
| 9 | `info_cards` | 여행 정보 카드 | trip_id, category, title, content, is_pinned |
| 10 | `exchange_rates` | 환율 (n8n 업데이트) | from_curr, to_curr, rate, date |
| 11 | `sync_log` | 오프라인 동기화 추적 | table_name, record_id, action, changed_at |

## 관계 다이어그램

```
trips (1)
  ├── members (N)          -- role: admin(진형) / member(지현, 동우, 유진)
  ├── trip_auth (1)        -- pin_hash(bcrypt), jwt_secret
  ├── day_plans (N)        -- 12일 × 1개 = 12행
  │     └── spots (N)      -- 하루 평균 9개 장소, 총 108개
  ├── expenses (N)
  │     ├── paid_by → members(id)
  │     └── expense_splits (N) → members(id)
  ├── locations (N)        -- 최근 1시간 데이터만 보관
  ├── info_cards (N)       -- 비상연락처, 숙소, 팁, 주의사항
  └── exchange_rates (N)   -- CHF/KRW, EUR/KRW 일별 환율
```

## 카테고리 열거형 (CHECK 제약)

### spots.category
```
'transport'   -- 이동 (기차, 버스, 항공)
'sightseeing' -- 관광 (명소, 박물관)
'meal'        -- 식사 (레스토랑, 카페)
'hotel'       -- 숙소 체크인/아웃
'activity'    -- 체험 활동 (케이블카, 투어)
```

### expenses.category
```
'food'          -- 식사·카페
'transport'     -- 교통 (기차, 버스, 택시)
'accommodation' -- 숙박
'activity'      -- 관광·체험
'shopping'      -- 쇼핑
'etc'           -- 기타
```

### info_cards.category
```
'emergency'     -- 비상연락처 (대사관, 보험사)
'accommodation' -- 숙소 정보
'transport'     -- 교통카드·이동 팁
'tip'           -- 여행 팁
'caution'       -- 주의사항
'checklist'     -- 체크리스트
```

## 마이그레이션 실행

```bash
# 최초 실행 (DB 파일 없을 때)
cd backend
npm run migrate

# 스키마 확인
sqlite3 /app/data/travel.db ".tables"
sqlite3 /app/data/travel.db ".schema trips"
```

## 초기 데이터 시딩

```bash
# 여행 데이터 초기 입력 (itinerary.ts → DB)
npm run seed
```

시딩 후 생성되는 데이터:
- trips: 1행 ("2026 스위스·이탈리아 가족여행")
- members: 4행 (진형/지현/동우/유진)
- day_plans: 12행 (2026-10-08 ~ 2026-10-19)
- spots: 108행 (일정 장소 전체)

---

> **버전:** v1.0
> **최종 수정:** 2026-03-29
> **정본 파일:** `backend/src/db/schema.sql`
