'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ITINERARY from '@/data/itinerary';
import type { DaySchedule } from '@/data/itinerary';
import { SpotListPanel } from '@/components/features/map/spot-list-panel';

// Leaflet은 window 객체가 필요하므로 SSR 비활성화
const MapView = dynamic(
  () =>
    import('@/components/features/map/map-view').then((m) => ({
      default: m.MapView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[55vh] items-center justify-center bg-[var(--color-background)]">
        <p className="text-sm text-[var(--color-text)]/50">
          지도 로딩 중...
        </p>
      </div>
    ),
  },
);

// 여행 시작일 — Day 번호 계산용
const TRIP_START = new Date('2026-10-08');

// 오늘이 여행 기간 내라면 해당 Day 인덱스, 아니면 0
function getInitialDayIndex(): number {
  const now = new Date();
  const diffDays =
    Math.floor(
      (now.getTime() - TRIP_START.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  if (diffDays >= 1 && diffDays <= ITINERARY.length) {
    return diffDays - 1;
  }
  return 0;
}

// 날짜 버튼의 국가별 활성 배경색
function getDayBgClass(country: DaySchedule['country']): string {
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

// 날짜 버튼의 비활성 배경색
function getDayInactiveBgClass(country: DaySchedule['country']): string {
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

export default function MapPage() {
  const [selectedIdx, setSelectedIdx] = useState(getInitialDayIndex);
  const [showAllRoute, setShowAllRoute] = useState(false);

  // 가로 스크롤 컨테이너와 활성 버튼 ref
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  const selectedDay = ITINERARY[selectedIdx];

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

  // Day 선택 시 전체 경로 보기 해제
  const handleDaySelect = (idx: number) => {
    setSelectedIdx(idx);
    setShowAllRoute(false);
  };

  return (
    <div className="flex flex-col">
      {/* 페이지 헤더 + 전체 경로 버튼 */}
      <header className="flex items-center justify-between px-4 pt-5 pb-2">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">
            🗺️ 지도
          </h1>
          <p className="mt-0.5 text-xs text-[var(--color-text)]/50">
            스위스 · 이탈리아 여행 루트
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAllRoute((prev) => !prev)}
          className={`min-h-[36px] rounded-xl px-3 text-xs font-medium transition-colors ${
            showAllRoute
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
          }`}
        >
          {showAllRoute ? '전체 경로' : '전체 경로'}
        </button>
      </header>

      {/* Day 가로 스크롤 버튼 */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {ITINERARY.map((day, idx) => {
          const isSelected = idx === selectedIdx && !showAllRoute;

          return (
            <button
              key={day.day}
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
                {day.day}
              </span>
              <span className="mt-0.5 max-w-[56px] truncate text-[10px] leading-tight opacity-80">
                {day.city}
              </span>
            </button>
          );
        })}
      </div>

      {/* Leaflet 지도 */}
      <MapView selectedDay={selectedDay} showAllRoute={showAllRoute} />

      {/* 하단 스팟 리스트 — BottomNav(64px) 고려 패딩 */}
      <div className="max-h-[30vh] overflow-y-auto pb-20">
        <SpotListPanel
          items={selectedDay.items}
          city={selectedDay.city}
          theme={selectedDay.theme}
        />
      </div>
    </div>
  );
}
