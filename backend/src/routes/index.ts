// routes/index.ts — 라우터 집합 등록
// 새 라우터 추가 시 이 파일에만 import하면 된다.

import { Router } from 'express';
import healthRouter from './health';

const router = Router();

// GET /api/health
router.use('/health', healthRouter);

// TODO: 마일스톤 1.3에서 추가 예정
// router.use('/auth', authRouter);
// router.use('/trips', tripRouter);

export default router;
