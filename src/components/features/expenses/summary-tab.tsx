'use client';

import { useState, useEffect, useCallback } from 'react';
import { getExpenseSummary } from '@/lib/api';
import type { ExpenseSummary, ExpenseCategory } from '@/types';

// 카테고리 메타 — 색상은 바 차트용
const CATEGORY_META: Record<
  ExpenseCategory,
  { icon: string; label: string; color: string }
> = {
  food: { icon: '\u{1F37D}\uFE0F', label: '식사', color: '#C8552A' },
  transport: { icon: '\u{1F682}', label: '교통', color: '#6B7B3A' },
  activity: { icon: '\u26F0\uFE0F', label: '액티비티', color: '#D4A017' },
  shopping: { icon: '\u{1F6CD}\uFE0F', label: '쇼핑', color: '#8B5CF6' },
  accommodation: { icon: '\u{1F3E8}', label: '숙소', color: '#3B82F6' },
  etc: { icon: '\u{1F4E6}', label: '기타', color: '#9CA3AF' },
};

interface SummaryTabProps {
  tripId: string;
  refreshKey: number;
}

// 전체 탭 — 카테고리별·결제자별 요약
export function SummaryTab({ tripId, refreshKey }: SummaryTabProps) {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getExpenseSummary(tripId);
    if (result.success && result.data) {
      setSummary(result.data);
    } else {
      setError(result.error ?? '요약을 불러올 수 없습니다.');
    }
    setIsLoading(false);
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-[var(--color-text)]/50">불러오는 중...</p>
      </div>
    );
  }

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

  if (!summary || summary.totalKrw === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-3xl">&#x1F4CA;</p>
        <p className="mt-2 text-sm text-[var(--color-text)]/50">
          아직 경비 데이터가 없습니다
        </p>
      </div>
    );
  }

  // 카테고리별 데이터 정렬 (금액 내림차순)
  const categoryEntries = Object.entries(summary.byCategory)
    .sort(([, a], [, b]) => b - a);
  const maxCategoryAmount =
    categoryEntries.length > 0 ? categoryEntries[0][1] : 1;

  return (
    <div className="flex flex-col gap-6">
      {/* 총 지출 */}
      <div className="rounded-xl bg-[var(--color-surface)] px-4 py-4 shadow-sm">
        <p className="text-xs text-[var(--color-text)]/50">총 지출</p>
        <p className="mt-1 text-2xl font-bold text-[var(--color-primary)]">
          &#x20A9;{summary.totalKrw.toLocaleString()}
        </p>
      </div>

      {/* 카테고리별 비율 — 바 차트 */}
      <div className="rounded-xl bg-[var(--color-surface)] px-4 py-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">
          카테고리별 지출
        </p>
        <div className="flex flex-col gap-3">
          {categoryEntries.map(([cat, amount]) => {
            const meta =
              CATEGORY_META[cat as ExpenseCategory] ?? CATEGORY_META.etc;
            const pct = summary.totalKrw > 0
              ? Math.round((amount / summary.totalKrw) * 100)
              : 0;
            const barWidth =
              maxCategoryAmount > 0
                ? Math.max((amount / maxCategoryAmount) * 100, 4)
                : 0;

            return (
              <div key={cat} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text)]/70">
                    {meta.icon} {meta.label}
                  </span>
                  <span className="font-medium text-[var(--color-text)]">
                    &#x20A9;{amount.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[var(--color-text)]/5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: meta.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 결제자별 지출 */}
      <div className="rounded-xl bg-[var(--color-surface)] px-4 py-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">
          결제자별 지출
        </p>
        <div className="flex flex-col gap-2">
          {summary.byPayer.map((payer) => {
            const pct = summary.totalKrw > 0
              ? Math.round((payer.totalKrw / summary.totalKrw) * 100)
              : 0;

            return (
              <div
                key={payer.name}
                className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-3 py-2"
              >
                <span className="text-sm text-[var(--color-text)]">
                  {payer.emoji} {payer.name}
                </span>
                <span className="text-sm font-semibold text-[var(--color-text)]">
                  &#x20A9;{payer.totalKrw.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-[var(--color-text)]/40">
                    ({pct}%)
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
