# SECURITY.md — 보안 정책

> 가족 전용 앱이지만, 기본 보안은 갖춘다. 상용화 대비 레이어 분리.

## 1. 위협 모델

```
공격 표면: 인터넷에 공개된 PWA + API
공격자 수준: 무작위 스캔 봇 ~ 일반 해커 (표적 공격 가능성 극저)
보호 대상: 가족 위치 데이터, 경비 내역, 숙소·예약 정보
```

## 2. 인증·인가

| 항목 | 구현 |
|------|------|
| 인증 방식 | 6자리 PIN → JWT (httpOnly, Secure, SameSite=Strict) |
| 토큰 만료 | 30일 (access), refresh 없음 (단순화) |
| Rate limit | PIN 5회 실패 → 5분 잠금 (IP 기반) |
| 권한 | admin(진형): 일정 수정/삭제, member: 열람 + 경비 입력 |

## 3. 데이터 보안

| 영역 | 대책 |
|------|------|
| 전송 | HTTPS 전 구간 (Vercel TLS + Oracle VM Let's Encrypt) |
| 저장 | PIN: bcrypt 해시, 나머지: 평문 (가족 데이터, 암호화 불필요) |
| DB 접근 | SQLite 파일 (/app/data/travel.db) — VM 내부 파일 시스템, 외부 노출 없음 |
| 위치 데이터 | 1시간 후 자동 삭제 (cron job) |
| 백업 | 암호화 없음 (Oracle Object Storage 접근 제어로 대체) |

## 4. API 보안

```
입력 검증: zod 스키마로 모든 입력 검증
CORS: swiss-italy-travel.vercel.app만 허용
Helmet: HTTP 보안 헤더 자동 설정
Rate limiting: 전체 API 100req/min/IP
SQL Injection: better-sqlite3 파라미터 바인딩 (Prepared Statements)
XSS: React 기본 이스케이프 + CSP 헤더
```

## 5. 인프라 보안

```
Oracle VM:
  - SSH 키 인증만 (비밀번호 로그인 비활성)
  - UFW 방화벽: 22(SSH), 443(HTTPS)만 개방
  - fail2ban: SSH brute-force 차단
  - 자동 보안 업데이트 (unattended-upgrades)

Vercel:
  - 환경변수로 시크릿 관리
  - 프리뷰 배포에 인증 보호 (선택)
```

## 6. 상용화 시 추가 필요

```
□ OAuth 2.0 (구글/카카오)
□ 데이터 암호화 at rest (AES-256)
□ WAF (Web Application Firewall)
□ 침입 탐지 시스템
□ GDPR/개인정보보호법 준수 검토
□ 보안 감사 로그
□ 의존성 보안 스캔 (npm audit, Snyk)
```

---

> **버전:** v0.1
> **최종 수정:** 2026-03-29
