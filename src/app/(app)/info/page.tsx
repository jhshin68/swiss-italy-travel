'use client';

import { EmergencyContacts } from '@/components/features/info/emergency-contacts';
import { HotelCard } from '@/components/features/info/hotel-card';

// 비상정보 메인 페이지 — SOS 버튼, 긴급연락처, 숙소, 항공편, 여행팁
export default function InfoPage() {
  return (
    <div className="mx-auto flex max-w-[430px] flex-col gap-6 px-4 pb-8 pt-5">
      {/* 페이지 헤더 */}
      <header>
        <h1 className="text-xl font-bold text-[var(--color-text)]">
          ℹ️ 비상정보
        </h1>
        <p className="mt-0.5 text-xs text-[var(--color-text)]/50">
          긴급 상황 시 필요한 모든 정보
        </p>
      </header>

      {/* SOS 버튼 — 유럽 통합 긴급번호 112 즉시 전화 */}
      <a
        href="tel:112"
        className="flex min-h-[64px] items-center justify-center gap-3 rounded-2xl bg-[#DC2626] text-white shadow-lg transition-transform active:scale-[0.97]"
      >
        <span className="text-2xl">🚨</span>
        <div className="flex flex-col">
          <span className="text-lg font-extrabold leading-tight">SOS 긴급전화</span>
          <span className="text-xs font-medium opacity-80">유럽 통합 긴급번호 112</span>
        </div>
      </a>

      {/* 긴급 연락처 (스위스/이탈리아/공통 서브탭) */}
      <EmergencyContacts />

      {/* 오늘 숙소 카드 */}
      <HotelCard />

      {/* 항공편 정보 */}
      <FlightInfo />

      {/* 여행 팁 */}
      <TravelTips />
    </div>
  );
}

// 항공편 정보 섹션
function FlightInfo() {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-bold text-[var(--color-text)]">
        ✈️ 항공편
      </h2>

      <div className="flex flex-col gap-2">
        {/* 출발편 */}
        <div className="rounded-xl border border-[var(--color-text)]/5 bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
              출발
            </span>
            <span className="text-xs text-[var(--color-text)]/50">
              예약번호: <span className="font-mono font-bold">FLTZFS</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[var(--color-text)]">ICN</span>
              <span className="text-[10px] text-[var(--color-text)]/40">인천</span>
            </div>
            <div className="flex flex-1 flex-col items-center">
              <span className="text-[10px] font-medium text-[var(--color-text)]/50">KE917</span>
              <div className="my-0.5 h-px w-full bg-[var(--color-text)]/10" />
              <span className="text-[10px] text-[var(--color-text)]/40">2026.10.08 (목)</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[var(--color-text)]">ZRH</span>
              <span className="text-[10px] text-[var(--color-text)]/40">취리히</span>
            </div>
          </div>
          <p className="mt-2 text-center text-sm font-bold text-[var(--color-primary)]">
            12:25 출발
          </p>
        </div>

        {/* 귀국편 */}
        <div className="rounded-xl border border-[var(--color-text)]/5 bg-[var(--color-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-[var(--color-secondary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-secondary)]">
              귀국
            </span>
            <span className="text-xs text-[var(--color-text)]/50">
              예약번호: <span className="font-mono font-bold">FLTZFS</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[var(--color-text)]">FCO</span>
              <span className="text-[10px] text-[var(--color-text)]/40">로마</span>
            </div>
            <div className="flex flex-1 flex-col items-center">
              <span className="text-[10px] font-medium text-[var(--color-text)]/50">KE932</span>
              <div className="my-0.5 h-px w-full bg-[var(--color-text)]/10" />
              <span className="text-[10px] text-[var(--color-text)]/40">2026.10.19 (월)</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[var(--color-text)]">ICN</span>
              <span className="text-[10px] text-[var(--color-text)]/40">인천</span>
            </div>
          </div>
          <p className="mt-2 text-center text-sm font-bold text-[var(--color-secondary)]">
            21:25 출발
          </p>
        </div>
      </div>
    </section>
  );
}

// 여행 팁 섹션 — 전압, 팁 문화, 기본 회화
function TravelTips() {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-bold text-[var(--color-text)]">
        💡 여행 팁
      </h2>

      <div className="flex flex-col gap-2">
        {/* 전압 정보 */}
        <div className="rounded-xl border border-[var(--color-text)]/5 bg-[var(--color-surface)] p-4 shadow-sm">
          <p className="text-sm font-semibold text-[var(--color-text)]">🔌 전압/플러그</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-xs text-[var(--color-text)]/70">
            <li>스위스: 230V / 50Hz, <strong>C타입</strong> (J타입 전용, C타입 호환)</li>
            <li>이탈리아: 230V / 50Hz, <strong>C / F타입</strong></li>
            <li>한국 2핀 어댑터(C타입) 하나면 양국 모두 사용 가능</li>
          </ul>
        </div>

        {/* 팁 문화 */}
        <div className="rounded-xl border border-[var(--color-text)]/5 bg-[var(--color-surface)] p-4 shadow-sm">
          <p className="text-sm font-semibold text-[var(--color-text)]">💶 팁 문화</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-xs text-[var(--color-text)]/70">
            <li>스위스: 서비스 요금 포함, 팁 의무 아님 (거스름돈 올림 정도)</li>
            <li>이탈리아: Coperto(좌석료) 1~3유로 별도, 팁은 선택</li>
            <li>택시: 요금 반올림 정도, 큰 팁 불필요</li>
          </ul>
        </div>

        {/* 기본 회화 */}
        <div className="rounded-xl border border-[var(--color-text)]/5 bg-[var(--color-surface)] p-4 shadow-sm">
          <p className="text-sm font-semibold text-[var(--color-text)]">🗣️ 기본 회화</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[var(--color-text)]/70">
            <div>
              <p className="font-medium text-[var(--color-text)]/90">🇩🇪 독일어 (스위스)</p>
              <p className="mt-1">안녕하세요: <strong>Grüezi</strong></p>
              <p>감사합니다: <strong>Danke</strong></p>
              <p>실례합니다: <strong>Entschuldigung</strong></p>
              <p>계산서 주세요: <strong>Die Rechnung, bitte</strong></p>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text)]/90">🇮🇹 이탈리아어</p>
              <p className="mt-1">안녕하세요: <strong>Buongiorno</strong></p>
              <p>감사합니다: <strong>Grazie</strong></p>
              <p>실례합니다: <strong>Scusi</strong></p>
              <p>계산서 주세요: <strong>Il conto, per favore</strong></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
