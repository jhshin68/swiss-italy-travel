'use client';

import { useNetworkStatus } from '@/hooks/use-network-status';

/**
 * 오프라인 상태 감지 배너
 * - 오프라인일 때 노란 배너 표시
 * - 온라인 상태에서는 배너를 보여주지 않는다 (네트워크 복귀는 UI가 자연스럽게 복구됨)
 *
 * 표시 상태는 isOnline 값에서 직접 파생되므로 useEffect + setState 없이 순수 렌더링이다.
 */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed left-0 right-0 top-0 z-50 border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-800"
    >
      오프라인 상태입니다. 일정·비상정보는 정상 이용 가능합니다
    </div>
  );
}
