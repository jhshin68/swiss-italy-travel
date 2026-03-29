# FRONTEND.md — 프론트엔드 코딩 규칙

> 에이전트가 프론트엔드 코드를 작성할 때 따르는 기술 규칙.
> DESIGN.md가 "어떻게 보이는가"라면, 이 문서는 "어떻게 만드는가"다.

## 1. 프로젝트 구조 규칙

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 루트 레이아웃 (탭바 포함)
│   ├── page.tsx                  # 홈 (대시보드)
│   ├── (auth)/
│   │   └── login/page.tsx        # PIN 로그인
│   ├── itinerary/
│   │   ├── page.tsx              # 일정 메인
│   │   └── [date]/page.tsx       # 특정 날짜 일정
│   ├── map/page.tsx              # 지도
│   ├── expenses/
│   │   ├── page.tsx              # 경비 메인
│   │   └── settle/page.tsx       # 정산 결과
│   └── info/page.tsx             # 여행 정보
│
├── components/
│   ├── ui/                       # shadcn/ui 기본 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   └── ...
│   ├── layout/                   # 레이아웃 컴포넌트
│   │   ├── tab-bar.tsx           # 하단 탭 바
│   │   ├── top-header.tsx        # 상단 헤더
│   │   └── offline-banner.tsx    # 오프라인 배너
│   └── features/                 # 기능별 컴포넌트
│       ├── dashboard/
│       ├── itinerary/
│       ├── expenses/
│       ├── map/
│       └── info/
│
├── lib/                          # 유틸리티
│   ├── api.ts                    # API 클라이언트
│   ├── auth.ts                   # 인증 유틸
│   ├── currency.ts               # 환율 변환
│   ├── date.ts                   # 날짜 유틸 (D-Day 계산 등)
│   ├── offline.ts                # 오프라인 감지·동기화
│   └── constants.ts              # 상수 정의
│
├── hooks/                        # 커스텀 훅
│   ├── use-online-status.ts      # 온/오프라인 감지
│   ├── use-current-member.ts     # 현재 로그인 멤버
│   ├── use-today-plan.ts         # 오늘 일정
│   └── use-expenses.ts           # 경비 CRUD
│
├── stores/                       # Zustand 스토어
│   ├── auth-store.ts             # 인증 상태
│   ├── trip-store.ts             # 여행 데이터
│   └── ui-store.ts               # UI 상태 (모달, 탭 등)
│
├── types/                        # TypeScript 타입
│   ├── trip.ts                   # Trip, DayPlan, Spot
│   ├── expense.ts                # Expense, ExpenseSplit
│   ├── member.ts                 # Member
│   └── info.ts                   # InfoCard
│
└── styles/
    └── globals.css               # Tailwind 기본 + CSS 변수
```

## 2. 네이밍 규칙

```
파일명:        kebab-case        (tab-bar.tsx, use-online-status.ts)
컴포넌트:      PascalCase        (TabBar, ExpenseCard)
함수/변수:     camelCase         (getTodayPlan, isOnline)
상수:         UPPER_SNAKE_CASE  (MAX_PIN_ATTEMPTS, API_BASE_URL)
타입/인터페이스: PascalCase       (Expense, DayPlan)
CSS 클래스:    Tailwind 유틸리티  (className="flex items-center")
```

## 3. 컴포넌트 작성 규칙

### 기본 템플릿
```typescript
// components/features/expenses/expense-card.tsx
'use client';

import { type Expense } from '@/types/expense';
import { formatCurrency } from '@/lib/currency';
import { Card } from '@/components/ui/card';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (id: string) => void;
}

