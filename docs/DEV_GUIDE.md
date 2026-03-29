# 여행 앱 개발 완전 가이드 v8
> Claude Code + Repository & Application Level Harness Engineering
> SELA (SL Power Executive Level Assistant) | 2026.03

---

## 프로젝트 기본 정보

| 항목 | 내용 |
|------|------|
| 기술 스택 | Next.js 16.2.1 · TypeScript · Tailwind CSS · Express · SQLite · PWA |
| 여행 일정 | 2026년 10월 8일(목) ~ 10월 19일(월) · 11박 12일 |
| 여행 인원 | 신진형(진형) · 임지현(지현) · 신동우(동우) · 신유진(유진, 12세) |
| 항공편 | KE917 인천→취리히 / KE932 로마→인천 · 예약번호: FLTZFS |
| 프론트엔드 | https://swiss-italy-travel.vercel.app |
| 백엔드 API | https://slp-travel.duckdns.org |
| GitHub | https://github.com/jhshin68/swiss-italy-travel |
| Oracle VM | 140.245.76.255 (기존 n8n 운영 중) |
| 장소 데이터 | itinerary.ts — 108개 장소 완성본 |
| 구글 내 지도 | mid: 1wDSiv4V92oqttHnxOT25WmZxmq9usPg |

- ✅ 이 가이드는 26개 설계 문서(Repository-Level Harness)를 기준으로 작성되었습니다.
- ✅ 개발 초보자도 Claude Code 프롬프트를 그대로 복사·붙여넣기하면 완성됩니다.
- ✅ itinerary.ts 파일은 /src/data/ 폴더에 이미 존재합니다 — 별도 복사 불필요.
- ✅ 백엔드 서버(Express + SQLite)가 포함되어 가족 4인이 경비를 실시간 공유합니다.

---

## PART 0 — 이 가이드를 읽기 전에

### v6 vs v7/v8 가이드 차이

| 항목 | v6 (이전) | v7/v8 (현재) |
|------|-----------|--------------|
| 아키텍처 | 프론트엔드만 (Next.js) | 풀스택 (Next.js + Express + SQLite) |
| 데이터 저장 | localStorage (각자 폰에만) | 서버 DB (4인 공유·동기화) |
| 인증 | 없음 | 4자리 PIN + 멤버 선택 (JWT) |
| 경비 공유 | ❌ 내 폰에만 저장 | ✅ 가족 전원 실시간 공유 |
| 일정 수정 | ❌ 수정자 폰에만 반영 | ✅ 서버 저장 → 전원 반영 |
| 개발 복잡도 | 낮음 (4~5시간) | 중간 (주간 단위 단계별 진행) |
| 설계 문서 | 없음 | 26개 문서 기반 (완성됨) |

### Repository-Level Harness란?

Claude Code가 매번 처음부터 맥락을 파악하지 않도록, 프로젝트의 "규칙·구조·목표"를 파일로 미리 준비해두는 것.
이미 완성된 26개 설계 문서가 바로 Repository-Level Harness.

| 구성 요소 | 역할 |
|-----------|------|
| CLAUDE.md | Claude Code가 매 대화마다 자동으로 읽는 프로젝트 핵심 요약 |
| AGENTS.md | AI 에이전트 행동 규칙 (코드 원칙·커밋 컨벤션·금지 사항) |
| docs/ARCHITECTURE.md | 시스템 전체 구조도 (프론트·백엔드·DB·인프라) |
| docs/product-specs/ | 기능별 상세 스펙 (인증·일정·경비·지도·비상정보) |
| docs/design-docs/ | 핵심 설계 결정 기록 (ADR: 왜 이 기술을 선택했나) |
| docs/DESIGN.md | UI/UX 디자인 가이드 (색상·폰트·컴포넌트 패턴) |
| .github/workflows/ci.yml | CI/CD 파이프라인 (자동 테스트·배포) |

### Application-Level Harness란?

실제 기능을 구현할 때, Claude Code에게 올바른 결과물을 얻기 위해 사용하는 "정밀한 프롬프트 세트".
이 가이드의 각 STEP에 담긴 📋 프롬프트가 바로 Application-Level Harness.

