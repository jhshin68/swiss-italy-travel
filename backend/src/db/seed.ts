// seed.ts — 초기 데이터 시딩 스크립트
// 실행: npm run seed
// 역할: trips, members, trip_auth 테이블에 기본 데이터를 삽입한다.
// 이미 데이터가 있으면 건너뛴다 (멱등성 보장).

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb, closeDb } from './connection';

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
    });

    seedAll();

    // 결과 확인
    const tripCount = (db.prepare('SELECT COUNT(*) as cnt FROM trips').get() as { cnt: number }).cnt;
    const memberCount = (db.prepare('SELECT COUNT(*) as cnt FROM members').get() as { cnt: number }).cnt;
    const authCount = (db.prepare('SELECT COUNT(*) as cnt FROM trip_auth').get() as { cnt: number }).cnt;

    console.log('\n🎉 시딩 완료!');
    console.log(`   trips: ${tripCount}개`);
    console.log(`   members: ${memberCount}명`);
    console.log(`   trip_auth: ${authCount}개`);
  } catch (err) {
    console.error('❌ 시딩 실패:', err);
    process.exit(1);
  } finally {
    closeDb();
  }
}

seed();
