'use client';

import { useState } from 'react';
import { createExpense } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Currency, ExpenseCategory, CreateExpenseRequest } from '@/types';

// 카테고리 선택지
const CATEGORIES: Array<{ value: ExpenseCategory; icon: string; label: string }> = [
  { value: 'food', icon: '\u{1F37D}\uFE0F', label: '식사' },
  { value: 'transport', icon: '\u{1F682}', label: '교통' },
  { value: 'activity', icon: '\u26F0\uFE0F', label: '액티비티' },
  { value: 'shopping', icon: '\u{1F6CD}\uFE0F', label: '쇼핑' },
  { value: 'accommodation', icon: '\u{1F3E8}', label: '숙소' },
  { value: 'etc', icon: '\u{1F4E6}', label: '기타' },
];

// 통화 선택지
const CURRENCIES: Array<{ value: Currency; label: string }> = [
  { value: 'CHF', label: 'CHF' },
  { value: 'EUR', label: 'EUR' },
  { value: 'KRW', label: 'KRW' },
];

// 멤버 프리셋 — 결제자 선택용
const MEMBER_PRESETS = [
  { memberId: 'jinhyung', name: '진형', emoji: '\u{1F468}' },
  { memberId: 'jihyun', name: '지현', emoji: '\u{1F469}' },
  { memberId: 'dongwoo', name: '동우', emoji: '\u{1F466}' },
  { memberId: 'yujin', name: '유진', emoji: '\u{1F467}' },
];

interface ExpenseFormProps {
  tripId: string;
  onClose: () => void;
  onSaved: () => void;
}

// 경비 입력 모달 폼
export function ExpenseForm({ tripId, onClose, onSaved }: ExpenseFormProps) {
  const { member } = useAuthStore();

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('CHF');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState(member?.memberId ?? 'jinhyung');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // 프론트 검증: 금액 0 이하 방지
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError('금액을 올바르게 입력해주세요.');
      return;
    }

    if (!description.trim()) {
      setError('설명을 입력해주세요.');
      return;
    }

    setError(null);
    setIsSaving(true);

    const data: CreateExpenseRequest = {
      amount: numericAmount,
      currency,
      category,
      description: description.trim(),
      paidBy,
      date,
      time,
    };

    const result = await createExpense(tripId, data);

    if (result.success) {
      onSaved();
      onClose();
    } else {
      setError(result.error ?? '저장에 실패했습니다.');
    }
    setIsSaving(false);
  };

  return (
    // 오버레이
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40">
      <div
        className="w-full max-w-[430px] rounded-t-2xl bg-[var(--color-surface)] px-4 pb-8 pt-4"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* 헤더 */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--color-text)]">
            &#x2795; 지출 추가
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text)]/50 hover:bg-[var(--color-text)]/5"
            aria-label="닫기"
          >
            &#x2715;
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* 금액 + 통화 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text)]/60">
              금액
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="min-h-[48px] flex-1 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-background)] px-3 text-lg font-bold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
              <div className="flex rounded-xl border border-[var(--color-text)]/10 overflow-hidden">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCurrency(c.value)}
                    className={`min-h-[48px] px-3 text-sm font-medium transition-colors ${
                      currency === c.value
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-background)] text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text)]/60">
              카테고리
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl border text-sm transition-colors ${
                    category === cat.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 font-semibold text-[var(--color-primary)]'
                      : 'border-[var(--color-text)]/10 bg-[var(--color-background)] text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5'
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text)]/60">
              설명
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 점심 파스타, 기차표..."
              className="min-h-[48px] w-full rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-background)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* 결제자 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text)]/60">
              결제자
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MEMBER_PRESETS.map((m) => (
                <button
                  key={m.memberId}
                  type="button"
                  onClick={() => setPaidBy(m.memberId)}
                  className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl border text-sm transition-colors ${
                    paidBy === m.memberId
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 font-semibold text-[var(--color-primary)]'
                      : 'border-[var(--color-text)]/10 bg-[var(--color-background)] text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5'
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className="text-xs">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 날짜 + 시간 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--color-text)]/60">
                날짜
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-background)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--color-text)]/60">
                시간
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-background)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* 분할 방식 안내 */}
          <div className="rounded-lg bg-[var(--color-background)] px-3 py-2">
            <p className="text-xs text-[var(--color-text)]/50">
              &#x1F465; 4인 균등 분할 (기본)
            </p>
          </div>

          {/* 저장 버튼 */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="min-h-[48px] w-full rounded-xl bg-[var(--color-primary)] text-base font-bold text-white transition-opacity disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
