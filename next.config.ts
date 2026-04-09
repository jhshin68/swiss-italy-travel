import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next-pwa가 자동으로 Service Worker를 생성
};

// next-pwa는 CJS 모듈이므로 require 사용
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 개발 시 비활성화
  runtimeCaching: [
    // Tier 1: Cache-First (일정 — 변경 빈도 낮은 데이터)
    {
      urlPattern: /^https:\/\/slp-travel\.duckdns\.org\/api\/trips\/\d+\/days/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'itinerary-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/slp-travel\.duckdns\.org\/api\/trips\/\d+\/spots/,
      handler: 'CacheFirst',
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
});

export default withPWA(nextConfig);
