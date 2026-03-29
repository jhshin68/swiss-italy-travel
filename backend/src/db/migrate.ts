// migrate.ts — SQLite 초기 마이그레이션 스크립트
// 실행: npm run migrate  (또는 tsx src/db/migrate.ts)
// 역할: schema.sql을 읽어 DB에 적용한다. 이미 존재하는 테이블은 건드리지 않는다.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getDb, closeDb } from './connection';

function migrate(): void {
  console.log('🔧 마이그레이션 시작...');

  const db = getDb();
  const schemaPath = path.join(__dirname, 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ schema.sql 파일을 찾을 수 없습니다:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf-8');

  try {
    // 스키마 전체를 트랜잭션으로 실행 (IF NOT EXISTS 덕분에 재실행 안전)
    db.exec(sql);
    console.log('✅ 스키마 적용 완료');

    // 적용된 테이블 목록 출력
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as Array<{ name: string }>;

    console.log('📋 생성된 테이블:');
    tables.forEach((t) => console.log(`   - ${t.name}`));

    console.log('\n🎉 마이그레이션 성공!');
    console.log(`📁 DB 위치: ${process.env.DB_PATH ?? './data/travel.db'}`);
  } catch (err) {
    console.error('❌ 마이그레이션 실패:', err);
    process.exit(1);
  } finally {
    closeDb();
  }
}

migrate();
