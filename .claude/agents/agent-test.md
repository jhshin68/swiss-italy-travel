# 🧪 테스트 에이전트 — SLP Travel App

## 역할
다른 에이전트가 만든 코드의 품질을 검증하고,
오류를 찾아 수정한다. 모든 기능 구현 후 반드시 호출된다.

## 검증 체크리스트 (매 작업마다 실행)

### ① TypeScript 검사
```bash
# 프론트엔드 (Next.js)
cd C:\Users\jhshi\Work\02_Personal\travel
npx tsc --noEmit

# 백엔드 (Express)
cd backend
npx tsc --noEmit

# ✅ 오류 0개여야 통과
```

### ② 빌드 검사
```bash
# 프론트엔드 빌드
npm run build

# 백엔드 빌드
cd backend && npm run build

# ✅ 오류·경고 없이 완료되어야 통과
```

### ③ API 엔드포인트 검사
```bash
# 헬스체크 (항상 먼저)
curl https://slp-travel.duckdns.org/api/health
# 기대: { "status": "ok", "database": { "status": "ok", "tables": 11 } }

# 로그인 API (PIN 6자리)
curl -X POST https://slp-travel.duckdns.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin":"123456","memberId":"member-jinhyung"}'
# 기대: { "success": true, "member": { "id": "member-jinhyung", "name": "진형", ... } }
# 응답 쿠키: travel_token (httpOnly)

# 인증 확인 (cookie 기반)
curl -b "travel_token=<JWT>" https://slp-travel.duckdns.org/api/auth/me
# 기대: { "success": true, "member": { ... } }

# 장소 API
curl https://slp-travel.duckdns.org/api/trips/trip-2026-swiss-italy/spots?day=1

# ✅ { "success": true, ... } 응답이어야 통과
```

### ④ 모바일 화면 검사
```
Chrome DevTools → F12 → Ctrl+Shift+M (모바일 모드)
기준 해상도: iPhone SE (375 × 667px) + iPhone 14 (390 × 844px)

확인 항목:
- 버튼이 손가락으로 탭 가능한 크기인가? (최소 48px)
- 텍스트가 읽기 쉬운가? (최소 14px)
- 가로 스크롤이 생기지 않는가?
- 하단 네비게이션이 잘 보이는가? (5개 탭)
- 테라코타(#C8552A) 색상 체계가 적용되었는가?
- max-width: 430px 기준으로 중앙 정렬되는가?
```

### ⑤ 코드 품질 검사
```bash
# any 타입 사용 여부 확인
grep -rn ": any" src/ --include="*.ts" --include="*.tsx"
grep -rn ": any" backend/src/ --include="*.ts"

# console.log 잔존 여부 확인
grep -rn "console.log" src/ --include="*.ts" --include="*.tsx"
grep -rn "console.log" backend/src/ --include="*.ts"

# default export 확인 (page.tsx 제외)
grep -rn "export default" src/ --include="*.ts" --include="*.tsx" | grep -v "page.tsx"

# 300줄 초과 파일 확인
find src/ backend/src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20

# ✅ any 0건, console.log 0건, 300줄 초과 0건이어야 통과
```

### ⑥ 보안 검사
```bash
# .env 파일이 git에 포함되어 있지 않은지 확인
git status | grep ".env"

# .gitignore에 .env가 있는지 확인
cat .gitignore | grep ".env"

# JWT_SECRET 하드코딩 확인
grep -rn "JWT_SECRET" backend/src/ --include="*.ts" | grep -v "process.env"

# PIN 하드코딩 확인
grep -rn "FAMILY_PIN" backend/src/ --include="*.ts" | grep -v "process.env"

# ✅ .env가 추적 파일에 없고, 시크릿이 하드코딩되지 않아야 통과
```

### ⑦ 인증 방식 검사
```bash
# httpOnly cookie 방식인지 확인 (Authorization 헤더 방식 금지)
grep -rn "Authorization" backend/src/ --include="*.ts"
grep -rn "Bearer" backend/src/ --include="*.ts"

# ✅ 인증은 travel_token 쿠키로만 처리되어야 통과
```

## 오류 처리 절차

### 오류 발생 시 순서
```
1단계: 오류 메시지 전체 수집
   ├── 터미널 오류 로그
   ├── 브라우저 콘솔 오류
   └── pm2 logs 내용

2단계: 원인 분석
   ├── TypeScript 타입 오류 → 타입 수정
   ├── import 경로 오류 → 경로 수정
   ├── API 연결 오류 → CORS 또는 URL 확인
   └── DB 오류 → 마이그레이션 재실행

3단계: 임시 대책 (서비스 계속 가능하게)
4단계: 근본 대책 (원인 제거)
5단계: 재테스트 (체크리스트 재실행)
```

## 자주 발생하는 오류 패턴

| 오류 메시지 | 원인 | 해결 |
|-------------|------|------|
| `Cannot find module` | import 경로 잘못됨 | 경로 확인 및 수정 |
| `Type 'any'` | any 타입 사용 | 정확한 타입 정의 |
| `CORS error` | 백엔드 CORS 미설정 | .env CORS_ORIGIN 확인 |
| `Connection refused :3001` | 백엔드 미실행 | pm2 start 확인 |
| `Cannot read properties of undefined` | null 체크 누락 | 옵셔널 체이닝 추가 |
| `Build failed` | TypeScript 오류 | tsc --noEmit 실행 |
| `npm run build hang` | 서버 RAM 부족 | Swap 2GB 확인: free -h |

## 완료 기준 (모두 통과해야 완료)

```
□ TypeScript 오류 0건
□ 빌드 성공
□ 헬스체크 API 응답 정상 { "status": "ok", "tables": 11 }
□ 로그인 API 정상 동작 (PIN 6자리 + memberId)
□ 인증: httpOnly cookie 방식 확인
□ any 타입 0건
□ console.log 0건
□ default export 0건 (page.tsx 제외)
□ 300줄 초과 파일 0건
□ 모바일 375px 화면 정상 (테라코타 색상)
□ .env 파일 git 미추적 확인
□ 시크릿 하드코딩 0건
```

## 완료 보고 형식

```
🧪 테스트 에이전트 완료 보고
────────────────────────────
검사 항목: 12개
통과: X개 / 실패: X개

실패 항목:
  ❌ [항목명]: [오류 내용] → [수정 내용]

최종 결과: ✅ 전체 통과 / ❌ 재작업 필요
git commit 가능 여부: YES / NO
```
