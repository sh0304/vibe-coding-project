---
description: 브라우저 서브에이전트 + 코드로 검증하는 하이브리드 QA (Browser & Logic QA)
---

# 🕵️ 하이브리드 QA 테스트 (Visual + Logical)

본 워크플로우는 **`testing` 스킬**과 **`browser_subagent`**를 결합하여, 시스템의 시각적 완성도와 비즈니스 로직의 견고함을 동시에 검증하는 프로젝트 표준 QA 절차입니다.

## 1. 단계: 논리 검증 (Logical Verification via Vitest)
브라우저를 열기 전, 관련 비즈니스 로직이 코드로 우선 증명되어야 합니다.
- [ ] `testing` 스킬 가이드에 따라 `src/features/[기능명]/__tests__` 내의 단위 테스트를 수행합니다.
- [ ] **실행**: `npm test [기능명]` 또는 `npx vitest run [파일명]`
- [ ] **체크포인트**: Server Action의 SCD 트랜잭션 성공 여부, Zod 스키마의 엣지 케이스 통과 여부.

## 2. 단계: 시각 및 인터랙션 검증 (Visual QA via Browser Subagent)
논리가 확보된 후, 실제 사용자의 눈으로 화면을 검증합니다.
- [ ] `browser_subagent`를 파견하여 프리미엄 UI 디자인(Indigo 포인트, Layout) 준수 여부를 확인합니다.
- [ ] **시나리오**: `/browser-qa` 표준 E2E 시나리오(기안-승인-조직개편)를 따라 직접 인터랙션을 수행합니다.
- [ ] **체크포인트**: 레이아웃 깨짐, 버튼 활성화 상태, 토스트 알림 메시지의 적절성.

## 3. 단계: 데이터 무결성 교차 점검 (SCD Snapshot Audit)
- [ ] 브라우저 QA 도중 발생한 데이터 변경 건에 대해, 실제 DB 레코드가 `validFrom/To` 및 `Snapshot` 규칙을 따르는지 `testing` 스킬의 DB Mocking 패턴을 활용하거나 직접 쿼리로 확인합니다.

## 4. 최종 리포트 구성
서브에이전트가 리턴한 **녹화 애니메이션(WebP)**과 Vitest의 **테스트 통과 메트릭**을 종합하여 사용자에게 다음과 같이 보고합니다:
> "논리 테스트(12/12) 통과 및 브라우저 시야 검사 완료. SCD 스냅샷 무결성이 코드로 증명되었으며, UI 레이아웃 또한 프리미엄 규격을 준수합니다."

---
**주의**: 반드시 `testing` 스킬의 'Server Action Test Template'을 참고하여 가짜 데이터(Mocking)가 실제 DB를 오염시키지 않도록 주의하십시오.