'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { login } from '@/lib/api';
import type { MemberPreset } from '@/types';

// 가족 4인 멤버 프리셋 — CLAUDE.md 멤버 정보 기준
const MEMBER_PRESETS: MemberPreset[] = [
  { memberId: 'member-jinhyung', memberName: '진형', emoji: '👨', color: '#E53E3E' },
  { memberId: 'member-jihyun', memberName: '지현', emoji: '👩', color: '#DD6B20' },
  { memberId: 'member-dongwoo', memberName: '동우', emoji: '👦', color: '#38A169' },
  { memberId: 'member-yujin', memberName: '유진', emoji: '👧', color: '#3182CE' },
];

export default function SelectMemberPage() {
  const router = useRouter();
  const { pendingPin, clearPendingPin, setMember } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // PIN이 없으면 로그인 화면으로 리다이렉트
  useEffect(() => {
    if (!pendingPin) {
      router.replace('/login');
    }
  }, [pendingPin, router]);

  const handleSelectMember = async (preset: MemberPreset) => {
    if (isSubmitting || !pendingPin) return;

    setIsSubmitting(true);
    setSelectedId(preset.memberId);
    setError('');

    const result = await login(pendingPin, preset.memberId);

    if (result.success && result.data) {
      // 로그인 성공: zustand에 멤버 저장 후 홈으로 이동
      setMember(result.data.member);
      clearPendingPin();
      router.replace('/');
    } else {
      // 로그인 실패: PIN 오류 → 로그인 화면으로
      clearPendingPin();
      setIsSubmitting(false);
      setSelectedId(null);

      if (result.error?.includes('PIN') || result.error?.includes('pin')) {
        router.replace('/login?error=invalid_pin');
      } else {
        setError(result.error ?? '로그인에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // PIN 없으면 빈 화면 (리다이렉트 대기)
  if (!pendingPin) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-4 py-8">
      {/* 제목 */}
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          누구세요? 😊
        </h1>
        <p className="text-sm text-[var(--color-text)]/60 mt-2">
          멤버를 선택해주세요
        </p>
      </div>

      {/* 2x2 멤버 카드 그리드 */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-[320px]">
        {MEMBER_PRESETS.map((preset) => {
          const isSelected = selectedId === preset.memberId;
          const isDisabled = isSubmitting && !isSelected;

          return (
            <button
              key={preset.memberId}
              type="button"
              onClick={() => handleSelectMember(preset)}
              disabled={isSubmitting}
              className={`
                flex flex-col items-center justify-center
                min-h-[140px] rounded-2xl
                border-2 transition-all duration-200
                ${isSelected
                  ? 'scale-95 opacity-70'
                  : 'hover:scale-[1.02] active:scale-95'
                }
                ${isDisabled ? 'opacity-40' : ''}
              `}
              style={{
                borderColor: preset.color,
                backgroundColor: `${preset.color}10`,
              }}
            >
              {/* 로딩 스피너 또는 이모지 */}
              {isSelected && isSubmitting ? (
                <div
                  className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin mb-2"
                  style={{ borderColor: `${preset.color}40`, borderTopColor: 'transparent' }}
                />
              ) : (
                <span className="text-5xl mb-2">{preset.emoji}</span>
              )}
              <span
                className="text-lg font-bold"
                style={{ color: preset.color }}
              >
                {preset.memberName}
              </span>
            </button>
          );
        })}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="mt-6 text-sm text-red-600 font-medium text-center">
          {error}
        </p>
      )}

      {/* 뒤로 가기 버튼 */}
      <button
        type="button"
        onClick={() => {
          clearPendingPin();
          router.replace('/login');
        }}
        disabled={isSubmitting}
        className="mt-8 text-sm text-[var(--color-text)]/50 hover:text-[var(--color-text)]/80 transition-colors disabled:opacity-30"
      >
        ← PIN 다시 입력
      </button>
    </div>
  );
}
