---
description: 도메인 구조 생성부터 UI 구현까지 통합 워크플로우 (Full Feature Implementation)
---

# Feature 통합 빌드 워크플로우 (Scaffold + Build)

이 워크플로우는 새로운 기능을 기획서 단계에서 실제 동작하는 페이지까지 한 번에 완성하는 엔드 투 엔드(E2E) 개발 프로세스입니다. **SCD Type 2의 복잡한 이력 관리 로직과 프리미엄 디자인**을 일관성 있게 구현하기 위해 사용됩니다.

// turbo-all
## 1단계: 도메인 뼈대 구축 (Scaffold)
1. 사용자가 명시한 기능명(예: `approval`, `statistics`)을 기준으로 `src/features/[기능명]` 폴더를 생성합니다.
2. 하위에 `components/`, `actions.ts`, `schemas.ts` 파일을 즉시 생성하여 개발 기초를 마련합니다.
3. `actions.ts`에는 `"use server"` 지시어를, `schemas.ts`에는 `zod` 기초 임포트를 포함한 보일러플레이트를 삽입합니다.

## 2단계: 데이터 스펙 정의 (Schema & Validation)
1. 요구사항 명세에 맞춘 **Zod 스키마**를 `schemas.ts`에 정의하여 폼 검증 및 Server Action의 보안 방어선을 구축합니다.
2. SCD 이력 관리를 위한 날짜 및 논리 식별자 검증 규칙을 포함합니다.

## 3단계: 비즈니스 로직 구현 (Server Actions)
1. `actions.ts`에서 데이터 Mutation 로직을 작성합니다.
2. **트랜잭션 보장**: SCD 데이터 변경 시 반드시 `prisma.$transaction` 블록을 사용해 원자성을 보장합니다.
3. `error-handling` 스킬 규격에 맞춰 `{ success: boolean, data?, error? }` 구조의 결과를 반환합니다.

## 4단계: 프리미엄 UI 조립 (Client Components)
1. `src/features/[기능명]/components/`에 `"use client"` 지시어가 포함된 상호작용 컴포넌트들을 제작합니다.
2. `tailwind-v4-shadcn` 및 `Agreemnet Premium Header` 스타일 가이드라인을 준수하여 심미성 높은 UI를 도출합니다.
3. `useTransition`을 활용해 데이터 연동 시 사용자 경험을 최적화합니다.

## 5단계: 최종 화면 결합 (App Router Page)
1. `src/app/[라우트경로]/page.tsx`에 서버 컴포넌트(RSC)를 생성합니다.
2. 상단에 프리미엄 공통 헤더를 배치하고, Prisma를 통해 초기 데이터(Initial Data)를 직접 Fetch합니다.
3. 가져온 데이터를 피처 컴포넌트에 주입하여 최종적인 완성 화면을 제공합니다.
