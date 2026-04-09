'use client';

import { useAuthStore } from '@/stores/auth-store';

const TRIP_START = new Date('2026-10-08T00:00:00');
const TRIP_END = new Date('2026-10-19T23:59:59');

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

// 도장 데이터 — 장소별 고유 테두리 색상 포함
const STAMPS = [
  { id: 'bern', name: '베른', emoji: '🐻', borderColor: '#92400e' },
  { id: 'grindelwald', name: '그린델발트', emoji: '💎', borderColor: '#1d4ed8' },
  { id: 'first', name: '피르스트', emoji: '🚡', borderColor: '#0369a1' },
  { id: 'zermatt', name: '체르마트', emoji: '⛰️', borderColor: '#374151' },
  { id: 'gornergrat', name: '고르너그라트', emoji: '🏔️', borderColor: '#6b7280' },
  { id: 'gelato', name: '젤라또', emoji: '🍦', borderColor: '#db2777' },
  { id: 'firenze', name: '피렌체', emoji: '🎨', borderColor: '#ea580c' },
  { id: 'colosseum', name: '콜로세움', emoji: '🏛️', borderColor: '#78350f' },
];

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

  const missionDay = phase === 'before' ? 2 : phase === 'after' ? 12 : dayNumber;
  const missionText = MISSIONS[missionDay] ?? '';

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 배경 이미지 — 스위스 수채화 일러스트 */}
      <div className="fixed inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/bg-swiss.webp"
          alt="스위스 풍경"
          className="h-full w-full object-cover"
        />
        {/* 하단으로 갈수록 흰색으로 — 카드 가독성 확보 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white/75" />
      </div>

      <div className="relative flex flex-col gap-4 px-4 pb-24 pt-6">
        {/* 타이틀 — 하늘 영역에 자연스럽게 배치 */}
        <section className="text-center">
          <p className="text-sm font-medium text-stone-600 drop-shadow-sm">CH &nbsp; IT</p>
          <h1 className="text-2xl font-black text-stone-800 drop-shadow-sm">
            우리 가족 <span className="text-amber-600">대탐험!</span>
          </h1>
          <p className="text-sm text-stone-600 drop-shadow-sm">
            스위스 &middot; 이탈리아 &middot; 12일 여행
          </p>
        </section>

        {/* D-Day 카드 — 나무간판 + 양피지 스타일 */}
        <section className="mx-auto flex w-full max-w-sm overflow-hidden rounded-2xl shadow-xl">
          {/* 왼쪽: 나무 간판 (걸쇠 + 국기 + D-Day) */}
          <div
            className="flex flex-col"
            style={{
              background: 'linear-gradient(160deg, #7B4F0A 0%, #A67828 40%, #8B6010 70%, #6B4C0A 100%)',
              borderRight: '3px solid #5A3C08',
            }}
          >
            {/* 상단 걸쇠 — 간판이 걸려있는 느낌 */}
            <div className="flex justify-around px-5 py-1.5">
              <div className="h-3 w-1.5 rounded-b-sm" style={{ backgroundColor: 'rgba(50,25,0,0.6)' }} />
              <div className="h-3 w-1.5 rounded-b-sm" style={{ backgroundColor: 'rgba(50,25,0,0.6)' }} />
            </div>
            {/* 간판 내용 */}
            <div className="flex flex-col items-center px-5 pb-5">
              <span className="text-2xl leading-none">🇨🇭</span>
              <span className="mt-1 text-xs font-bold text-amber-200">
                {phase === 'before' ? '출발까지' : phase === 'during' ? '여행중' : '완료!'}
              </span>
              <span className="text-4xl font-black leading-tight text-white drop-shadow-md">
                {phase === 'before' ? `D-${dday}` : phase === 'during' ? `Day ${dayNumber}` : 'END'}
              </span>
            </div>
          </div>

          {/* 오른쪽: 양피지 스타일 여행 정보 */}
          <div
            className="flex flex-1 flex-col justify-center gap-1.5 px-4 py-3"
            style={{ background: 'linear-gradient(160deg, #FFFCF0 0%, #FFF8E0 100%)' }}
          >
            <p className="text-sm font-bold text-stone-700">
              {phase === 'before'
                ? '🎒 대탐험 준비 중!'
                : phase === 'during'
                ? '🗺️ 대탐험 진행 중!'
                : '🏆 대탐험 완료!'}
            </p>
            <p className="text-xs text-stone-500">2026년 10월 8일 출발</p>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                style={{
                  width:
                    phase === 'before' ? '5%' : phase === 'after' ? '100%' : `${(dayNumber / 12) * 100}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-stone-400">
              11박 12일 &middot; 취리히→그린델발트→체르마트→피렌체→로마
            </p>
          </div>
        </section>

        {/* 현재 날씨 */}
        <section
          className="rounded-2xl px-4 py-3 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.82)' }}
        >
          <h2 className="mb-2 text-sm font-bold text-stone-700">
            <span className="mr-1">☀️</span>현재 날씨
          </h2>
          <div className="rounded-xl bg-white/60 py-3 text-center text-sm text-stone-400">
            날씨 정보 없음
          </div>
        </section>

        {/* 다음 미션 — 양피지 두루마리 스타일 */}
        <section
          className="flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-4 shadow-md transition-opacity active:opacity-80"
          style={{
            background: 'linear-gradient(160deg, #FEF3C7 0%, #FDE68A 50%, #F6D860 100%)',
            border: '2px solid #B45309',
            boxShadow: '0 4px 14px rgba(180, 83, 9, 0.28)',
          }}
        >
          <span className="text-3xl">🐻</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-800">
              다음 미션 &middot; DAY {missionDay}
            </p>
            <p className="text-sm font-bold text-amber-900">
              {missionText} 🐻
            </p>
          </div>
          <span className="text-xl text-amber-600">&rsaquo;</span>
        </section>

        {/* 방문 도장 모으기 */}
        <section
          className="rounded-2xl px-4 py-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.82)' }}
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
      </div>
    </div>
  );
}

// ── 서브 컴포넌트 ──────────────────────────────

function StampCard({
  stamp,
  collected,
}: {
  stamp: (typeof STAMPS)[number];
  collected: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-3 text-center transition-all ${
        collected ? 'shadow-md' : ''
      }`}
      style={{
        borderColor: collected ? stamp.borderColor : '#e5e7eb',
        backgroundColor: collected ? `${stamp.borderColor}18` : 'rgba(255,255,255,0.72)',
      }}
    >
      <span className={`text-2xl ${collected ? '' : 'opacity-40 grayscale'}`}>
        {stamp.emoji}
      </span>
      <span
        className="text-[10px] font-medium"
        style={{ color: collected ? stamp.borderColor : '#9ca3af' }}
      >
        {stamp.name}
      </span>
    </div>
  );
}
