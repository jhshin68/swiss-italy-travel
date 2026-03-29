# DD-006: 경비 정산 알고리즘

## 상태
✅ 확정

## 맥락 (Context)
가족 4인이 여행 중 각자 결제하고, 여행 종료 후 정산하는 알고리즘을 결정.

## 핵심 요구사항

```
1. 다중 통화 지원: CHF, EUR, KRW이 혼재
2. 결제자 ≠ 수혜자: 진형이 결제했지만 4인 균등 분할
3. 부분 분할: 특정 지출은 2인만 해당 (예: 진형+동우 맥주)
4. 최종 정산: "누가 누구에게 얼마" 최소 거래 수로 정리
```

## 정산 로직

### Step 1: 모든 지출을 KRW로 통일
```
각 지출 × 해당일 환율 → KRW 환산
환율 소스: n8n 자동 수집 (매일 갱신)
오프라인 시: 마지막 캐시된 환율 사용
```

### Step 2: 멤버별 "낸 돈" vs "써야 할 돈" 계산
```
for each expense:
  paidBy: 실제 결제자 (1명)
  splits: 분할 대상자 + 비율/금액

멤버별 balance = 총 낸 금액 - 총 써야 할 금액
  양수 → 돌려받을 돈
  음수 → 갚아야 할 돈
```

### Step 3: 최소 거래 수 정산 (Minimum Transfers)
```
알고리즘: Greedy 방식
1. 양수(받을 사람) 내림차순, 음수(줄 사람) 오름차순 정렬
2. 가장 많이 받을 사람 ↔ 가장 많이 줄 사람 매칭
3. 둘 중 작은 금액만큼 정산
4. 잔액이 0이 된 사람 제거
5. 반복

4인이므로 최대 3건의 송금으로 정산 완료.
```

### 예시
```
여행 총 지출: ₩4,000,000

진형:  냄 ₩2,500,000 / 써야 할 ₩1,000,000 → +₩1,500,000 (받을 돈)
지현:  냄 ₩1,000,000 / 써야 할 ₩1,000,000 →  ₩0
동우:  냄   ₩300,000 / 써야 할 ₩1,000,000 → -₩700,000 (갚을 돈)
유진:  냄   ₩200,000 / 써야 할 ₩1,000,000 → -₩800,000 (갚을 돈)

정산 결과:
  유진 → 진형: ₩800,000
  동우 → 진형: ₩700,000
  (총 2건 송금으로 완료)
```

## 환율 처리 규칙

```
1. 경비 입력 시: 원래 통화로 저장 (CHF 85.00)
2. 표시 시: 원래 통화 + (₩환산액) 병기
3. 정산 시: 모두 KRW로 통일 후 계산
4. 환율 기준: 해당 지출일의 환율 (소급 적용)
5. 원 단위: 100원 단위 반올림 (가족이니 세세한 계산 불필요)
```

## 반올림 잔차 처리 정책

```
100원 단위 반올림 시 발생하는 잔차(±최대 ±200원):
- 잔차는 최대 수령자(진형)가 흡수한다.
- 이유: 진형이 가장 많이 받는 정산 주체이므로,
  ±소액 조정이 실질 영향이 가장 적다.
- 구현: Greedy 정산 후 총합 검증,
  불일치 금액을 진형 수령액에 가산/감산.
- 예시: 총 잔차 -50원 → 진형 수령액 50원 감소로 처리.
```

## TypeScript 구현 스펙

> Claude Code가 이 로직을 구현할 때 반드시 아래 인터페이스와 알고리즘을 따른다.

