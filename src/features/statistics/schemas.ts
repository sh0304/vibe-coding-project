import { z } from "zod";

// 예산 항목 (Budget Categories)
export const BudgetCategory = {
  WELFARE: "WELFARE",    // 복리후생
  EDUCATION: "EDUCATION", // 교육비
  ACTIVITY: "ACTIVITY",   // 활동비
} as const;

export type BudgetCategory = typeof BudgetCategory[keyof typeof BudgetCategory];

// 예산 정책 관리 스키마 (Budget Policy Schema)
export const budgetPolicySchema = z.object({
  category: z.nativeEnum(BudgetCategory),
  unitPrice: z.number()
    .min(0, "단가는 0원 이상이어야 합니다.")
    .max(1000000, "단가는 최대 1,000,000원까지 설정 가능합니다."),
  description: z.string().max(100, "설명은 100자 이내로 입력해주세요.").optional(),
});

export type BudgetPolicyValues = z.infer<typeof budgetPolicySchema>;

// 통계 조회 필터 스키마 (Stats Filter Schema)
export const statsFilterSchema = z.object({
  targetDate: z.date(),
  period: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]),
});

export type StatsFilterValues = z.infer<typeof statsFilterSchema>;

// 결과 데이터 타입 정의
export interface OrganizationStat {
  orgCode: string;
  orgName: string;
  headcount: number;
  plannedBudget: number;
  actualExpense: number;
  ratio: number;
}

// 사원별 상세 통계 (Drill-down 용)
export interface MemberStat {
  employeeCode: string;
  name: string;
  position: string;
  orgName: string;
  plannedBudget: number;
  actualExpense: number;
  remainingBudget: number;
}

// 부서 상세 통계 패키지
export interface TeamDetailStat {
  orgCode: string;
  orgName: string;
  totalPlanned: number;
  totalActual: number;
  totalHeadcount: number;
  members: MemberStat[];
}
