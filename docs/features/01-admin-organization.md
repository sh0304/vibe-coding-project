# Feature 01: 조직도 구성 및 인사 관리 (Admin Organization)

## 1. 개요
조직의 계층 구조와 사원의 인사 정보를 통합적으로 관리합니다. 모든 변경 사항은 **SCD Type 2** 아키텍처를 기반으로 기록되며, 과거 시점의 조직도를 완벽하게 복원할 수 있는 타임 머신 기능을 포함합니다.

## 2. 라우팅 경로
- `/admin/organization` (조직도 + 사원 통합 관리 메인 화면)

## 3. 화면 UI/UX 요건

### 3.1 프리미엄 관리자 헤더 (Global Header)
*   **서브 타이틀**: `Admin Management` (Indigo 굵은 텍스트)
*   **메인 타이틀**: `조직도 관리` (3xl, Black 굵기)
*   **상태 정보**: 헤더 우측에 현재 활성 부서 수와 총 사원 수를 요약하여 표시.

### 3.2 통합 매니저 레이아웃 (`OrganizationManager`)
*   **Split View 구조**: 좌측 트리 패널(1/4)과 우측 액션 패널(3/4)이 `gap-6` 여백으로 분리된 구조.
*   **독립 스크롤**: 전체 화면은 `h-screen overflow-hidden`을 유지하며, 트리와 상세 패널은 각각 독립적으로 스크롤 (`custom-scrollbar`).

### 3.3 상세 액션 패널 (데이터 관리)
*   **부서 모드**: 이름 변경 및 상위 부서 이동 시 `applyDate`를 기준으로 새 이력 생성.
*   **사원 모드**: 
    - 인사 발령 기능 포함 (대상 부서, 직급, 발령일 지정).
    - **정렬 정책**: 사원 목록은 **직급 레벨(Level) 오름차순**으로 우선 정렬되며, 동일 직급 내에서는 **성명 가나다순**으로 표시됩니다.

## 4. 상세 기술 명세 (Technical Specifications)

### 4.1 Database Schema (Prisma)
```prisma
model Organization {
  id          String    @id @default(uuid())
  code        String    @map("org_code")      // 불변 논리 식별자
  name        String                          // 부서명
  parentCode  String?   @map("parent_code")   // 상위 부서 논리 식별자
  validFrom   DateTime  @default(now()) @map("valid_from")
  validTo     DateTime? @map("valid_to")      // 이력이 닫히면 값이 채워짐
  isActive    Boolean   @default(true) @map("is_active")
  deletedAt   DateTime? @map("deleted_at")
  
  @@index([code, isActive])
  @@map("organizations")
}

model Employee {
  id               String    @id @default(uuid())
  employeeCode     String    @map("employee_code") // 불변 사번
  name             String                           // 이름
  organizationCode String    @map("org_code")        // 소속 부서 논리 식별자
  positionCode     String    @map("position_code")   // Position.code 참조
  validFrom        DateTime  @default(now()) @map("valid_from")
  validTo          DateTime? @map("valid_to")
  isActive         Boolean   @default(true) @map("is_active")
  deletedAt        DateTime? @map("deleted_at")

  @@index([employeeCode, isActive])
  @@map("employees")
}
```

### 4.2 유효성 검증 규칙 (Validation & Zod)
*   **데이터 형식 검증 (Zod)**:
    *   `name`: 최소 2자 이상의 문자열.
    *   `applyDate`: 'YYYY-MM-DD' 형식의 유효한 날짜 문자열.
*   **비즈니스 제약 (SCD Integrity)**:
    *   **이력 역행 방지**: 새로운 `applyDate`는 해당 사원/부서의 현재 레코드의 `validFrom`보다 이전일 수 없습니다.
    *   **원자성 보장**: 모든 이력 갱신(기존 레코드 Close + 새 레코드 Open)은 반드시 `prisma.$transaction` 블록 내에서 실행되어야 합니다.
*   **로그인 계정 연동**:
    *   신규 사원 등록 시 `User` 테이블에 로그인 계정을 동시에 생성합니다.
    *   초기 비밀번호는 `password123`으로 자동 설정되며, 이메일은 필수 입력 사항입니다.

## 5. 핵심 비즈니스 로직
*   **SCD Type 2 프로세스**: 기존 레코드의 `validTo`를 `applyDate`로 업데이트하고, 동일한 논리 식별자(`code`)를 가진 새 레코드를 추가합니다.
*   **타임 머신 (History Explorer)**: 선택된 과거 특정 일자와 `validFrom <= targetDate < validTo` 조건을 만족하는 모든 이력을 결합하여 당시의 스냅샷을 복원합니다.

## 6. AI 구현 체크리스트
- [x] 인사 발령 및 조직 개편 시 트랜잭션 처리 완료.
- [x] 조직도 과거 이력 조회 기능을 위한 전용 모달(HistoryExplorerModal) 구현.
- [x] 사원별 수직 타임라인 이력 보기 모달 구현.
