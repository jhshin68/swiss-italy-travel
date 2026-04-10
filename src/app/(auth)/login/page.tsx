'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

// 실패 횟수 제한 상수
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5분

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth, setPendingPin } = useAuthStore();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  // attempts는 setter만 쓰되 getter는 세터 functional form으로 접근 — render 중 사용 안 함
  const [, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // 이미 인증되어 있으면 홈으로 이동
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // 잠금 타이머 카운트다운
  useEffect(() => {
    if (!lockedUntil) return;

    const interval = setInterval(() => {
      const remaining = lockedUntil - Date.now();
      if (remaining <= 0) {
        setLockedUntil(null);
        setRemainingTime(0);
        setAttempts(0);
        setError('');
      } else {
        setRemainingTime(Math.ceil(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  // render 중 Date.now() 직접 호출 금지 — remainingTime 타이머 상태로 판정
  const isLocked = lockedUntil !== null && remainingTime > 0;

  // 숫자 키 입력
  const handleKeyPress = useCallback((digit: string) => {
    if (isLocked) return;
    if (pin.length >= 6) return;

    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    // 6자리 완성 시 멤버 선택 화면으로 이동
    if (newPin.length === 6) {
      setPendingPin(newPin);
      router.push('/select-member');
    }
  }, [pin, isLocked, setPendingPin, router]);

  // 백스페이스
  const handleDelete = useCallback(() => {
    if (isLocked) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, [isLocked]);

  // 멤버 선택 화면에서 돌아왔을 때 (PIN 오류) 처리
  // 이 페이지에서는 PIN만 입력받고, 서버 검증은 select-member에서 수행
  // PIN 오류 시 select-member에서 이 페이지로 리다이렉트하며 에러 상태를 전달
  // setState는 마이크로태스크로 지연시켜 effect 동기 본체에서 제외한다
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') !== 'invalid_pin') return;

    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setError('PIN이 올바르지 않습니다');
      setPin('');
      setAttempts((prev) => {
        const next = prev + 1;
        if (next >= MAX_ATTEMPTS) {
          const lockTime = Date.now() + LOCKOUT_DURATION_MS;
          setLockedUntil(lockTime);
          setRemainingTime(Math.ceil(LOCKOUT_DURATION_MS / 1000));
          setError('');
        }
        return next;
      });
      // URL에서 쿼리 파라미터 제거
      window.history.replaceState({}, '', '/login');
    });
    return () => { cancelled = true; };
  }, []);

  // 잠금 시간 포맷 (분:초)
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // 키패드 레이아웃
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="text-lg text-[var(--color-text)]">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-[var(--color-background)] px-4 py-8">
      {/* 상단: 앱 로고 영역 */}
      <div className="flex flex-col items-center pt-8">
        <div className="text-5xl mb-3">✈️</div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">
          swiss-italy-travel
        </h1>
        <p className="text-sm text-[var(--color-text)]/60 mt-1">
          가족 여행 컴패니언
        </p>
      </div>

      {/* 중간: PIN 인디케이터 + 에러 메시지 */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-base font-medium text-[var(--color-text)]">
          PIN 6자리를 입력하세요
        </p>

        {/* PIN 인디케이터 6개 */}
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? 'bg-[var(--color-primary)] scale-110'
                  : 'bg-[var(--color-text)]/20'
              }`}
            />
          ))}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-red-600 font-medium animate-shake">
            {error}
          </p>
        )}

        {/* 잠금 메시지 */}
        {isLocked && (
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-red-600 font-medium">
              5분 후 다시 시도하세요
            </p>
            <p className="text-xl font-mono text-red-600 font-bold">
              {formatTime(remainingTime)}
            </p>
          </div>
        )}
      </div>

      {/* 하단: 숫자 키패드 */}
      <div className="w-full max-w-[280px] pb-4">
        <div className="grid grid-cols-3 gap-3">
          {keys.flat().map((key, idx) => {
            if (key === '') {
              return <div key={idx} />;
            }

            if (key === 'del') {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={handleDelete}
                  disabled={isLocked || pin.length === 0}
                  className="flex min-h-[56px] items-center justify-center rounded-xl text-lg font-medium text-[var(--color-text)]/70 transition-colors hover:bg-[var(--color-text)]/5 active:bg-[var(--color-text)]/10 disabled:opacity-30"
                  aria-label="삭제"
                >
                  ←
                </button>
              );
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleKeyPress(key)}
                disabled={isLocked}
                className="flex min-h-[56px] items-center justify-center rounded-xl text-2xl font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-text)]/5 active:bg-[var(--color-primary)]/10 disabled:opacity-30"
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
