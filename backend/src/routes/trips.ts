// routes/trips.ts — 일정/장소 조회 API
// 여행 일정(day_plans)과 장소(spots) 데이터를 조회한다.
// 모든 엔드포인트는 requireAuth 미들웨어로 인증 필수이며,
// URL의 tripId가 JWT의 tripId와 일치해야 한다.

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db/connection';
import { logger } from '../lib/logger';
import { requireAuth } from '../middleware/auth';
import type { ApiResponse } from '../types';

const router = Router();

// ── 응답 타입 ───────────────────────────────────────────────

interface DayPlanResponse {
  id: number;
  date: string;
  title: string;
  theme: string;
  country: string;
  city: string;
  hotel: string;
  isSpecial: boolean;
  specialNote: string;
  spotCount: number;
}

interface SpotResponse {
  id: number;
  name: string;
  nameLocal: string;
  category: string;
  lat: number | null;
  lng: number | null;
  address: string;
  mapUrl: string;
  navUrl: string;
  startTime: string;
  endTime: string;
  cost: number | null;
  currency: string;
  notes: string;
  bookingRef: string;
  weatherAlternative: string;
  imageUrl: string;
  sortOrder: number;
  isImportant: boolean;
}

interface DayDetailResponse {
  dayPlan: DayPlanResponse;
  spots: SpotResponse[];
}

// ── DB 행 타입 (snake_case) ─────────────────────────────────

interface DayPlanRow {
  id: number;
  date: string;
  title: string;
  theme: string;
  country: string;
  city: string;
  hotel: string;
  is_special: number;
  special_note: string;
  spot_count: number;
}

interface SpotRow {
  id: number;
  name: string;
  name_local: string;
  category: string;
  lat: number | null;
  lng: number | null;
  address: string;
  map_url: string;
  nav_url: string;
  start_time: string;
  end_time: string;
  cost: number | null;
  currency: string;
  notes: string;
  booking_ref: string;
  weather_alternative: string;
  image_url: string;
  sort_order: number;
  is_important: number;
}

// ── 변환 함수 ──────────────────────────────────────────────
// DB의 snake_case 컬럼을 API의 camelCase 필드로 변환한다.

function toDayPlanResponse(row: DayPlanRow): DayPlanResponse {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    theme: row.theme,
    country: row.country,
    city: row.city,
    hotel: row.hotel,
    isSpecial: row.is_special === 1,
    specialNote: row.special_note,
    spotCount: row.spot_count,
  };
}

function toSpotResponse(row: SpotRow): SpotResponse {
  return {
    id: row.id,
    name: row.name,
    nameLocal: row.name_local,
    category: row.category,
    lat: row.lat,
    lng: row.lng,
    address: row.address,
    mapUrl: row.map_url,
    navUrl: row.nav_url,
    startTime: row.start_time,
    endTime: row.end_time,
    cost: row.cost,
    currency: row.currency,
    notes: row.notes,
    bookingRef: row.booking_ref,
    weatherAlternative: row.weather_alternative,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isImportant: row.is_important === 1,
  };
}

// ── Zod 스키마 ──────────────────────────────────────────────

const tripIdParamSchema = z.object({
  tripId: z.string().regex(/^\d+$/, 'tripId는 숫자여야 합니다'),
});

// :date 파라미터 — ISO 날짜 또는 day 번호(1~12)
const dateParamSchema = z.object({
  date: z.string().regex(
    /^(\d{4}-\d{2}-\d{2}|\d{1,2})$/,
    '날짜는 YYYY-MM-DD 형식 또는 1~12 사이의 숫자여야 합니다',
  ),
});

const spotIdParamSchema = z.object({
  spotId: z.string().regex(/^\d+$/, 'spotId는 숫자여야 합니다'),
});

const dayQuerySchema = z.object({
  day: z.string().regex(/^\d{1,2}$/, 'day는 1~12 사이의 숫자여야 합니다').optional(),
});

// ── tripId 일치 검증 헬퍼 ───────────────────────────────────
// JWT의 tripId와 URL 파라미터의 tripId가 일치하는지 확인한다.

