# Feature 04: 전자결재 시스템 (Approval System)

## 1. 개요
조직의 의사결정을 디지털화하고, SCD Type 2 아키텍처의 핵심인 **'결재 시점의 상태 보존(Snapshot)'**을 구현합니다. 기안 당시의 소속 정보와 고정된 결재선을 보존하여 데이터 무결성을 증명합니다.

## 2. 라우팅 경로
- `/approval` (결재 센터 메인)

## 3. 화면 UI/UX 요건
*   **Split View 콘솔**: 좌측 결재 목록과 우측 상세 패널의 이분할 구조.
*   **멀티 카테고리 폼**: 휴가, 비용, 증명서 등 문서 종류에 따른 동적 입력 필드 제공.
*   **인라인 액션**: 상세 대시보드 내에서 즉시 승인/반려 가능.

## 4. 상세 기술 명세 (Technical Specifications)

### 4.1 Database Schema (Prisma)
```prisma
model Approval {
  id                    String         @id @default(uuid())
  category              String         // LEAVE, EXPENSE, CERT
  title                 String
  content               String?
  status                String         @default("PENDING") // PENDING, IN_PROGRESS, APPROVED, REJECTED
  
  // SCD Snapshot Fields (기안 시점의 정보 박제)
  authorEmployeeCode    String         @map("author_employee_code")
  snapshotAuthorName    String         @map("snapshot_author_name")
  snapshotOrgName       String         @map("snapshot_org_name")
  snapshotPosition      String         @map("snapshot_position")
  snapshotApproverLine  String?        @map("snapshot_approver_line") // 기안 당시 결재선 JSON (이름/직급/순서)
  
  // 카테고리별 명시적 데이터 필드
  startDate             DateTime?      @map("start_date")
  endDate               DateTime?      @map("end_date")
  amount                Int?           @map("amount")              // 지출 금액
  budgetCategory        String?        @map("budget_category")     // WELFARE, EDUCATION, ACTIVITY
  
  steps                 ApprovalStep[]
  createdAt             DateTime       @default(now()) @map("created_at")

  @@map("approvals")
}

model ApprovalStep {
  id                       String    @id @default(uuid())
  approvalId               String    @map("approval_id")
  stepOrder                Int       @map("step_order")          // 1: 팀장, 2: 인사팀
  role                     String                                // TEAM_LEAD, HR_DEPT
  snapshotApproverName     String    @map("snapshot_approver_name")     // 박제된 결재자 이름
  snapshotApproverPosition String    @map("snapshot_approver_position") // 박제된 결재자 직급
  approverEmployeeCode     String?   @map("approver_employee_code")     // 실제 결재자 사번 (권한 체크용)
  status                   String    @default("WAITING")         // WAITING, APPROVED, REJECTED
  comment                  String?                               // 결재 의견
  actionAt                 DateTime? @map("action_at")           // 결재 처리 시각

  @@map("approval_steps")
}
```

### 4.2 유효성 검증 규칙 (Validation & Zod)
*   **기안 폼 검증 (`ApprovalSchema`)**:
    *   `title`: 필수 입력, 2자 이상 50자 이하.
    *   `category`: `LEAVE`, `EXPENSE`, `CERT` 중 하나 필수 선택.
    *   **조건부 검증**:
        *   `LEAVE`인 경우: 시작일과 종료일이 필수이며, 종료일은 시작일 이후여야 함.
        *   `EXPENSE`인 경우: 금액(Int) 및 예산 항목(`budgetCategory`) 필수 선택.
*   **결재 액션 검증**:
    *   **순서 보장**: 이전 단계(`stepOrder-1`)가 `APPROVED` 상태가 아닌 경우 현재 단계의 승인 처리를 차단합니다.
    *   **권한 검증**: 현재 로그인한 사원의 `code`가 해당 Step의 `approverCode`와 일치해야 합니다.

## 5. 핵심 비즈니스 로직
*   **데이터 박제**: 결재가 상신되는 순간, 당시 기안자의 부서명과 직급명을 `snapshot` 필드에 텍스트로 저장하여 향후 조직 개편의 영향을 받지 않도록 합니다.
*   **결재선 자동 생성**: 
    - 기안자의 소속과 직급을 기반으로 결재선을 구성합니다.
    - 소속 팀장(1차) → 관련 본부장 또는 인사팀장(2차) 순으로 결재자가 상신 시점에 동적으로 할당됩니다.
    - SCD Type 2 쿼리를 통해 **상신 일자 당일에 실제 해당 직책을 맡고 있던 사원**을 정확히 추적하여 결재자로 지정합니다.

## 6. AI 구현 체크리스트
- [x] 결재 상신 및 승인/반려 시 트랜잭션 처리 원칙 준수.
- [x] `LEAVE` 카테고리 선택 시 날짜 선택기 동적 노출 UI 구현.
- [x] 박제된 정보임을 알리는 시각적 가이드라인 제공.
