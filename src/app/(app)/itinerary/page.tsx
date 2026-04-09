'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getDays, getDayDetail } from '@/lib/api';
import { SpotCard } from '@/components/features/itinerary/spot-card';
import type { DayPlan, Spot } from '@/types';

// 여행 시작일 — Day 번호 계산용
const TRIP_START = new Date('2026-10-08');

// 날짜 버튼의 국가별 배경색 매핑
function getDayBgClass(country: DayPlan['country']): string {
  switch (country) {
    case 'switzerland':
      return 'bg-[var(--color-primary)] text-white';
    case 'italy':
      return 'bg-[var(--color-secondary)] text-white';
    case 'transit':
      return 'bg-[var(--color-accent)] text-white';
    default:
      return 'bg-[var(--color-surface)] text-[var(--color-text)]';
  }
}

// 비활성 날짜 버튼 스타일
function getDayInactiveBgClass(country: DayPlan['country']): string {
  switch (country) {
    case 'switzerland':
      return 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]';
    case 'italy':
      return 'bg-[var(--color-secondary)]/15 text-[var(--color-secondary)]';
    case 'transit':
      return 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]';
    default:
      return 'bg-[var(--color-surface)] text-[var(--color-text)]';
  }
}

// 오늘이 여행 기간 내라면 해당 Day 번호, 아니면 1
function getInitialDayIndex(days: DayPlan[]): number {
  const now = new Date();
  const startMs = TRIP_START.getTime();
  const diffDays =
    Math.floor((now.getTime() - startMs) / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays >= 1 && diffDays <= days.length) {
    return diffDays - 1;
  }
  return 0;
}

export default function ItineraryPage() {
  const { member } = useAuthStore();
  const tripId = member?.tripId ?? '1';

  const [days, setDays] = useState<DayPlan[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [isLoadingDays, setIsLoadingDays] = useState(true);
  const [isLoadingSpots, setIsLoadingSpots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 가로 스크롤 날짜 버튼 컨테이너 ref
  const scrollRef = useRef<HTMLDivElement>(null);
  // 선택된 날짜 버튼 ref (자동 스크롤용)
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  // 날짜 목록 로드
  useEffect(() => {
    let cancelled = false;

    async function loadDays() {
      setIsLoadingDays(true);
      setError(null);

      const result = await getDays(tripId);
      if (cancelled) return;

      if (result.success && result.data) {
        setDays(result.data);
        const initialIdx = getInitialDayIndex(result.data);
        setSelectedIdx(initialIdx);
      } else {
        setError(result.error ?? '일정을 불러올 수 없습니다.');
      }
      setIsLoadingDays(false);
    }

    loadDays();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  // 선택된 날짜의 장소 목록 로드
  const selectedDay = days[selectedIdx];

  const loadSpots = useCallback(async () => {
    if (!selectedDay) return;

    setIsLoadingSpots(true);
    const result = await getDayDetail(tripId, selectedDay.date);
    if (result.success && result.data) {
      setSpots(result.data.spots);
    } else {
      setSpots([]);
    }
    setIsLoadingSpots(false);
  }, [tripId, selectedDay]);

  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

  // 선택된 날짜 버튼이 가시 영역에 오도록 자동 스크롤
  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedIdx]);

  // 날짜 선택 핸들러
  const handleDaySelect = (idx: number) => {
    setSelectedIdx(idx);
  };

  // ── 로딩/에러 상태 ────────────────────────

  if (isLoadingDays) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-base text-[var(--color-text)]/60">
          일정을 불러오는 중...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
        <p className="text-center text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-[48px] rounded-xl bg-[var(--color-primary)] px-6 text-sm font-medium text-white"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-base text-[var(--color-text)]/60">
          등록된 일정이 없습니다.
        </p>
      </div>
    );
  }

  // ── 메인 렌더 ──────────────────────────

  return (
    <div className="flex flex-col">
      {/* 페이지 헤더 */}
      <header className="px-4 pt-5 pb-2">
        <h1 className="text-xl font-bold text-[var(--color-text)]">
          📅 일정
        </h1>
        <p className="mt-0.5 text-xs text-[var(--color-text)]/50">
          11박 12일 스위스 · 이탈리아
        </p>
      </header>

      {/* 가로 스크롤 날짜 버튼 */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {days.map((day, idx) => {
          const isSelected = idx === selectedIdx;
          const dayNum = idx + 1;

          return (
            <button
              key={day.id}
              ref={isSelected ? activeBtnRef : undefined}
              type="button"
              onClick={() => handleDaySelect(idx)}
              className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-2 text-center transition-all ${
                isSelected
                  ? `${getDayBgClass(day.country)} shadow-md scale-105`
                  : `${getDayInactiveBgClass(day.country)} hover:opacity-80`
              }`}
              style={{ minWidth: '60px' }}
            >
              <span className="text-[10px] font-medium opacity-80">
                Day
              </span>
              <span className="text-lg font-bold leading-tight">
                {dayNum}
                {day.country === 'transit' && !isSelected && ' ⚠'}
              </span>
              <span className="mt-0.5 max-w-[56px] truncate text-[10px] leading-tight opacity-80">
                {day.city}
              </span>
            </button>
          );
        })}
      </div>

      {/* 선택된 날짜 정보 헤더 */}
      {selectedDay && (
        <div className="mx-4 rounded-xl bg-[var(--color-surface)] px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-[var(--color-text)]">
                {selectedDay.title}
              </p>
              <p className="text-xs text-[var(--color-text)]/50">
                {selectedDay.date} · {selectedDay.city}
              </p>
            </div>
            {selectedDay.theme && (
              <span className="rounded-lg bg-[var(--color-background)] px-2 py-1 text-xs text-[var(--color-text)]/60">
                {selectedDay.theme}
              </span>
            )}
          </div>
          {selectedDay.hotel && (
            <p className="mt-1.5 text-xs text-[var(--color-text)]/50">
              🏨 {selectedDay.hotel}
            </p>
          )}
          {selectedDay.isSpecial && selectedDay.specialNote && (
            <p className="mt-1 text-xs font-medium text-[var(--color-accent)]">
              ⚠ {selectedDay.specialNote}
            </p>
          )}
        </div>
      )}

      {/* 장소 카드 목록 */}
      <section className="flex flex-col gap-3 px-4 py-4">
        {isLoadingSpots ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-[var(--color-text)]/50">
              장소를 불러오는 중...
            </p>
          </div>
        ) : spots.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-[var(--color-text)]/50">
              등록된 장소가 없습니다.
            </p>
          </div>
        ) : (
          spots.map((spot) => <SpotCard key={spot.id} spot={spot} />)
        )}
      </section>
    </div>
  );
}
