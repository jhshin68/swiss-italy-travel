'use client';

import type { ScheduleItem } from '@/data/itinerary';

// 카테고리별 아이콘
const CATEGORY_ICONS: Record<ScheduleItem['type'], string> = {
  transport: '🚂',
  sightseeing: '🏛',
  meal: '🍽',
  hotel: '🏨',
  activity: '⛰️',
};

interface SpotListPanelProps {
  items: ScheduleItem[];
  city: string;
  theme: string;
}

// 지도 아래 장소 목록 패널 — 선택된 Day의 스팟 리스트
export function SpotListPanel({ items, city, theme }: SpotListPanelProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-[var(--color-text)]/50">
          등록된 장소가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      {/* 도시·테마 헤더 */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-bold text-[var(--color-text)]">
          {city}
        </span>
        <span className="rounded-md bg-[var(--color-background)] px-2 py-0.5 text-[10px] text-[var(--color-text)]/60">
          {theme}
        </span>
      </div>

      {/* 장소 리스트 */}
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
            item.important
              ? 'border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/5'
              : 'border border-[var(--color-text)]/5 bg-[var(--color-surface)]'
          }`}
        >
          {/* 카테고리 아이콘 */}
          <span className="mt-0.5 text-base leading-none">
            {CATEGORY_ICONS[item.type]}
          </span>

          {/* 본문 */}
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex items-start gap-2">
              {/* 시간 + 이름 */}
              <p className="flex-1 text-sm font-semibold text-[var(--color-text)]">
                {item.time && (
                  <span className="mr-1.5 text-xs font-normal text-[var(--color-text)]/50">
                    {item.time}
                  </span>
                )}
                {item.name}
              </p>
              {item.important && (
                <span className="shrink-0 rounded-md bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  필수
                </span>
              )}
            </div>

            {/* 설명 */}
            {item.desc && (
              <p className="text-xs leading-relaxed text-[var(--color-text)]/60">
                {item.desc}
              </p>
            )}

            {/* 비용 */}
            {item.cost && (
              <p className="text-xs font-medium text-[var(--color-secondary)]">
                {item.cost}
              </p>
            )}

            {/* 팁 */}
            {item.tip && (
              <p className="text-xs text-[var(--color-accent)]">
                💡 {item.tip}
              </p>
            )}

            {/* 지도/길안내 버튼 */}
            {(item.mapUrl || item.navUrl) && (
              <div className="mt-1 flex gap-2">
                {item.mapUrl && (
                  <a
                    href={item.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[28px] items-center rounded-lg bg-[var(--color-primary)]/10 px-2.5 text-[11px] font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
                  >
                    🗺️ 지도
                  </a>
                )}
                {item.navUrl && (
                  <a
                    href={item.navUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[28px] items-center rounded-lg bg-[var(--color-secondary)]/10 px-2.5 text-[11px] font-medium text-[var(--color-secondary)] transition-colors hover:bg-[var(--color-secondary)]/20"
                  >
                    🧭 길안내
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
