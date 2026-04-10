# Project Overview & Technology Stack

## 1. 프로젝트 개요 (Project Overview)
본 프로젝트는 **SCD(Slowly Changing Dimension) Type 2** 아키텍처를 기반으로 설계된 이력 추적형 조직 및 인사 관리 시스템(HR System)입니다. 
- 조직 개편, 부서 이동, 사원 발령 시 과거 데이터를 파기하지 않고 기록을 닫은(`validTo`) 뒤 새 기록을 엽니다.
- 결재 및 비용 분배 산출 등은 언제나 해당 발생 시점의 스냅샷 또는 이력 범위를 추적해야 합니다.

## 2. 사용 기술 스택 및 준수 규칙 (Tech Stack & AI Rules)
AI 모델(Agent)은 이 프로젝트 내에서 코드를 추가하거나 수정할 때, **아래 정해진 프레임워크와 규칙들을 다른 방법론보다 최우선으로 강제 적용**해야 합니다.

### Next.js (App Router) & React
- 기본적으로 **서버 컴포넌트(RSC)** 위주로 짜여야 하며, 초기 데이터 패칭에 사용합니다.
- 순수 상태(`useState`, Context)나 이벤트 핸들러가 들어가는 상호작용 UI의 최하위 단에만 `'use client'` 지시어를 사용해 클라이언트 컴포넌트로 분리합니다.
- Form 전송, DB Insert/Update 작업 등 Mutation은 API Route보다 **Server Actions**를 사용합니다.

### TypeScript & Zod
- **Type-Safety 강제**: 암시적 `any` 사용은 허용하지 않으며, 모든 파라미터와 리턴 타입의 인터페이스를 명확하게 선언합니다.
- **Zod 기반 검증**: 프론트엔드 Form 유효성 검증과 더불어 Server Action으로 전달되는 페이로드의 백엔드 무결성 방어 역시 Zod 스키마 검증을 거쳐야 합니다.

### Prisma ORM
- SCD 로직(기존 이력 업데이트 닫기 + 새 이력 Insert)은 절대 분리되어 실행되선 안 되며, 반드시 **`prisma.$transaction` 블록** 안에서 묶어 원자성(Atomicity)을 보장해야 합니다.
- 단순히 외래키 물리 ID 조인을 넘어선 포인트-인-타임(Point-In-Time) 쿼리(범위 검색)에 주의하며, 논리 식별자(`code`) 기반 참조를 우선적으로 따릅니다.

### Tailwind CSS & shadcn/ui
- **Tailwind 지향**: 커스텀 순수 CSS나 Styled-components 사용을 지양하고, Tailwind CSS Utility Classes를 우선적으로 사용해 작성합니다.
- **shadcn/ui 활용**: 버튼, 인풋, 모달 UI, DatePicker 등 표준화된 컴포넌트는 `shadcn/ui` 생태계를 기반으로 컴포넌트를 사용하고 조립하여 개발합니다.

## 3. 요구사항 문서 작성 규격 (Requirements Specification Standards)
AI 모델은 새로운 기능(Feature)을 설계하거나 기존 문서를 수정할 때, 반드시 아래 구조에 따라 기술 명세를 상세히 작성해야 합니다.

1. **개요 및 라우팅 경로**: 기능의 목적과 Next.js App Router 기준의 URL 경로 명시.
2. **화면 UI/UX 요건**: 컴포넌트 단위의 인터랙션 명세 및 레이아웃 요건.
3. **상태 관리 및 렌더링 전략**: RSC(서버 컴포넌트)와 Client Component의 역할 분담 명시.
4. **상세 기술 명세 (Technical Specifications)**:
   - **Database Schema**: 해당 기능과 연관된 Prisma 모델링.
   - **Form Validation (Zod)**: 프론트/백엔드 공통 유효성 검증 규칙.
   - **Server Action Interface**: 입출력 데이터 구조(DTO) 정의.
5. **핵심 비즈니스 로직**: SCD Type 2 적용 방식 및 트랜잭션 원칙 기술.
6. **AI 구현 체크리스트**: 성능 최적화, 엣지 케이스 처리 등 구현 시 유의사항.