**핵심 원칙:**
1. Claude Code를 열기 전에 항상 CLAUDE.md를 최신 상태로 유지하세요.
2. 각 STEP의 📋 프롬프트를 그대로 복사·붙여넣기 하세요 — 임의 수정 금지.
3. 각 STEP 완료 후 `npm run dev`로 브라우저에서 반드시 확인하세요.
4. 문제 발생 시: 오류 메시지 복사 → Claude Code에 "이 오류를 수정해줘" 입력.
5. 매 STEP 완료 후 git commit을 하면 실수해도 되돌릴 수 있습니다.

---

## PART 1 — 전체 개발 로드맵

| 단계 | 내용 | 목표 시점 |
|------|------|-----------|
| Phase 1 (STEP 1~4) | Repository Harness 구축 | 4월 1주 |
| Phase 2 (STEP 5~7) | 백엔드 서버 확인 + DB 마이그레이션 | 4월 1주 |
| Phase 3 (STEP 8~9) | 인증 기능 (PIN 로그인 + 멤버 선택) | 4월 2주 |
| Phase 4 (STEP 10~11) | 데이터 시딩 (108개 장소·예약·체크리스트) | 4월 3주 |
| Phase 5 (STEP 12~15) | 핵심 기능 (일정·경비·지도·비상정보) | 5~6월 |
| Phase 6 (STEP 16~17) | 오프라인 PWA + 동기화 | 7~8월 |
| Phase 7 (STEP 18~19) | 배포 (Vercel + Oracle VM CI/CD) | 8월 |
| Phase 8 (STEP 20) | 가족 베타 테스트 + 최종 점검 | 9월 |

> ⚠ 개발은 반드시 순서대로 진행하세요.
> ⚠ Phase 2 (백엔드) 없이는 Phase 3 (인증)을 시작할 수 없습니다.

---

## STEP 0 — 시작 전 환경 사전 점검

| # | 점검 항목 | 확인 방법 | ❌일 때 해결 |
|---|-----------|-----------|-------------|
| 1 | Windows PC에서 작업 중인가? | 시작 메뉴 확인 | Mac이면 경로 변경 필요 |
| 2 | 프로젝트 폴더가 존재하는가? `C:\Users\jhshi\Work\swiss-italy-travel` | 탐색기에서 확인 | mkdir 으로 생성 |
| 3 | GitHub 로그인 상태인가? (계정: jhshin68) | github.com 접속 | 로그인 후 진행 |
| 4 | Oracle VM SSH 접속 가능한가? (140.245.76.255) | `ssh ubuntu@140.245.76.255` | SSH 키 경로 확인 |
| 5 | Node.js v20 이상 설치되어 있는가? | cmd: `node -v` | nodejs.org LTS 설치 |
| 6 | Oracle VM 포트 3001 방화벽 개방되어 있는가? | `sudo iptables -L \| grep 3001` | iptables + Oracle Cloud Security List에서 개방 |

> ⚠ Oracle VM(140.245.76.255)은 n8n(포트 5678)을 운영 중. 백엔드 API는 포트 3001 사용 — 충돌 없음.
> Oracle Cloud 콘솔: Networking → Virtual Cloud Networks → Security List → Ingress Rules → Add (TCP 3001)

---

## PHASE 1 — Repository Harness 구축

### STEP 1 — Node.js + Git + Claude Code 설치 확인 ⏱ 15분

```bash
node -v          # v20.x.x 이상이어야 함
git -v           # git version 2.x.x
npm install -g @anthropic-ai/claude-code   # Claude Code 설치
cd C:\Users\jhshi\Work\swiss-italy-travel
claude           # > 프롬프트가 나오면 준비 완료
```

### STEP 2 — CLAUDE.md 작성 ✅ 완료

### STEP 3 — 설계 문서 26개 업로드 ✅ 완료

### STEP 4 — 환경변수(.env) 설정 ⏱ 10분

```bash
cd C:\Users\jhshi\Work\swiss-italy-travel\backend
copy .env.example .env
```

`backend/.env` 실제 값 입력:

```env
PORT=3001
NODE_ENV=production
DB_PATH=/app/data/travel.db

# JWT 시크릿 — 32자 이상 랜덤 문자열
JWT_SECRET=여기에_랜덤_문자열_입력_32자이상

# 가족 공통 PIN (4자리 숫자)
FAMILY_PIN=1234

# CORS 허용
CORS_ORIGIN=https://swiss-italy-travel.vercel.app

LOG_FORMAT=combined
```

> ⚠ .env 파일은 절대 GitHub에 올리면 안 됩니다 (.gitignore에 포함됨)

---

## PHASE 2 — 백엔드 서버 구동 확인

### STEP 5 — Oracle VM SSH 접속 + 초기 설정 ⏱ 20분

```bash
ssh ubuntu@140.245.76.255

# VM 안에서 실행
mkdir -p /app
cd /app
git clone https://github.com/jhshin68/swiss-italy-travel.git
cd /app/swiss-italy-travel/backend
npm ci
cp .env.example .env
nano .env          # 실제 값 입력 후 Ctrl+X → Y → Enter
mkdir -p /app/data
```

### STEP 6 — DB 마이그레이션 + 서버 시작 ⏱ 15분

```bash
# Oracle VM 안에서
cd /app/swiss-italy-travel/backend
npm run migrate

npm run build

npm install -g pm2
pm2 start dist/index.js --name swiss-italy-api
pm2 save
pm2 startup        # 출력된 명령어를 복사해서 실행
pm2 status
```

### STEP 7 — 헬스체크 확인 ⏱ 5분

```bash
curl https://slp-travel.duckdns.org/api/health
# {"status":"ok","database":{"status":"ok","tables":12}} 이면 완료
```

---

## PHASE 3 — 인증 기능 구현

### STEP 8 — 백엔드 인증 API 구현 ⏱ 30분

📋 **Claude Code 프롬프트:**
```
docs/product-specs/auth.md 와 docs/design-docs/adr-auth-pin.md 를 읽고,
백엔드 인증 API를 구현해줘.

[구현할 파일]
- backend/src/routes/auth.ts
- backend/src/middleware/authenticate.ts

[POST /api/auth/login 동작]
1. body에서 pin(4자리 숫자), memberId(string) 수신
2. FAMILY_PIN과 bcrypt.compare로 PIN 검증
3. members 테이블에서 해당 memberId 조회
4. JWT 발급 (payload: { memberId, memberName, role }, 만료: 30일)
5. JWT를 httpOnly cookie "travel_token"에 저장
6. 응답: { success: true, member: { id, name, emoji, role } }

[GET /api/auth/me 동작]
- travel_token 쿠키 검증 → 현재 멤버 정보 반환

[POST /api/auth/logout 동작]
- travel_token 쿠키 삭제

[보안]
- Rate limiting: 5회 연속 실패 시 5분 잠금
- zod로 입력값 검증 필수

구현 완료 후 backend/src/routes/index.ts에 /auth 라우터 마운트해줘.
```

### STEP 9 — 프론트엔드 로그인 화면 + 멤버 선택 화면 ⏱ 30분

📋 **Claude Code 프롬프트:**
```
docs/product-specs/auth.md 의 화면 구성을 참고해서
프론트엔드 인증 화면을 구현해줘.

[구현할 파일]
- src/app/(auth)/login/page.tsx
- src/app/(auth)/select-member/page.tsx
- src/stores/authStore.ts (Zustand)
- src/hooks/useAuth.ts

[PIN 입력 화면]
- 4자리 숫자 키패드 (0~9 + 백스페이스)
- 입력 중: ● 으로 마스킹
- 4자리 입력 즉시 POST /api/auth/login 호출
- 실패 시: "PIN이 올바르지 않습니다" 빨간 메시지
- 5회 실패 시: "5분 후 다시 시도하세요" + 타이머

[멤버 선택 화면 (PIN 통과 후)]
- "누구세요? 😊" 타이틀
- 2×2 그리드: 진형(👨), 지현(👩), 동우(👦), 유진(👧)
- 카드 탭 → POST /api/auth/login (memberId 포함) → JWT 발급
- 로그인 성공 → 대시보드(/)로 이동

[디자인]
- docs/DESIGN.md 의 색상 시스템 적용 (테라코타 Primary)
- 모바일 퍼스트 (max-width: 430px)

Zustand authStore에 member 정보 저장,
useAuth 훅으로 로그인 상태 확인 및 미로그인 시 /login 리다이렉트 구현.
```

