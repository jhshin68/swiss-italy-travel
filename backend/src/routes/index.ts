// routes/index.ts — 라우터 집합 등록
// 새 라우터 추가 시 이 파일에만 import하면 된다.

import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';

const router = Router();

// GET /api/health
router.use('/health', healthRouter);

// POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
router.use('/auth', authRouter);

// TODO: 마일스톤 1.3에서 추가 예정
// router.use('/trips', tripRouter);

export default router;