function validateTripAccess(req: Request, res: Response, tripId: string): boolean {
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

// ── GET /api/trips/:tripId/days ─────────────────────────────
// 12일 전체 일정 목록 + 각 날의 장소 개수

router.get(
  '/:tripId/days',
  requireAuth,
  (req: Request, res: Response<ApiResponse<DayPlanResponse[]>>) => {
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

    try {
      const db = getDb();

      const rows = db.prepare(`
        SELECT
          dp.id, dp.date, dp.title, dp.theme,
          dp.country, dp.city, dp.hotel,
          dp.is_special, dp.special_note,
          COUNT(s.id) AS spot_count
        FROM day_plans dp
        LEFT JOIN spots s ON s.day_plan_id = dp.id
        WHERE dp.trip_id = ?
        GROUP BY dp.id
        ORDER BY dp.date ASC
      `).all(Number(tripId)) as DayPlanRow[];

      res.status(200).json({
        success: true,
        data: rows.map(toDayPlanResponse),
      });
    } catch (err) {
      logger.error('일정 목록 조회 실패', err);
      res.status(500).json({
        success: false,
        error: '일정 목록을 불러오는 중 오류가 발생했습니다',
      });
    }
  },
);

// ── GET /api/trips/:tripId/days/:date ───────────────────────
// 특정 날짜의 일정 + 장소 목록
// :date는 'YYYY-MM-DD' 또는 day 번호 '1'~'12'

router.get(
  '/:tripId/days/:date',
  requireAuth,
  (req: Request, res: Response<ApiResponse<DayDetailResponse>>) => {
    const paramParsed = tripIdParamSchema.safeParse({ tripId: req.params.tripId });
    if (!paramParsed.success) {
      res.status(400).json({
        success: false,
        error: paramParsed.error.errors[0]?.message ?? '잘못된 요청입니다',
      });
      return;
    }

    const dateParsed = dateParamSchema.safeParse({ date: req.params.date });
    if (!dateParsed.success) {
      res.status(400).json({
        success: false,
        error: dateParsed.error.errors[0]?.message ?? '날짜 형식이 올바르지 않습니다',
      });
      return;
    }

    const { tripId } = paramParsed.data;
    if (!validateTripAccess(req, res, tripId)) return;

    const { date } = dateParsed.data;

    try {
      const db = getDb();

      // day 번호인 경우 해당 날짜로 변환
      // day_plans를 date 오름차순으로 정렬해 N번째 행을 찾는다
      let dayPlanRow: DayPlanRow | undefined;

      if (/^\d{1,2}$/.test(date)) {
        const dayNumber = Number(date);

        const rows = db.prepare(`
          SELECT
            dp.id, dp.date, dp.title, dp.theme,
            dp.country, dp.city, dp.hotel,
            dp.is_special, dp.special_note,
            COUNT(s.id) AS spot_count
          FROM day_plans dp
          LEFT JOIN spots s ON s.day_plan_id = dp.id
          WHERE dp.trip_id = ?
          GROUP BY dp.id
          ORDER BY dp.date ASC
          LIMIT 1 OFFSET ?
        `).all(Number(tripId), dayNumber - 1) as DayPlanRow[];

        dayPlanRow = rows[0];
      } else {
        const rows = db.prepare(`
          SELECT
            dp.id, dp.date, dp.title, dp.theme,
            dp.country, dp.city, dp.hotel,
            dp.is_special, dp.special_note,
            COUNT(s.id) AS spot_count
          FROM day_plans dp
          LEFT JOIN spots s ON s.day_plan_id = dp.id
          WHERE dp.trip_id = ? AND dp.date = ?
          GROUP BY dp.id
        `).all(Number(tripId), date) as DayPlanRow[];

        dayPlanRow = rows[0];
      }

      if (!dayPlanRow) {
        res.status(404).json({
          success: false,
          error: '해당 날짜의 일정을 찾을 수 없습니다',
        });
        return;
      }

      // 해당 day_plan의 장소 목록 (sort_order 정렬)
      const spotRows = db.prepare(`
        SELECT
          id, name, name_local, category,
          lat, lng, address, map_url, nav_url,
          start_time, end_time, cost, currency,
          notes, booking_ref, weather_alternative,
          image_url, sort_order, is_important
        FROM spots
        WHERE day_plan_id = ?
        ORDER BY sort_order ASC
      `).all(dayPlanRow.id) as SpotRow[];

      res.status(200).json({
        success: true,
        data: {
          dayPlan: toDayPlanResponse(dayPlanRow),
          spots: spotRows.map(toSpotResponse),
        },
      });
    } catch (err) {
      logger.error('일정 상세 조회 실패', err);
      res.status(500).json({
        success: false,
        error: '일정 상세를 불러오는 중 오류가 발생했습니다',
      });
    }
  },
);

// ── GET /api/trips/:tripId/spots ────────────────────────────
// 전체 장소 목록 (선택적 day 쿼리 파라미터로 필터)

router.get(
  '/:tripId/spots',
  requireAuth,
  (req: Request, res: Response<ApiResponse<SpotResponse[]>>) => {
    const paramParsed = tripIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      res.status(400).json({
        success: false,
        error: paramParsed.error.errors[0]?.message ?? '잘못된 요청입니다',
      });
      return;
    }

    const queryParsed = dayQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      res.status(400).json({
        success: false,
        error: queryParsed.error.errors[0]?.message ?? 'day 파라미터가 올바르지 않습니다',
      });
      return;
    }

    const { tripId } = paramParsed.data;
    if (!validateTripAccess(req, res, tripId)) return;

    const { day } = queryParsed.data;

    try {
      const db = getDb();

      let spotRows: SpotRow[];

      if (day) {
        // day 번호로 day_plan을 찾아 해당 장소만 반환
        const dayNumber = Number(day);

        spotRows = db.prepare(`
          SELECT
            s.id, s.name, s.name_local, s.category,
            s.lat, s.lng, s.address, s.map_url, s.nav_url,
            s.start_time, s.end_time, s.cost, s.currency,
            s.notes, s.booking_ref, s.weather_alternative,
            s.image_url, s.sort_order, s.is_important
          FROM spots s
          INNER JOIN day_plans dp ON dp.id = s.day_plan_id
          WHERE dp.trip_id = ?
            AND dp.id = (
              SELECT id FROM day_plans
              WHERE trip_id = ?
              ORDER BY date ASC
              LIMIT 1 OFFSET ?
            )
          ORDER BY s.sort_order ASC
        `).all(Number(tripId), Number(tripId), dayNumber - 1) as SpotRow[];
      } else {
        // 전체 장소 반환 (날짜순 + sort_order순)
        spotRows = db.prepare(`
          SELECT
            s.id, s.name, s.name_local, s.category,
            s.lat, s.lng, s.address, s.map_url, s.nav_url,
            s.start_time, s.end_time, s.cost, s.currency,
            s.notes, s.booking_ref, s.weather_alternative,
            s.image_url, s.sort_order, s.is_important
          FROM spots s
          INNER JOIN day_plans dp ON dp.id = s.day_plan_id
          WHERE dp.trip_id = ?
          ORDER BY dp.date ASC, s.sort_order ASC
        `).all(Number(tripId)) as SpotRow[];
      }

      res.status(200).json({
        success: true,
        data: spotRows.map(toSpotResponse),
      });
    } catch (err) {
      logger.error('장소 목록 조회 실패', err);
      res.status(500).json({
        success: false,
        error: '장소 목록을 불러오는 중 오류가 발생했습니다',
      });
    }
  },
);

