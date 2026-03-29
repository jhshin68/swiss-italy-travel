// health.ts — GET /api/health 헬스체크 엔드포인트
// GitHub Actions CI, Caddy 리버스 프록시, 모니터링 도구가 사용한다.
// DB 연결 상태까지 확인해 실제 서비스 가능 여부를 반환한다.

import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection';
import type { ApiResponse } from '../types';

const router = Router();

interface HealthData {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;           // 프로세스 업타임 (초)
  version: string;
  environment: string;
  database: {
    status: 'ok' | 'error';
    path: string;
    tables?: number;
  };
}

router.get('/', (_req: Request, res: Response<ApiResponse<HealthData>>) => {
  const startTime = Date.now();

  let dbStatus: HealthData['database'] = {
    status: 'error',
    path: process.env.DB_PATH ?? './data/travel.db',
  };

  try {
    const db = getDb();
    // 가벼운 쿼리로 DB 응답 확인
    const tables = db
      .prepare("SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table'")
      .get() as { cnt: number };

    dbStatus = {
      status: 'ok',
      path: process.env.DB_PATH ?? './data/travel.db',
      tables: tables.cnt,
    };
  } catch {
    // DB 연결 실패 — degraded 상태로 응답
  }

  const overallStatus: HealthData['status'] =
    dbStatus.status === 'ok' ? 'ok' : 'degraded';

  const data: HealthData = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version ?? '0.1.0',
    environment: process.env.NODE_ENV ?? 'development',
    database: dbStatus,
  };

  const httpStatus = overallStatus === 'ok' ? 200 : 503;

  // X-Response-Time 헤더로 응답 지연 확인 가능
  res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);

  res.status(httpStatus).json({
    success: overallStatus === 'ok',
    data,
  });
});

export default router;
