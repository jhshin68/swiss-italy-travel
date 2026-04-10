'use client';

import { useState } from 'react';

// 여행 기간 기준 D-Day 계산
const TRIP_START = new Date('2026-10-08T00:00:00');
const TRIP_END = new Date('2026-10-19T23:59:59');

function getCurrentDayNumber(): number {
  const now = new Date();
  if (now < TRIP_START) return 0;
  if (now > TRIP_END) return 13;
  return Math.floor((now.getTime() - TRIP_START.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

interface Mission {
  id: string;
  day: number;
  title: string;
  description: string;
  emoji: string;
  city: string;
  country: 'swiss' | 'italy' | 'transit';
}

// Day별 메인 미션 12개
const MISSIONS: Mission[] = [
  { id: 'm1', day: 1, title: '취리히 구시가지 산책하기!', description: '린덴호프 언덕에서 취리히 전경 사진 찍기', emoji: '🏙️', city: '취리히', country: 'swiss' },
  { id: 'm2', day: 2, title: '곰 공원에서 살아있는 곰 발견하기!', description: '베른 곰 공원(Bärenpark)에서 곰 찾고 인증샷', emoji: '🐻', city: '베른', country: 'swiss' },
  { id: 'm3', day: 3, title: '블라우제 호수에서 신비로운 물빛 감상!', description: '에메랄드빛 블라우제 호수에서 가족사진 찍기', emoji: '💎', city: '그린델발트', country: 'swiss' },
  { id: 'm4', day: 4, title: '피르스트 클리프워크 도전!', description: '피르스트 전망대에서 절벽 위 산책로 정복하기', emoji: '🚡', city: '그린델발트', country: 'swiss' },
  { id: 'm5', day: 5, title: '마터호른 일출 보기!', description: '체르마트에서 마터호른의 골든 아워 포착하기', emoji: '🌄', city: '체르마트', country: 'swiss' },
  { id: 'm6', day: 6, title: '고르너그라트 전망대 정복!', description: '3,089m 전망대에서 컵라면 먹으며 마터호른 감상', emoji: '⛰️', city: '체르마트', country: 'swiss' },
  { id: 'm7', day: 7, title: '이탈리아 첫 젤라또 먹기!', description: '밀라노 or 피렌체 도착 후 진짜 이탈리안 젤라또 도전', emoji: '🍦', city: '대이동', country: 'transit' },
  { id: 'm8', day: 8, title: '두오모 앞에서 가족사진!', description: '피렌체 두오모 대성당 앞 가족 단체 사진 완성', emoji: '⛪', city: '피렌체', country: 'italy' },
  { id: 'm9', day: 9, title: '우피치 미술관 명화 찾기!', description: '보티첼리 <비너스의 탄생> 직접 눈으로 확인하기', emoji: '🎨', city: '피렌체', country: 'italy' },
  { id: 'm10', day: 10, title: '콜로세움에서 검투사 포즈!', description: '콜로세움 아레나에서 검투사 흉내내며 사진 찍기', emoji: '🏛️', city: '로마', country: 'italy' },
  { id: 'm11', day: 11, title: '트레비 분수에 동전 던지기!', description: '오른손으로 왼쪽 어깨 너머 동전 던지면 로마 재방문!', emoji: '⛲', city: '로마', country: 'italy' },
  { id: 'm12', day: 12, title: '로마 공항에서 마지막 젤라또!', description: '피우미치노 공항에서 이탈리아 마지막 젤라또로 여행 마무리', emoji: '✈️', city: '로마', country: 'italy' },
];

// 미션 페이지 — Day별 미션 카드와 진행 상태 표시
export default function MissionsPage() {
  const currentDay = getCurrentDayNumber();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const filteredMissions = selectedDay
    ? MISSIONS.filter((m) => m.day === selectedDay)
    : MISSIONS;

  const completedCount = 0; // 향후 서버/로컬 상태와 연동

  return (
    <div className="mx-auto max-w-[430px] px-4 pb-24 pt-6">
      {/* 헤더 */}
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold text-stone-800">
          🏆 대탐험 미션
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          12일 동안 {MISSIONS.length}개 미션을 완수하세요!
        </p>
        {/* 진행률 */}
        <div className="mx-auto mt-3 max-w-xs">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>완료 {completedCount}/{MISSIONS.length}</span>
            <span>{Math.round((completedCount / MISSIONS.length) * 100)}%</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all"
              style={{ width: `${(completedCount / MISSIONS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Day 필터 */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        <DayFilterButton
          label="전체"
          isActive={selectedDay === null}
          onClick={() => setSelectedDay(null)}
        />
        {Array.from({ length: 12 }, (_, i) => i + 1).map((day) => (
          <DayFilterButton
            key={day}
            label={`D${day}`}
            isActive={selectedDay === day}
            onClick={() => setSelectedDay(day)}
            highlight={day === currentDay}
          />
        ))}
      </div>

      {/* 미션 카드 목록 */}
      <div className="flex flex-col gap-3">
        {filteredMissions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            isCurrent={mission.day === currentDay}
            isPast={mission.day < currentDay}
          />
        ))}
      </div>
    </div>
  );
}

// ── 서브 컴포넌트 ──────────────────────────────

function DayFilterButton({
  label,
  isActive,
  onClick,
  highlight,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        isActive
          ? 'bg-amber-500 text-white shadow-sm'
          : highlight
            ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
      }`}
    >
      {label}
    </button>
  );
}

function MissionCard({
  mission,
  isCurrent,
  isPast,
}: {
  mission: Mission;
  isCurrent: boolean;
  isPast: boolean;
}) {
  const countryColor = mission.country === 'swiss'
    ? 'border-l-emerald-500'
    : mission.country === 'italy'
      ? 'border-l-red-500'
      : 'border-l-amber-500';

  return (
    <div
      className={`rounded-xl border-l-4 bg-white p-4 shadow-sm transition-all ${countryColor} ${
        isCurrent ? 'ring-2 ring-amber-400 ring-offset-1' : ''
      } ${isPast ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{mission.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
              DAY {mission.day}
            </span>
            <span className="text-[10px] text-stone-400">{mission.city}</span>
            {isCurrent && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                오늘!
              </span>
            )}
          </div>
          <h3 className="mt-1 text-sm font-bold text-stone-800">{mission.title}</h3>
          <p className="mt-0.5 text-xs text-stone-500">{mission.description}</p>
        </div>
      </div>
    </div>
  );
}
