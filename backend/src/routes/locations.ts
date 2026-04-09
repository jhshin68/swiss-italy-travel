// routes/locations.ts — 위치 공유 API (POST 전송 + GET 조회)
// 가족 간 실시간 위치 공유를 위한 엔드포인트.
// 10초 간격 폴링 구조이며, 5분 이내 데이터만 활성 상태로 반환한다.

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection';
import { logger } from '../lib/logger';
import { requireAuth } from '../middleware/auth';
import type { ApiResponse } from '../types';

const router = Router();

// ── Zod 스키마 ─────────────────────────────────────────────

const tripIdParamSchema = z.object({
  tripId: z.string().regex(/^\d+$/, 'tripId는 숫자여야 합니다'),
});

const postLocationSchema = z.object({
  lat: z.number().min(-90).max(90, '위도는 -90~90 사이여야 합니다'),
  lng: z.number().min(-180).max(180, '경도는 -180~180 사이여야 합니다'),
  accuracy: z.number().min(0).default(0),
});

// ── 응답 타입 ──────────────────────────────────────────────

interface LocationResponse {
  memberId: string;
  memberName: string;
  emoji: string;
  lat: number;
  lng: number;
  accuracy: number;
  updatedAt: string;
}

// ── DB 행 타입 ─────────────────────────────────────────────

interface LocationRow {
  member_id: number;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

interface MemberRow {
  id: number;
  name: string;
  emoji: string;
}

// ── 멤버 DB id → 문자열 memberId 매핑 ─────────────────────

const NAME_TO_STRING_ID: Record<string, string> = {
  '진형': 'member-jinhyung',
  '지현': 'member-jihyun',
  '동우': 'member-dongwoo',
  '유진': 'member-yujin',
};

function getMemberStringId(name: string): string {
  return NAME_TO_STRING_ID[name] ?? name;
}

// ── 문자열 memberId → DB id 조회 ──────────────────────────

function getMemberDbId(tripId: number, memberId: string): number | null {
  const db = getDb();
  const members = db
    .prepare('SELECT id, name FROM members WHERE trip_id = ?')
    .all(tripId) as MemberRow[];

  for (const m of members) {
    if (getMemberStringId(m.name) === memberId) return m.id;
  }
  return null;
}

// ── JWT tripId 검증 헬퍼 ────────────────────────────────────

function validateTripAccess(
  req: Request,
  res: Response,
  tripId: string,
): boolean {
  if (!req.auth) {
    res.status(401).json({ success: false, error: '인증이 필요합니다' });
    return false;
  }
  if (req.auth.tripId !== tripId) {
    res.status(403).json({
      success: false,
      error: '해당 여행에 대한 접근 권한이 없습니다',
    });
    return false;
  }
  return true;
}

// ── POST /:tripId/locations ────────────────────────────────
// 내 위치를 서버에 전송 (UPSERT — 기존 위치가 있으면 갱신)

router.post(
  '/:tripId/locations',
  requireAuth,
  (req: Request, res: Response<ApiResponse>) => {
    const paramParsed = tripIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      res.status(400).json({
        success: false,
        error: paramParsed.error.errors[0]?.message ?? '잘못된 요청입니다',
      });
      return;
    }

    const bodyParsed = postLocationSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({
        success: false,
        error: bodyParsed.error.errors[0]?.message ?? '위치 데이터가 올바르지 않습니다',
      });
      return;
    }

    const { tripId } = paramParsed.data;
    if (!validateTripAccess(req, res, tripId)) return;

    const tripIdNum = Number(tripId);
    const { lat, lng, accuracy } = bodyParsed.data;
    const memberId = req.auth!.memberId;

    try {
      const memberDbId = getMemberDbId(tripIdNum, memberId);
      if (memberDbId === null) {
        res.status(400).json({
          success: false,
          error: '멤버 정보를 찾을 수 없습니다',
        });
        return;
      }

      const db = getDb();
      const now = new Date().toISOString();

      // 기존 위치가 있으면 UPDATE, 없으면 INSERT
      const existing = db
        .prepare(
          'SELECT id FROM locations WHERE trip_id = ? AND member_id = ?',
        )
        .get(tripIdNum, memberDbId) as { id: number } | undefined;

      if (existing) {
        db.prepare(
          `UPDATE locations
           SET lat = ?, lng = ?, accuracy = ?, timestamp = ?
           WHERE id = ?`,
        ).run(lat, lng, accuracy, now, existing.id);
      } else {
        db.prepare(
          `INSERT INTO locations (trip_id, member_id, lat, lng, accuracy, timestamp)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).run(tripIdNum, memberDbId, lat, lng, accuracy, now);
      }

      res.status(200).json({ success: true });
    } catch (err) {
      logger.error('위치 저장 실패', err);
      res.status(500).json({
        success: false,
        error: '위치를 저장하는 중 오류가 발생했습니다',
      });
    }
  },
);

// ── GET /:tripId/locations ─────────────────────────────────
// 가족 전체 위치 조회 (최근 5분 이내 활성 위치만)

router.get(
  '/:tripId/locations',
  requireAuth,
  (req: Request, res: Response<ApiResponse<LocationResponse[]>>) => {
    const paramParsed = tripIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      res.status(400).json({
        success: false,
        error: paramParsed.error.errors[0]?.message ?? '잘못된 요청입니다',
      });
      return;
    }

    const { tripId } = paramParsed.data;
    if (!validateTripAccess(req, res, tripId)) return;

    const tripIdNum = Number(tripId);

    try {
      const db = getDb();

      // 5분 이내 위치가 있는 멤버만 조회
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const rows = db
        .prepare(
          `SELECT l.member_id, l.lat, l.lng, l.accuracy, l.timestamp
           FROM locations l
           WHERE l.trip_id = ?
             AND l.timestamp > ?
           ORDER BY l.timestamp DESC`,
        )
        .all(tripIdNum, fiveMinAgo) as LocationRow[];

      // 멤버 정보 조회
      const members = db
        .prepare('SELECT id, name, emoji FROM members WHERE trip_id = ?')
        .all(tripIdNum) as MemberRow[];

      const memberMap = new Map<number, MemberRow>();
      for (const m of members) {
        memberMap.set(m.id, m);
      }

      // 멤버당 최신 위치 1개만 추출 (중복 제거)
      const seen = new Set<number>();
      const data: LocationResponse[] = [];

      for (const row of rows) {
        if (seen.has(row.member_id)) continue;
        seen.add(row.member_id);

        const member = memberMap.get(row.member_id);
        if (!member) continue;

        data.push({
          memberId: getMemberStringId(member.name),
          memberName: member.name,
          emoji: member.emoji,
          lat: row.lat,
          lng: row.lng,
          accuracy: row.accuracy,
          updatedAt: row.timestamp,
        });
      }

      res.status(200).json({ success: true, data });
    } catch (err) {
      logger.error('위치 조회 실패', err);
      res.status(500).json({
        success: false,
        error: '위치 정보를 불러오는 중 오류가 발생했습니다',
      });
    }
  },
);

export default router;
