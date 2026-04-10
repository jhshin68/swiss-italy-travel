'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Service Worker 업데이트 감지 훅
 * - next-pwa가 등록한 SW의 updatefound 이벤트를 구독
 * - 기존 controller가 존재(이미 실행 중인 구버전)하면서 새 워커가 installed 상태가 되면
 *   "업데이트 가능" 상태로 간주
 * - skipWaiting: true 설정이라 신규 SW는 즉시 activate되지만, 페이지는 여전히 구버전
 *   asset을 사용 중이므로 사용자가 명시적으로 reload 하도록 배너로 알린다.
 */
function useServiceWorkerUpdate(): {
  hasUpdate: boolean;
  applyUpdate: () => void;
} {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    // navigator.serviceWorker.ready는 active registration이 존재할 때 resolve
    void navigator.serviceWorker.ready.then((registration) => {
      if (cancelled) return;

      // 세션 시작 시점에 이미 waiting 워커가 있는 경우 — 직전 탭에서 설치됨
      if (registration.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(registration.waiting);
        setHasUpdate(true);
      }

      // 새 SW 발견 시 → statechange로 installed 감지
      const handleUpdateFound = () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // controller가 존재 = 기존 앱이 이미 구동 중 → 진짜 "업그레이드" 케이스
          // controller가 없으면 초기 설치라서 배너를 띄울 필요 없음
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setHasUpdate(true);
          }
        });
      };

      registration.addEventListener('updatefound', handleUpdateFound);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const applyUpdate = useCallback(() => {
    // skipWaiting: true 설정이라 대기 중인 워커는 이미 있거나 곧 activate된다.
    // 혹시 남은 waiting 워커가 있으면 명시적으로 SKIP_WAITING을 요청한 뒤 reload.
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, [waitingWorker]);

  return { hasUpdate, applyUpdate };
}

/**
 * 업데이트 알림 배너
 * - 새 Service Worker가 설치되었을 때 화면 최상단에 고정 노출
 * - z-[60]으로 OfflineBanner(z-50)보다 위에 배치 — 업데이트 우선
 */
export function UpdatePrompt() {
  const { hasUpdate, applyUpdate } = useServiceWorkerUpdate();

  if (!hasUpdate) return null;

  return (
    <div
      role="alert"
      className="fixed left-0 right-0 top-0 z-[60] flex items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
    >
      <span className="flex-1 truncate">새 버전이 있습니다 ✨</span>
      <button
        type="button"
        onClick={applyUpdate}
        className="shrink-0 rounded-md bg-white/25 px-3 py-1 text-xs font-semibold backdrop-blur transition-colors hover:bg-white/35 active:bg-white/30"
      >
        업데이트
      </button>
    </div>
  );
}
