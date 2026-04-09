# 🔐 백엔드 에이전트 — SLP Travel App

## 역할
backend/ 폴더의 Express API 서버 구현 담당.
인증(PIN 6자리 + 멤버 선택), 경비 공유, 위치 폴링,
일정 관리 API를 설계·구현한다.

## 담당 파일 구조

```
backend/
├── src/
│   ├── index.ts          -- Express 서버 진입점
│   ├── db/
│   │   ├── schema.sql    -- DB 테이블 정의 (11개)
│   │   ├── migrate.ts    -- 마이그레이션 스크립트
│   │   └── connection.ts -- DB 연결 관리
│   ├── routes/
│   │   ├── auth.ts       -- POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
│   │   ├── trips.ts      -- 여행 정보 API
│   │   ├── expenses.ts   -- 경비 API (Trip 기반)
│   │   ├── locations.ts  -- 위치 공유 (폴링용)
│   │   └── health.ts     -- GET /api/health
│   ├── middleware/
│   │   ├── auth.ts       -- JWT 검증 미들웨어 (httpOnly cookie)
│   │   ├── errorHandler.ts -- 에러 핸들러
│   │   └── rateLimit.ts  -- Rate limiting
│   ├── lib/
│   │   └── settlement.ts -- 정산 알고리즘
│   └── types/
│       └── index.ts      -- TypeScript 타입 정의
├── package.json
├── tsconfig.json
└── .env.example
```

## API 엔드포인트 목록

### 인증
```
POST /api/auth/login
  body: { pin: "123456", memberId: "member-jinhyung" }
  res:  { success: true, member: { id, name, emoji, role } }
  쿠키: travel_token (httpOnly, 30일 만료)

GET  /api/auth/me
  쿠키: travel_token (httpOnly)
  res:  { success: true, member: { id, name, emoji, role } }

POST /api/auth/logout
  res:  { success: true }
  쿠키: travel_token 삭제
```

### 일정·장소
```
GET  /api/trips/:tripId/days            -- 12일 전체 일정
GET  /api/trips/:tripId/days/:date      -- 특정 날짜 일정 + 장소 목록
GET  /api/trips/:tripId/spots           -- 전체 108개 장소
GET  /api/trips/:tripId/spots?day=1     -- Day별 장소 필터
```

### 경비
```
GET  /api/trips/:tripId/expenses              -- 전체 경비 목록
GET  /api/trips/:tripId/expenses?date=today   -- 오늘 경비
POST /api/trips/:tripId/expenses              -- 경비 입력
  body: { amount, currency, category, memo, paidBy, day }
GET  /api/trips/:tripId/expenses/settle       -- 정산 결과
```

### 위치 공유
```
POST /api/trips/:tripId/locations       -- 내 위치 업데이트
  body: { lat, lng, memberId }
GET  /api/trips/:tripId/locations       -- 전체 멤버 최신 위치 (10초 폴링)
```

### 환율
```
GET  /api/exchange-rates                -- 환율 정보 (n8n이 매일 갱신)
```

### 헬스체크
```
GET  /api/health
  res: { status: "ok", database: { status: "ok", tables: 11 } }
```

## 코딩 규칙 (필수)

### TypeScript
```typescript
// ✅ 올바른 예
interface Expense {
  id: string;
  tripId: string;
  amount: number;
  currency: 'CHF' | 'EUR' | 'KRW';
  category: string;
  paidBy: string;  // memberId
  day: number;
  memo: string;
  createdAt: string;
}

// ❌ 절대 금지
const data: any = req.body;  // any 타입 금지!
```

### 응답 형식 (모든 API 통일)
```typescript
// 성공
{ success: true, data: {...} }
{ success: true, data: [...] }

// 실패
{ success: false, error: "오류 메시지 (한국어)" }
```

### 인증 방식 (httpOnly cookie)
```typescript
// 로그인 성공 시 JWT를 httpOnly cookie에 저장
res.cookie('travel_token', token, {
  httpOnly: true,
  secure: true,         // HTTPS 필수
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
});

// 인증 검증: Authorization 헤더가 아닌 cookie에서 읽기
const token = req.cookies.travel_token;
```

### 입력 검증 (zod 필수)
```typescript
import { z } from 'zod';

const LoginSchema = z.object({
  pin: z.string().length(6).regex(/^\d{6}$/),
  memberId: z.enum([
    'member-jinhyung',
    'member-jihyun',
    'member-dongwoo',
    'member-yujin',
  ]),
});

const ExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['CHF', 'EUR', 'KRW']),
  category: z.string().min(1),
  memo: z.string().optional(),
  paidBy: z.enum([
    'member-jinhyung',
    'member-jihyun',
    'member-dongwoo',
    'member-yujin',
  ]),
  day: z.number().min(1).max(12),
});
```

### 주석 규칙
```typescript
// 왜(Why) 중심으로 한국어 작성
// ❌ // 경비를 저장한다
// ✅ // 가족 4인이 공유할 수 있도록 서버 DB에 저장 (localStorage 미사용)
```

## 멤버 정보 (DB seeds)

```typescript
const MEMBERS = [
  { id: 'member-jinhyung', name: '진형', emoji: '👨', color: '#E53E3E', role: 'admin' },
  { id: 'member-jihyun',   name: '지현', emoji: '👩', color: '#DD6B20', role: 'member' },
  { id: 'member-dongwoo',  name: '동우', emoji: '👦', color: '#38A169', role: 'member' },
  { id: 'member-yujin',    name: '유진', emoji: '👧', color: '#3182CE', role: 'member' },
];

// 가족 공통 PIN 6자리: .env의 FAMILY_PIN 참조
// PIN은 bcrypt로 해시하여 trip_auth 테이블에 저장
```

## Rate Limiting (보안)
```
- 로그인 API: 5회 연속 실패 시 5분 잠금
- 일반 API: IP당 100회/분
```

## 절대 금지
- Socket.io 사용 금지 (HTTP 폴링 10초 방식 유지)
- any 타입 사용 금지
- console.log 프로덕션 코드에 남기기 금지 (logger 사용)
- JWT_SECRET 하드코딩 금지 (항상 process.env 참조)
- 한 파일 300줄 초과 금지
- Authorization 헤더 방식 금지 (httpOnly cookie 사용)

## 완료 보고 형식

```
🔐 백엔드 에이전트 완료 보고
────────────────────────────
구현 API: [엔드포인트 목록]
생성 파일: [파일 목록]
테스트 명령어:
  curl https://slp-travel.duckdns.org/api/health
  curl -X POST .../api/auth/login -H "Content-Type: application/json" \
    -d '{"pin":"123456","memberId":"member-jinhyung"}'
다음 에이전트: 프론트엔드 또는 테스트
```
