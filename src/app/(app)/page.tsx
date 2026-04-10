'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useMissions } from '@/hooks/use-missions';
import { WeatherCard } from '@/components/features/weather/weather-card';
import { CloudSun, MapPin, Plane, Hotel } from 'lucide-react';
// 여행 기본 정보
const TRIP_START = new Date('2026-10-08T00:00:00');
const TRIP_END = new Date('2026-10-19T23:59:59');

// D-Day 계산
function getDday(now: Date): { dday: number; phase: 'before' | 'during' | 'after'; dayNumber: number } {
  const startMs = TRIP_START.getTime();
  const endMs = TRIP_END.getTime();
  const nowMs = now.getTime();

  if (nowMs < startMs) {
    const diffDays = Math.ceil((startMs - nowMs) / (1000 * 60 * 60 * 24));
    return { dday: diffDays, phase: 'before', dayNumber: 0 };
  }
  if (nowMs > endMs) {
    return { dday: 0, phase: 'after', dayNumber: 12 };
  }
  const dayNumber = Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
  return { dday: 0, phase: 'during', dayNumber };
}

// 도장 데이터 — 주요 방문지 8곳
// borderColor: 스위스(bern~gornergrat) = teal 계열, 이탈리아(gelato~colosseum) = amber 계열
// 왜: 국가별 정체성을 색으로 드러내어 도장이 단순 개수가 아닌 "여정의 증거"로 보이게 함
const STAMPS = [
  { id: 'bern',        name: '베른',         emoji: '🐻',  color: '#8B6914', borderColor: '#14B8A6' },
  { id: 'grindelwald', name: '그린델발트',    emoji: '🏔️', color: '#2E7D32', borderColor: '#2DD4BF' },
  { id: 'first',       name: '피르스트',      emoji: '🚡',  color: '#0277BD', borderColor: '#5EEAD4' },
  { id: 'zermatt',     name: '체르마트',      emoji: '⛰️', color: '#5D4037', borderColor: '#2DD4BF' },
  { id: 'gornergrat',  name: '고르너그라트',  emoji: '🏔️', color: '#37474F', borderColor: '#14B8A6' },
  { id: 'gelato',      name: '젤라또',        emoji: '🍦',  color: '#E91E63', borderColor: '#F59E0B' },
  { id: 'firenze',     name: '피렌체',        emoji: '🎨',  color: '#FF6F00', borderColor: '#D97706' },
  { id: 'colosseum',   name: '콜로세움',      emoji: '🏛️', color: '#4E342E', borderColor: '#B45309' },
];

// 미션 데이터 (Day별 메인 미션)
const MISSIONS: Record<number, string> = {
  1: '취리히 구시가지 산책하기!',
  2: '곰 공원에서 살아있는 곰 발견하기!',
  3: '융프라우요흐 정상에서 인증샷!',
  4: '피르스트 클리프워크 도전!',
  5: '마터호른 일출 보기!',
  6: '고르너그라트 전망대 정복!',
  7: '이탈리아 첫 젤라또 먹기!',
  8: '두오모 앞에서 가족사진!',
  9: '우피치 미술관 명화 찾기!',
  10: '콜로세움에서 검투사 포즈!',
  11: '트레비 분수에 동전 던지기!',
  12: '로마 공항에서 마지막 젤라또!',
};

