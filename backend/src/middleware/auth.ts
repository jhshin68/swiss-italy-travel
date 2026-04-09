// middleware/auth.ts — JWT 인증 미들웨어
// httpOnly cookie(travel_token)에서 JWT를 추출하여 검증한다.
// Authorization 헤더 방식은 사용하지 않는다 — 쿠키만 사용.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/connection';
import { logger } from '../lib/logger';
import type { ApiResponse, JwtPayload } from '../types';

const COOKIE_NAME = 'travel_token';

/**
 * requireAuth — 인증 필수 미들웨어
 *
 * 1. req.cookies에서 travel_token 쿠키를 읽는다
 * 2. trip_auth 테이블에서 해당 여행의 jwt_secret을 조회한다
 * 3. jwt.verify로 토큰을 검증한다
 * 4. 검증 성공 시 req.auth에 페이로드를 저장한다
 */
export function requireAuth(
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;

  if (!token) {
    res.status(401).json({
      success: false,
      error: '인증이 필요합니다',
    });
    return;
  }

  try {
    // 토큰을 디코딩하여 tripId를 먼저 추출 — jwt_secret 조회에 필요
    const decoded = jwt.decode(token) as JwtPayload | null;

    if (!decoded?.tripId) {
      res.status(401).json({
        success: false,
        error: '유효하지 않은 인증 토큰입니다',
      });
      return;
    }

    // trip_auth에서 해당 여행의 jwt_secret 조회
    const db = getDb();
    const authRow = db
      .prepare('SELECT jwt_secret FROM trip_auth WHERE trip_id = ?')
      .get(Number(decoded.tripId)) as { jwt_secret: string } | undefined;

    if (!authRow) {
      res.status(401).json({
        success: false,
        error: '여행 인증 정보를 찾을 수 없습니다',
      });
      return;
    }

    // jwt_secret으로 토큰 검증
    const verified = jwt.verify(token, authRow.jwt_secret) as JwtPayload;

    // req.auth에 페이로드 저장
    req.auth = {
      tripId: verified.tripId,
      memberId: verified.memberId,
      memberName: verified.memberName,
      role: verified.role,
    };

    next();
  } catch (err) {
    // 토큰 만료 또는 변조
    const isExpired = err instanceof jwt.TokenExpiredError;
    const message = isExpired
      ? '인증이 만료되었습니다. 다시 로그인해주세요'
      : '유효하지 않은 인증 토큰입니다';

    logger.warn(`JWT 검증 실패: ${isExpired ? '만료' : '변조/오류'}`);

    res.status(401).json({
      success: false,
      error: message,
    });
  }
}
