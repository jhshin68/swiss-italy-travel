'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { TodayTab } from '@/components/features/expenses/today-tab';
import { SummaryTab } from '@/components/features/expenses/summary-tab';
import { SettleTab } from '@/components/features/expenses/settle-tab';
import { ExpenseForm } from '@/components/features/expenses/expense-form';

type TabKey = 'today' | 'summary' | 'settle';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'today', label: '오늘' },
  { key: 'summary', label: '전체' },
  { key: 'settle', label: '정산' },
];

export default function ExpensesPage() {
  const { member } = useAuthStore();
  const tripId = member?.tripId ?? '1';

  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [showForm, setShowForm] = useState(false);
  // 경비 입력 후 탭 데이터 갱신 트리거
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="mx-auto flex max-w-[430px] flex-col">
      {/* 페이지 헤더 */}
      <header className="flex items-center justify-between px-4 pt-5 pb-2">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">
            &#x1F4B0; 경비
          </h1>
          <p className="mt-0.5 text-xs text-[var(--color-text)]/50">
            가족 여행 경비 관리
          </p>
        </div>
      </header>

      {/* 서브 탭 */}
      <div className="flex border-b border-[var(--color-text)]/10 px-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`min-h-[48px] flex-1 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 px-4 py-4">
        {activeTab === 'today' && (
          <TodayTab tripId={tripId} refreshKey={refreshKey} />
        )}
        {activeTab === 'summary' && (
          <SummaryTab tripId={tripId} refreshKey={refreshKey} />
        )}
        {activeTab === 'settle' && (
          <SettleTab tripId={tripId} refreshKey={refreshKey} />
        )}
      </div>

      {/* FAB — 지출 추가 버튼 */}
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{
          /* 중앙 정렬된 max-w-[430px] 기준 우측 배치 */
          right: 'max(1rem, calc((100vw - 430px) / 2 + 1rem))',
        }}
        aria-label="지출 추가"
      >
        +
      </button>

      {/* 경비 입력 모달 */}
      {showForm && (
        <ExpenseForm
          tripId={tripId}
          onClose={() => setShowForm(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