---

## PHASE 4 — 초기 데이터 입력 (시딩)

### STEP 10 — 여행·멤버 초기 데이터 시딩 ⏱ 20분

📋 **Claude Code 프롬프트:**
```
backend/scripts/seed.ts 를 생성해줘.
이 스크립트는 1회 실행으로 DB에 초기 데이터를 입력한다.

[입력 데이터 1 — trips 테이블]
name: "2026 스위스·이탈리아 가족여행"
startDate: "2026-10-08", endDate: "2026-10-19"
currencies: CHF,EUR,KRW

[입력 데이터 2 — members 테이블 (4인)]
{ name:"진형", emoji:"👨", color:"#E53E3E", role:"admin" }
{ name:"지현", emoji:"👩", color:"#DD6B20", role:"member" }
{ name:"동우", emoji:"👦", color:"#38A169", role:"member" }
{ name:"유진", emoji:"👧", color:"#3182CE", role:"member" }

[입력 데이터 3 — trip_auth 테이블]
FAMILY_PIN을 bcrypt.hash(pin, 10) 으로 해시해서 저장

[입력 데이터 4 — day_plans 테이블 (12일)]
Day1: 2026-10-08 취리히 (스위스)
Day2: 2026-10-09 베른→그린델발트 (스위스)
Day3: 2026-10-10 그린델발트 (스위스)
Day4: 2026-10-11 그린델발트 (스위스)
Day5: 2026-10-12 체르마트 (스위스)
Day6: 2026-10-13 체르마트 (스위스)
Day7: 2026-10-14 대이동 (스위스→이탈리아)
Day8: 2026-10-15 피렌체 (이탈리아)
Day9: 2026-10-16 피렌체 근교 (이탈리아)
Day10: 2026-10-17 로마 (이탈리아)
Day11: 2026-10-18 로마 (이탈리아)
Day12: 2026-10-19 로마→귀국 (이탈리아)

package.json scripts에 "seed": "tsx scripts/seed.ts" 추가해줘.
```

### STEP 11 — 108개 장소 데이터 시딩 ⏱ 20분

📋 **Claude Code 프롬프트:**
```
src/data/itinerary.ts 의 ITINERARY 배열 데이터를
백엔드 DB의 spots 테이블로 변환·입력하는 스크립트를 만들어줘.

[파일] backend/scripts/seed-spots.ts

[변환 규칙]
- DaySchedule.items → spots 테이블 레코드
- type 필드 → category 필드 (sightseeing/meal/hotel/transport/activity)
- mapUrl, navUrl 각각 map_url, nav_url 필드로 저장
- important:true → is_important = 1

package.json에 "seed:spots": "tsx scripts/seed-spots.ts" 추가
```

---

## PHASE 5 — 핵심 기능 구현

### STEP 12 — 대시보드 (홈 화면) ⏱ 30분

📋 **Claude Code 프롬프트:**
```
docs/product-specs/dashboard.md 를 읽고 홈 대시보드를 구현해줘.

[파일] src/app/(app)/page.tsx

[구성 요소]
① D-Day 카운터
   - 여행 전: "D-n 출발까지 n일" (골드색, 크게)
   - 여행 중: "Day n / 12 {현재 도시}" + 진행률 바
   - 여행 후: "🎉 여행 완료! 소중한 추억 간직하세요"
② 항공편 카드
   - 출발: KE917 / 2026.10.08 / 인천(ICN)→취리히(ZRH) / 12:25
   - 귀국: KE932 / 2026.10.19 / 로마(FCO)→인천(ICN) / 21:25
   - 예약번호 FLTZFS: 탭하면 클립보드 복사 + "복사됨!" 토스트
③ 오늘 일정 요약 카드 (GET /api/trips/:id/days/:date)
④ 오늘 지출 요약 (GET /api/trips/:id/expenses?date=today)
⑤ 비상정보 요약 (현재 도시 기준 긴급번호 112)
⑥ Day7 특별 배너 (10/14에만): "⚠ 오늘은 6시간 대이동일!" 빨간 배너

[디자인] docs/DESIGN.md 테라코타 Primary 색상 + 모바일 퍼스트
```

