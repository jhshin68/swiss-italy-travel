// routes/expenses.ts — 경비 CRUD API (GET list, POST create, DELETE)
// 모든 엔드포인트는 requireAuth 미들웨어로 인증 필수이며,
// URL의 tripId가 JWT의 tripId와 일치해야 한다.
// 타입·스키마·헬퍼는 expenses-helpers.ts에, 통계·정산은 expenses-stats.ts에 분리.

import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import { logger } from '../lib/logger';
import { requireAuth } from '../middleware/auth';
import type { ApiResponse } from '../types';
import {
  tripIdParamSchema, expenseIdParamSchema, expenseQuerySchema, createExpenseSchema,
  validateTripAccess, getMemberIdMap, getExchangeRate, toExpenseResponse,
  type ExpenseResponse, type ExpenseRow,
} from './expenses-helpers';

const router = Router();

// ── GET /:tripId/expenses ───────────────────────────────────
// 경비 목록 조회 (날짜·결제자 필터 지원)

router.get(
  '/:tripId/expenses',
  requireAuth,
  (req: Request, res: Response<ApiResponse<ExpenseResponse[]>>) => {
    const paramParsed = tripIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      res.status(400).json({ success: false, error: paramParsed.error.errors[0]?.message ?? '잘못된 요청입니다' });
      return;
    }

    const queryParsed = expenseQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      res.status(400).json({ success: false, error: queryParsed.error.errors[0]?.message ?? '잘못된 쿼리입니다' });
      return;
    }

    const { tripId } = paramParsed.data;
    if (!validateTripAccess(req, res, tripId)) return;

    const { date, paidBy } = queryParsed.data;
    const tripIdNum = Number(tripId);

    try {
      const db = getDb();
      let sql = `
        SELECT e.*, m.name AS payer_name
        FROM expenses e
        INNER JOIN members m ON m.id = e.paid_by
        WHERE e.trip_id = ?
      `;
      const params: (string | number)[] = [tripIdNum];

      if (date) {
        sql += ' AND e.date = ?';
        params.push(date);
      }

      if (paidBy) {
        const memberMap = getMemberIdMap(tripIdNum);
        const dbId = memberMap.get(paidBy);
        if (dbId !== undefined) {
          sql += ' AND e.paid_by = ?';
          params.push(dbId);
        }
      }

      sql += ' ORDER BY e.date DESC, e.time DESC, e.id DESC';

      const rows = db.prepare(sql).all(...params) as ExpenseRow[];
      const data = rows.map((row) => toExpenseResponse(row, tripIdNum));

      res.status(200).json({ success: true, data });
    } catch (err) {
      logger.error('경비 목록 조회 실패', err);
      res.status(500).json({ success: false, error: '경비 목록을 불러오는 중 오류가 발생했습니다' });
    }
  },
);

// ── POST /:tripId/expenses ──────────────────────────────────
// 경비 입력

