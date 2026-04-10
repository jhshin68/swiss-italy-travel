import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 백엔드 빌드 산출물 — TypeScript 컴파일 결과물이라 lint 불필요
    "backend/dist/**",
    // next-pwa가 빌드 시 생성하는 Service Worker / Workbox 번들 — minified 산출물
    "public/sw.js",
    "public/sw.js.map",
    "public/workbox-*.js",
    "public/workbox-*.js.map",
    "public/swe-worker-*.js",
  ]),
  // 언더스코어 접두사 파라미터/변수는 미사용 경고에서 제외 — Express 미들웨어 관례
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
