import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { OrganizationStat } from "@/features/statistics/schemas";

/**
 * 통계 및 예산 분석 관련 비즈니스 서비스
 */
export const StatisticsService = {
  /**
   * 특정 시점 기준 부서별 인원 및 예산 집행 통계 산출
   * SCD Type 2 로직을 통해 과거 시점의 조직/인원 구성을 정확히 반영함
   */
  async getOrganizationStats(targetDate: Date): Promise<OrganizationStat[]> {
    // 1. 활성 예산 정책 조회
    const policies = await prisma.budgetPolicy.findMany({
      where: { isActive: true }
    });
    const totalUnitAmount = policies.reduce((acc, p) => acc + p.unitPrice, 0);

    // 2. 해당 시점(targetDate)의 유효한 부서 목록 조회 (SCD Type 2)
    const activeOrgs = await prisma.organization.findMany({
      where: {
        AND: [
          { validFrom: { lte: targetDate } },
          { OR: [{ validTo: null }, { validTo: { gt: targetDate } }] },
          { isActive: true }
        ]
      }
    });

    // 3. 해당 시점(targetDate)의 유효한 사원 목록 조회 (SCD Type 2)
    const activeEmployees = await prisma.employee.findMany({
      where: {
        AND: [
          { validFrom: { lte: targetDate } },
          { OR: [{ validTo: null }, { validTo: { gt: targetDate } }] },
          { isActive: true }
        ]
      }
    });

    // 4. 해당 기간(Month)의 비용 지출 데이터 조회 (승인 완료 건)
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    const expenses = await prisma.approval.findMany({
      where: {
        category: "EXPENSE",
        status: "APPROVED",
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    // 5. 집계 데이터 생성 (최하위 팀 위주)
    const teamOrgs = activeOrgs.filter(org => 
      org.name.endsWith("팀") && org.parentCode !== null
    );

    const stats: OrganizationStat[] = teamOrgs.map(org => {
      // 해당 부서의 당시 소속 인원
      const deptEmployees = activeEmployees.filter(e => e.organizationCode === org.code);
      const headcount = deptEmployees.length;

      // 목표 예산 (Headcount 기반)
      const plannedBudget = headcount * totalUnitAmount;

      // 실제 지출액 (당시 소속 사원들이 상신한 승인 금액 합산)
      const empCodes = new Set(deptEmployees.map(e => e.employeeCode));
      const actualExpense = expenses
        .filter(exp => empCodes.has(exp.authorEmployeeCode))
        .reduce((acc, exp) => {
          // TODO: 실제 예산 정책별 정확한 상세 금액 합산 로직이 필요할 경우 고도화
          // 현재는 단순 데모용으로 승인 건당 100,000원으로 가산 (또는 content 등에서 파싱 필요)
          return acc + 100000; 
        }, 0);

      return {
        orgCode: org.code,
        orgName: org.name,
        headcount,
        plannedBudget,
        actualExpense,
        ratio: plannedBudget > 0 ? (actualExpense / plannedBudget) * 100 : 0
      };
    });

    return stats;
  },

  /**
   * 예산 정책 기초 데이터 시딩
   */
  async seedBudgetPolicies() {
    const defaultPolicies = [
      { category: "WELFARE", unitPrice: 100000, description: "복리후생비" },
      { category: "EDUCATION", unitPrice: 50000, description: "교육훈련비" },
      { category: "ACTIVITY", unitPrice: 80000, description: "부서활동비" },
    ];

    for (const policy of defaultPolicies) {
      await prisma.budgetPolicy.upsert({
        where: { category: policy.category },
        update: { unitPrice: policy.unitPrice },
        create: policy
      });
    }
  }
};