// 컴포넌트는 항상 named export (default export 금지)
export function ExpenseCard({ expense, onEdit }: ExpenseCardProps) {
  return (
    <Card>
      {/* ... */}
    </Card>
  );
}
```

### 규칙
```
1. 'use client'는 필요한 컴포넌트에만 (서버 컴포넌트 우선)
2. Props는 반드시 interface로 정의
3. default export 금지 → named export만 사용 (page.tsx 제외)
4. 한 파일에 한 컴포넌트 (작은 내부 컴포넌트는 예외)
5. 300줄 초과 시 분리
6. children 대신 명시적 Props 선호 (의도 명확)
```

## 4. 상태 관리 규칙

```
서버 데이터 → TanStack Query (React Query)
  - 일정, 경비, 멤버 정보 등 서버에서 오는 데이터
  - 캐싱, 리페칭, 에러 핸들링 자동

클라이언트 상태 → Zustand
  - 현재 선택 날짜, 모달 열림/닫힘, 탭 상태 등
  - 인증 상태 (현재 멤버)

로컬 영속 데이터 → IndexedDB (idb 라이브러리)
  - 오프라인 경비 입력 큐
  - 캐시된 일정 데이터

금지: 
  ❌ Redux (이 규모에 과도)
  ❌ Context API 남용 (리렌더링 문제)
  ❌ useState로 서버 데이터 관리
```

## 5. API 호출 패턴

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function apiClient<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // JWT 쿠키 전송
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  return res.json();
}

// hooks/use-expenses.ts — TanStack Query 패턴
export function useExpenses(tripId: string, date?: string) {
  return useQuery({
    queryKey: ['expenses', tripId, date],
    queryFn: () => apiClient<Expense[]>(
      `/api/trips/${tripId}/expenses${date ? `?date=${date}` : ''}`
    ),
    staleTime: 1000 * 60,  // 1분 캐시
  });
}
```

## 6. 스타일링 규칙

```
기본: Tailwind CSS 유틸리티 클래스
컴포넌트: shadcn/ui (커스터마이징)
커스텀 스타일: CSS 변수 (globals.css)

globals.css에 정의할 CSS 변수:
  --color-primary: #E8725A;
  --color-secondary: #2D7D9A;
  --color-accent: #F4A84F;
  --color-bg: #FFF9F5;
  --color-surface: #FFFFFF;
  --color-text: #2C2C2C;
  --color-text-sub: #7A7A7A;
  --color-border: #E8E2DC;
  --radius-card: 12px;
  --radius-button: 8px;

금지:
  ❌ inline style (style={{ }})
  ❌ CSS Modules (Tailwind와 혼용 복잡)
  ❌ styled-components (번들 크기)
  ❌ !important
```

## 7. 에러 핸들링

```typescript
// 페이지 수준: Error Boundary
// app/expenses/error.tsx
'use client';

export default function ExpensesError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center p-8">
      <p className="text-text-sub mb-4">
        경비 정보를 불러올 수 없어요 😅
      </p>
      <button onClick={reset} className="btn-primary">
        다시 시도
      </button>
    </div>
  );
}

// API 수준: 커스텀 에러
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// 사용자 메시지: 한국어, 친근한 톤
// ❌ "500 Internal Server Error"
// ✅ "서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요 🙏"
```

## 8. 성능 규칙

```
이미지:
  - next/image 필수 (자동 최적화)
  - 지연 로딩 (loading="lazy") 기본
  - WebP 우선

번들:
  - dynamic import로 지도 컴포넌트 분리 (Leaflet 무거움)
  - 경비 차트는 lazy load

렌더링:
  - 일정 목록: 가상화 불필요 (하루 최대 10개)
  - 경비 목록: 50개 이상 시 가상화 검토

폰트:
  - next/font로 Pretendard 로드 (FOUT 방지)
  - subset: 한국어 + 라틴 기본
```

## 9. 접근성 체크리스트

```
모든 컴포넌트 작성 시:
  □ 버튼/링크에 명확한 텍스트 또는 aria-label
  □ 이미지에 alt 텍스트
  □ 폼 입력에 label 연결
  □ 색상만으로 정보 전달하지 않기 (아이콘/텍스트 병기)
  □ 키보드 포커스 순서 확인
  □ 터치 타겟 44px 이상
```

---

> **버전:** v0.1
> **최종 수정:** 2026-03-29