router.post(
  '/:tripId/expenses',
  requireAuth,
  (req: Request, res: Response<ApiResponse<ExpenseResponse>>) => {
    const paramParsed = tripIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      res.status(400).json({ success: false, error: paramParsed.error.errors[0]?.message ?? '잘못된 요청입니다' });
      return;
    }

    const bodyParsed = createExpenseSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ success: false, error: bodyParsed.error.errors[0]?.message ?? '입력 데이터가 올바르지 않습니다' });
      return;
    }

    const { tripId } = paramParsed.data;
    if (!validateTripAccess(req, res, tripId)) return;

    const tripIdNum = Number(tripId);
    const { amount, currency, category, description, paidBy, date, time, splits } = bodyParsed.data;

    try {
      const db = getDb();
      const memberMap = getMemberIdMap(tripIdNum);
      const payerDbId = memberMap.get(paidBy);

      if (payerDbId === undefined) {
        res.status(400).json({ success: false, error: `결제자를 찾을 수 없습니다: ${paidBy}` });
        return;
      }

      // 환율 조회 + KRW 환산
      const exchangeRate = getExchangeRate(currency, date);
      const amountKrw = currency === 'KRW' ? amount : Math.round(amount * exchangeRate);

      // splits 결정: 명시적 splits가 없으면 전체 멤버 균등 분할
      let resolvedSplits: Array<{ memberDbId: number; amount: number }>;

      if (splits && splits.length > 0) {
        resolvedSplits = [];
        for (const s of splits) {
          const dbId = memberMap.get(s.memberId);
          if (dbId === undefined) {
            res.status(400).json({ success: false, error: `분담 멤버를 찾을 수 없습니다: ${s.memberId}` });
            return;
          }
          resolvedSplits.push({ memberDbId: dbId, amount: s.amount });
        }
      } else {
        // 균등 분할: 모든 멤버에게 KRW 기준으로 분배
        const allMembers = db.prepare('SELECT id FROM members WHERE trip_id = ?')
          .all(tripIdNum) as Array<{ id: number }>;
        const perPerson = Math.round(amountKrw / allMembers.length);
        resolvedSplits = allMembers.map((m) => ({ memberDbId: m.id, amount: perPerson }));
      }

      // 트랜잭션으로 expenses + expense_splits 동시 INSERT
      const insertExpense = db.prepare(`
        INSERT INTO expenses (trip_id, paid_by, amount, currency, amount_krw, exchange_rate, category, description, date, time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertSplit = db.prepare(`
        INSERT INTO expense_splits (expense_id, member_id, amount)
        VALUES (?, ?, ?)
      `);

      const result = db.transaction(() => {
        const info = insertExpense.run(
          tripIdNum, payerDbId, amount, currency, amountKrw, exchangeRate,
          category, description, date, time,
        );
        const expenseId = info.lastInsertRowid as number;

        for (const s of resolvedSplits) {
          insertSplit.run(expenseId, s.memberDbId, s.amount);
        }

        return expenseId;
      })();

      // 생성된 경비 조회하여 응답
      const created = db.prepare(`
        SELECT e.*, m.name AS payer_name
        FROM expenses e
        INNER JOIN members m ON m.id = e.paid_by
        WHERE e.id = ?
      `).get(result) as ExpenseRow;

      logger.info(`경비 생성: id=${result}, ${amount} ${currency} by ${paidBy}`);
      res.status(201).json({ success: true, data: toExpenseResponse(created, tripIdNum) });
    } catch (err) {
      logger.error('경비 생성 실패', err);
      res.status(500).json({ success: false, error: '경비를 저장하는 중 오류가 발생했습니다' });
    }
  },
);

// ── DELETE /:tripId/expenses/:expenseId ─────────────────────
// 경비 삭제 (expense_splits는 CASCADE로 자동 삭제)

router.delete(
  '/:tripId/expenses/:expenseId',
  requireAuth,
  (req: Request, res: Response<ApiResponse>) => {
    const paramParsed = tripIdParamSchema.safeParse({ tripId: req.params.tripId });
    if (!paramParsed.success) {
      res.status(400).json({ success: false, error: paramParsed.error.errors[0]?.message ?? '잘못된 요청입니다' });
      return;
    }

    const expenseParsed = expenseIdParamSchema.safeParse({ expenseId: req.params.expenseId });
    if (!expenseParsed.success) {
      res.status(400).json({ success: false, error: expenseParsed.error.errors[0]?.message ?? 'expenseId가 올바르지 않습니다' });
      return;
    }

    const { tripId } = paramParsed.data;
    if (!validateTripAccess(req, res, tripId)) return;

    const tripIdNum = Number(tripId);
    const expenseId = Number(expenseParsed.data.expenseId);

    try {
      const db = getDb();

      const result = db.prepare(
        'DELETE FROM expenses WHERE id = ? AND trip_id = ?',
      ).run(expenseId, tripIdNum);

      if (result.changes === 0) {
        res.status(404).json({ success: false, error: '해당 경비를 찾을 수 없습니다' });
        return;
      }

      logger.info(`경비 삭제: id=${expenseId}, tripId=${tripIdNum}`);
      res.status(200).json({ success: true });
    } catch (err) {
      logger.error('경비 삭제 실패', err);
      res.status(500).json({ success: false, error: '경비를 삭제하는 중 오류가 발생했습니다' });
    }
  },
);

export default router;
