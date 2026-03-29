// errorHandler.ts — Express 전역 에러 핸들러
// 모든 예외를 잡아 일관된 JSON 형태로 응답한다.

import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import type { ApiResponse } from '../types';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;

  // 운영 환경에서는 스택 트레이스를 응답에 포함하지 않는다
  const isDev = process.env.NODE_ENV === 'development';

  logger.error(`${statusCode} — ${err.message}`, isDev ? err.stack : '');

  res.status(statusCode).json({
    success: false,
    error: err.message ?? '서버 오류가 발생했습니다.',
    ...(isDev && { stack: err.stack }),
  });
}

/** 404 핸들러 — 라우터 등록 후 마지막에 추가 */
export function notFoundHandler(req: Request, res: Response<ApiResponse>): void {
  res.status(404).json({
    success: false,
    error: `경로를 찾을 수 없습니다: ${req.method} ${req.path}`,
  });
}

/** 에러 생성 헬퍼 */
export function createError(message: string, statusCode = 500): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  return err;
}
