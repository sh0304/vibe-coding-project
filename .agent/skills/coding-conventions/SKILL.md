---
name: coding-conventions
description: Project coding conventions — ALWAYS use when writing new code, reviewing code, or refactoring. Covers naming, imports, TypeScript style, comments, and git commits.
tested-with:
  enf: "1.0.0"
  next: "16.x"
  typescript: "5.x"
triggers:
  - 컨벤션
  - 네이밍
  - 코드 스타일
  - import
  - 커밋
  - 주석
  - convention
  - naming
  - code style
  - commit
  - comment
---

# Coding Conventions

## 1. Naming Rules

### Files/Folders

| Target         | Rule       | Example             |
| -------------- | ---------- | ------------------- |
| Component      | PascalCase | `CustomerTable.tsx` |
| Utility/Hook   | camelCase  | `useCustomer.ts`    |
| Folder         | kebab-case | `customer-form/`    |
| Server Action  | camelCase  | `updateCustomer.ts` |

### Variables/Functions

| Target    | Rule                | Example          |
| --------- | ------------------- | ---------------- |
| Variable  | camelCase           | `customerList`   |
| Constant  | SCREAMING_SNAKE     | `API_BASE_URL`   |
| Function  | camelCase + verb    | `getCustomers()` |
| Component | PascalCase          | `CustomerCard`   |
| Hook      | use prefix          | `useCustomers()` |
| Type      | PascalCase (no I)   | `Customer`       |
| Boolean   | is/has/should       | `isActive`       |

## 2. Comment Patterns

```typescript
// 단순 설명 (한글)
// 다음 페이지로 이동

/** JSDoc - 컴포넌트/함수 설명 */

{
  /* JSX 구조 주석 */
}

// TODO: 향후 작업
// FIXME: 버그 수정 필요
```

## 3. Import Order

```typescript
// 1. React/Next.js
"use client"
import { useState } from "react"
import { headers } from "next/headers"

// 2. 외부 라이브러리
import { clsx } from "clsx"

// 3. 내부 모듈 (절대 경로)
import { Button } from "@/components/ui"
import { db } from "@/db"
import { auth } from "@/lib/auth"

// 4. 내부 모듈 (상대 경로)
import { CustomerTable } from "./_components/CustomerTable"
import { updateCustomer } from "../../_actions/customer"

// 5. 타입 (type-only)
import type { Customer } from "@/db/schema"
```

> **Why this order?** Consistent import ordering makes files faster to scan visually and reduces merge conflicts — framework imports change rarely, so they stay at the top; relative imports change often, so they cluster at the bottom.

## 4. TypeScript

- No `any` — use `unknown` instead
- Prefer type guards over `as` assertions
- Use `interface` for objects, `type` for unions

> **Why `unknown` over `any`?** `unknown` forces explicit type narrowing before use, catching type errors at compile time that `any` would silently pass through to runtime.

## 4.5. Architecture & React Patterns

- **Feature Directory**: 기존 `app`, `components` 폴더 구조를 넘어 `src/features/` 폴더를 생성하고, 도메인 단위(Organization, Approval 등)로 로직과 UI를 응집력 있게 관리한다.
- **Pure Services**: 데이터베이스 쿼리와 무관한 순수 비즈니스 로직(예: 통계 일할 연산 등)은 `src/services/`로 적출하여 의존성을 분리하고 테스트가 용이하게 한다.
- **RSC First**: 데이터 직렬화와 성능 최적화를 위해 Server Component를 우선한다. `useState` 등 클라이언트 훅이 필요한 최말단 인터랙션 컴포넌트에만 `'use client'`를 선언한다.
- **Constants**: 하드코딩된 숫자나 의미 없는 매직 스트링은 금지하며 `src/constants/` 혹은 `src/lib/constants.ts` 에 상수로 분리한다.

## 4.6. Project Folder Structure (src/)

```text
src/
 ├── app/                    # 1. 라우팅 (Pages & Layouts) - (dashboard) 등 그룹화
 ├── features/               # 2. 도메인 단위 비즈니스 응집 모듈 (가장 중요)
 │   ├── organization/       # 부서 비즈니스 (components, actions.ts, schemas.ts 응집)
 │   ├── employees/          # 사원 관련 비즈니스
 │   ├── approval/           # 전자결재 스냅샷 비즈니스
 │   └── statistics/         # 통계 대시보드
 ├── services/               # 3. 순수 비즈니스/연산 로직 (Unit Testable)
 │   └── costCalculator.ts   # DB 비의존형 일할 비용 계산 로직 등
 ├── components/             # 4. 앱 전역 공유 UI
 │   ├── ui/                 # shadcn/ui 등 기본 표준 컴포넌트
 │   └── shared/             # 도메인 간 공유 컴포넌트 (공용 인사 발령 모달 등)
 ├── lib/                    # 5. 인프라 코어 인스턴스 (prisma.ts, cn 등 utils.ts)
 └── types/                  # 6. 전역 인터페이스 선언 (DTO, 공용 Type)
```

## 5. Server Action Pattern

```typescript
// src/app/(admin)/_actions/customer.ts
"use server"

import { auth } from "@/lib/auth"
import { db } from "@/db"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

export async function updateCustomer(id: string, prevState: unknown, formData: FormData) {
  // 1. 인증 체크
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: "권한이 없습니다." }

  // 2. Zod 검증
  // 3. DB 작업
  // 4. revalidatePath
  revalidatePath("/admin/customers")

  return { success: true }
}
```

## 6. Git Commits

```
<type>: <한글 설명>

feat: 새 기능
fix: 버그 수정
refactor: 리팩토링
test: 테스트
docs: 문서
style: 포맷팅
chore: 빌드/설정
```

## 7. Error Handling

> **Detailed patterns**: See `error-handling` skill — covers Server Action, API Route, Database, and Error Boundary error handling

```typescript
// 서버 - 유효성 검증
if (!valid) notFound();

// 클라이언트 - try-catch
try { ... } catch { return defaultValue; }

// 비동기 - finally 보장
try { await fetch(); } finally { cleanup(); }
```

## 8. ESLint/Prettier

- `no-explicit-any`: error
- `consistent-type-imports`: enforced
- `printWidth`: 100
- `singleQuote`: true
