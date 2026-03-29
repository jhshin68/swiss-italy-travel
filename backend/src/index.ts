// index.ts — Express 서버 진입점
// swiss-italy-travel API 서버 (포트 3001)
// Oracle Cloud VM에서 Caddy 리버스 프록시를 통해 외부 접근

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

const app = express();

// ── 보안 헤더 (helmet) ──────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────
// Vercel 프론트엔드 + 로컬 개발 허용
app.use(
  cors({
    origin: [CORS_ORIGIN, 'http://localhost:3000'],
    credentials: true, // httpOnly 쿠키 허용
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── 요청 파싱 ───────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP 로깅 ───────────────────────────────────────────────
const logFormat = process.env.LOG_FORMAT ?? 'dev';
app.use(morgan(logFormat));

// ── API 라우터 ──────────────────────────────────────────────
app.use('/api', apiRouter);

// ── 404 처리 ───────────────────────────────────────────────
app.use(notFoundHandler);

// ── 전역 에러 핸들러 ────────────────────────────────────────
app.use(errorHandler);

// ── 서버 시작 ───────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 API 서버 실행 중`);
  logger.info(`   포트      : ${PORT}`);
  logger.info(`   환경      : ${process.env.NODE_ENV ?? 'development'}`);
  logger.info(`   CORS 허용 : ${CORS_ORIGIN}`);
  logger.info(`   헬스체크  : http://localhost:${PORT}/api/health`);
});

// 예기치 않은 에러 처리 — 프로세스 종료 방지
process.on('uncaughtException', (err) => {
  logger.error('[uncaughtException]', err);
});

process.on('unhandledRejection', (reason) => {
  logger.error('[unhandledRejection]', reason);
});

export default app;
