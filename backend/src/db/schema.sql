-- ============================================================
-- swiss-italy-travel SQLite 스키마 v1.0
-- 엔티티: Trip > Member / TripAuth / DayPlan > Spot /
--          Expense > ExpenseSplit / Location / InfoCard / ExchangeRate
-- ============================================================

-- 아래 PRAGMA는 migrate 최초 실행 시 DB 파일 초기화용.
-- 서버 런타임에서는 connection.ts의 getDb()가 동일 PRAGMA를 재적용하므로 중복이지만 의도적.
PRAGMA journal_mode = WAL;   -- 읽기/쓰기 동시성 향상
PRAGMA foreign_keys = ON;    -- 외래키 제약 활성화

-- ============================================================
-- 1. trips — 여행 단위
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,               -- "2026 스위스·이탈리아 가족여행"
  start_date  TEXT    NOT NULL,               -- ISO 8601: "2026-10-08"
  end_date    TEXT    NOT NULL,               -- ISO 8601: "2026-10-20"
  currencies  TEXT    NOT NULL DEFAULT 'CHF,EUR,KRW',  -- 콤마 구분
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ============================================================
-- 2. members — 여행 참여자 (가족 4인)
-- ============================================================
CREATE TABLE IF NOT EXISTS members (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id     INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,               -- "아빠", "엄마", "딸", "아들"
  emoji       TEXT    NOT NULL DEFAULT '👤', -- 아바타 이모지
  color       TEXT    NOT NULL DEFAULT '#6366f1', -- 멤버 색상 (HEX)
  role        TEXT    NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ============================================================
-- 3. trip_auth — 가족 공통 PIN 인증 정보
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_auth (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id     INTEGER NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
  pin_hash    TEXT    NOT NULL,               -- bcrypt 해시 (또는 SHA256 + salt)
  jwt_secret  TEXT    NOT NULL,               -- 이 여행 전용 JWT 시크릿
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ============================================================
-- 4. day_plans — 일별 일정
-- ============================================================
CREATE TABLE IF NOT EXISTS day_plans (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id     INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  date        TEXT    NOT NULL,               -- "2026-10-08"
  title       TEXT    NOT NULL DEFAULT '',   -- "취리히 도착·시차 적응"
  theme       TEXT    NOT NULL DEFAULT '',   -- 테마 설명
  country     TEXT    NOT NULL DEFAULT '',   -- "switzerland" | "italy" | "transit"
  city        TEXT    NOT NULL DEFAULT '',   -- "취리히"
  hotel       TEXT    NOT NULL DEFAULT '',   -- 당일 숙소명
  notes       TEXT    NOT NULL DEFAULT '',   -- 자유 메모
  is_special  INTEGER NOT NULL DEFAULT 0,   -- BOOLEAN (0/1)
  special_note TEXT   NOT NULL DEFAULT '',
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(trip_id, date)
);

-- ============================================================
-- 5. spots — 방문 장소 (day_plan에 속함)
-- ============================================================
CREATE TABLE IF NOT EXISTS spots (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  day_plan_id         INTEGER NOT NULL REFERENCES day_plans(id) ON DELETE CASCADE,
  name                TEXT    NOT NULL,
  name_local          TEXT    NOT NULL DEFAULT '',  -- 현지어 이름
  category            TEXT    NOT NULL DEFAULT 'sightseeing'
                        CHECK (category IN ('transport','sightseeing','meal','hotel','activity')),
  lat                 REAL,
  lng                 REAL,
  address             TEXT    NOT NULL DEFAULT '',
  map_url             TEXT    NOT NULL DEFAULT '',  -- 구글맵 링크
  nav_url             TEXT    NOT NULL DEFAULT '',  -- 구글맵 내비 링크
  start_time          TEXT    NOT NULL DEFAULT '',  -- "09:00"
  end_time            TEXT    NOT NULL DEFAULT '',  -- "11:00"
  cost                REAL,                          -- 예상 비용
  currency            TEXT    NOT NULL DEFAULT 'CHF',
  notes               TEXT    NOT NULL DEFAULT '',  -- 팁, 주의사항
  booking_ref         TEXT    NOT NULL DEFAULT '',  -- 예약 번호
  weather_alternative TEXT    NOT NULL DEFAULT '',  -- 날씨 대안
  image_url           TEXT    NOT NULL DEFAULT '',
  sort_order          INTEGER NOT NULL DEFAULT 0,
  is_important        INTEGER NOT NULL DEFAULT 0,   -- BOOLEAN
  created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_spots_day_plan ON spots(day_plan_id, sort_order);

-- ============================================================
-- 6. expenses — 지출 항목
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id       INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  paid_by       INTEGER NOT NULL REFERENCES members(id),
  amount        REAL    NOT NULL,
  currency      TEXT    NOT NULL DEFAULT 'CHF',
  amount_krw    REAL    NOT NULL DEFAULT 0,   -- KRW 환산 금액
  exchange_rate REAL    NOT NULL DEFAULT 0,   -- 적용 환율
  category      TEXT    NOT NULL DEFAULT 'etc'
                  CHECK (category IN ('food','transport','accommodation','activity','shopping','etc')),
  description   TEXT    NOT NULL DEFAULT '',
  date          TEXT    NOT NULL,             -- "2026-10-08"
  time          TEXT    NOT NULL DEFAULT '',  -- "13:30"
  receipt_url   TEXT    NOT NULL DEFAULT '',
  sync_status   TEXT    NOT NULL DEFAULT 'synced'
                  CHECK (sync_status IN ('synced', 'pending', 'conflict')),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_trip_date ON expenses(trip_id, date);

-- ============================================================
-- 7. expense_splits — 경비 정산 분배
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_splits (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_id  INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id   INTEGER NOT NULL REFERENCES members(id),
  amount      REAL    NOT NULL,
  UNIQUE(expense_id, member_id)
);

-- ============================================================
-- 8. locations — 실시간 위치 (최근 1시간 보관)
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id     INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  member_id   INTEGER NOT NULL REFERENCES members(id),
  lat         REAL    NOT NULL,
  lng         REAL    NOT NULL,
  accuracy    REAL,
  timestamp   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_locations_member_ts ON locations(member_id, timestamp DESC);

-- ============================================================
-- 9. info_cards — 여행 정보 카드 (비상연락처·팁 등)
-- ============================================================
CREATE TABLE IF NOT EXISTS info_cards (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id       INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category      TEXT    NOT NULL DEFAULT 'tip'
                  CHECK (category IN ('emergency','accommodation','transport','tip','caution','checklist')),
  title         TEXT    NOT NULL,
  content       TEXT    NOT NULL DEFAULT '',
  phone_numbers TEXT    NOT NULL DEFAULT '',  -- JSON 배열: ["112","118"]
  valid_from    TEXT,                          -- 유효 기간 시작
  valid_to      TEXT,                          -- 유효 기간 종료
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_pinned     INTEGER NOT NULL DEFAULT 0,   -- BOOLEAN (고정 표시)
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_info_cards_trip_cat ON info_cards(trip_id, category, sort_order);

-- ============================================================
-- 10. exchange_rates — 환율 (n8n이 매일 업데이트)
-- ============================================================
CREATE TABLE IF NOT EXISTS exchange_rates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  from_curr   TEXT NOT NULL,   -- "CHF"
  to_curr     TEXT NOT NULL,   -- "KRW"
  rate        REAL NOT NULL,
  date        TEXT NOT NULL,   -- "2026-10-08"
  source      TEXT NOT NULL DEFAULT 'n8n',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(from_curr, to_curr, date)
);

-- ============================================================
-- 11. sync_log — 오프라인 동기화 변경 추적
--   클라이언트가 /api/sync?since={ts} 로 폴링할 때 사용
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name  TEXT NOT NULL,
  record_id   INTEGER NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('insert','update','delete')),
  changed_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_sync_log_ts ON sync_log(changed_at);
