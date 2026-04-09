// use-offline-sync.ts — 오프라인 경비 동기화 훅
// 오프라인 상태에서 저장된 경비를 온라인 복귀 시 자동으로 서버에 전송한다.
// 실패한 항목은 다음 동기화 주기에 재시도한다.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getPendingExpenses,
  markAsSynced,
  getPendingCount,
  clearSyncedExpenses,
} from '@/lib/offline-store';
import { createExpense } from '@/lib/api';
import { useNetworkStatus } from './use-network-status';

interface OfflineSyncState {
  /** 서버 전송 대기 중인 경비 수 */
  pendingCount: number;
  /** 동기화 진행 중 여부 */
  isSyncing: boolean;
  /** 마지막 동기화 오류 메시지 */
  lastError: string | null;
  /** 수동 동기화 트리거 */
  syncNow: () => Promise<void>;
}

/** 오프라인 경비를 서버에 동기화하는 훅 */
export function useOfflineSync(tripId: number): OfflineSyncState {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();
  const syncingRef = useRef(false);

  // 대기 중인 경비 수 갱신
  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB 접근 실패 시 무시 (SSR 등)
    }
  }, []);

  // 미동기화 경비를 서버에 전송
  const syncNow = useCallback(async () => {
    // 중복 실행 방지
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    setLastError(null);

    try {
      const pending = await getPendingExpenses();

      if (pending.length === 0) {
        setIsSyncing(false);
        syncingRef.current = false;
        return;
      }

      let failCount = 0;

      for (const expense of pending) {
        try {
          const result = await createExpense(String(tripId), {
            amount: expense.amount,
            currency: expense.currency as 'KRW' | 'CHF' | 'EUR',
            category: expense.category as 'meal' | 'transport' | 'activity' | 'shopping' | 'accommodation' | 'etc',
            description: expense.description,
            paidBy: expense.paidBy,
            date: expense.date,
            time: expense.time,
          });

          if (result.success) {
            await markAsSynced(expense.id);
          } else {
            failCount++;
          }
        } catch {
          // 개별 전송 실패 — 다음 동기화 때 재시도
          failCount++;
        }
      }

      // 동기화 완료된 항목 정리
      await clearSyncedExpenses();
      await refreshCount();

      if (failCount > 0) {
        setLastError(`${failCount}건 동기화 실패 — 다음에 재시도합니다`);
      }
    } catch {
      setLastError('동기화 중 오류가 발생했습니다');
    } finally {
      setIsSyncing(false);
      syncingRef.current = false;
    }
  }, [tripId, refreshCount]);

  // 초기 마운트 시 대기 수 확인
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // 온라인 복귀 시 자동 동기화
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncNow();
    }
  }, [isOnline, pendingCount, syncNow]);

  return {
    pendingCount,
    isSyncing,
    lastError,
    syncNow,
  };
}
