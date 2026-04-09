// lib/settlement.ts — 경비 정산 알고리즘
// 멤버별 잔액 계산 + 최소 거래 수 정산(Greedy) 로직을 담당한다.
// 모든 금액은 KRW 기준이며, 100원 단위로 반올림한다.

export interface BalanceMap {
  [memberId: string]: number; // 양수: 받을 돈, 음수: 줄 돈 (KRW)
}

export interface Transfer {
  from: string;   // 줄 멤버 ID
  to: string;     // 받을 멤버 ID
  amount: number; // KRW (양수, 100원 단위 반올림)
}

interface ExpenseInput {
  paidById: string;
  amountKRW: number;
  splits: Array<{ memberId: string; amount: number }>;
}

/**
 * 멤버별 잔액을 계산한다.
 *
 * 각 경비에 대해:
 *   - 결제자(paidBy)는 실제 결제한 만큼 "받을 돈" 증가
 *   - splits의 각 멤버는 본인 부담액만큼 "줄 돈" 증가
 *
 * 결과: 양수 = 다른 멤버에게 받아야 함, 음수 = 다른 멤버에게 줘야 함
 */
export function calcBalances(expenses: ExpenseInput[]): BalanceMap {
  const balances: BalanceMap = {};

  for (const expense of expenses) {
    const { paidById, amountKRW, splits } = expense;

    // 결제자는 전체 금액만큼 크레딧(받을 돈) 증가
    balances[paidById] = (balances[paidById] ?? 0) + amountKRW;

    // 각 분담자는 자기 부담액만큼 데빗(줄 돈) 증가
    for (const split of splits) {
      balances[split.memberId] = (balances[split.memberId] ?? 0) - split.amount;
    }
  }

  return balances;
}

/**
 * 최소 거래 수로 정산하는 Greedy 알고리즘.
 *
 * 가장 많이 빚진 사람(최소 잔액)이 가장 많이 받을 사람(최대 잔액)에게
 * 둘 중 작은 절대값만큼 이체하는 것을 반복한다.
 * 4인 가족이므로 최대 3회 이체로 정산 가능하다.
 */
export function calcMinTransfers(balances: BalanceMap): Transfer[] {
  // 잔액이 0이 아닌 멤버만 추출
  const entries = Object.entries(balances)
    .map(([id, amount]) => ({ id, amount }))
    .filter((e) => Math.abs(e.amount) >= 1); // 1원 미만 무시

  const transfers: Transfer[] = [];

  // 정산할 항목이 없으면 빈 배열 반환
  if (entries.length === 0) return transfers;

  // Greedy: 매 반복마다 debtor(음수)와 creditor(양수)를 매칭
  while (true) {
    // 최소값(가장 큰 빚)과 최대값(가장 많이 받을 사람)을 찾는다
    let minIdx = 0;
    let maxIdx = 0;

    for (let i = 1; i < entries.length; i++) {
      if (entries[i].amount < entries[minIdx].amount) minIdx = i;
      if (entries[i].amount > entries[maxIdx].amount) maxIdx = i;
    }

    const debtor = entries[minIdx];
    const creditor = entries[maxIdx];

    // 둘 다 0에 수렴하면 종료
    if (Math.abs(debtor.amount) < 1 && Math.abs(creditor.amount) < 1) {
      break;
    }

    // 이체 금액: 둘 중 작은 절대값
    const transferAmount = Math.min(Math.abs(debtor.amount), creditor.amount);

    // 100원 단위 반올림
    const rounded = Math.round(transferAmount / 100) * 100;

    if (rounded > 0) {
      transfers.push({
        from: debtor.id,
        to: creditor.id,
        amount: rounded,
      });
    }

    // 잔액 갱신
    debtor.amount += transferAmount;
    creditor.amount -= transferAmount;
  }

  return transfers;
}
