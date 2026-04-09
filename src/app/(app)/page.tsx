'use client';

import { useAuthStore } from '@/stores/auth-store';
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
const STAMPS = [
  { id: 'bern', name: '베른', emoji: '🐻', color: '#8B6914' },
  { id: 'grindelwald', name: '그린델발트', emoji: '🏔️', color: '#2E7D32' },
  { id: 'first', name: '피르스트', emoji: '🚡', color: '#0277BD' },
  { id: 'zermatt', name: '체르마트', emoji: '⛰️', color: '#5D4037' },
  { id: 'gornergrat', name: '고르너그라트', emoji: '🏔️', color: '#37474F' },
  { id: 'gelato', name: '젤라또', emoji: '🍦', color: '#E91E63' },
  { id: 'firenze', name: '피렌체', emoji: '🎨', color: '#FF6F00' },
  { id: 'colosseum', name: '콜로세움', emoji: '🏛️', color: '#4E342E' },
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
        {/* 배경 위에 반투명 오버레이 — 가독성 확보 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white/70" />
      </div>

      <div className="relative flex flex-col gap-4 px-4 pb-24 pt-6">
        {/* 타이틀 */}
        <section className="text-center">
          <p className="text-sm font-medium text-stone-600 drop-shadow-sm">CH + IT</p>
          <h1 className="text-2xl font-black text-stone-800 drop-shadow-sm">
            우리 가족 <span className="text-amber-600">대탐험!</span>
          </h1>
          <p className="text-sm text-stone-600 drop-shadow-sm">
            스위스 &middot; 이탈리아 &middot; 12일 여행
          </p>
        </section>

        {/* D-Day 카드 (나무간판 스타일) */}
        <section className="mx-auto flex w-full max-w-sm overflow-hidden rounded-2xl shadow-lg"
          style={{ backgroundColor: 'rgba(255,253,245,0.92)' }}
        >
          {/* 왼쪽: D-day 나무간판 */}
          <div className="flex flex-col items-center justify-center px-5 py-4"
            style={{
              background: 'linear-gradient(135deg, #8B6914 0%, #A67C28 50%, #8B6914 100%)',
              borderRight: '3px solid #6B5310',
            }}
          >
            <span className="text-xs font-bold text-amber-100">
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
            {/* 진행률 바 */}
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                style={{
                  width: phase === 'before' ? '5%' : phase === 'after' ? '100%' : `${(dayNumber / 12) * 100}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-stone-400">
              11박 12일 &middot; 취리리&rarr;그린델발트&rarr;체르마트&rarr;피렌체&rarr;로마
            </p>
          </div>
        </section>

        {/* 현재 날씨 (플레이스홀더) */}
        <section className="rounded-2xl px-4 py-3 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}
        >
          <h2 className="mb-2 text-sm font-bold text-stone-700">
            <span className="mr-1">☀️</span>현재 날씨
          </h2>
          <div className="rounded-xl bg-white/60 py-3 text-center text-sm text-stone-400">
            날씨 정보 없음
          </div>
        </section>

        {/* 다음 미션 카드 */}
        <section
          className="flex items-center gap-3 rounded-2xl px-4 py-4 shadow-md"
          style={{
            background: 'linear-gradient(135deg, #D97706 0%, #EA580C 100%)',
          }}
        >
          <span className="text-3xl">🐻</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-100">
              다음 미션 &middot; DAY {missionDay}
            </p>
            <p className="text-sm font-bold text-white">
              {missionText} 🐻
            </p>
          </div>
          <span className="text-xl text-white/60">&rsaquo;</span>
        </section>

        {/* 방문 도장 모으기 */}
        <section className="rounded-2xl px-4 py-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}
        >
          <h2 className="mb-3 text-center text-sm font-bold text-stone-700">
            <span className="mr-1">📍</span>방문 도장 모으기
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {STAMPS.map((stamp) => (
              <StampCard key={stamp.id} stamp={stamp} collected={false} />
            ))}
          </div>
        </section>

        {/* 항공편 요약 */}
        <section className="rounded-2xl px-4 py-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}
        >
          <h2 className="mb-2 text-sm font-bold text-stone-700">
            <span className="mr-1">✈️</span>항공편
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
        <section className="rounded-2xl px-4 py-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}
        >
          <h2 className="mb-2 text-sm font-bold text-stone-700">
            <span className="mr-1">🏨</span>숙소 일정
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
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-3 text-center transition-all ${
        collected
          ? 'border-amber-400 bg-amber-50 shadow-md'
          : 'border-stone-200 bg-white/60'
      }`}
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
