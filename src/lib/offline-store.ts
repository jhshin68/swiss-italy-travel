// offline-store.ts — IndexedDB 기반 오프라인 경비 저장소
// 네트워크 불가 시 경비를 로컬에 저장하고, 온라인 복귀 시 서버에 동기화한다.

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'travel-offline';
const DB_VERSION = 1;

// 오프라인 경비 항목 — IndexedDB에 저장되는 형태
export interface OfflineExpense {
  id: string;
  tripId: number;
  amount: number;
  currency: 'KRW' | 'CHF' | 'EUR';
  category: string;
  description: string;
  paidBy: string;       // 'member-jinhyung' 등
  date: string;         // YYYY-MM-DD
  time: string;
  createdAt: string;    // ISO timestamp
  synced: boolean;      // false = 서버 동기화 대기 중
}

// 새 경비 저장 시 자동 생성되는 필드를 제외한 타입
type NewOfflineExpense = Omit<OfflineExpense, 'id' | 'createdAt' | 'synced'>;

// DB 인스턴스 캐시 — 매번 openDB를 호출하지 않기 위해 재사용
let dbPromise: Promise<IDBPDatabase> | null = null;

/** IndexedDB 인스턴스 반환 (싱글턴) */
function getDB(): Promise<IDBPDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // pendingExpenses 스토어 생성 — synced 인덱스로 미동기화 항목 조회
      if (!db.objectStoreNames.contains('pendingExpenses')) {
        const store = db.createObjectStore('pendingExpenses', {
          keyPath: 'id',
        });
        store.createIndex('synced', 'synced');
      }
    },
  });

  return dbPromise;
}

/** 오프라인 경비 저장 — 임시 UUID를 부여하고 synced=false로 저장 */
export async function savePendingExpense(
  expense: NewOfflineExpense,
): Promise<OfflineExpense> {
  const db = await getDB();
  const entry: OfflineExpense = {
    ...expense,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    synced: false,
  };
  await db.put('pendingExpenses', entry);
  return entry;
}

/** 미동기화 경비 목록 조회 (synced=false인 항목만) */
export async function getPendingExpenses(): Promise<OfflineExpense[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex(
    'pendingExpenses',
    'synced',
    IDBKeyRange.only(false),
  );
  return all as OfflineExpense[];
}

/** 동기화 완료 표시 — 서버 전송 성공 후 호출 */
export async function markAsSynced(id: string): Promise<void> {
  const db = await getDB();
  const entry = await db.get('pendingExpenses', id);
  if (!entry) return;
  (entry as OfflineExpense).synced = true;
  await db.put('pendingExpenses', entry);
}

/** 오프라인 경비 삭제 — 동기화 완료 후 정리용 */
export async function deletePendingExpense(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingExpenses', id);
}

/** 미동기화 경비 수 반환 — UI 배지 표시용 */
export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  const count = await db.countFromIndex(
    'pendingExpenses',
    'synced',
    IDBKeyRange.only(false),
  );
  return count;
}

/** 동기화 완료된 경비 일괄 삭제 — 스토리지 정리용 */
export async function clearSyncedExpenses(): Promise<void> {
  const db = await getDB();
  const synced = await db.getAllFromIndex(
    'pendingExpenses',
    'synced',
    IDBKeyRange.only(true),
  );
  const tx = db.transaction('pendingExpenses', 'readwrite');
  for (const entry of synced) {
    await tx.store.delete((entry as OfflineExpense).id);
  }
  await tx.done;
}