// ── GET /api/trips/:tripId/spots/:spotId ────────────────────
// 특정 장소 상세 조회

router.get(
  '/:tripId/spots/:spotId',
  requireAuth,
  (req: Request, res: Response<ApiResponse<SpotResponse>>) => {
    const paramParsed = tripIdParamSchema.safeParse({ tripId: req.params.tripId });
    if (!paramParsed.success) {
      res.status(400).json({
        success: false,
        error: paramParsed.error.errors[0]?.message ?? '잘못된 요청입니다',
      });
      return;
    }

    const spotParsed = spotIdParamSchema.safeParse({ spotId: req.params.spotId });
    if (!spotParsed.success) {
      res.status(400).json({
        success: false,
        error: spotParsed.error.errors[0]?.message ?? 'spotId가 올바르지 않습니다',
      });
      return;
    }

    const { tripId } = paramParsed.data;
    if (!validateTripAccess(req, res, tripId)) return;

    const spotId = Number(spotParsed.data.spotId);

    try {
      const db = getDb();

      // spots를 day_plans와 JOIN하여 trip_id 소속 검증
      const row = db.prepare(`
        SELECT
          s.id, s.name, s.name_local, s.category,
          s.lat, s.lng, s.address, s.map_url, s.nav_url,
          s.start_time, s.end_time, s.cost, s.currency,
          s.notes, s.booking_ref, s.weather_alternative,
          s.image_url, s.sort_order, s.is_important
        FROM spots s
        INNER JOIN day_plans dp ON dp.id = s.day_plan_id
        WHERE s.id = ? AND dp.trip_id = ?
      `).get(spotId, Number(tripId)) as SpotRow | undefined;

      if (!row) {
        res.status(404).json({
          success: false,
          error: '해당 장소를 찾을 수 없습니다',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: toSpotResponse(row),
      });
    } catch (err) {
      logger.error('장소 상세 조회 실패', err);
      res.status(500).json({
        success: false,
        error: '장소 정보를 불러오는 중 오류가 발생했습니다',
      });
    }
  },
);

export default router;
