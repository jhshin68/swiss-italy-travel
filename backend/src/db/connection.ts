// connection.ts — SQLite DB 연결 싱글턴
// better-sqlite3는 동기 API이므로 프로세스 전체에서 인스턴스 하나만 사용한다.

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../../data/travel.db');

// data 디렉토리가 없으면 자동 생성
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 싱글턴 인스턴스
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH, {
    // 개발 모드에서 SQL 쿼리 콘솔 출력
    verbose: process.env.NODE_ENV === 'development'
      ? (msg) => {
          if (process.env.LOG_SQL === 'true') console.log('[SQL]', msg);
        }
      : undefined,
  });

  // 성능 최적화 PRAGMA — 서버 시작 시 1회 실행
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('busy_timeout = 5000'); // 동시 쓰기 충돌 시 최대 5초 대기

  return _db;
}

/** 테스트·종료 시 DB 연결 닫기 */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
