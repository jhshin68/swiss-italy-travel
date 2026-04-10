'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

/**
 * Chrome의 beforeinstallprompt 이벤트 타입 — 표준 DOM 타입에 아직 없음.
 * prompt()와 userChoice는 Chromium 계열에서만 제공.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

// 사용자가 배너를 한 번 닫으면 이 기간 동안 다시 띄우지 않음.
// 너무 짧으면 지겹고, 너무 길면 가족 기기에 앱 설치 유도가 어려워 7일로 타협.
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const DISMISS_STORAGE_KEY = 'pwa-install-dismissed-at';

/**
 * Android Chrome PWA 설치 배너
 * - Chrome이 beforeinstallprompt 이벤트를 발생시키면 이벤트를 잡아 두고 배너 표시
 * - 사용자가 "설치" 클릭 → deferredPrompt.prompt() → 네이티브 설치 다이얼로그
 * - 이미 standalone으로 실행 중이거나, 최근에 닫았거나, iOS Safari라 이벤트 자체가 없으면 숨김
 *
 * Chrome 94+ 부터 mini-infobar가 기본 비활성화라 커스텀 UI가 없으면 설치 프롬프트가
 * 뜨지 않는다. 이 컴포넌트가 가족 구성원들이 한 번의 탭으로 홈 화면에 앱을 추가할
 * 수 있도록 만드는 핵심 진입점이다.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 이미 앱으로 실행 중 — 설치 배너 노출 불필요
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // iOS Safari 계열 — navigator.standalone이 true면 이미 홈 화면에 추가된 상태
    if ('standalone' in window.navigator && window.navigator.standalone) return;

    // 최근에 닫았으면 쿨다운 체크
    const dismissedAtRaw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
    if (dismissedAtRaw) {
      const dismissedAt = Number.parseInt(dismissedAtRaw, 10);
      if (
        Number.isFinite(dismissedAt) &&
        Date.now() - dismissedAt < DISMISS_COOLDOWN_MS
      ) {
        return;
      }
    }

    const handleBeforeInstall = (event: Event) => {
      // 네이티브 미니 인포바가 자동으로 뜨지 못하도록 기본 동작 차단 후 보관
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    // 설치 완료 시 배너 제거
    const handleInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    // 설치 수락 또는 거절 상관 없이 deferredPrompt는 1회용이라 비움
    setDeferredPrompt(null);
    if (choice.outcome === 'accepted') {
      setVisible(false);
    } else {
      // 거절 시에도 쿨다운을 걸어 같은 세션에서 반복 노출되지 않도록
      window.localStorage.setItem(
        DISMISS_STORAGE_KEY,
        Date.now().toString(),
      );
      setVisible(false);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="앱 설치"
      className="fixed bottom-20 left-4 right-4 z-[55] flex items-center gap-3 rounded-2xl border border-amber-200 bg-white/95 p-3 shadow-xl backdrop-blur"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
        <Download className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex-1 text-sm">
        <p className="font-semibold text-[var(--color-text)]">앱으로 설치하기</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          홈 화면에 추가하면 더 빠르게 열려요
        </p>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="shrink-0 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-600 active:bg-amber-700"
      >
        설치
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="닫기"
        className="shrink-0 rounded-lg p-1 text-[var(--color-text-muted)] transition-colors hover:bg-amber-50"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
