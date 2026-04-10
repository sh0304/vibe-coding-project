# Feature 05: 전사 팀별 통계 (Analytics & Budget)

## 1. 개요
조직의 변경 이력(SCD Type 2)을 기반으로 특정 시점의 조직 구조를 복원하고, **실무 팀(Team) 단위**의 비용 지출 현황과 인당 단가 기준의 목표 예산을 분석합니다.

## 2. 라우팅 경로
- `/admin/statistics` (전사 통계 대시보드)

## 3. 화면 UI/UX 요건
*   **Split View 레이아웃**: 좌측 조직도 트리와 우측 상세 통계 패널의 이분할 구조.
*   **드릴다운(Drill-down) 분석**:
    - 조직도에서 부서 선택 시 우측 패널에 해당 부서의 **요약 지표** 및 **팀원별 상세 현황** 표시.
    - 선택 해제 시 전사 요약 카드 및 전체 부서 비교 차트(Recharts) 표시.
*   **지표 요약**: 전사/팀 총 예산, 실제 집행액, 잔액(남은 예산), 집계 인원수 요약 카드.
*   **상세 테이블**: 팀원별 [성명, 직급, 배정 예산, 실 집행액, 잔고]를 표 형태로 제공.

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
    - `targetDate`: 필수 선택, 유효한 날짜 형식.
    - `period`: `MONTHLY`, `QUARTERLY`, `YEARLY` 중 하나 필수.
*   **예산 정책 검증**:
    - `unitPrice`: 0원 이상의 정수값 필수.

## 5. 핵심 비즈니스 로직
*   **조직도 연계 내비게이션**: `OrganizationTree`를 재활용하여 부서 단위 탐색을 지원합니다.
*   **SCD 연계 집계**:
    - **헤드카운트**: `targetDate` 시점에 소속된 사원 수를 이력 테이블에서 정확히 카운트합니다.
    - **팀원별 상세 집합**: 특정 부서 클릭 시, 당시 소속 사원들 각각의 지출 총액(`Approval` APPROVED 상태)을 쿼리하여 남은 예산(잔액)을 계산합니다.
    - **목표 예산**: (해당 팀 인원수) × (전사 공통 인당 단가 정책 합계)로 산합합니다.

## 6. AI 구현 체크리스트
- [x] `OrganizationTree`와 연동된 2분할(Side-by-side) 레이아웃 구현.
- [x] 부서 선택 여부에 따른 동적 렌더링 (차트 View <-> 테이블 View).
- [x] 사원별 상세 예산 사용 현황 추출 및 잔액 계산 로직 구현.
- [x] `recharts`를 활용한 전사 예산 분석 시각화.
