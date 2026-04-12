# 조직도 과거 이력 조회

## 개요
현재 시점의 운영 데이터를 관리하는 부서/사원 환경을 방해하지 않도록, **격리된 전용 "타임머신 모달(Dialog)"**을 띄워 과거 스냅샷 기능을 제공합니다.
관리 페이지(`/admin/organization`) 전체가 Read-Only로 변하는 기존 UX 대신, 모달 내부에서만 과거 일자에 따른 독립적인 데이터를 페칭(Fetching)하여 조직도 트리를 구성합니다.

## 화면 UI/UX 요건

1. **타임머신 진입 버튼**:
   - `OrganizationManager` 최상단 (또는 헤더 영역)에 눈에 띄는 **[과거 이력 조회]** 버튼을 배치합니다.

2. **History Explorer Modal (Dialog)**:
   - 버튼 클릭 시 전체 화면 크기에 준하는 넓은 Dialog가 열립니다.
   - **모달 헤더**: `[YYYY-MM-DD]` 형태의 Date Picker를 제공하여 언제든 조회할 과거 일자를 자유롭게 변경할 수 있습니다.
   - **모달 본문**:
     - 기존 `OrganizationTree`를 사용하여 과거 시점의 부서와 사원을 계층 구조로 시각화합니다.
     - **스크롤 보장**: 많은 부서/사원이 한꺼번에 펼쳐질 경우를 대비하여 모달 내부에 독립적인 세로 스크롤(`min-h-0`, `overflow-y-auto`)이 반드시 동작해야 함.
     - **데이터 정렬 일관성**: `/admin/organization` 화면과 동일하게 부서는 **이름순**, 사원은 **직급 레벨순**으로 정렬하여 사용자에게 일관된 뷰를 제공함.

## 동적 타임머신 렌더링 쿼리 로직 (Server Action)

1. URL 파라미터를 사용하는 Server Component (`page.tsx`) 방식이 아닌, **Client Component 내부의 비동기 (AJAX) Server Action**을 쏘아 스냅샷 데이터를 가져옵니다.
2. 클라이언트 모달의 로컬 상태(State)로 `targetDate`를 관리합니다.
3. Date 값이 변경되면, Server Action `getOrganizationSnapshot(targetDate)`을 호출.
   - 이 액션 내부에서 `Promise.all`로 조직 스냅샷, 사원 스냅샷을 동시에 Fetch합니다.
   ```typescript
   // history-actions.ts 
   export async function getOrganizationSnapshot(dateStr: string) {
     // 1. 날짜를 해당 일자의 시작 시점(00:00:00)으로 초기화하여 조회 정밀도 확보
     const targetDate = new Date(dateStr);
     targetDate.setHours(0, 0, 0, 0);

     const orgParams = { 
       where: { 
         validFrom: { lte: targetDate }, 
         OR: [
           { validTo: null }, 
           { validTo: { gte: targetDate } } // gte를 사용하여 해당일 종료 시점까지 포함
         ] 
       }
     };
     // ... Fetch orgs & emps simultaneously returning data ...
   }
   ```

## AI 구현 체크리스트
- [x] `page.tsx`는 항상 최신(Current Active) 상태만 SSR로 내려주는 코드로 원복.
- [x] `src/features/organization/history-actions.ts` 생성 후 병렬(Parallel) point-in-time Fetching 액션 정의.
- [x] `HistoryExplorerModal.tsx` 생성. 이 안에서 `targetDate`를 바꾸면 비동기 `useTransition` 혹은 수동 `useState` 기반으로 스냅샷을 다시 불러와 재렌더링.
- [x] `OrganizationManager`에 "과거 조회 모달 열기" 버튼 추가 및 `HistoryExplorerModal` 탑재.

## 상세 기술 명세 (Technical Specifications)
- **Database**: 기존 SCD Type 2 구조(`validFrom`, `validTo`)를 그대로 활용, 추가 DB 작업 불필요.
- **Tree View Migration**: `OrganizationTree` 컴포넌트를 직접 사용하여 과거 이력을 시각화하며, 관리자용 상세 액션 패널은 포함하지 않음.
