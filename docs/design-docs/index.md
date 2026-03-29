# Design Docs — 설계 결정 인덱스

> 이 디렉토리는 프로젝트의 핵심 기술·설계 결정을 기록한다.
> 모든 결정은 "왜(Why)" 중심으로 작성하며, 번복 시 원래 결정과 변경 사유를 함께 기록한다.

---

## 📌 처음 오신 분 — 문서 읽기 순서 (권장)

개발을 시작하기 전, 아래 순서로 읽으면 전체 그림을 가장 빠르게 파악할 수 있습니다.

### ① 지금 바로 읽어야 할 문서 (30분, 개발 시작 전 필수)

| 순서 | 문서 | 이유 |
|------|------|------|
| 1 | [ARCHITECTURE.md](../../ARCHITECTURE.md) | 시스템 전체 구조 파악 — 프론트/백엔드/DB가 어떻게 연결되는지 |
| 2 | [docs/PRODUCT_SENSE.md](../PRODUCT_SENSE.md) | 무엇을 만드는지, 누구를 위한 앱인지 |
| 3 | [AGENTS.md](../../AGENTS.md) | Claude Code에게 내릴 지시의 규칙 — 반드시 읽을 것 |
| 4 | [CLAUDE.md](../../CLAUDE.md) | 이 프로젝트의 코딩 컨벤션 요약 |

### ② 기능 개발 시작 전에 읽을 문서 (기능별, 필요할 때)

| 기능 | 읽을 문서 |
|------|-----------|
| 인증 (로그인) | [adr-auth-pin.md](./adr-auth-pin.md) + [product-specs/auth.md](../product-specs/auth.md) |
| 일정 탭 | [product-specs/itinerary.md](../product-specs/itinerary.md) |
| 경비 탭 | [product-specs/expenses.md](../product-specs/expenses.md) + [adr-expense-settlement.md](./adr-expense-settlement.md) |
| 지도 탭 | [adr-map-leaflet.md](./adr-map-leaflet.md) |
| 오프라인 기능 | [adr-offline-strategy.md](./adr-offline-strategy.md) + [product-specs/offline-sync.md](../product-specs/offline-sync.md) |
| DB 스키마 | [generated/db-schema.md](../generated/db-schema.md) + `backend/src/db/schema.sql` |

### ③ 나중에 참고할 문서 (개발 중·후반)

| 문서 | 읽는 시점 |
|------|-----------|
| [docs/SECURITY.md](../SECURITY.md) | 보안 관련 코드 작성 시 |
| [docs/RELIABILITY.md](../RELIABILITY.md) | 배포·모니터링 설정 시 |
| [docs/QUALITY_SCORE.md](../QUALITY_SCORE.md) | PR 머지 전 체크리스트 |
| [docs/FRONTEND.md](../FRONTEND.md) | 컴포넌트 작성 규칙 확인 시 |
| [exec-plans/tech-debt-tracker.md](../exec-plans/tech-debt-tracker.md) | 기술 부채 기록 시 |

---

## 문서 목록

| 번호 | 문서 | 결정 사항 | 상태 |
|------|------|-----------|------|
| DD-001 | [core-beliefs.md](./core-beliefs.md) | 프로젝트 핵심 신념·불변 원칙 | ✅ 확정 |
| DD-002 | [adr-auth-pin.md](./adr-auth-pin.md) | 인증 방식: 4자리 PIN | ✅ 확정 |
| DD-003 | [adr-offline-strategy.md](./adr-offline-strategy.md) | 오프라인 퍼스트 전략 | ✅ 확정 |
| DD-004 | [adr-db-oracle-vm.md](./adr-db-oracle-vm.md) | DB를 Oracle VM에 직접 운영 | ✅ 확정 |
| DD-005 | [adr-map-leaflet.md](./adr-map-leaflet.md) | 지도: Leaflet + OpenStreetMap | ✅ 확정 |
| DD-006 | [adr-expense-settlement.md](./adr-expense-settlement.md) | 경비 정산 알고리즘 | ✅ 확정 |

## ADR 작성 템플릿

```markdown
# DD-XXX: [결정 제목]

## 상태
✅ 확정 / 🔄 검토 중 / ❌ 폐기

## 맥락 (Context)
이 결정이 필요한 배경. 어떤 문제를 해결하려는가?

## 선택지 (Options)
| 선택지 | 장점 | 단점 |
|--------|------|------|
| A | ... | ... |
| B | ... | ... |

## 결정 (Decision)
선택한 방안과 그 이유.

## 결과 (Consequences)
이 결정으로 인해 발생하는 트레이드오프.

## 상용화 시 재검토 사항
상용화 전환 시 이 결정을 다시 검토해야 하는 조건.
```
