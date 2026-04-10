'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { BottomNav } from '@/components/layout/bottom-nav';
import { OfflineBanner } from '@/components/layout/offline-banner';
import { UpdatePrompt } from '@/components/layout/update-prompt';
import { InstallPrompt } from '@/components/layout/install-prompt';

// 인증된 사용자 전용 레이아웃 — 미인증 시 /login으로 리다이렉트
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-[var(--color-text)]">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* UpdatePrompt(z-60)가 OfflineBanner(z-50)보다 우선 — 업데이트 알림 우선순위 */}
      <UpdatePrompt />
      <OfflineBanner />
      {/* 스크롤 가능한 메인 콘텐츠 — BottomNav 높이만큼 하단 여백 */}
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>
      {/* InstallPrompt(z-55)는 BottomNav 위·OfflineBanner 아래에 위치 — 설치 유도 */}
      <InstallPrompt />
      <BottomNav />
    </div>
  );
}