### STEP 13 — 일정 탭 (108개 장소) ⏱ 40분

📋 **Claude Code 프롬프트:**
```
docs/product-specs/itinerary.md 를 읽고 일정 탭을 구현해줘.

[파일]
- src/app/(app)/itinerary/page.tsx
- src/components/features/itinerary/DayCard.tsx
- src/components/features/itinerary/SpotCard.tsx

[날짜 네비게이션]
- Day 1~12 버튼 가로 스크롤
- 스위스(Day1~6): 테라코타 / 이탈리아(Day8~12): 올리브 / 대이동(Day7): 골드 + ⚠

[Spot 카드]
- 장소명 / 카테고리 아이콘 / 비용(CHF or EUR)
- "📍 지도" 버튼 → mapUrl (구글맵, 새 탭)
- "🗺 길 안내" 버튼 → navUrl (구글맵 내비)
- is_important=1 → 골드 테두리 + "예약 필수" 배지
- weatherAlternative 있으면 ⚠️ 날씨 대안 표시

[카테고리 아이콘]
sightseeing=🏛 / meal=🍽 / hotel=🏨 / transport=🚂 / activity=🎿
```

### STEP 14 — 경비 탭 ⏱ 40분

📋 **Claude Code 프롬프트:**
```
docs/product-specs/expenses.md 를 읽고 경비 탭을 구현해줘.

[파일]
- src/app/(app)/expenses/page.tsx
- src/components/features/expenses/ExpenseForm.tsx
- src/components/features/expenses/SettlementCard.tsx

[3개 서브탭] 오늘 / 전체 / 정산

[지출 추가 모달]
- 금액 입력 + 통화 선택 (CHF/EUR/KRW)
- KRW 환산 표시 (GET /api/exchange-rates)
- 카테고리: 교통🚂/숙박🏨/식비🍽/관광🏛/쇼핑🛍/기타📦
- 결제자: 진형/지현/동우/유진

[정산] docs/design-docs/adr-expense-settlement.md 알고리즘 적용
[오프라인] 경비 입력 → IndexedDB 임시 저장 → 온라인 복귀 시 POST
```

### STEP 15 — 비상정보 탭 ⏱ 20분

📋 **Claude Code 프롬프트:**
```
docs/product-specs/emergency-info.md 를 읽고 비상정보 탭을 구현해줘.

[파일] src/app/(app)/info/page.tsx

[구성]
① 긴급전화 (스위스🇨🇭 / 이탈리아🇮🇹 / 공통✈ 탭)
   스위스: 경찰117/구급144/소방118/통합112
   이탈리아: 경찰113/구급118/소방115/통합112
   공통: 영사콜센터 +82-2-3210-0404 / 대한항공 +82-2-2656-2001
         한국대사관 베른 +41-31-356-2444 / 로마 +39-06-802461
   → 모든 번호: tel: 링크 (탭하면 즉시 전화)
② SOS 버튼 (상단 고정, 빨간 배경) → 112 즉시 전화
③ 숙박 정보 카드 (현재 날짜 기준 자동 표시)
[오프라인] 전체 오프라인 필수 (캐시 Tier 1)
```

---

## PHASE 6 — PWA 설정 + 오프라인 동작

### STEP 16 — PWA 설정 + 오프라인 캐싱 ⏱ 30분

📋 **Claude Code 프롬프트:**
```
docs/design-docs/adr-offline-strategy.md 를 읽고 PWA를 설정해줘.

1. next-pwa 패키지 설정 (next.config.ts)
2. public/manifest.json:
   name:"2026 스위스·이탈리아 가족여행" / short_name:"가족여행"
   theme_color:"#C8552A" / display:"standalone"
3. 오프라인 캐싱 전략:
   Tier 1: Cache-First (일정/비상정보/체크리스트)
   Tier 2: Stale-While-Revalidate (지도 타일/날씨)
4. IndexedDB 설정 (src/lib/offlineStore.ts)
   오프라인 경비 입력 → 온라인 복귀 시 동기화
5. OfflineBanner 컴포넌트: "오프라인 상태입니다. 일정·비상정보는 정상 이용 가능"
```

