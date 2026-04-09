'use client';

import { useState } from 'react';

// 서브탭 키
type ContactTab = 'switzerland' | 'italy' | 'common';

interface ContactEntry {
  label: string;
  number: string;
  desc?: string;
}

// 스위스 긴급 연락처
const SWISS_CONTACTS: ContactEntry[] = [
  { label: '통합 긴급번호', number: '112', desc: '유럽 공통 긴급번호' },
  { label: '경찰', number: '117' },
  { label: '구급/응급', number: '144' },
  { label: '소방', number: '118' },
];

// 이탈리아 긴급 연락처
const ITALY_CONTACTS: ContactEntry[] = [
  { label: '통합 긴급번호', number: '112', desc: '유럽 공통 긴급번호' },
  { label: '경찰 (카라비니에리)', number: '113' },
  { label: '구급/응급', number: '118' },
  { label: '소방', number: '115' },
];

// 공통 연락처 (영사콜센터, 대한항공, 대사관 등)
const COMMON_CONTACTS: ContactEntry[] = [
  { label: '영사콜센터 (24시간)', number: '+82-2-3210-0404', desc: '해외 긴급상황 시 한국 외교부' },
  { label: '대한항공', number: '+82-2-2656-2001', desc: '예약번호 FLTZFS' },
  { label: '주스위스 대사관 (베른)', number: '+41-31-356-2444' },
  { label: '주이탈리아 대사관 (로마)', number: '+39-06-802461' },
];

const TABS: Array<{ key: ContactTab; label: string }> = [
  { key: 'switzerland', label: '🇨🇭 스위스' },
  { key: 'italy', label: '🇮🇹 이탈리아' },
  { key: 'common', label: '✈ 공통' },
];

const CONTACT_MAP: Record<ContactTab, ContactEntry[]> = {
  switzerland: SWISS_CONTACTS,
  italy: ITALY_CONTACTS,
  common: COMMON_CONTACTS,
};

// 전화번호에서 하이픈 제거하여 tel: 링크용 번호 생성
function toTelHref(number: string): string {
  return `tel:${number.replace(/[^+\d]/g, '')}`;
}

// 긴급 연락처 — 3개 서브탭 (스위스/이탈리아/공통)으로 전화번호 표시
export function EmergencyContacts() {
  const [activeTab, setActiveTab] = useState<ContactTab>('switzerland');

  const contacts = CONTACT_MAP[activeTab];

  return (
    <section className="flex flex-col gap-3">
      {/* 섹션 제목 */}
      <h2 className="text-base font-bold text-[var(--color-text)]">
        📞 긴급 연락처
      </h2>

      {/* 서브탭 */}
      <div className="flex gap-1 rounded-xl bg-[var(--color-text)]/5 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text)]/50 hover:text-[var(--color-text)]/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 연락처 카드 목록 */}
      <div className="flex flex-col gap-2">
        {contacts.map((contact) => (
          <a
            key={contact.number}
            href={toTelHref(contact.number)}
            className="flex min-h-[48px] items-center justify-between rounded-xl border border-[var(--color-text)]/5 bg-[var(--color-surface)] px-4 py-3 shadow-sm transition-shadow active:shadow-md"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {contact.label}
              </span>
              {contact.desc && (
                <span className="text-[11px] text-[var(--color-text)]/50">
                  {contact.desc}
                </span>
              )}
            </div>
            <span className="shrink-0 rounded-lg bg-[var(--color-primary)]/10 px-3 py-1.5 text-sm font-bold text-[var(--color-primary)]">
              {contact.number}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