```typescript
// backend/src/lib/settlement.ts

export interface BalanceMap {
  [memberId: string]: number; // 양수: 받을 돈, 음수: 줄 돈 (단위: KRW 원)
}

export interface Transfer {
  from: string;  // 줄 멤버 ID
  to: string;    // 받을 멤버 ID
  amount: number; // KRW (양수, 100원 단위 반올림 후)
}

/**
 * 멤버별 잔액 계산
 * - expenses 배열에서 paid_by (낸 돈) - splits (써야 할 돈) 합산
 */
export function calcBalances(
  expenses: Array<{
    paidById: string;
    amountKRW: number;
    splits: Array<{ memberId: string; amount: number }>;
  }>
): BalanceMap {
  const balance: BalanceMap = {};

  for (const exp of expenses) {
    // 결제자는 amountKRW 획득
    balance[exp.paidById] = (balance[exp.paidById] ?? 0) + exp.amountKRW;
    // 각 분할 대상자는 자기 몫만큼 차감
    for (const split of exp.splits) {
      balance[split.memberId] = (balance[split.memberId] ?? 0) - split.amount;
    }
  }

  return balance;
}

/**
 * 최소 거래 수 정산 (Greedy)
 * - 반올림 잔차(±200원 이내)는 최대 수령자(진형)가 흡수
 */
export function calcMinTransfers(balances: BalanceMap): Transfer[] {
  const ROUND_UNIT = 100;

  // 100원 단위 반올림
  const rounded: BalanceMap = {};
  let roundingError = 0;
  for (const [id, amt] of Object.entries(balances)) {
    const r = Math.round(amt / ROUND_UNIT) * ROUND_UNIT;
    rounded[id] = r;
    roundingError += amt - r;
  }

  // 잔차 흡수: 가장 많이 받을 멤버에게 귀속
  const maxReceiver = Object.entries(rounded)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])[0];
  if (maxReceiver) {
    rounded[maxReceiver[0]] += Math.round(roundingError);
  }

  // Greedy 최소 거래
  const creditors = Object.entries(rounded)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ id, amount: v }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = Object.entries(rounded)
    .filter(([, v]) => v < 0)
    .map(([id, v]) => ({ id, amount: -v }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let ci = 0, di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const settle = Math.min(creditors[ci].amount, debtors[di].amount);
    if (settle > 0) {
      transfers.push({ from: debtors[di].id, to: creditors[ci].id, amount: settle });
    }
    creditors[ci].amount -= settle;
    debtors[di].amount -= settle;
    if (creditors[ci].amount === 0) ci++;
    if (debtors[di].amount === 0) di++;
  }

  return transfers;
}
```

**테스트 케이스 (Vitest)**
```typescript
// backend/src/lib/__tests__/settlement.test.ts
import { calcBalances, calcMinTransfers } from '../settlement';

test('4인 정산: 최대 3건 이하', () => {
  const expenses = [
    { paidById: 'jinhyung', amountKRW: 2500000,
      splits: [
        { memberId: 'jinhyung', amount: 625000 },
        { memberId: 'jihyun',   amount: 625000 },
        { memberId: 'dongwoo',  amount: 625000 },
        { memberId: 'yujin',    amount: 625000 },
      ]},
  ];
  const balances = calcBalances(expenses);
  const transfers = calcMinTransfers(balances);
  expect(transfers.length).toBeLessThanOrEqual(3);
  expect(transfers.every(t => t.amount > 0)).toBe(true);
});

test('0원 지출: 정산 결과 없음', () => {
  const balances = { jinhyung: 0, jihyun: 0, dongwoo: 0, yujin: 0 };
  expect(calcMinTransfers(balances)).toHaveLength(0);
});
```

## UI 표시

```
정산 탭에서:
┌──────────────────────────┐
│  🏦 최종 정산              │
│                          │
│  유진 → 진형  ₩800,000   │
│  동우 → 진형  ₩700,000   │
│                          │
│  [정산 완료 표시]          │
└──────────────────────────┘
```

## 상용화 시 재검토 사항
- Splitwise 수준의 그룹 정산 지원
- 실시간 환율 API 연동 (Open Exchange Rates 등)
- 정산 내역 PDF 내보내기
- 영수증 OCR 자동 입력
