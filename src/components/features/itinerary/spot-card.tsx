'use client';

import type { Spot, SpotCategory } from '@/types';
import {
  Train,
  Landmark,
  Utensils,
  BedDouble,
  Mountain,
  Clock,
  Coins,
  Ticket,
  CloudRain,
  Map as MapIcon,
  Navigation,
  type LucideIcon,
} from 'lucide-react';

// 카테고리별 아이콘 매핑
const CATEGORY_ICONS: Record<SpotCategory, LucideIcon> = {
  transport: Train,
  sightseeing: Landmark,
  meal: Utensils,
  hotel: BedDouble,
  activity: Mountain,
};

const CATEGORY_LABELS: Record<SpotCategory, string> = {
  transport: '교통',
  sightseeing: '관광',
  meal: '식사',
  hotel: '숙소',
  activity: '액티비티',
};

// 카테고리별 아이콘 색상 — 톤온톤으로 은은하게 구분
const CATEGORY_COLORS: Record<SpotCategory, string> = {
  transport: 'text-blue-500',
  sightseeing: 'text-rose-500',
  meal: 'text-amber-600',
  hotel: 'text-emerald-600',
  activity: 'text-stone-600',
};

interface SpotCardProps {
  spot: Spot;
}

// 장소 카드 — 일정 화면에서 각 장소를 표시하는 카드 컴포넌트
export function SpotCard({ spot }: SpotCardProps) {
  const Icon = CATEGORY_ICONS[spot.category] ?? Landmark;
  const categoryLabel = CATEGORY_LABELS[spot.category] ?? spot.category;
  const iconColor = CATEGORY_COLORS[spot.category] ?? 'text-stone-600';

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
        <Icon size={22} className={iconColor} aria-hidden />
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
          <p className="flex items-center gap-1 text-xs text-[var(--color-text)]/60">
            <Clock size={12} aria-hidden />
            {timeDisplay}
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
          <p className="flex items-center gap-1 text-xs font-semibold text-[var(--color-secondary)]">
            <Coins size={12} aria-hidden />
            {spot.currency} {spot.cost.toLocaleString()}
          </p>
        )}

        {/* 예약번호 */}
        {spot.bookingRef && (
          <p className="flex items-center gap-1 text-xs text-[var(--color-accent)]">
            <Ticket size={12} aria-hidden />
            예약: <span className="font-mono">{spot.bookingRef}</span>
          </p>
        )}

        {/* 우천 대안 */}
        {spot.weatherAlternative && (
          <p className="flex items-center gap-1 text-xs text-[var(--color-text)]/50">
            <CloudRain size={12} aria-hidden />
            우천 시: {spot.weatherAlternative}
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
                className="flex min-h-[32px] items-center gap-1 rounded-lg bg-[var(--color-primary)]/10 px-3 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
              >
                <MapIcon size={14} aria-hidden />
                지도
              </a>
            )}
            {spot.navUrl && (
              <a
                // maps.google.com/dir/ → www.google.com/maps/dir/ (404 수정)
                href={spot.navUrl.replace('https://maps.google.com/', 'https://www.google.com/maps/')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[32px] items-center gap-1 rounded-lg bg-[var(--color-secondary)]/10 px-3 text-xs font-medium text-[var(--color-secondary)] transition-colors hover:bg-[var(--color-secondary)]/20"
              >
                <Navigation size={14} aria-hidden />
                길안내
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
