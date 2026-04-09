// routes/index.ts — 라우터 집합 등록
// 새 라우터 추가 시 이 파일에만 import하면 된다.

import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import tripsRouter from './trips';
import expensesRouter from './expenses';
import expensesStatsRouter from './expenses-stats';

const router = Router();

// GET /api/health
router.use('/health', healthRouter);

// POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
router.use('/auth', authRouter);

// 일정·장소 조회 API
router.use('/trips', tripsRouter);

// 경비 CRUD API (GET list, POST create, DELETE)
router.use('/trips', expensesRouter);

// 경비 통계 + 정산 API (summary, settle)
router.use('/trips', expensesStatsRouter);

export default router;