export default function HomePage() {
  const { member } = useAuthStore();
  const { dday, phase, dayNumber } = getDday(new Date());
  const { collectedStamps, completedCount } = useMissions();

  if (!member) return null;

  // 현재 또는 다음 미션 결정
  const missionDay = phase === 'before' ? 2 : phase === 'after' ? 12 : dayNumber;
  const missionText = MISSIONS[missionDay] ?? '';

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 배경 이미지 */}
      <div className="fixed inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/bg-swiss.webp"
          alt="스위스 풍경"
          className="h-full w-full object-cover"
        />
        {/* 배경 위에 반투명 오버레이 — 상단은 풍경을 보여주고 하단은 크림색 배경과 자연스럽게 통합
            이유: 기존 via-white/30은 전체가 뿌옇게 보여 "배경 이미지 따로, 콘텐츠 따로" 느낌.
                 상단 25%까지는 완전 투명으로 풍경 노출, 이후 점진적으로 --color-background(#FEF9E7)로 전환. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(254, 249, 231, 0.55) 55%, rgba(254, 249, 231, 0.92) 100%)',
          }}
        />
      </div>

      <div className="relative flex flex-col gap-4 px-4 pb-24 pt-6">
        {/* 타이틀 — 여백 + 레터스페이싱으로 여행 포스터 느낌 */}
        <section className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-700/80 drop-shadow-sm">
            CH &middot; IT &middot; 2026
          </p>
          <h1 className="mt-1 text-3xl font-black leading-tight text-stone-800 drop-shadow-sm">
            우리 가족{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              대탐험!
            </span>
          </h1>
          <div className="mx-auto mt-1.5 flex items-center justify-center gap-2 text-xs text-stone-600 drop-shadow-sm">
            <span className="h-px w-6 bg-stone-400/50" />
            <span>스위스 &middot; 이탈리아 &middot; 12일</span>
            <span className="h-px w-6 bg-stone-400/50" />
          </div>
        </section>

        {/* D-Day 카드 (나무간판 스타일) — rounded-2xl + 강화된 shadow + phase 링 */}
        <section
          className={`mx-auto flex w-full max-w-sm overflow-hidden rounded-2xl shadow-xl ring-2 ${
            phase === 'before'
              ? 'ring-amber-300/60'
              : phase === 'during'
              ? 'ring-emerald-400/60'
              : 'ring-stone-300/60'
          }`}
          style={{ backgroundColor: 'rgba(255,253,245,0.94)' }}
        >
          {/* 왼쪽: D-day 나무간판 — wooden-sign 클래스가 나무결 + 못 장식 담당 (globals.css) */}
          <div className="wooden-sign relative flex flex-col items-center justify-center px-5 py-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100 drop-shadow">
              {phase === 'before' ? '출발까지' : phase === 'during' ? '여행중' : '완료!'}
            </span>
            <span className="text-4xl font-black text-white drop-shadow-md">
              {phase === 'before' ? `D-${dday}` : phase === 'during' ? `Day ${dayNumber}` : 'END'}
            </span>
          </div>

          {/* 오른쪽: 여행 정보 */}
          <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-3">
            <p className="text-sm font-bold text-stone-700">
              {phase === 'before' ? '대탐험 준비 중!' : phase === 'during' ? '대탐험 진행 중!' : '대탐험 완료!'}
            </p>
            <p className="text-xs text-stone-500">2026년 10월 8일 출발</p>
            {/* 진행률 바 — phase별 색상 */}
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-stone-200/80 shadow-inner">
              <div
                className={`h-full rounded-full transition-all ${
                  phase === 'before'
                    ? 'bg-gradient-to-r from-amber-300 to-amber-500'
                    : phase === 'during'
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600'
                    : 'bg-gradient-to-r from-stone-400 to-stone-600'
                }`}
                style={{
                  width: phase === 'before' ? '5%' : phase === 'after' ? '100%' : `${(dayNumber / 12) * 100}%`,
                }}
              />
            </div>
            <p className="mt-0.5 text-[10px] text-stone-400">
              11박 12일 &middot; 취리히&rarr;그린델발트&rarr;체르마트&rarr;피렌체&rarr;로마
            </p>
          </div>
        </section>

        {/* 현재 날씨 — OpenWeatherMap 3일 예보 */}
        <section className="rounded-2xl bg-gradient-to-br from-sky-50/90 via-white/80 to-amber-50/70 px-4 py-3 shadow-sm ring-1 ring-sky-100/60 backdrop-blur-md">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-stone-700">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100">
              <CloudSun size={14} className="text-amber-600" aria-hidden />
            </span>
            현재 날씨
          </h2>
          <WeatherCard />
        </section>

        {/* 다음 미션 카드 — 내부 글로우 레이어 + 강화된 그림자 */}
        <a href="/missions"
          className="relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-4 shadow-lg shadow-orange-500/20 ring-1 ring-white/20 transition-transform active:scale-[0.98]"
          style={{
            background:
              'linear-gradient(135deg, #F59E0B 0%, #D97706 45%, #C2410C 100%)',
          }}
        >
          {/* 내부 하이라이트 오버레이 — 종이 질감 느낌 */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.35) 0%, transparent 60%)',
            }}
          />
          <span className="relative text-3xl drop-shadow">🐻</span>
          <div className="relative flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-100/90">
              {completedCount > 0 ? `${completedCount}개 완료` : '다음 미션'} &middot; DAY {missionDay}
            </p>
            <p className="text-sm font-bold text-white drop-shadow-sm">
              {missionText} 🐻
            </p>
          </div>
          <span className="relative text-xl text-white/70">&rsaquo;</span>
        </a>

        {/* 방문 도장 모으기 */}
        <section className="rounded-2xl bg-gradient-to-br from-rose-50/80 via-white/85 to-amber-50/70 px-4 py-4 shadow-sm ring-1 ring-rose-100/60 backdrop-blur-md">
          <h2 className="mb-1 flex items-center justify-center gap-1.5 text-center text-sm font-bold text-stone-700">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100">
              <MapPin size={14} className="text-rose-600" aria-hidden />
            </span>
            방문 도장 모으기
          </h2>
          <p className="mb-3 text-center text-[10px] text-stone-400">
            미션 완료 시 도장이 자동 획득됩니다 ({collectedStamps.size}/{STAMPS.length})
          </p>
          <div className="grid grid-cols-4 gap-2">
            {STAMPS.map((stamp) => (
              <StampCard key={stamp.id} stamp={stamp} collected={collectedStamps.has(stamp.id)} />
            ))}
          </div>
        </section>

        {/* 항공편 요약 */}
        <section className="rounded-2xl bg-gradient-to-br from-sky-50/80 via-white/85 to-white/70 px-4 py-4 shadow-sm ring-1 ring-sky-100/60 backdrop-blur-md">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-stone-700">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100">
              <Plane size={14} className="text-sky-600" aria-hidden />
            </span>
            항공편
          </h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2">
              <span className="rounded-md bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">출국</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-stone-700">KE917 &middot; 인천 &rarr; 취리히</p>
                <p className="text-[10px] text-stone-400">10.08 (목) 12:25</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2">
              <span className="rounded-md bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white">귀국</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-stone-700">KE932 &middot; 로마 &rarr; 인천</p>
                <p className="text-[10px] text-stone-400">10.19 (월) 21:25</p>
              </div>
            </div>
            <p className="text-center text-[10px] text-stone-400">
              예약번호: <span className="font-mono font-semibold">FLTZFS</span>
            </p>
          </div>
        </section>

        {/* 숙소 일정 */}
        <section className="rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white/85 to-amber-50/70 px-4 py-4 shadow-sm ring-1 ring-emerald-100/60 backdrop-blur-md">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-stone-700">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100">
              <Hotel size={14} className="text-emerald-600" aria-hidden />
            </span>
            숙소 일정
          </h2>
          <div className="flex flex-col gap-1.5">
            <AccomRow emoji="🇨🇭" city="취리히" nights="1박" days="Day 1" />
            <AccomRow emoji="🏔️" city="그린델발트" nights="3박" days="Day 2~4" />
            <AccomRow emoji="⛰️" city="체르마트" nights="2박" days="Day 5~6" />
            <AccomRow emoji="🇮🇹" city="피렌체" nights="3박" days="Day 8~10" />
            <AccomRow emoji="🏛️" city="로마" nights="2박" days="Day 11~12" />
          </div>
        </section>
      </div>
    </div>
  );
}

