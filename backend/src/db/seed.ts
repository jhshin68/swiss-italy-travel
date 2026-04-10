// seed.ts — 초기 데이터 시딩 스크립트
// 실행: npm run seed
// 역할: trips, members, trip_auth, day_plans, spots 테이블에 기본 데이터를 삽입한다.
// 이미 데이터가 있으면 건너뛴다 (멱등성 보장).

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb, closeDb } from './connection';
import ITINERARY from '../../../src/data/itinerary';
import type { ScheduleItem } from '../../../src/data/itinerary';

// itinerary.ts의 '10/8' → '2026-10-08' ISO 형식으로 변환
function toIsoDate(shortDate: string): string {
  const [month, day] = shortDate.split('/');
  return `2026-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// cost 문자열에서 금액과 통화를 추출
// "CHF 5" → { amount: 5, currency: 'CHF' }
// "€8~12" → { amount: 10, currency: 'EUR' }
// "약 CHF 30" → { amount: 30, currency: 'CHF' }
function parseCost(cost: string | undefined): { amount: number | null; currency: string } {
  if (!cost) return { amount: null, currency: 'CHF' };

  // 통화 판별: €가 있으면 EUR, CHF가 있으면 CHF
  const currency = cost.includes('€') ? 'EUR' : 'CHF';

  // 숫자 패턴 추출: "8~12" 같은 범위 또는 단일 숫자
  const rangeMatch = cost.match(/(\d+(?:\.\d+)?)\s*[~\-–]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    return { amount: Math.round((low + high) / 2), currency };
  }

  // 단일 숫자 추출
  const singleMatch = cost.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    return { amount: parseFloat(singleMatch[1]), currency };
  }

  return { amount: null, currency };
}

function seed(): void {
  const db = getDb();
  const FAMILY_PIN = process.env.FAMILY_PIN;

  if (!FAMILY_PIN || !/^\d{6}$/.test(FAMILY_PIN)) {
    console.error('❌ FAMILY_PIN 환경변수가 없거나 6자리 숫자가 아닙니다');
    console.error('   .env 파일에 FAMILY_PIN=123456 형식으로 설정하세요');
    process.exit(1);
  }

  console.log('🌱 시딩 시작...');

  try {
    // 트랜잭션으로 일괄 처리
    const seedAll = db.transaction(() => {
      // ── 1. trips 테이블 ──────────────────────────────────
      const existingTrip = db
        .prepare('SELECT id FROM trips LIMIT 1')
        .get() as { id: number } | undefined;

      let tripId: number;

      if (existingTrip) {
        tripId = existingTrip.id;
        console.log(`   ⏭ trips: 이미 존재 (id=${tripId})`);
      } else {
        const result = db.prepare(`
          INSERT INTO trips (name, start_date, end_date, currencies)
          VALUES (?, ?, ?, ?)
        `).run(
          '2026 스위스·이탈리아 가족여행',
          '2026-10-08',
          '2026-10-19',
          'CHF,EUR,KRW',
        );
        tripId = Number(result.lastInsertRowid);
        console.log(`   ✅ trips: 생성 (id=${tripId})`);
      }

      // ── 2. members 테이블 ────────────────────────────────
      const MEMBERS = [
        { name: '진형', emoji: '👨', color: '#E53E3E', role: 'admin' },
        { name: '지현', emoji: '👩', color: '#DD6B20', role: 'member' },
        { name: '동우', emoji: '👦', color: '#38A169', role: 'member' },
        { name: '유진', emoji: '👧', color: '#3182CE', role: 'member' },
      ];

      const existingMembers = db
        .prepare('SELECT COUNT(*) as cnt FROM members WHERE trip_id = ?')
        .get(tripId) as { cnt: number };

      if (existingMembers.cnt > 0) {
        console.log(`   ⏭ members: 이미 존재 (${existingMembers.cnt}명)`);
      } else {
        const insertMember = db.prepare(`
          INSERT INTO members (trip_id, name, emoji, color, role)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const m of MEMBERS) {
          insertMember.run(tripId, m.name, m.emoji, m.color, m.role);
        }
        console.log(`   ✅ members: ${MEMBERS.length}명 생성`);
      }

      // ── 3. trip_auth 테이블 ──────────────────────────────
      const existingAuth = db
        .prepare('SELECT id FROM trip_auth WHERE trip_id = ?')
        .get(tripId) as { id: number } | undefined;

      if (existingAuth) {
        console.log('   ⏭ trip_auth: 이미 존재');
      } else {
        // PIN을 bcrypt로 해시
        const pinHash = bcrypt.hashSync(FAMILY_PIN, 10);
        // 여행 전용 JWT 시크릿 생성
        const jwtSecret = crypto.randomBytes(32).toString('hex');

        db.prepare(`
          INSERT INTO trip_auth (trip_id, pin_hash, jwt_secret)
          VALUES (?, ?, ?)
        `).run(tripId, pinHash, jwtSecret);

        console.log('   ✅ trip_auth: PIN 해시 + JWT 시크릿 생성');
      }

      // ── 4. day_plans 테이블 (12일 일정) ───────────────────
      const existingDayPlans = db
        .prepare('SELECT COUNT(*) as cnt FROM day_plans WHERE trip_id = ?')
        .get(tripId) as { cnt: number };

      if (existingDayPlans.cnt > 0) {
        console.log(`   ⏭ day_plans: 이미 존재 (${existingDayPlans.cnt}일)`);
      } else {
        const insertDayPlan = db.prepare(`
          INSERT INTO day_plans (trip_id, date, title, theme, country, city, hotel, is_special, special_note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const day of ITINERARY) {
          const isoDate = toIsoDate(day.date);
          insertDayPlan.run(
            tripId,
            isoDate,
            `Day ${day.day} - ${day.theme}`,
            day.theme,
            day.country,
            day.city,
            day.hotel,
            day.isSpecial ? 1 : 0,
            day.specialNote ?? '',
          );
        }
        console.log(`   ✅ day_plans: ${ITINERARY.length}일 생성`);
      }

      // ── 5. spots 테이블 (108개 장소) ──────────────────────
      const existingSpots = (db
        .prepare(`
          SELECT COUNT(*) as cnt FROM spots
          WHERE day_plan_id IN (SELECT id FROM day_plans WHERE trip_id = ?)
        `)
        .get(tripId) as { cnt: number });

      if (existingSpots.cnt > 0) {
        console.log(`   ⏭ spots: 이미 존재 (${existingSpots.cnt}개)`);
      } else {
        // day_plans id를 date 기준으로 조회하여 매핑
        const dayPlanRows = db
          .prepare('SELECT id, date FROM day_plans WHERE trip_id = ? ORDER BY date')
          .all(tripId) as Array<{ id: number; date: string }>;

        // date → day_plan_id 매핑 테이블
        const dateToId = new Map<string, number>();
        for (const row of dayPlanRows) {
          dateToId.set(row.date, row.id);
        }

        const insertSpot = db.prepare(`
          INSERT INTO spots (
            day_plan_id, name, name_local, category,
            lat, lng, address, map_url, nav_url,
            start_time, end_time, cost, currency,
            notes, booking_ref, weather_alternative, image_url,
            sort_order, is_important
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let totalSpots = 0;

        for (const day of ITINERARY) {
          const isoDate = toIsoDate(day.date);
          const dayPlanId = dateToId.get(isoDate);

          if (!dayPlanId) {
            console.error(`   ❌ day_plan 미발견: ${isoDate} (Day ${day.day})`);
            continue;
          }

          for (let idx = 0; idx < day.items.length; idx++) {
            const item: ScheduleItem = day.items[idx];
            const { amount, currency } = parseCost(item.cost);

            insertSpot.run(
              dayPlanId,
              item.name,
              '',              // name_local: 현지어 이름은 아직 없음
              item.type,       // category: schema CHECK 제약과 동일
              null,            // lat: 좌표는 아직 없음
              null,            // lng
              '',              // address
              item.mapUrl ?? '',
              item.navUrl ?? '',
              item.time ?? '',
              '',              // end_time
              amount,          // cost (REAL | null)
              currency,
              item.tip ?? '',  // notes
              '',              // booking_ref
              '',              // weather_alternative
              '',              // image_url
              idx,             // sort_order: items 배열 인덱스
              item.important ? 1 : 0,
            );
            totalSpots++;
          }
        }
        console.log(`   ✅ spots: ${totalSpots}개 생성`);
      }
    });

    seedAll();

    // 결과 확인
    const tripCount = (db.prepare('SELECT COUNT(*) as cnt FROM trips').get() as { cnt: number }).cnt;
    const memberCount = (db.prepare('SELECT COUNT(*) as cnt FROM members').get() as { cnt: number }).cnt;
    const authCount = (db.prepare('SELECT COUNT(*) as cnt FROM trip_auth').get() as { cnt: number }).cnt;
    const dayPlanCount = (db.prepare('SELECT COUNT(*) as cnt FROM day_plans').get() as { cnt: number }).cnt;
    const spotCount = (db.prepare('SELECT COUNT(*) as cnt FROM spots').get() as { cnt: number }).cnt;

    console.log('\n🎉 시딩 완료!');
    console.log(`   trips: ${tripCount}개`);
    console.log(`   members: ${memberCount}명`);
    console.log(`   trip_auth: ${authCount}개`);
    console.log(`   day_plans: ${dayPlanCount}일`);
    console.log(`   spots: ${spotCount}개`);
  } catch (err) {
    console.error('❌ 시딩 실패:', err);
    process.exit(1);
  } finally {
    closeDb();
  }
}

seed();
