import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack dev 모드에서 webpack 설정 경고 억제
  // (next-pwa는 dev 시 disable되므로 Turbopack과 무관)
  turbopack: {},
};

// @ducanh2912/next-pwa — next-pwa v5의 유지보수 포크, Next 14/15/16 지원.
// 기존 next-pwa@5.6.0이 Next 16과 호환되지 않아 sw.js가 빌드에서 생성되지 않는
// 문제를 해결하기 위해 교체. v10부터 runtimeCaching / skipWaiting 등이
// workboxOptions 하위로 이동한 점에 주의.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  // 프런트엔드 네비게이션 캐싱 — App Router 내부 이동을 빠르게 유지
  cacheOnFrontEndNav: true,
  // 온라인 복귀 시 자동 리로드로 stale 상태 최소화
  reloadOnOnline: true,
  workboxOptions: {
    skipWaiting: true,
    disableDevLogs: true,
    runtimeCaching: [
      // Tier 1: StaleWhileRevalidate (일정 — 오프라인 대응 유지 + 백그라운드 갱신)
      // 기존 CacheFirst는 앱 업데이트 후에도 구버전 데이터가 계속 남아 Day 변경이 반영되지 않았음.
      // StaleWhileRevalidate는 즉시 캐시를 반환(오프라인 OK)하면서 동시에 네트워크로 최신을 받아
      // 다음 요청부터 새 데이터가 노출된다.
      {
        urlPattern: /^https:\/\/slp-travel\.duckdns\.org\/api\/trips\/\d+\/days/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'itinerary-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/slp-travel\.duckdns\.org\/api\/trips\/\d+\/spots/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'spots-cache',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      // Tier 2: StaleWhileRevalidate (지도 타일 — 캐시 우선, 백그라운드 갱신)
      {
        urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\//,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'map-tiles',
          expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      // Tier 3: NetworkFirst (경비 — 온라인 우선, 실패 시 캐시 폴백)
      {
        urlPattern: /^https:\/\/slp-travel\.duckdns\.org\/api\/trips\/\d+\/expenses/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'expenses-cache',
          expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
    ],
  },
});

export default withPWA(nextConfig);