// ── 서브 컴포넌트 ──────────────────────────────

function StampCard({ stamp, collected }: { stamp: typeof STAMPS[number]; collected: boolean }) {
  // collected 시 stamp.borderColor 인라인 적용 (Tailwind 동적 클래스 회피)
  // animate-stamp-bounce는 collected 상태에서만 렌더되어 마운트 1회 재생
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-3 text-center transition-all ${
        collected
          ? 'bg-white/90 shadow-md animate-stamp-bounce'
          : 'border-stone-200 bg-white/60'
      }`}
      style={collected ? { borderColor: stamp.borderColor } : undefined}
    >
      <span className={`text-2xl ${collected ? '' : 'grayscale opacity-40'}`}>
        {stamp.emoji}
      </span>
      <span className={`text-[10px] font-medium ${collected ? 'text-stone-700' : 'text-stone-400'}`}>
        {stamp.name}
      </span>
    </div>
  );
}

function AccomRow({ emoji, city, nights, days }: { emoji: string; city: string; nights: string; days: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 text-sm">
      <span>{emoji}</span>
      <span className="flex-1 font-medium text-stone-700">{city}</span>
      <span className="text-xs text-stone-500">{nights}</span>
      <span className="text-xs text-stone-400">{days}</span>
    </div>
  );
}
