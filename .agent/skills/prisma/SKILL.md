---
name: prisma
description: Prisma ORM patterns — ALWAYS use when writing database queries, defining schemas, creating migrations, or working with relations and transactions.
triggers:
  - prisma
  - 스키마
  - 마이그레이션
  - 데이터베이스
  - ORM
  - schema
  - migration
  - database
  - db
---

# Prisma ORM Guide

## Setup

### 1. Installation

```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

### 2. DB Connection (`src/lib/prisma.ts`)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Schema Design Patterns

### Base Model Structure (`prisma/schema.prisma`)

```prisma
model Customer {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  status    String   @default("ACTIVE")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  campaigns Campaign[]

  @@map("customers")
}
```

### 1:N Relationship

```prisma
model Campaign {
  id         String   @id @default(uuid())
  name       String
  status     String   @default("RECRUITING")
  customerId String   @map("customer_id")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  customer   Customer @relation(fields: [customerId], references: [id])

  @@map("campaigns")
}
```

## Query Patterns

### Select (필요한 필드만 조회)

```typescript
// GOOD: 필요한 필드만 선택
const result = await prisma.customer.findMany({
  select: { id: true, name: true, email: true },
})
```

### Select with Relations

```typescript
const customer = await prisma.customer.findFirst({
  where: { id },
  include: {
    campaigns: {
      select: { id: true, name: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    },
  },
})
```

### Insert

```typescript
const newCustomer = await prisma.customer.create({
  data: {
    name: "홍길동",
    email: "hong@test.com",
  },
})
```

### Update

```typescript
const updated = await prisma.customer.update({
  where: { id },
  data: { name: "김철수" },
})
```

### Delete

```typescript
await prisma.customer.delete({
  where: { id },
})
```

### Transactions

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. 첫 번째 로직
  const campaign = await tx.campaign.create({
    data: { name: "새 캠페인", customerId }
  });

  // 2. 다른 연계 데이터 생성 (반드시 tx 객체 사용)
  // await tx.something.create(...)

  return campaign;
})
```

## Migration Commands

```bash
# 로컬 스키마 변경을 DB에 푸시 (프로토타이핑/개발용)
npx prisma db push

# 마이그레이션 파일 생성 및 반영 (프로덕션 배포 이력 관리용)
npx prisma migrate dev --name init

# 스키마 브라우저 (Prisma Studio)
npx prisma studio
```

## Important Notes

1. **`@@map` 사용** -- Prisma 모델명(PascalCase)과 필드명(camelCase)을 물리적 데이터베이스의 표준인 `snake_case`로 자동 매핑하기 위해 항상 `@map` 및 `@@map`을 권장합니다.
2. **트랜잭션 일관성** -- `prisma.$transaction` 블록 내에서는 반드시 인자로 받은 `tx` 객체를 사용해야 합니다. 절대 외부의 `prisma.` 객체를 혼용하면 안 됩니다.
3. **Relation 선언** -- 관계형 데이터를 연결할 때 필드 레벨에서 `@relation(fields: [...], references: [...])` 문법을 누락 없이 작성해야 합니다.
