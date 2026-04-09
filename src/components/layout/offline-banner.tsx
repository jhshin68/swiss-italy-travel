'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 오프라인 상태 감지 배너
 * - 오프라인 진입 시 노란 배너 표시
 * - 온라인 복귀 시 2초 후 자동 닫힘
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
    setShowBanner(true);
  }, []);

  const handleOnline = useCallback(() => {
    setIsOffline(false);
    // 온라인 복귀 시 2초 후 배너 자동 닫힘
    const timer = setTimeout(() => {
      setShowBanner(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 초기 상태 확인
    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOffline, handleOnline]);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      role="alert"
      className={`
        fixed top-0 left-0 right-0 z-50
        px-4 py-2 text-center text-sm font-medium
        transition-colors duration-300
        ${isOffline
          ? 'bg-amber-100 text-amber-800 border-b border-amber-300'
          : 'bg-emerald-100 text-emerald-800 border-b border-emerald-300'
        }
      `}
    >
      {isOffline
        ? '오프라인 상태입니다. 일정·비상정보는 정상 이용 가능합니다'
        : '온라인으로 복귀했습니다'
      }
    </div>
  );
}
