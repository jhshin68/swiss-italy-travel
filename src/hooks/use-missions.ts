import { useCallback, useSyncExternalStore } from 'react';

// 미션 완료 상태 관리 — localStorage 기반 + 도장 자동 연동
// 미션 ID와 도장 ID 매핑 (미션 완료 시 해당 도시 도장 획득)
const MISSION_STAMP_MAP: Record<string, string> = {
  m1: '',            // Day 1 취리히 — 별도 도장 없음
  m2: 'bern',        // Day 2 베른
  m3: 'grindelwald', // Day 3 그린델발트
  m4: 'first',       // Day 4 피르스트
  m5: 'zermatt',     // Day 5 체르마트
  m6: 'gornergrat',  // Day 6 고르너그라트
  m7: 'gelato',      // Day 7 젤라또
  m8: 'firenze',     // Day 8 피렌체
  m9: '',            // Day 9 우피치 — 피렌체 도장과 동일 도시
  m10: 'colosseum',  // Day 10 콜로세움
  m11: '',           // Day 11 트레비 — 로마 도장과 동일 도시
  m12: '',           // Day 12 공항 — 별도 도장 없음
};

const STORAGE_KEY = 'travel-missions-completed';

// 외부 스토어 패턴 — 탭 간 상태 동기화
let completedMissions: Set<string> = new Set();
const listeners = new Set<() => void>();

function loadFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
}

function saveToStorage(missions: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...missions]));
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Set<string> {
  return completedMissions;
}

function getServerSnapshot(): Set<string> {
  return new Set();
}

// 초기 로드 (클라이언트 전용)
if (typeof window !== 'undefined') {
  completedMissions = loadFromStorage();
}

// 미션 완료 상태 관리 훅
export function useMissions() {
  const completed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleMission = useCallback((missionId: string) => {
    const next = new Set(completedMissions);
    if (next.has(missionId)) {
      next.delete(missionId);
    } else {
      next.add(missionId);
    }
    completedMissions = next;
    saveToStorage(next);
    emitChange();
  }, []);

  // 획득한 도장 목록 계산
  const collectedStamps = new Set<string>();
  completed.forEach((missionId) => {
    const stampId = MISSION_STAMP_MAP[missionId];
    if (stampId) collectedStamps.add(stampId);
  });

  return {
    completedMissions: completed,
    collectedStamps,
    toggleMission,
    completedCount: completed.size,
  };
}
