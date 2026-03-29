# PS-006: 오프라인 캐싱 + 동기화

> 이 앱의 생명선. 스위스 산 위에서도, 기차 터널에서도 핵심 기능이 동작해야 한다.

## 사용자 스토리

```
AS 가족 멤버
I WANT 인터넷 없이도 일정 확인하고 경비를 기록하고 싶다
SO THAT 여행 중 네트워크 상태에 의존하지 않는다
```

## 캐싱 계층

### Layer 1: Service Worker (Cache API)
```
앱 설치 시 사전 캐싱 (Pre-cache):
  - 앱 셸 (HTML, CSS, JS 번들)
  - 아이콘, 폰트
  - 전체 일정 데이터 (12일분)
  - 비상 정보 카드 전체
  - 숙소·예약 정보 전체

런타임 캐싱 (Runtime cache):
  - API 응답 (Cache-first, 네트워크 fallback)
  - 이미지 (Cache-first)
  - 환율 데이터 (Network-first, 캐시 fallback)
```

### Layer 2: IndexedDB
```
로컬 데이터 저장:
  - 경비 입력 (오프라인 생성분)
  - 체크리스트 체크 상태
  - 일정 수정 사항 (오프라인 수정분)
  - 마지막 동기화 시각

스키마:
  expenses_local: { id, data, syncStatus, createdAt }
  itinerary_changes: { id, type, data, syncStatus, createdAt }
  checklist_state: { id, checked, updatedAt }
  sync_meta: { lastSyncAt, pendingCount }
```

### Layer 3: localStorage
```
경량 데이터:
  - 디바이스 토큰
  - 현재 멤버 ID
  - UI 상태 (마지막 본 날짜 등)
  - 마지막 캐시 환율
```

## 동기화 전략

### 오프라인 → 온라인 복귀 시

```
[감지] navigator.onLine === true + online 이벤트
  │
  ├── [1] 경비 동기화
  │   pending 상태인 expenses를 서버로 POST
  │   성공 → syncStatus = 'synced'
  │   실패 → 재시도 (최대 3회, exponential backoff)
  │
  ├── [2] 일정 변경 동기화  
  │   pending 상태인 변경사항을 서버로 PATCH
  │   충돌 시: Last-Write-Wins (timestamp 기준)
  │
  ├── [3] 서버 데이터 풀
  │   다른 멤버가 추가한 경비/일정 변경 가져오기
  │   GET /api/sync?since={lastSyncAt}
  │
  └── [4] 캐시 갱신
      최신 데이터로 Cache API + IndexedDB 업데이트
      sync_meta.lastSyncAt 갱신
```

### 충돌 해결 정책

```
원칙: Last-Write-Wins (LWW)

이유:
  - 가족 4인 → 동시 수정 확률 극저
  - CRDT는 이 규모에 과도한 복잡성
  - 만약 충돌 발생 시: 가장 최근 수정 우선, 
    덮어쓴 데이터는 서버 로그에 보관 (30일)

예외:
  - 경비 추가: 충돌 없음 (각자 다른 항목 생성)
  - 경비 삭제: 이미 동기화된 항목만 삭제 가능
```

## PWA 설정

### manifest.json
```json
{
  "name": "스위스·이탈리아 여행",
  "short_name": "여행가이드",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFF9F5",
  "theme_color": "#E8725A",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker 전략 (Workbox)
```javascript
// 앱 셸: Cache-first
registerRoute(
  ({ request }) => request.destination === 'document' ||
                   request.destination === 'script' ||
                   request.destination === 'style',
  new CacheFirst({ cacheName: 'app-shell' })
);

// API 데이터: Network-first (오프라인 시 캐시)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ 
    cacheName: 'api-data',
    networkTimeoutSeconds: 5
  })
);

// 이미지: Cache-first
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ 
    cacheName: 'images',
    expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }
  })
);
```

## UI 오프라인 표시

```
온라인 → 오프라인 전환 시:
  상단에 슬라이드 다운 배너:
  "📡 오프라인 모드 · 일정과 경비는 정상 사용 가능"
  배경: #FFF3E0, 텍스트: #E8A838
  3초 후 축소 (탭하면 다시 펼침)

오프라인 → 온라인 복귀 시:
  "✅ 온라인 복귀 · 데이터 동기화 중..."
  동기화 완료 → "✅ 동기화 완료" (2초 후 사라짐)

오프라인에서 불가 기능 접근 시:
  해당 UI 비활성화 + "온라인 연결 시 사용 가능" 안내
  (실시간 위치 공유, 날씨 새로고침 등)
```

## 엣지 케이스

| 케이스 | 처리 |
|--------|------|
| 장기 오프라인 (24시간+) | 정상 동작, 복귀 시 일괄 동기화 |
| 동기화 중 다시 오프라인 | 미완료 항목은 pending 유지, 재시도 |
| IndexedDB 용량 초과 | 경고 + 오래된 동기화 완료 데이터 정리 |
| Service Worker 업데이트 | 새 버전 감지 → "업데이트 있습니다" 배너 + 새로고침 |
| Safari PWA 제한 | Background Sync 미지원 → 앱 포그라운드 복귀 시 동기화 |

## 테스트 시나리오

```
1. 비행기 모드에서 앱 열기 → 일정 정상 표시
2. 비행기 모드에서 경비 입력 → 저장 성공 (pending)
3. 비행기 모드 해제 → pending 경비 자동 동기화
4. 두 디바이스 동시 오프라인 경비 입력 → 복귀 후 양쪽 모두 반영
5. 캐시 삭제 후 오프라인 접속 → "온라인 연결 필요" 안내
```

## 수용 기준

```
□ 오프라인에서 일정 열람 100% 동작
□ 오프라인에서 경비 입력 → 로컬 저장 성공
□ 온라인 복귀 시 10초 이내 자동 동기화
□ 오프라인 배너 표시 (경고가 아닌 안내 톤)
□ PWA 설치 → 홈 화면 아이콘으로 실행 가능
□ Safari(iOS), Chrome(Android) 양쪽에서 오프라인 동작
```
