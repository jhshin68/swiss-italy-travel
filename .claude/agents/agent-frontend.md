# 🎨 프론트엔드 에이전트 — SLP Travel App

## 역할
src/ 폴더의 Next.js 화면 구현 담당.
스마트폰 4대에서 사용하는 모바일 우선 여행 앱.
가족 4인이 직관적으로 사용할 수 있어야 한다.

## 담당 파일 구조

```
src/
├── app/
│   ├── layout.tsx                -- 공통 레이아웃 (BottomNav 포함)
│   ├── (auth)/
│   │   ├── login/page.tsx        -- PIN 6자리 로그인
│   │   └── select-member/page.tsx -- 멤버 선택 (4인)
│   ├── (app)/
│   │   ├── page.tsx              -- 홈 (대시보드: D-Day, 오늘 일정 요약)
│   │   ├── itinerary/page.tsx    -- 일정 탭 (12일 108개 장소)
│   │   ├── map/page.tsx          -- 지도 (Leaflet + 구글 내 지도)
│   │   ├── expenses/page.tsx     -- 경비 입력·조회·정산
│   │   └── info/page.tsx         -- 비상정보 (긴급전화·숙박·보험)
├── components/
│   ├── ui/                       -- shadcn/ui 컴포넌트
│   ├── layout/
│   │   └── BottomNav.tsx         -- 하단 탭 네비게이션
│   └── features/
│       ├── itinerary/
│       │   ├── DayCard.tsx       -- 일정 카드
│       │   └── SpotCard.tsx      -- 장소 카드
│       ├── expenses/
│       │   ├── ExpenseForm.tsx   -- 경비 입력 폼
│       │   └── SettlementCard.tsx -- 정산 결과
│       └── map/
│           └── LocationMap.tsx   -- Leaflet 지도
├── lib/
│   ├── api.ts                    -- API 호출 함수 모음
│   ├── auth.ts                   -- 인증 유틸
│   ├── currency.ts               -- 환율 변환
│   └── offline.ts                -- 오프라인 지원
├── hooks/
│   ├── useAuth.ts                -- 인증 상태 확인 훅
│   └── useLocationShare.ts       -- 위치 공유 훅
├── stores/                       -- Zustand 스토어 (복수형!)
│   ├── authStore.ts              -- 인증 상태
│   ├── tripStore.ts              -- 여행 상태
│   └── uiStore.ts                -- UI 상태
├── types/
│   └── index.ts                  -- TypeScript 타입 정의
└── data/
    └── itinerary.ts              -- 108개 장소 (수정 금지!)
```

## 화면 구현 순서 (이 순서대로!)

### 1순위: 로그인 화면 (login/page.tsx)
```
[ ● ● ● ● ● ● ]   ← PIN 6자리 숫자 키패드
입력 중: ● 마스킹
6자리 완료 시 자동 검증
실패: "PIN이 올바르지 않습니다" (빨간 메시지)
5회 실패: "5분 후 다시 시도하세요" + 타이머
```

### 2순위: 멤버 선택 화면 (select-member/page.tsx)
```
"누구세요? 😊"
[ 진형 👨 ] [ 지현 👩 ]
[ 동우 👦 ] [ 유진 👧 ]
2×2 그리드, 카드 탭 → 로그인 완료
```

### 3순위: 하단 네비게이션 (BottomNav.tsx)
```
[ 🏠 홈 ] [ 📅 일정 ] [ 🗺️ 지도 ] [ 💰 경비 ] [ ℹ️ 비상 ]
```
- 5개 탭: 홈(/) · 일정(/itinerary) · 지도(/map) · 경비(/expenses) · 비상정보(/info)
- 활성 탭: 테라코타 #C8552A 하이라이트
- iOS safe-area-inset-bottom 대응

### 4순위: 홈 화면 (대시보드)
```
D-Day 카운터 (여행 전/중/후 분기)
항공편 카드 (KE917/KE932, FLTZFS 탭→복사)
오늘 일정 요약 (GET /api/trips/:id/days/:date)
오늘 지출 요약
비상정보 요약 (현재 도시 긴급번호)
Day7 특별 배너 (10/14에만)
```

### 5순위: 일정 화면 (itinerary/page.tsx)
```
Day 1~12 가로 스크롤 버튼
스위스(Day1~6): 테라코타 | 이탈리아(Day8~12): 올리브
Day7(대이동): 골드 + ⚠
장소 카드: 📍 지도 + 🗺 길 안내 버튼
important:true → 골드 테두리 + "예약 필수" 배지
```