### STEP 17 — 오프라인 동기화 + 위치 공유 ⏱ 30분

📋 **Claude Code 프롬프트:**
```
docs/product-specs/offline-sync.md 를 읽고 동기화 로직을 구현해줘.

[오프라인→온라인 동기화]
- useNetworkStatus 훅: navigator.onLine + online/offline 이벤트
- 온라인 복귀 시 IndexedDB의 pending 경비를 서버에 일괄 POST
- 충돌 전략: LWW (Last-Write-Wins)

[실시간 위치 공유 (HTTP 폴링)]
- src/hooks/useLocationShare.ts
- 10초마다 POST /api/trips/{id}/locations 위치 전송
- GET /api/trips/{id}/locations 로 가족 위치 조회
- Leaflet 지도에 멤버 위치 마커 표시 (이름+이모지)
- 배터리 절약: 백그라운드 시 폴링 일시 중단
```

---

## PHASE 7 — 배포 설정

### STEP 18 — GitHub Secrets 등록 + CI/CD 활성화 ⏱ 20분

GitHub 레포 → Settings → Secrets and variables → Actions에서 등록:

| 시크릿명 | 획득 방법 |
|---------|-----------|
| VERCEL_TOKEN | vercel.com → 프로필 → Settings → Tokens → Create |
| VERCEL_ORG_ID | `vercel link` 실행 후 .vercel/project.json → orgId |
| VERCEL_PROJECT_ID | 동상 → projectId |
| ORACLE_VM_HOST | 140.245.76.255 |
| ORACLE_VM_USER | ubuntu |
| ORACLE_VM_SSH_KEY | ~/.ssh/id_rsa 파일 전체 내용 |

### STEP 19 — 최종 배포 확인 ⏱ 10분

```
https://swiss-italy-travel.vercel.app        → 로그인 화면 표시되면 OK
https://slp-travel.duckdns.org/api/health    → {"status":"ok"} 이면 OK
https://github.com/jhshin68/swiss-italy-travel/actions → ✅ 초록 체크이면 OK
```

---

## PHASE 8 — 가족 베타 테스트 (9월)

| 테스트 항목 | 확인 방법 |
|------------|-----------|
| PWA 설치 (iOS/Android) | 각자 폰에서 홈 화면에 추가 |
| PIN 로그인 4인 전원 | 각자 폰에서 PIN 입력 → 본인 선택 → 대시보드 진입 |
| 경비 공유 확인 | 진형이 입력 → 지현 폰에서 실시간 반영 여부 |
| 오프라인 동작 | 비행기 모드 → 일정·비상정보 정상 열람 |
| 일정 Day1~12 전체 | 각 일자 탭해서 108개 장소 표시 확인 |
| 지도 버튼 동작 | 📍 지도 / 🗺 길 안내 버튼 → 구글맵 열기 |
| 긴급전화 버튼 | 112 버튼 탭 → 전화 앱 열기 확인 |
| 위치 공유 | 진형·지현 위치가 서로의 지도에 표시되는지 |

---

## PART 6 — Claude Code 프롬프트 템플릿

### 템플릿 A — 기능 추가

```
추가할 기능: [기능명]
관련 설계 문서: docs/product-specs/[파일명].md 를 먼저 읽어줘.
요구사항:
  - [요구사항 1]
  - [요구사항 2]
제약:
  - TypeScript strict 모드 유지
  - Express + SQLite 아키텍처 유지
  - 모바일 퍼스트 (430px)
  - API 응답은 ApiResponse<T> 타입 사용
먼저 구현 계획을 설명하고, 승인 후 구현해줘.
```

### 템플릿 B — 버그 수정

```
버그 위치: [탭명 또는 파일명]
증상: [무슨 일이 발생하는지]
재현 방법:
  1. [단계1]
  2. [단계2]
콘솔/네트워크 오류: [F12 개발자도구에서 복사한 오류 메시지]
원인을 먼저 분석하고, 수정 방법을 설명한 뒤 안전하게 수정해줘.
```

### 템플릿 C — 일정 데이터 수정

