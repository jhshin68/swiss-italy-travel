# DD-004: DB를 Oracle Cloud VM에 직접 운영 (SQLite)

## 상태
✅ 확정

## 맥락 (Context)
DB를 어디서 어떤 방식으로 운영할지 결정. 초기엔 PostgreSQL을 검토했으나, 가족 4인 앱 규모와 실제 구현 용이성을 고려해 SQLite로 확정.

## 선택지 (Options)

| 선택지 | 장점 | 단점 |
|--------|------|------|
| A. Supabase | 관리 편함, 무료 티어, 실시간 구독 내장 | 무료 한계(500MB), 외부 의존, Oracle VM과 이중 인프라 |
| B. Oracle VM — PostgreSQL | 기존 인프라 활용, 비용 0, 풀 제어 | 설치·관리 부담, pg_dump 백업 복잡 |
| **C. Oracle VM — SQLite** | **설치 없음, 파일 기반 단순 운영, 백업 간단 (cp 명령어)** | **동시 쓰기 제한 (가족 4인이라 수용)** |
| D. Railway/Render DB | 쉬운 배포 | 유료, 또 다른 외부 의존 |

## 결정 (Decision)
**C안: Oracle Cloud VM에 SQLite(better-sqlite3) 직접 사용**

이유:
1. 이미 n8n이 운영 중인 Oracle VM이 있다 (추가 비용 0)
2. 가족 4인 앱의 데이터량은 극소 (수십 MB 수준)
3. SQLite는 설치 불필요, 파일 하나로 운영 가능
4. 백업이 `cp travel.db backup/` 수준으로 극히 단순
5. better-sqlite3의 동기 API가 Express와 궁합이 좋음

## 운영 구성

```
Oracle Cloud VM (기존)
├── n8n (Docker) ─── 포트 5678
├── Express API ──── 포트 3001 (SQLite 연결: /app/data/travel.db)
└── Caddy (Docker) ─ 포트 443 (HTTPS, Let's Encrypt) ← 리버스 프록시 단독

방화벽:
  - 3001: VM 내부만 허용 (Caddy 경유)
  - 443:  외부 개방 (HTTPS)

도메인:
  - slp-travel.duckdns.org → Express API
  - slpower-n8n.duckdns.org → n8n

Caddyfile:
  slp-travel.duckdns.org {
    reverse_proxy localhost:3001
  }
  slpower-n8n.duckdns.org {
    reverse_proxy localhost:5678
  }
```

## 백업 전략
```
1. 매일 03:00 KST:
   cp /app/data/travel.db /backup/sqlite/daily/travel_$(date +%Y%m%d).db
2. 매주 일요일: Oracle Object Storage로 원격 백업
3. 보관: 로컬 7일, 원격 30일
4. n8n 워크플로로 백업 실패 시 카톡 알림
5. 복구: cp backup/travel_YYYYMMDD.db /app/data/travel.db → Express 재시작 (RTO 10분)
```

## 상용화 시 재검토 사항
- 사용자 증가 시 → PostgreSQL 또는 관리형 DB(Supabase, AWS RDS) 전환
- 동시 접속 증가 시 → Connection Pooling, Read Replica 도입
- 자동 스케일링이 필요해지는 시점에서 전환
