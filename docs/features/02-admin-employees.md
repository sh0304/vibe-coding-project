# 사원 이력 타임라인 (Employee History Timeline)

## 라우팅 경로
- `/admin/employees/[code]/history` (특정 사원의 소속 이력 타임라인)

> **참고**: 사원 관리의 **주 진입점**은 `/admin/organization`의 통합 트리입니다.
> 이 페이지는 특정 사원의 전체 이력을 상세하게 보여주는 **보조 상세 뷰** 역할입니다.
> 조직도 트리에서 사원 선택 → 우측 패널의 [이력 보기] 버튼을 통해 이 페이지로 진입합니다.

## 화면 UI/UX 요건

- 상단에 **[← 조직도로 돌아가기]** 뒤로가기 네비게이션 제공.

### 2. 사원 이력 팝업 (Employee History Modal)
- `/admin/organization` 트리에서 사원 선택 시 노출되는 '이력 보기' 버튼으로 빠른 조회가 가능한 모달 제공.
- **레이아웃 비중**: 이력 카드 내에서 소속 부서 영역이 직급보다 더 넓게 확보되어야 함 (너비 비율 약 **1.3 : 1**).
- **시각적 강조**: 배경색(`bg-indigo-50/30`) 및 아이콘을 활용하여 현재와 과거 발령 이력을 쉽게 구분.

## 핵심 데이터 조작 방식 (Server Actions)

### 이력 타임라인 조회 (`getEmployeeHistory`)
- **Query**: `prisma.employee.findMany({ where: { employeeCode: parameter }, orderBy: { validFrom: 'desc' } })`
- 각 레코드별 `organizationCode`를 통해 **당시 시점의 부서명**을 리졸빙해야 합니다.
- Point-in-Time 리졸빙 로직: 해당 이력의 `validFrom` 시점에 유효했던 Organization 레코드를 찾아 부서명을 매핑.

## 상세 기술 명세 (Technical Specifications)

### 1. Point-in-Time 부서명 리졸빙 쿼리
```typescript
// 각 사원 이력 레코드에 대해 해당 시점의 유효한 부서명을 조회
const org = await prisma.organization.findFirst({
  where: {
    code: record.organizationCode,
    validFrom: { lte: record.validFrom },
    OR: [
      { validTo: null },
      { validTo: { gte: record.validFrom } },
    ],
  },
  orderBy: { validFrom: "desc" },
})
```

### 2. 상태 및 렌더링 전략
- **Server Component (`page.tsx`)**: Next.js 동적 라우트 `params`에서 `code`를 추출하여 `getEmployeeHistory()` 호출. 이력이 없으면 `notFound()`.
- **Client Component (`EmployeeTimeline.tsx`)**: 수직 타임라인 UI 렌더링. 현재 활성 이력은 강조(인디고 배경 + 펄스 도트), 과거 이력은 일반 카드.
