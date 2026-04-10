'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSettlement } from '@/lib/api';
import type { Settlement } from '@/types';

interface SettleTabProps {
  tripId: string;
  refreshKey: number;
}

// 정산 탭 — 1인당 부담액 + 이체 목록
export function SettleTab({ tripId, refreshKey }: SettleTabProps) {
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 페치 — Promise 마이크로태스크 안에서만 setState 호출
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      const result = await getSettlement(tripId);
      if (cancelled) return;
      if (result.success && result.data) {
        setSettlement(result.data);
        setError(null);
      } else {
        setError(result.error ?? '정산 정보를 불러올 수 없습니다.');
      }
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [tripId, refreshKey]);

  // 다시 시도 — effect 밖(click handler)이므로 sync setState OK
  const retry = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getSettlement(tripId);
    if (result.success && result.data) {
      setSettlement(result.data);
    } else {
      setError(result.error ?? '정산 정보를 불러올 수 없습니다.');
    }
    setIsLoading(false);
  }, [tripId]);

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
          onClick={retry}
          className="min-h-[48px] rounded-xl bg-[var(--color-primary)] px-6 text-sm font-medium text-white"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 아직 경비가 없는 경우
  if (!settlement || settlement.perPerson === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-3xl">&#x1F9FE;</p>
        <p className="mt-2 text-sm text-[var(--color-text)]/50">
          경비를 입력하면 자동으로 정산됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1인당 부담액 */}
      <div className="rounded-xl bg-[var(--color-surface)] px-4 py-4 shadow-sm">
        <p className="text-xs text-[var(--color-text)]/50">1인당 부담액</p>
        <p className="mt-1 text-2xl font-bold text-[var(--color-primary)]">
          &#x20A9;{settlement.perPerson.toLocaleString()}
        </p>
      </div>

      {/* 개인별 잔액 */}
      <div className="rounded-xl bg-[var(--color-surface)] px-4 py-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">
          개인별 잔액
        </p>
        <div className="flex flex-col gap-2">
          {Object.entries(settlement.balances).map(([name, balance]) => {
            const isPositive = balance > 0;
            const isZero = balance === 0;

            return (
              <div
                key={name}
                className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-3 py-2"
              >
                <span className="text-sm text-[var(--color-text)]">{name}</span>
                <span
                  className={`text-sm font-semibold ${
                    isZero
                      ? 'text-[var(--color-text)]/40'
                      : isPositive
                        ? 'text-[var(--color-secondary)]'
                        : 'text-red-500'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  &#x20A9;{balance.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 이체 목록 */}
      {settlement.transfers.length > 0 && (
        <div className="rounded-xl bg-[var(--color-surface)] px-4 py-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">
            정산 이체
          </p>
          <div className="flex flex-col gap-2">
            {settlement.transfers.map((t, idx) => (
              <div
                key={`${t.from}-${t.to}-${idx}`}
                className="flex items-center justify-between rounded-lg border border-[var(--color-text)]/5 bg-[var(--color-background)] px-3 py-3"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-[var(--color-text)]">
                    {t.from}
                  </span>
                  <span className="text-[var(--color-text)]/30">&#x2192;</span>
                  <span className="font-medium text-[var(--color-text)]">
                    {t.to}
                  </span>
                </div>
                <span className="text-sm font-bold text-[var(--color-primary)]">
                  &#x20A9;{t.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
