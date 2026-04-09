'use client';

import { useState, useEffect, useCallback } from 'react';
import { getExpenses, deleteExpense } from '@/lib/api';
import type { Expense, ExpenseCategory } from '@/types';

// 카테고리별 아이콘·레이블
const CATEGORY_META: Record<ExpenseCategory, { icon: string; label: string }> = {
  food: { icon: '\u{1F37D}\uFE0F', label: '식사' },
  transport: { icon: '\u{1F682}', label: '교통' },
  activity: { icon: '\u26F0\uFE0F', label: '액티비티' },
  shopping: { icon: '\u{1F6CD}\uFE0F', label: '쇼핑' },
  accommodation: { icon: '\u{1F3E8}', label: '숙소' },
  etc: { icon: '\u{1F4E6}', label: '기타' },
};

interface TodayTabProps {
  tripId: string;
  /** 외부에서 갱신이 필요할 때 변하는 카운터 */
  refreshKey: number;
}

// 오늘 탭 — 오늘 날짜의 경비 목록 표시
export function TodayTab({ tripId, refreshKey }: TodayTabProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getExpenses(tripId, today);
    if (result.success && result.data) {
      setExpenses(result.data);
    } else {
      setError(result.error ?? '경비를 불러올 수 없습니다.');
    }
    setIsLoading(false);
  }, [tripId, today]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleDelete = async (expenseId: number) => {
    const confirmed = window.confirm('이 경비를 삭제하시겠습니까?');
    if (!confirmed) return;
    const result = await deleteExpense(tripId, expenseId);
    if (result.success) {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    }
  };

  // 오늘 총 지출 (KRW 기준)
  const totalKrw = expenses.reduce((sum, e) => sum + e.amountKrw, 0);

  // ── 로딩 ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-[var(--color-text)]/50">불러오는 중...</p>
      </div>
    );
  }

  // ── 에러 ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-center text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={load}
          className="min-h-[48px] rounded-xl bg-[var(--color-primary)] px-6 text-sm font-medium text-white"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 오늘 날짜 + 총 합계 */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-text)]/70">
          {today}
        </p>
        <p className="text-base font-bold text-[var(--color-primary)]">
          {totalKrw > 0 ? `\u20A9${totalKrw.toLocaleString()}` : '\u20A90'}
        </p>
      </div>

      {/* 경비 리스트 */}
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-3xl">&#x1F4B0;</p>
          <p className="mt-2 text-sm text-[var(--color-text)]/50">
            오늘 아직 지출이 없어요
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {expenses.map((expense) => {
            const meta =
              CATEGORY_META[expense.category as ExpenseCategory] ??
              CATEGORY_META.etc;

            return (
              <li
                key={expense.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-text)]/5 bg-[var(--color-surface)] px-4 py-3 shadow-sm"
              >
                {/* 카테고리 아이콘 */}
                <span className="text-xl leading-none">{meta.icon}</span>

                {/* 설명·결제자 */}
                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                    {expense.description || meta.label}
                  </p>
                  <p className="text-xs text-[var(--color-text)]/50">
                    {expense.paidByEmoji} {expense.paidByName} &middot;{' '}
                    {expense.time?.slice(0, 5) ?? ''}
                  </p>
                </div>

                {/* 금액 */}
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <p className="text-sm font-bold text-[var(--color-text)]">
                    {expense.currency}{' '}
                    {expense.amount.toLocaleString()}
                  </p>
                  {expense.currency !== 'KRW' && (
                    <p className="text-[10px] text-[var(--color-text)]/40">
                      &#x20A9;{expense.amountKrw.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* 삭제 버튼 */}
                <button
                  type="button"
                  onClick={() => handleDelete(expense.id)}
                  className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-[var(--color-text)]/30 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label="삭제"
                >
                  &#x2715;
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
