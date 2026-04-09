'use client';

import type { Spot, SpotCategory } from '@/types';

// 카테고리별 아이콘 매핑
const CATEGORY_ICONS: Record<SpotCategory, string> = {
  transport: '🚂',
  sightseeing: '📍',
  meal: '🍽️',
  hotel: '🏨',
  activity: '⛰️',
};

const CATEGORY_LABELS: Record<SpotCategory, string> = {
  transport: '교통',
  sightseeing: '관광',
  meal: '식사',
  hotel: '숙소',
  activity: '액티비티',
};

interface SpotCardProps {
  spot: Spot;
}

// 장소 카드 — 일정 화면에서 각 장소를 표시하는 카드 컴포넌트
export function SpotCard({ spot }: SpotCardProps) {
  const icon = CATEGORY_ICONS[spot.category] ?? '📍';
  const categoryLabel = CATEGORY_LABELS[spot.category] ?? spot.category;

  // 시간 포맷: "09:00" → "09:00", 빈 값이면 표시 안함
  const timeDisplay =
    spot.startTime && spot.endTime
      ? `${spot.startTime} ~ ${spot.endTime}`
      : spot.startTime || '';

  return (
    <div
      className={`relative flex min-h-[48px] gap-3 rounded-xl bg-[var(--color-surface)] px-4 py-3 shadow-sm transition-shadow hover:shadow-md ${
        spot.isImportant
          ? 'border-2 border-[var(--color-accent)]'
          : 'border border-[var(--color-text)]/5'
      }`}
    >
      {/* 카테고리 아이콘 */}
      <div className="flex shrink-0 flex-col items-center pt-0.5">
        <span className="text-xl leading-none">{icon}</span>
        <span className="mt-1 text-[10px] text-[var(--color-text)]/40">
          {categoryLabel}
        </span>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col gap-1">
        {/* 장소명 + 예약 필수 배지 */}
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm font-bold text-[var(--color-text)]">
            {spot.name}
            {spot.nameLocal && (
              <span className="ml-1 text-xs font-normal text-[var(--color-text)]/40">
                {spot.nameLocal}
              </span>
            )}
          </p>
          {spot.isImportant && (
            <span className="shrink-0 rounded-md bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
              예약 필수
            </span>
          )}
        </div>

        {/* 시간 */}
        {timeDisplay && (
          <p className="text-xs text-[var(--color-text)]/60">
            🕐 {timeDisplay}
          </p>
        )}

        {/* 설명/노트 */}
        {spot.notes && (
          <p className="text-xs leading-relaxed text-[var(--color-text)]/70">
            {spot.notes}
          </p>
        )}

        {/* 비용 표시 */}
        {spot.cost !== null && spot.cost > 0 && (
          <p className="text-xs font-semibold text-[var(--color-secondary)]">
            💰 {spot.currency} {spot.cost.toLocaleString()}
          </p>
        )}

        {/* 예약번호 */}
        {spot.bookingRef && (
          <p className="text-xs text-[var(--color-accent)]">
            📋 예약: <span className="font-mono">{spot.bookingRef}</span>
          </p>
        )}

        {/* 우천 대안 */}
        {spot.weatherAlternative && (
          <p className="text-xs text-[var(--color-text)]/50">
            🌧️ 우천 시: {spot.weatherAlternative}
          </p>
        )}

        {/* 지도/길안내 버튼 */}
        {(spot.mapUrl || spot.navUrl) && (
          <div className="mt-1 flex gap-2">
            {spot.mapUrl && (
              <a
                href={spot.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[32px] items-center rounded-lg bg-[var(--color-primary)]/10 px-3 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
              >
                🗺️ 지도
              </a>
            )}
            {spot.navUrl && (
              <a
                href={spot.navUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[32px] items-center rounded-lg bg-[var(--color-secondary)]/10 px-3 text-xs font-medium text-[var(--color-secondary)] transition-colors hover:bg-[var(--color-secondary)]/20"
              >
                🧭 길안내
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