```
src/data/itinerary.ts 의 데이터를 수정해줘.
수정 대상: Day [번호] — [장소명]
변경 전: [현재 내용]
변경 후: [새로운 내용]
이유: [왜 바꾸는지]
1. TypeScript 타입 오류 없이 수정
2. 백엔드 DB 업데이트 SQL도 함께 제공해줘.
3. 변경 후 npm run build 로 에러 없는지 확인해줘.
```

### 템플릿 D — 진행 상황 점검

```
현재 구현된 기능과 미완성 기능을 점검해줘.
확인 항목:
1. src/app/ 폴더 구조 → 구현된 페이지 목록
2. backend/src/routes/ → 구현된 API 엔드포인트 목록
3. PLANS.md 의 마일스톤 대비 현재 진행률
4. 다음에 구현해야 할 기능 우선순위 3가지 추천
한국어로 요약해줘.
```

---

## PART 7 — 자주 묻는 질문 (FAQ)

| 질문 | 답변 |
|------|------|
| 경비를 입력하면 가족 폰에도 바로 보이나요? | ✅ 서버 DB에 저장되므로 10초 폴링 후 가족 폰에 반영 |
| 일정 수정하면 가족에게도 반영되나요? | ✅ itinerary.ts 수정 → git push → 자동 배포 → 최신판 확인 |
| 해외에서 오프라인으로 동작하나요? | ✅ STEP 16 PWA 설정 후 첫 접속 시 캐싱 → 이후 오프라인 동작 |
| Oracle VM 서버가 다운되면? | 오프라인 캐시로 일정·비상정보 열람 가능. 경비는 IndexedDB 임시 저장 |
| 비용이 발생하나요? | Vercel 무료 티어 + Oracle VM 기존 인프라 → 추가 비용 0원 |
| 유진(12세)도 혼자 쓸 수 있나요? | 멤버 선택 화면에서 👧 유진 카드 탭하면 완료. PIN은 진형님이 알려주면 됨 |
| 오류가 발생하면? | 오류 메시지 복사 → Claude Code에 "이 오류를 수정해줘" 입력 |
| Day7(10/14) 대이동이 왜 특별한가요? | 체르마트→피렌체 6시간 이상. 전날(10/13) COOP에서 간식 키트 준비 권장 |

---

## PART 8 — 개발 진행 TRACKER

> Claude Code에게 "TRACKER 현재 상태에 맞게 갱신해줘"라고 하면 자동 업데이트됩니다.

| Phase | STEP | 내용 | 상태 | 완료일 | 메모 |
|-------|------|------|------|--------|------|
| STEP 0 | - | 환경 6가지 사전 점검 | ✅ 완료 | 2026-03-29 | |
| Phase 1 | STEP 1 | Node.js + Git + Claude Code 설치 확인 | ✅ 완료 | 2026-03-29 | |
| Phase 1 | STEP 2 | CLAUDE.md 작성 | ✅ 완료 | 2026-03-29 | |
| Phase 1 | STEP 3 | 설계 문서 26개 업로드 | ✅ 완료 | 2026-03-29 | git 커밋됨 |
| Phase 1 | STEP 4 | 환경변수(.env) 설정 | ⏳ 진행중 | | 로컬 .env 생성됨, Oracle VM 설정 필요 |
| Phase 2 | STEP 5~7 | 백엔드 서버 확인 + DB 마이그레이션 | ☐ 미시작 | | |
| Phase 3 | STEP 8~9 | 인증 기능 (PIN 로그인 + 멤버 선택) | ☐ 미시작 | | |
| Phase 4~5 | STEP 10~15 | 데이터 시딩 + 핵심 기능 5종 | ☐ 미시작 | | |
| Phase 6~7 | STEP 16~19 | PWA + 배포 (Vercel + Oracle VM) | ☐ 미시작 | | |
| Phase 8 | STEP 20 | 가족 베타 테스트 + 최종 점검 (9월) | ☐ 미시작 | | |

**상태 범례:** ☐ 미시작 | ⏳ 진행중 | ✅ 완료 | ⚠ 이슈

---

> **버전:** v8
> **원본:** 여행앱_개발_가이드_v8_Claude_Harness.docx
> **변환:** Claude Code (2026-03-29)
> **정본:** 내폴더/여행앱_개발_가이드_v8_Claude_Harness.docx
