---
description: DB 스키마 마이그레이션 동기화 (Prisma DB Push)
---

# DB 마이그레이션 및 타입 동기화

이 워크플로우는 `prisma/schema.prisma` 파일 내의 모델(인덱스, 스키마 등)이 추가되거나 수정되었을 때, 데이터베이스에 변경 상태를 원클릭으로 밀어넣고 서버 타입을 동기화하기 위해 사용합니다.

// turbo-all
1. `npx prisma db push` 명령어를 실행하여 수정된 Prisma 스키마를 실제 데이터베이스에 동기화합니다.
2. `npx prisma generate` 명령어를 연달아 실행하여 서버 컴포넌트나 Action용 TypeScript 클라이언트 코드를 업데이트합니다.
3. 마이그레이션이 완료되면 콘솔 출력의 성공/에러 여부를 요약해서 사용자에게 보고합니다.
