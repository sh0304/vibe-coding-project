# VIBE HR System

이 프로젝트는 조직 개편 및 인사 정보를 체계적으로 관리하는 **이력 추적형 인사 관리 시스템(HR System)**입니다. 조직 개편, 부서 이동, 사원 발령 시 과거 데이터를 파기하지 않고 기록을 보존하며, 특정 시점의 조직도를 재현하거나 결재 당시의 정보를 추적할 수 있는 기능을 제공합니다.

---

## 🚀 주요 기능 (Core Features)

### 1. 조직 및 사원 관리 (이력 관리)
- **과거 데이터 보존**: 모든 부서 및 사원 정보는 `validFrom`, `validTo` 기반으로 관리되어 변경 전 기록이 유실되지 않습니다.
- **타임머신(Time Machine)**: 특정 날짜를 선택하여 과거의 조직 구조와 사원 배치를 조회할 수 있습니다.
- **유연한 조직 개편**: 부서 생성, 이름 변경, 상위 부서 변경 시 기존 이력을 보존하면서 새로운 정보를 업데이트하여 데이터 무결성을 유지합니다.

### 2. 전자결재 시스템 (Approval System)
- **스냅샷 결재**: 기안 시점의 기안자 정보(이름, 소속, 직급)와 결재선 정보를 스냅샷으로 저장하여, 이후 조직 개편이 발생해도 결재 문서의 정합성을 유지합니다.
- **비용 집계**: 휴가, 비용 청구, 증명서 신청 등 다양한 카테고리의 결재를 지원하며, 실시간 비용 검증(예산 체크)을 수행합니다.

### 3. 통계 및 비용 대시보드 (Statistics)
- **조직별 비용 집계**: 기간별, 부서별 지출 현황을 시각화합니다.
- **예산 정책 관리**: 항목별 인당 기준 단가를 설정하고 실지출액과 대조하여 통계 데이터를 제공합니다.

---

## 🛠 기술 스택 (Tech Stack)

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescript.org/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: SQLite (Development)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Authentication**: Custom Session Management (Cookie-based)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

---

## 📊 데이터베이스 구조 (ERD)

프로젝트의 주요 테이블 간 관계는 다음과 같습니다. (Mermaid 다이어그램)

```mermaid
erDiagram
    POSITION ||--o{ EMPLOYEE : "has"
    ORGANIZATION ||--o{ EMPLOYEE : "belongs to"
    ORGANIZATION ||--o| ORGANIZATION : "parent"
    EMPLOYEE ||--o| USER : "mapped"
    EMPLOYEE ||--o{ APPROVAL : "requests"
    EMPLOYEE ||--o{ APPROVAL_STEP : "approves"
    APPROVAL ||--o{ APPROVAL_STEP : "contains"

    POSITION {
        string code PK "직급 코드 (POS_STAFF 등)"
        string name "직급명 (사원, 팀장)"
        int level "권한 레벨"
        string approvalGroup "결재 권한 그룹"
    }
    ORGANIZATION {
        string code "부서 논리 식별자"
        string name "부서명 (이력 변경 가능)"
        string parent_code FK "상위 부서 코드"
        datetime valid_from "이력 시작일"
        datetime valid_to "이력 종료일"
        boolean is_active "활성화 여부"
    }
    EMPLOYEE {
        string employee_code PK "사번"
        string name "이름"
        string org_code FK "소속 부서 코드"
        string position_code FK "직급 코드"
        datetime valid_from "발령 시작일"
        datetime valid_to "발령 종료일"
        boolean is_active "재직 여부"
    }
    APPROVAL {
        string id PK "문서 ID"
        string category "결재 유형 (LEAVE, EXPENSE)"
        string status "상태 (PENDING, APPROVED)"
        string author_employee_code FK "기안자 사번"
        string snapshot_org_name "기안 당시 부서명"
        string snapshot_position "기안 당시 직급"
        int amount "청구 금액 (있는 경우)"
    }
    APPROVAL_STEP {
        string id PK "단계 ID"
        string approval_id FK "연결된 결재 문서"
        int step_order "결재 순서"
        string role "담당 역할 (TEAM_LEAD 등)"
        string status "승인 상태 (WAITING, APPROVED)"
        string approver_employee_code FK "승인자 사번"
    }
    USER {
        string email PK "계정 이메일"
        string employee_code FK "연결된 사번"
        string role "시스템 권한 (admin, user)"
    }
    BUDGET_POLICY {
        string category PK "예산 항목 (WELFARE 등)"
        int unit_price "인당 기준 단가"
        boolean is_active "정책 활성화 상태"
    }
```

---

## 📑 스키마 상세 설명 (쉽게 읽기)

이 시스템의 데이터 모델은 크게 **'과거를 기억하는 타임머신'**과 **'중요한 순간을 기록하는 사진기'**라는 두 가지 개념으로 설계되었습니다.

### 1. 조직 및 인사 관리: "데이터 타임머신" 🕰️
이 영역의 테이블들은 부서가 바뀌거나 팀을 옮겨도 과거의 기록을 지우지 않고 보관합니다.

