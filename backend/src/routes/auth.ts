// routes/auth.ts — 인증 API (PIN 로그인 / me / 로그아웃)
// 가족 공통 PIN 6자리 + 멤버 선택 방식의 인증을 처리한다.
// httpOnly cookie로 JWT를 발급하며, Authorization 헤더는 사용하지 않는다.

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getDb } from '../db/connection';
import { logger } from '../lib/logger';
import { requireAuth } from '../middleware/auth';
import type { ApiResponse } from '../types';

const router = Router();

// ── 상수 ────────────────────────────────────────────────────

const COOKIE_NAME = 'travel_token';
const JWT_EXPIRES_IN = '30d';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30일 (밀리초)

// Rate limiting 상수
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5분

// ── 멤버 매핑 정보 ──────────────────────────────────────────

interface MemberInfo {
  name: string;
  emoji: string;
  color: string;
  role: 'admin' | 'member';
}

const MEMBER_MAP: Record<string, MemberInfo> = {
  'member-jinhyung': { name: '진형', emoji: '👨', color: '#E53E3E', role: 'admin' },
  'member-jihyun':   { name: '지현', emoji: '👩', color: '#DD6B20', role: 'member' },
  'member-dongwoo':  { name: '동우', emoji: '👦', color: '#38A169', role: 'member' },
  'member-yujin':    { name: '유진', emoji: '👧', color: '#3182CE', role: 'member' },
};

// ── Rate Limiting (메모리 Map) ──────────────────────────────

interface RateLimitEntry {
  attempts: number;
  lockedUntil: number | null; // Unix timestamp (ms)
}

// IP별 실패 횟수 추적 — 서버 재시작 시 초기화됨
const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * IP 기반 Rate Limit 검사
 * @returns true이면 요청 차단 (잠금 상태)
 */
function isRateLimited(ip: string): boolean {
  const entry = rateLimitMap.get(ip);
  if (!entry) return false;

  // 잠금 시간이 지났으면 초기화
  if (entry.lockedUntil && Date.now() > entry.lockedUntil) {
    rateLimitMap.delete(ip);
    return false;
  }

  return entry.lockedUntil !== null;
}

/** 로그인 실패 기록 — 연속 MAX_ATTEMPTS 실패 시 잠금 */
function recordFailure(ip: string): void {
  const entry = rateLimitMap.get(ip) ?? { attempts: 0, lockedUntil: null };
  entry.attempts += 1;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    logger.warn(`Rate limit 잠금 활성화: IP=${ip}, ${MAX_ATTEMPTS}회 실패`);
  }

  rateLimitMap.set(ip, entry);
}

/** 로그인 성공 시 실패 기록 초기화 */
function resetFailures(ip: string): void {
  rateLimitMap.delete(ip);
}

/** 잠금 해제까지 남은 시간(초) */
function getRemainingLockSeconds(ip: string): number {
  const entry = rateLimitMap.get(ip);
  if (!entry?.lockedUntil) return 0;
  return Math.ceil((entry.lockedUntil - Date.now()) / 1000);
}

// ── Zod 스키마 ──────────────────────────────────────────────

const loginSchema = z.object({
  pin: z
    .string()
    .length(6, 'PIN은 6자리여야 합니다')
    .regex(/^\d{6}$/, 'PIN은 숫자 6자리여야 합니다'),
  memberId: z.enum(
    ['member-jinhyung', 'member-jihyun', 'member-dongwoo', 'member-yujin'],
    { errorMap: () => ({ message: '올바른 멤버를 선택해주세요' }) },
  ),
});

// ── 응답 타입 ───────────────────────────────────────────────

interface LoginResponseData {
  memberId: string;
  memberName: string;
  emoji: string;
  color: string;
  role: 'admin' | 'member';
  tripId: string;
}

interface MeResponseData {
  memberId: string;
  memberName: string;
  emoji: string;
  color: string;
  role: 'admin' | 'member';
  tripId: string;
}

// ── POST /api/auth/login ────────────────────────────────────

