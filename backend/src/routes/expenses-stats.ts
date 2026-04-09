// routes/expenses-stats.ts — 경비 통계 + 정산 API
// expenses.ts에서 분리 (300줄 제한 준수).

import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { logger } from '../lib/logger';
import { requireAuth } from '../middleware/auth';
import { calcBalances, calcMinTransfers } from '../lib/settlement';
import type { ApiResponse } from '../types';
import type { BalanceMap, Transfer } from '../lib/settlement';
import {
  tripIdParamSchema, validateTripAccess, getMemberStringId,
  type ExpenseSummary, type SummaryRow,
} from './expenses-helpers';

const router = Router();

interface SettleResult {
  balances: BalanceMap;
  transfers: Transfer[];
  perPerson: number;
}

// ── GET /:tripId/expenses/summary ───────────────────────────
// 경비 통계: 총 지출, 카테고리별, 결제자별, 일별

router.get(
  '/:tripId/expenses/summary',
  requireAuth,
  (req: Request, res: Response<ApiResponse<ExpenseSummary>>) => {
    const paramParsed = tripIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      res.status(400).json({ success: false, error: paramParsed.error.errors[0]?.message ?? '잘못된 요청입니다' });
      return;
    }

    const { tripId } = paramParsed.data;
    if (!validateTripAccess(req, res, tripId)) return;

    const tripIdNum = Number(tripId);

    try {
      const db = getDb();

      const totalRow = db.prepare(
        'SELECT COALESCE(SUM(amount_krw), 0) AS total, COUNT(*) AS cnt FROM expenses WHERE trip_id = ?',
      ).get(tripIdNum) as { total: number; cnt: number };

      const byCatRows = db.prepare(
        'SELECT category AS key, COALESCE(SUM(amount_krw), 0) AS total FROM expenses WHERE trip_id = ? GROUP BY category',
      ).all(tripIdNum) as SummaryRow[];
      const byCategory: Record<string, number> = {};
      for (const r of byCatRows) byCategory[r.key] = r.total;

      const byPayerRows = db.prepare(`
        SELECT m.name AS key, COALESCE(SUM(e.amount_krw), 0) AS total
        FROM expenses e INNER JOIN members m ON m.id = e.paid_by
        WHERE e.trip_id = ? GROUP BY e.paid_by
      `).all(tripIdNum) as SummaryRow[];
      const byPayer: Record<string, number> = {};
      for (const r of byPayerRows) byPayer[r.key] = r.total;

      const byDateRows = db.prepare(
        'SELECT date AS key, COALESCE(SUM(amount_krw), 0) AS total FROM expenses WHERE trip_id = ? GROUP BY date ORDER BY date',
      ).all(tripIdNum) as SummaryRow[];
      const byDate: Record<string, number> = {};
      for (const r of byDateRows) byDate[r.key] = r.total;

      res.status(200).json({
        success: true,
        data: { totalKrw: totalRow.total, byCategory, byPayer, byDate, count: totalRow.cnt },
      });
    } catch (err) {
      logger.error('경비 통계 조회 실패', err);
      res.status(500).json({ success: false, error: '경비 통계를 불러오는 중 오류가 발생했습니다' });
    }
  },
);

// ── GET /:tripId/expenses/settle ────────────────────────────
// 정산 결과: 멤버별 잔액 + 최소 이체 목록

router.get(
  '/:tripId/expenses/settle',
  requireAuth,
  (req: Request, res: Response<ApiResponse<SettleResult>>) => {
    const paramParsed = tripIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      res.status(400).json({ success: false, error: paramParsed.error.errors[0]?.message ?? '잘못된 요청입니다' });
      return;
    }

    const { tripId } = paramParsed.data;
    if (!validateTripAccess(req, res, tripId)) return;

    const tripIdNum = Number(tripId);

    try {
      const db = getDb();

      const expenseRows = db.prepare(
        'SELECT id, paid_by, amount_krw FROM expenses WHERE trip_id = ?',
      ).all(tripIdNum) as Array<{ id: number; paid_by: number; amount_krw: number }>;

      // 각 경비의 splits를 정산 입력 형태로 변환
      const expenses = expenseRows.map((e) => {
        const splits = db.prepare(
          'SELECT member_id, amount FROM expense_splits WHERE expense_id = ?',
        ).all(e.id) as Array<{ member_id: number; amount: number }>;

        return {
          paidById: getMemberStringId(tripIdNum, e.paid_by),
          amountKRW: e.amount_krw,
          splits: splits.map((s) => ({
            memberId: getMemberStringId(tripIdNum, s.member_id),
            amount: s.amount,
          })),
        };
      });

      const balances = calcBalances(expenses);
      const transfers = calcMinTransfers(balances);

      const totalKrw = expenseRows.reduce((sum, e) => sum + e.amount_krw, 0);
      const memberCount = db.prepare(
        'SELECT COUNT(*) AS cnt FROM members WHERE trip_id = ?',
      ).get(tripIdNum) as { cnt: number };
      const perPerson = memberCount.cnt > 0 ? Math.round(totalKrw / memberCount.cnt) : 0;

      res.status(200).json({
        success: true,
        data: { balances, transfers, perPerson },
      });
    } catch (err) {
      logger.error('정산 결과 조회 실패', err);
      res.status(500).json({ success: false, error: '정산 결과를 불러오는 중 오류가 발생했습니다' });
    }
  },
);

export default router;
