'use client';

import { useAuthStore } from '@/stores/auth-store';

// 여행 기본 정보 — 하드코딩 (변경될 일 없는 항공편 정보)
const TRIP_START = new Date('2026-10-08T00:00:00');
const TRIP_END = new Date('2026-10-19T23:59:59');
const TOTAL_DAYS = 12;

const DAILY_CITIES: Record<number, string> = {
  1: '취리히',
  2: '그린델발트',
  3: '그린델발트',
  4: '그린델발트',
  5: '체르마트',
  6: '체르마트',
  7: '체르마트 → 피렌체 (대이동)',
  8: '피렌체',
  9: '피렌체',
  10: '피렌체',
  11: '로마',
  12: '로마',
};

// D-Day 또는 여행 N일차 계산
function getTripStatus(now: Date): {
  label: string;
  sub: string;
  dayNumber: number | null;
} {
  const startMs = TRIP_START.getTime();
  const endMs = TRIP_END.getTime();
  const nowMs = now.getTime();

  if (nowMs < startMs) {
    // 여행 전: D-Day 카운트
    const diffDays = Math.ceil((startMs - nowMs) / (1000 * 60 * 60 * 24));
    return {
      label: `여행까지 D-${diffDays}`,
      sub: '설레는 준비 기간입니다!',
      dayNumber: null,
    };
  }

  if (nowMs > endMs) {
    // 여행 후
    return {
      label: '여행 완료!',
      sub: '멋진 추억이 가득합니다 🇨🇭🇮🇹',
      dayNumber: null,
    };
  }

  // 여행 중: Day X 계산
  const dayNumber =
    Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
  const city = DAILY_CITIES[dayNumber] ?? '';

  return {
    label: `Day ${dayNumber} / ${TOTAL_DAYS}`,
    sub: city,
    dayNumber,
  };
}

export default function HomePage() {
  const { member, logout } = useAuthStore();
  const tripStatus = getTripStatus(new Date());

  const handleLogout = async () => {
    await logout();
    // 앱 레이아웃의 인증 가드가 자동으로 /login으로 리다이렉트
  };

  if (!member) return null;

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      {/* 환영 헤더 */}
      <section className="flex items-center gap-3">
        <span className="text-4xl">{member.emoji}</span>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">
            안녕하세요, {member.memberName}님!
          </h1>
          <p className="text-sm text-[var(--color-text)]/60">
            스위스 · 이탈리아 가족 여행
          </p>
        </div>
      </section>

      {/* D-Day / 여행 일차 카드 */}
      <section className="rounded-2xl bg-[var(--color-primary)] px-5 py-6 text-center text-white shadow-md">
        <p className="text-3xl font-extrabold tracking-tight">
          {tripStatus.label}
        </p>
        <p className="mt-1 text-base opacity-90">{tripStatus.sub}</p>
        <p className="mt-3 text-xs opacity-70">
          2026.10.08 (목) ~ 10.19 (월) · 11박 12일
        </p>
      </section>

      {/* 항공편 카드 */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          ✈️ 항공편
        </h2>

        <FlightCard
          code="KE917"
          route="인천(ICN) → 취리히(ZRH)"
          date="10월 8일 (목) 12:25 출발"
          badge="출국"
          badgeColor="var(--color-primary)"
        />

        <FlightCard
          code="KE932"
          route="로마(FCO) → 인천(ICN)"
          date="10월 19일 (월) 21:25 출발"
          badge="귀국"
          badgeColor="var(--color-secondary)"
        />

        <p className="text-center text-xs text-[var(--color-text)]/50">
          예약번호: <span className="font-mono font-semibold">FLTZFS</span>
        </p>
      </section>

      {/* 숙소 요약 */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          🏨 숙소 일정
        </h2>
        <ul className="flex flex-col gap-1.5 text-sm text-[var(--color-text)]">
          <AccommodationRow emoji="🇨🇭" city="취리히" nights="1박" days="Day 1" />
          <AccommodationRow emoji="🏔️" city="그린델발트" nights="3박" days="Day 2~4" />
          <AccommodationRow emoji="⛰️" city="체르마트" nights="2박" days="Day 5~6" />
          <AccommodationRow emoji="🇮🇹" city="피렌체" nights="3박" days="Day 8~10" />
          <AccommodationRow emoji="🏛️" city="로마" nights="2박" days="Day 11~12" />
        </ul>
      </section>

      {/* 로그아웃 */}
      <button
        type="button"
        onClick={handleLogout}
        className="mt-2 min-h-[48px] rounded-xl border border-[var(--color-text)]/20 text-sm text-[var(--color-text)]/60 transition-colors hover:bg-[var(--color-text)]/5 active:bg-[var(--color-text)]/10"
      >
        로그아웃
      </button>
    </div>
  );
}

// ── 서브 컴포넌트 ──────────────────────────────

function FlightCard({
  code,
  route,
  date,
  badge,
  badgeColor,
}: {
  code: string;
  route: string;
  date: string;
  badge: string;
  badgeColor: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--color-surface)] px-4 py-3 shadow-sm">
      <span
        className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold text-white"
        style={{ backgroundColor: badgeColor }}
      >
        {badge}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--color-text)]">
          {code} · {route}
        </p>
        <p className="text-xs text-[var(--color-text)]/60">{date}</p>
      </div>
    </div>
  );
}

function AccommodationRow({
  emoji,
  city,
  nights,
  days,
}: {
  emoji: string;
  city: string;
  nights: string;
  days: string;
}) {
  return (
    <li className="flex items-center gap-2 rounded-lg bg-[var(--color-surface)] px-3 py-2">
      <span>{emoji}</span>
      <span className="flex-1 font-medium">{city}</span>
      <span className="text-xs text-[var(--color-text)]/60">{nights}</span>
      <span className="text-xs text-[var(--color-text)]/40">{days}</span>
    </li>
  );
}
