'use client';

import { useMemo } from 'react';
import { Phone, Map as MapIcon } from 'lucide-react';
import ITINERARY from '@/data/itinerary';

// 호텔 상세 정보 — 도시명을 키로 매핑
interface HotelDetail {
  name: string;
  address: string;
  phone: string;
  emoji: string;
  mapQuery: string;
}

const HOTEL_DETAILS: Record<string, HotelDetail> = {
  '취리히': {
    name: 'Zurich Marriott Hotel',
    address: 'Neumühlequai 42, 8006 Zürich',
    phone: '+41-44-360-7070',
    emoji: '🏔',
    mapQuery: 'Zurich+Marriott+Hotel+Neumühlequai+42+Zürich',
  },
  '그린델발트': {
    name: 'Hotel Kreuz & Post',
    address: 'Dorfstrasse 85, 3818 Grindelwald',
    phone: '+41-33-854-5492',
    emoji: '⛰️',
    mapQuery: 'Hotel+Kreuz+Post+Dorfstrasse+85+Grindelwald',
  },
  '체르마트': {
    name: 'Hotel Bristol Zermatt',
    address: 'Schluhmattstrasse 3, 3920 Zermatt',
    phone: '+41-27-966-3366',
    emoji: '🏔',
    mapQuery: 'Hotel+Bristol+Zermatt+Schluhmattstrasse+3',
  },
  '피렌체': {
    name: 'Hotel Davanzati',
    address: 'Via Porta Rossa 5, 50123 Firenze',
    phone: '+39-055-286666',
    emoji: '🏛',
    mapQuery: 'Hotel+Davanzati+Via+Porta+Rossa+5+Firenze',
  },
  '로마': {
    name: 'Hotel Navona',
    address: 'Via dei Sediari 8, 00186 Roma',
    phone: '+39-06-6821-1392',
    emoji: '🏛',
    mapQuery: 'Hotel+Navona+Via+dei+Sediari+8+Roma',
  },
};

// 여행 시작일
const TRIP_START = new Date('2026-10-08');
const TRIP_DAYS = 12;

// 도시명에서 호텔 키를 추출 (itinerary의 city 필드에서 핵심 도시명 매칭)
function extractCityKey(city: string): string | null {
  const keys = Object.keys(HOTEL_DETAILS);
  for (const key of keys) {
    if (city.includes(key)) return key;
  }
  return null;
}

// 현재 날짜 기준으로 오늘의 숙소 정보를 계산
function useTodayHotel(): {
  status: 'before' | 'during' | 'after';
  dayNumber: number;
  hotel: HotelDetail | null;
  cityKey: string | null;
  hotelLabel: string;
} {
  return useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tripStart = new Date(TRIP_START.getFullYear(), TRIP_START.getMonth(), TRIP_START.getDate());

    const diffMs = today.getTime() - tripStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // 여행 시작 전
    if (diffDays < 0) {
      const firstDay = ITINERARY[0];
      const cityKey = firstDay ? extractCityKey(firstDay.city) : null;
      return {
        status: 'before' as const,
        dayNumber: 0,
        hotel: cityKey ? HOTEL_DETAILS[cityKey] : null,
        cityKey,
        hotelLabel: firstDay?.hotel ?? '',
      };
    }

    // 여행 종료 후
    if (diffDays >= TRIP_DAYS) {
      const lastDay = ITINERARY[ITINERARY.length - 1];
      const cityKey = lastDay ? extractCityKey(lastDay.city) : null;
      return {
        status: 'after' as const,
        dayNumber: TRIP_DAYS,
        hotel: cityKey ? HOTEL_DETAILS[cityKey] : null,
        cityKey,
        hotelLabel: lastDay?.hotel ?? '',
      };
    }

    // 여행 중
    const daySchedule = ITINERARY[diffDays];
    const cityKey = daySchedule ? extractCityKey(daySchedule.city) : null;
    return {
      status: 'during' as const,
      dayNumber: diffDays + 1,
      hotel: cityKey ? HOTEL_DETAILS[cityKey] : null,
      cityKey,
      hotelLabel: daySchedule?.hotel ?? '',
    };
  }, []);
}

// 전화번호에서 하이픈 제거
function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

// 오늘 숙소 카드 — 날짜 기반으로 현재 숙소 정보 표시
export function HotelCard() {
  const { status, dayNumber, hotel, cityKey, hotelLabel } = useTodayHotel();

  // 마지막 날(귀국일)은 숙소 없음
  const isLastDay = hotelLabel === '—';

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-bold text-[var(--color-text)]">
        🏨 오늘 숙소
      </h2>

      <div className="rounded-xl border border-[var(--color-text)]/5 bg-[var(--color-surface)] p-4 shadow-sm">
        {/* 상태 배지 */}
        {status === 'before' && (
          <div className="mb-3 rounded-lg bg-[var(--color-accent)]/10 px-3 py-2 text-xs text-[var(--color-accent)]">
            여행 시작 전입니다. 첫째 날 숙소 정보를 표시합니다.
          </div>
        )}
        {status === 'after' && (
          <div className="mb-3 rounded-lg bg-[var(--color-text)]/5 px-3 py-2 text-xs text-[var(--color-text)]/50">
            여행이 종료되었습니다.
          </div>
        )}

        {isLastDay ? (
          <p className="text-sm text-[var(--color-text)]/60">
            Day {dayNumber} — 귀국일이므로 숙소가 없습니다.
          </p>
        ) : hotel && cityKey ? (
          <>
            {/* 호텔명 + 도시 이모지 */}
            <div className="flex items-start gap-2">
              <span className="text-2xl">{hotel.emoji}</span>
              <div className="flex flex-1 flex-col">
                {status === 'during' && (
                  <span className="text-[11px] font-medium text-[var(--color-primary)]">
                    Day {dayNumber} · {cityKey}
                  </span>
                )}
                {status === 'before' && (
                  <span className="text-[11px] font-medium text-[var(--color-accent)]">
                    Day 1 · {cityKey}
                  </span>
                )}
                <p className="text-sm font-bold text-[var(--color-text)]">
                  {hotel.name}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text)]/60">
                  {hotel.address}
                </p>
              </div>
            </div>

            {/* 체크인/체크아웃 */}
            <div className="mt-3 flex gap-3">
              <div className="flex-1 rounded-lg bg-[var(--color-background)] px-3 py-2 text-center">
                <p className="text-[10px] text-[var(--color-text)]/40">체크인</p>
                <p className="text-sm font-bold text-[var(--color-text)]">15:00</p>
              </div>
              <div className="flex-1 rounded-lg bg-[var(--color-background)] px-3 py-2 text-center">
                <p className="text-[10px] text-[var(--color-text)]/40">체크아웃</p>
                <p className="text-sm font-bold text-[var(--color-text)]">11:00</p>
              </div>
            </div>

            {/* 전화/지도 버튼 */}
            <div className="mt-3 flex gap-2">
              <a
                href={toTelHref(hotel.phone)}
                className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-primary)] text-xs font-medium text-white transition-opacity active:opacity-80"
              >
                <Phone size={14} aria-hidden />
                전화
              </a>
              <a
                href={`https://www.google.com/maps/?q=${hotel.mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-secondary)] text-xs font-medium text-white transition-opacity active:opacity-80"
              >
                <MapIcon size={14} aria-hidden />
                지도
              </a>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--color-text)]/60">
            숙소 정보를 찾을 수 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}
