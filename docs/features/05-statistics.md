# Feature 05: 전사 팀별 통계 (Analytics & Budget)

## 1. 개요
조직의 변경 이력(SCD Type 2)을 기반으로 특정 시점의 조직 구조를 복원하고, **실무 팀(Team) 단위**의 비용 지출 현황과 인당 단가 기준의 목표 예산을 분석합니다.

## 2. 라우팅 경로
- `/admin/statistics` (전사 통계 대시보드)

## 3. 화면 UI/UX 요건
*   **프리미엄 대시보드**: `recharts` 기반의 팀별 Plan vs Actual 시각화.
*   **지표 요약**: 전사 총 예산, 실집행액, 집계 인원수 요약 카드.
*   **예산 기준 안내**: 시스템에 적용된 인당 단가 정책을 안내하는 모달 가이드.

## 4. 상세 기술 명세 (Technical Specifications)

### 4.1 Database Schema (Prisma)
```prisma
model BudgetPolicy {
  id           String   @id @default(uuid())
  category     String   @unique // WELFARE, EDUCATION, ACTIVITY 등
  unitPrice    Int      @map("unit_price") // 인당 단가 (예: 100,000)
  description  String?
  isActive     Boolean  @default(true) @map("is_active")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("budget_policies")
}
```

### 4.2 유효성 검증 규칙 (Validation & Zod)
*   **통계 필터 검증 (`StatsFilterSchema`)**:
    *   `targetDate`: 필수 선택, 유효한 날짜 형식.
    *   `period`: `MONTHLY`, `QUARTERLY`, `YEARLY` 중 하나 필수.
*   **예산 정책 검증**:
    *   `unitPrice`: 0원 이상의 정수값 필수.

## 5. 핵심 비즈니스 로직
*   **팀 단위 필터링**: 최상위 및 본부를 제외하고 실제 실무가 이루어지는 '팀(Team)' 단위 조직만을 집계 대상으로 선별합니다.
*   **SCD 연계 집계**:
    *   **헤드카운트**: `targetDate` 시점에 소속된 사원 수를 이력 테이블에서 정확히 카운트합니다.
    *   **실제 집행액**: `Approval` 테이블에서 `APPROVED` 상태인 `EXPENSE` 데이터를 조회하되, 결재 건의 생성 시점(`createdAt`) 기준 사원의 소속 부서를 추적하여 귀속시킵니다.
    *   **목표 예산**: (해당 팀 인원수) × (전사 공통 인당 단가 정책 합계)로 산출합니다.

## 6. AI 구현 체크리스트
- [x] `recharts`를 활용한 동적 막대 차트(Stacked/Bar) 구현.
- [x] 조회 시점의 부서명 및 인원수를 SCD 이력 기반으로 정확히 복원.
- [x] 예산 정책 가이드라인 모달을 통한 데이터 산출 근거 투명성 확보.