| 테이블 | 설명 (역할) | 쉬운 예시 |
| :--- | :--- | :--- |
| **Position (직급)** | 회사 내의 계급장 목록입니다. | 사원, 팀장, 본부장 등 어떤 역할이 있는지 정의합니다. |
| **Organization (부서)** | 부서의 족보입니다. | '인사팀'이 '피플팀'으로 이름이 바뀌어도, "작년에는 인사팀이었다"는 사실을 기억합니다. |
| **Employee (사원)** | 사원의 발령 기록지입니다. | 홍길동 사원이 1월에는 A팀, 2월에는 B팀 소속이었다는 이동 경로를 모두 저장합니다. |

*   **핵심 원리**: `시작일(validFrom)`과 `종료일(validTo)`을 사용하여, 특정 날짜를 입력하면 그 당시의 조직도를 그대로 재현할 수 있습니다.

---

### 2. 전자결재 시스템: "기록용 폴라로이드" 📸
결재는 나중에 부서 이름이 바뀌거나 팀장이 바뀌어도, **'결재했던 그 순간'**의 정보가 그대로 남아 있어야 합니다.

| 테이블 | 설명 (역할) | 쉬운 예시 |
| :--- | :--- | :--- |
| **Approval (결재)** | 신청서 본체입니다. | 휴가 신청서나 영수증 청구서라고 생각하면 됩니다. |
| **Snapshot (스냅샷)** | 결재 당시의 정보를 사진 찍듯 저장합니다. | 결재 후에 팀 이름이 바뀌어도, 신청서에는 **당시의 팀 이름**이 그대로 찍혀 나옵니다. |
| **ApprovalStep (결재선)** | 도장을 찍는 순서입니다. | 1단계는 팀장님, 2단계는 본부장님처럼 승인을 받아야 하는 길을 정합니다. |

---

### 3. 시스템 설정 및 규칙 ⚙️
| 테이블 | 설명 (역할) | 쉬운 예시 |
| :--- | :--- | :--- |
| **User (사용자)** | 시스템에 로그인하기 위한 열쇠입니다. | 이메일과 비밀번호로 "나"라는 것을 증명합니다. 인사 정보(`Employee`)와 연결되어 있습니다. |
| **BudgetPolicy (돈 관리)** | 회사에서 정한 비용 기준입니다. | "복리후생비는 인당 10만원까지"라는 식의 기준치를 정해두고 결재 시 참고합니다. |

---

### 💡 시스템 작동 방식 요약
1.  **변하지 않는 기록**: 부서 이름이 바뀌어도 과거의 결재 서류나 발령 기록은 바뀌지 않고 그대로 유지됩니다.
2.  **자동 권한 부여**: 내 직급(`Position`)에 따라 결재할 수 있는 권한이 자동으로 결정됩니다.
3.  **데이터 무결성**: 모든 정보는 함부로 삭제되지 않으며, 기록을 '닫고' 새로운 기록을 '여는' 방식으로 운영됩니다.

---

## 📂 프로젝트 구조 (Project Structure)

프로젝트는 도메인 중심의 **Feature-based Architecture**를 따릅니다.

```text
src/
 ├── app/                    # 라우팅 (Pages & Layouts)
 ├── features/               # 도메인 단위 비즈니스 로직 (Core)
 │   ├── organization/       # 조직/사원 관리
 │   ├── approval/           # 전자결재 시스템
 │   └── statistics/         # 통계 및 대시보드
 ├── services/               # 공통 비즈니스/연산 로직 (Unit Testable)
 ├── components/             # 전역 공유 UI 컴포넌트 (shadcn/ui 포함)
 ├── lib/                    # 인프라 설정 (prisma, auth, utils)
 └── types/                  # 전역 타입 정의
```

---

## 🚦 시작하기 (Getting Started)

### 1. 의존성 설치
```bash
npm install
```

### 2. 데이터베이스 설정 및 마이그레이션
```bash
# Prisma Client 생성
npx prisma generate

# DB 스키마 동기화 (SQLite)
npx prisma db push
```

### 3. 초기 시드 데이터 생성
테스트를 위한 관리자 계정 및 SCD 이력이 포함된 데이터가 생성됩니다.
```bash
npx prisma db seed
```

### 4. 개발 서버 실행
```bash
npm run dev
```
접속 주소: [http://localhost:3000](http://localhost:3000)

---

## 🔑 테스트 계정
시드 데이터를 통해 생성된 주요 계정 정보입니다. (비밀번호: `admin123` 또는 `password123`)

- **관리자**: `admin@company.com`
- **본부장**: `head@company.com`
- **팀장급**: `lead1@company.com`, `lead2@company.com`
- **사원급**: `user1@company.com`, `user2@company.com`

---

## 📜 설계 원칙
1. **데이터 이력 보존**: 기존 데이터를 수정하는 대신 기간 정보를 이용해 기록을 보존하여 누적 데이터를 관리합니다.
2. **Atomic Transaction**: 이력 생성 및 관련 업데이트 작업은 반드시 Prisma 트랜잭션 내에서 처리됩니다.
3. **RSC First**: 데이터 페칭은 서버 컴포넌트에서 우선적으로 처리하며, 인터랙션이 필요한 부분만 클라이언트 컴포넌트로 분리합니다.
