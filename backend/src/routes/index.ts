// routes/index.ts — 라우터 집합 등록
// 새 라우터 추가 시 이 파일에만 import하면 된다.

import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import tripsRouter from './trips';

const router = Router();

// GET /api/health
router.use('/health', healthRouter);

// POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
router.use('/auth', authRouter);

// 일정·장소 조회 API
router.use('/trips', tripsRouter);

export default router;
