// use-network-status.ts — 네트워크 연결 상태 감지 훅
// useSyncExternalStore 기반 — effect 내 setState 없이 외부 스토어에 직접 구독한다.

'use client';

import { useSyncExternalStore } from 'react';

interface NetworkStatus {
  /** 현재 온라인 여부 */
  isOnline: boolean;
}

// 브라우저 online/offline 이벤트에 리스너 연결
function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

// 클라이언트 스냅샷 — navigator.onLine을 그대로 반환
function getSnapshot(): boolean {
  return navigator.onLine;
}

// 서버 스냅샷 — SSR에서는 항상 온라인으로 간주
function getServerSnapshot(): boolean {
  return true;
}

/** 브라우저 네트워크 온/오프라인 상태를 추적하는 훅 */
export function useNetworkStatus(): NetworkStatus {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { isOnline };
}