router.post('/login', (req: Request, res: Response<ApiResponse<LoginResponseData>>) => {
  const clientIp = req.ip ?? req.socket.remoteAddress ?? 'unknown';

  // Rate limit 검사
  if (isRateLimited(clientIp)) {
    const remaining = getRemainingLockSeconds(clientIp);
    res.status(429).json({
      success: false,
      error: `로그인 시도가 너무 많습니다. ${remaining}초 후에 다시 시도해주세요`,
    });
    return;
  }

  // 입력 검증
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? '입력이 올바르지 않습니다';
    res.status(400).json({
      success: false,
      error: firstError,
    });
    return;
  }

  const { pin, memberId } = parsed.data;

  // 멤버 정보 확인
  const memberInfo = MEMBER_MAP[memberId];
  if (!memberInfo) {
    res.status(400).json({
      success: false,
      error: '올바른 멤버를 선택해주세요',
    });
    return;
  }

  try {
    const db = getDb();

    // trip_auth에서 PIN 해시와 jwt_secret 조회
    // 현재 여행은 1개뿐이므로 첫 번째 레코드를 사용
    const authRow = db
      .prepare('SELECT trip_id, pin_hash, jwt_secret FROM trip_auth LIMIT 1')
      .get() as { trip_id: number; pin_hash: string; jwt_secret: string } | undefined;

    if (!authRow) {
      logger.error('trip_auth 테이블에 인증 정보가 없습니다');
      res.status(500).json({
        success: false,
        error: '서버 인증 설정이 완료되지 않았습니다',
      });
      return;
    }

    // bcrypt로 PIN 해시 비교
    const isMatch = bcrypt.compareSync(pin, authRow.pin_hash);

    if (!isMatch) {
      recordFailure(clientIp);
      const entry = rateLimitMap.get(clientIp);
      const attemptsLeft = MAX_ATTEMPTS - (entry?.attempts ?? 0);

      logger.warn(`로그인 실패: memberId=${memberId}, IP=${clientIp}`);

      // 잠금 상태가 됐으면 잠금 메시지
      if (attemptsLeft <= 0) {
        const remaining = getRemainingLockSeconds(clientIp);
        res.status(429).json({
          success: false,
          error: `로그인 시도가 너무 많습니다. ${remaining}초 후에 다시 시도해주세요`,
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: 'PIN이 올바르지 않습니다',
      });
      return;
    }

    // PIN 일치 — 실패 기록 초기화
    resetFailures(clientIp);

    // JWT 생성
    const tripId = String(authRow.trip_id);
    const payload = {
      tripId,
      memberId,
      memberName: memberInfo.name,
      role: memberInfo.role,
    };

    const token = jwt.sign(payload, authRow.jwt_secret, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // httpOnly 쿠키 설정
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,         // HTTPS에서만 전송 (프로덕션)
      sameSite: isProduction ? 'none' : 'lax', // 크로스 사이트 쿠키 허용 (Vercel↔Oracle VM)
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    logger.info(`로그인 성공: ${memberInfo.name}(${memberId})`);

    res.status(200).json({
      success: true,
      data: {
        memberId,
        memberName: memberInfo.name,
        emoji: memberInfo.emoji,
        color: memberInfo.color,
        role: memberInfo.role,
        tripId,
      },
    });
  } catch (err) {
    logger.error('로그인 처리 중 오류', err);
    res.status(500).json({
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다',
    });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────

router.get('/me', requireAuth, (req: Request, res: Response<ApiResponse<MeResponseData>>) => {
  // requireAuth 미들웨어가 req.auth를 채워준다
  const auth = req.auth;

  if (!auth) {
    res.status(401).json({
      success: false,
      error: '인증이 필요합니다',
    });
    return;
  }

  const memberInfo = MEMBER_MAP[auth.memberId];

  // 멤버 정보가 매핑에 없는 극히 예외적인 경우 방어
  if (!memberInfo) {
    logger.error(`MEMBER_MAP에 없는 memberId: ${auth.memberId}`);
    res.status(500).json({
      success: false,
      error: '멤버 정보를 확인할 수 없습니다',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      memberId: auth.memberId,
      memberName: auth.memberName,
      emoji: memberInfo.emoji,
      color: memberInfo.color,
      role: auth.role,
      tripId: auth.tripId,
    },
  });
});

// ── POST /api/auth/logout ───────────────────────────────────

router.post('/logout', (_req: Request, res: Response<ApiResponse>) => {
  // travel_token 쿠키를 즉시 만료시켜 삭제
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 0, // 즉시 만료
    path: '/',
  });

  res.status(200).json({
    success: true,
  });
});

export default router;
