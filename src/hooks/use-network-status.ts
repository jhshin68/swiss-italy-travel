// use-network-status.ts — 네트워크 연결 상태 감지 훅
// navigator.onLine + online/offline 이벤트를 이용하여 실시간 네트워크 상태를 반환한다.

'use client';

import { useState, useEffect } from 'react';

interface NetworkStatus {
  /** 현재 온라인 여부 */
  isOnline: boolean;
}

/** 브라우저 네트워크 온/오프라인 상태를 추적하는 훅 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 초기값: 브라우저 API로 현재 상태 확인
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
