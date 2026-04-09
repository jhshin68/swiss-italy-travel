'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function HomePage() {
  const router = useRouter();
  const { member, isAuthenticated, isLoading, checkAuth, logout } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 인증 확인 중
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-[var(--color-text)]">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated || !member) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* 환영 메시지 */}
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-6xl">{member.emoji}</span>
        <h1 className="text-xl font-bold text-[var(--color-text)]">
          환영합니다, {member.memberName}님!
        </h1>
        <p className="text-sm text-[var(--color-text)]/60">
          swiss-italy-travel에 오신 것을 환영합니다
        </p>
      </div>

      {/* 로그아웃 버튼 */}
      <button
        type="button"
        onClick={handleLogout}
        className="mt-10 min-h-[48px] rounded-xl bg-[var(--color-primary)] px-8 text-base font-medium text-white transition-colors hover:opacity-90 active:opacity-80"
      >
        로그아웃
      </button>
    </div>
  );
}
