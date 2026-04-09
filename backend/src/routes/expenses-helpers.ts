// routes/expenses-helpers.ts — 경비 API에서 사용하는 타입, Zod 스키마, 헬퍼 함수
// expenses.ts의 300줄 제한 준수를 위해 분리함.

import { Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection';
import type { ApiResponse } from '../types';

// ── 응답 타입 ───────────────────────────────────────────────

export interface ExpenseSplit {
  memberId: number;
  memberName: string;
  amount: number;
}

export interface ExpenseResponse {
  id: number;
  tripId: number;
  paidBy: number;
  paidByName: string;
  amount: number;
  currency: string;
  amountKrw: number;
  exchangeRate: number;
  category: string;
  description: string;
  date: string;
  time: string;
  receiptUrl: string;
  splits: ExpenseSplit[];
  createdAt: string;
  updatedAt: string;
}

export interface PayerSummary {
  name: string;
  emoji: string;
  totalKrw: number;
}

export interface ExpenseSummary {
  totalKrw: number;
  byCategory: Record<string, number>;
  byPayer: PayerSummary[];
  byDate: Record<string, number>;
  count: number;
}

// ── DB 행 타입 ──────────────────────────────────────────────

export interface ExpenseRow {
  id: number;
  trip_id: number;
  paid_by: number;
  payer_name: string;
  amount: number;
  currency: string;
  amount_krw: number;
  exchange_rate: number;
  category: string;
  description: string;
  date: string;
  time: string;
  receipt_url: string;
  created_at: string;
  updated_at: string;
}

export interface SplitRow {
  member_id: number;
  member_name: string;
  amount: number;
}

interface MemberRow {
  id: number;
  name: string;
}

interface ExchangeRateRow {
  rate: number;
}

export interface SummaryRow {
  key: string;
  total: number;
}

// ── Zod 스키마 ──────────────────────────────────────────────

export const tripIdParamSchema = z.object({
  tripId: z.string().regex(/^\d+$/, 'tripId는 숫자여야 합니다'),
});

export const expenseIdParamSchema = z.object({
  expenseId: z.string().regex(/^\d+$/, 'expenseId는 숫자여야 합니다'),
});

export const expenseQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다').optional(),
  paidBy: z.string().optional(),
});

const splitSchema = z.object({
  memberId: z.string(),
  amount: z.number().positive('분담 금액은 양수여야 합니다'),
});

export const createExpenseSchema = z.object({
  amount: z.number().positive('금액은 양수여야 합니다'),
  currency: z.enum(['KRW', 'CHF', 'EUR']),
  category: z.enum(['food', 'transport', 'accommodation', 'activity', 'shopping', 'etc']),
  description: z.string().min(1, '설명을 입력해주세요'),
  paidBy: z.string().min(1, '결제자를 선택해주세요'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다'),
  time: z.string().default(''),
  splits: z.array(splitSchema).optional(),
});

// ── 헬퍼 함수 ───────────────────────────────────────────────

/** JWT의 tripId와 URL 파라미터의 tripId 일치 검증 */
export function validateTripAccess(req: Request, res: Response, tripId: string): boolean {
  if (!req.auth) {
    res.status(401).json({ success: false, error: '인증이 필요합니다' } satisfies ApiResponse);
    return false;
  }
  if (req.auth.tripId !== tripId) {
    res.status(403).json({ success: false, error: '해당 여행에 대한 접근 권한이 없습니다' } satisfies ApiResponse);
    return false;
  }
  return true;
}

/**
 * memberId 문자열('member-jinhyung')을 DB의 members.id(INTEGER)로 매핑.
 * members 테이블에서 조회하여 캐싱한다.
 */
const memberIdCache = new Map<string, Map<string, number>>();

export function getMemberIdMap(tripId: number): Map<string, number> {
  const cacheKey = String(tripId);
  const cached = memberIdCache.get(cacheKey);
  if (cached) return cached;

  const db = getDb();
  const rows = db.prepare('SELECT id, name FROM members WHERE trip_id = ?')
    .all(tripId) as MemberRow[];

  // name → memberId 문자열 매핑 (진형→member-jinhyung 등)
  const nameToStringId: Record<string, string> = {
    '진형': 'member-jinhyung',
    '지현': 'member-jihyun',
    '동우': 'member-dongwoo',
    '유진': 'member-yujin',
  };

  const map = new Map<string, number>();
  for (const row of rows) {
    const stringId = nameToStringId[row.name];
    if (stringId) {
      map.set(stringId, row.id);
    }
    // 숫자 ID 문자열로도 매핑 (범용성)
    map.set(String(row.id), row.id);
  }

  memberIdCache.set(cacheKey, map);
  return map;
}

/** 멤버 DB id → 문자열 memberId 역매핑 */
export function getMemberStringId(tripId: number, dbId: number): string {
  const map = getMemberIdMap(tripId);
  for (const [key, val] of map.entries()) {
    if (val === dbId && key.startsWith('member-')) return key;
  }
  return String(dbId);
}

/** 멤버 DB id → 표시용 이름 (진형, 지현 등) */
export function getMemberName(tripId: number, dbId: number): string {
  const db = getDb();
  const row = db.prepare('SELECT name FROM members WHERE trip_id = ? AND id = ?')
    .get(tripId, dbId) as { name: string } | undefined;
  return row?.name ?? String(dbId);
}

/** 환율 조회: 해당 날짜 → 최근 환율 → 기본값 순서 */
export function getExchangeRate(fromCurr: string, date: string): number {
  if (fromCurr === 'KRW') return 1;

  const db = getDb();

  // 해당 날짜의 환율 조회
  const exact = db.prepare(
    'SELECT rate FROM exchange_rates WHERE from_curr = ? AND to_curr = ? AND date = ?',
  ).get(fromCurr, 'KRW', date) as ExchangeRateRow | undefined;

  if (exact) return exact.rate;

  // 가장 최근 환율 조회
  const latest = db.prepare(
    'SELECT rate FROM exchange_rates WHERE from_curr = ? AND to_curr = ? ORDER BY date DESC LIMIT 1',
  ).get(fromCurr, 'KRW') as ExchangeRateRow | undefined;

  if (latest) return latest.rate;

  // 기본 환율 (exchange_rates가 비어있을 때)
  const defaults: Record<string, number> = { CHF: 1500, EUR: 1450 };
  return defaults[fromCurr] ?? 1;
}

/** 경비 행 + splits를 API 응답으로 변환 */
export function toExpenseResponse(row: ExpenseRow, _tripId: number): ExpenseResponse {
  const db = getDb();
  const splits = db.prepare(`
    SELECT es.member_id, m.name AS member_name, es.amount
    FROM expense_splits es
    INNER JOIN members m ON m.id = es.member_id
    WHERE es.expense_id = ?
  `).all(row.id) as SplitRow[];

  return {
    id: row.id,
    tripId: row.trip_id,
    paidBy: row.paid_by,
    paidByName: row.payer_name,
    amount: row.amount,
    currency: row.currency,
    amountKrw: row.amount_krw,
    exchangeRate: row.exchange_rate,
    category: row.category,
    description: row.description,
    date: row.date,
    time: row.time,
    receiptUrl: row.receipt_url,
    splits: splits.map((s) => ({
      memberId: s.member_id,
      memberName: s.member_name,
      amount: s.amount,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