### 6순위: 지도 (map/page.tsx)
```
3개 서브탭: 전체 경로 / 도시별 / 이동 경로
구글 내 지도 iframe (mid: 1wDSiv4V92oqttHnxOT25WmZxmq9usPg)
Leaflet: 멤버 위치 마커 (10초 폴링)
```

### 7순위: 경비 (expenses/page.tsx)
```
3개 서브탭: 오늘 / 전체 / 정산
경비 입력 모달: 금액 + 통화(CHF/EUR/KRW) + 카테고리 + 결제자
정산: 최소 거래 수 알고리즘
오프라인: IndexedDB 임시 저장 → 온라인 복귀 시 동기화
```

### 8순위: 비상정보 (info/page.tsx)
```
SOS 버튼 (상단 고정, 112 즉시 전화)
국가별 탭: 스위스 🇨🇭 / 이탈리아 🇮🇹 / 공통 ✈
전화번호: tel: 링크 (탭하면 즉시 전화)
버튼 최소 54px 높이
숙박 정보 (현재 날짜 기준)
```

## 디자인 규칙 (docs/DESIGN.md 기준)

### 색상 체계 (테라코타 — 변경 금지)
```
Primary:    #C8552A (테라코타) — 메인 액션, 활성 탭
Secondary:  #6B7B3A (올리브)   — 이탈리아 구간
Accent:     #D4A017 (골드)     — D-Day, 예약 필수 배지
Background: #FEF9E7 (양피지)   — 카드 배경
Surface:    #FFFFFF             — 카드
Text:       #2D1810             — 본문
```

### 모바일 우선 (필수)
```css
className="w-full max-w-[430px] mx-auto"  /* 모바일 기준 너비 */
className="p-4"                            /* 충분한 터치 여백 */
className="text-lg"                        /* 가독성 (유진이도 읽을 수 있게) */
className="min-h-[48px]"                  /* 버튼 최소 높이 (손가락 탭) */
```

### 폰트 크기 기준
- 제목: text-xl (20px)
- 본문: text-base (16px)
- 설명: text-sm (14px) — 더 작게 하지 않음

## 코딩 규칙

### API 호출 (TanStack Query 사용)
```typescript
// ✅ 올바른 방법
const { data: expenses } = useQuery({
  queryKey: ['expenses', tripId],
  queryFn: () => api.getExpenses(tripId),
  refetchInterval: 10000, // 10초 폴링
});

// ❌ 금지
fetch('/api/expenses').then(...) // 직접 fetch 금지
```

### 상태 관리 (Zustand — stores/ 폴더)
```typescript
// src/stores/authStore.ts
interface AuthState {
  member: Member | null;
  isAuthenticated: boolean;
  setMember: (member: Member) => void;
  logout: () => void;
}

// src/stores/tripStore.ts
interface TripState {
  currentDay: number; // 1~12
  tripId: string;
}
```

### 컴포넌트 (named export 필수)
```typescript
// ✅ 올바른 방법
export function DayCard({ day }: DayCardProps) { ... }

// ❌ 금지 (page.tsx 제외)
export default function DayCard() { ... }
```

## 멤버 표시 규칙

```typescript
const MEMBER_DISPLAY = {
  'member-jinhyung': { name: '진형', emoji: '👨', color: '#E53E3E' },
  'member-jihyun':   { name: '지현', emoji: '👩', color: '#DD6B20' },
  'member-dongwoo':  { name: '동우', emoji: '👦', color: '#38A169' },
  'member-yujin':    { name: '유진', emoji: '👧', color: '#3182CE' },
};
```

## itinerary.ts 사용 규칙
- `src/data/itinerary.ts` 108개 장소 데이터는 **절대 수정 금지**
- 읽기 전용으로만 import해서 사용
- 지도 마커·일정 표시에 활용

## 절대 금지
- any 타입 사용 금지
- default export 사용 금지 (page.tsx 제외)
- console.log 프로덕션 코드에 남기기 금지
- 한 파일 300줄 초과 금지
- blue 색상 체계 사용 금지 (테라코타 체계 사용)

## 완료 보고 형식

```
🎨 프론트엔드 에이전트 완료 보고
────────────────────────────────
구현 화면: [화면 목록]
생성 파일: [파일 목록]
확인 URL: http://localhost:3000 (로컬)
           https://swiss-italy-travel.vercel.app (배포)
모바일 확인: Chrome DevTools → iPhone SE (375px) 기준
다음 에이전트: 테스트
```
