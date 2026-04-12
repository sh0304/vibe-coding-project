import { z } from "zod";

// 결재 종류 Enum
export const ApprovalCategory = {
  LEAVE: "LEAVE",
  EXPENSE: "EXPENSE",
  CERT: "CERT",
} as const;

export type ApprovalCategory = typeof ApprovalCategory[keyof typeof ApprovalCategory];

/**
 * 결재 종류에 따른 한글 레이블 반환
 */
export function getCategoryLabel(category: string | ApprovalCategory): string {
  switch (category) {
    case ApprovalCategory.LEAVE: return "휴가신청";
    case ApprovalCategory.EXPENSE: return "비용청구";
    case ApprovalCategory.CERT: return "증명서발급";
    default: return "일반결재";
  }
}

/**
 * 예산 항목 코드에 따른 한글 레이블 반환
 */
export function getBudgetCategoryLabel(category: string): string {
  switch (category) {
    case "WELFARE": return "복리후생비";
    case "EDUCATION": return "교육훈련비";
    case "ACTIVITY": return "부서활동비";
    default: return category;
  }
}

/**
 * 결재 종류에 따른 테마 반환
 */
export const getCategoryTheme = (category: string, isSelected: boolean) => {
  switch (category) {
    case ApprovalCategory.LEAVE:
      return isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case ApprovalCategory.EXPENSE:
      return isSelected ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600 border-amber-100';
    default:
      return isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

// 결재 전체 상태 Enum
export const ApprovalStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ApprovalStatus = typeof ApprovalStatus[keyof typeof ApprovalStatus];

// 결재 단계 상태 Enum
export const ApprovalStepStatus = {
  WAITING: "WAITING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ApprovalStepStatus = typeof ApprovalStepStatus[keyof typeof ApprovalStepStatus];

// 결재 상신 폼 스키마
export const approvalFormSchema = z.object({
  category: z.nativeEnum(ApprovalCategory, {
    message: "결재 종류를 선택해주세요.",
  }),
  title: z.string()
    .min(2, "제목은 최소 2자 이상이어야 합니다.")
    .max(50, "제목은 최대 50자까지 입력 가능합니다."),
  content: z.string()
    .min(1, "상세 내용을 입력해주세요.")
    .max(500, "상세 내용은 최대 500자까지 입력 가능합니다."),
  // 휴가 관련 필드
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  // 비용 관련 필드
  amount: z.number().int().positive("금액은 0보다 커야 합니다.").optional(),
  budgetCategory: z.string().optional(),
}).refine((data) => {
  if (data.category === ApprovalCategory.LEAVE) {
    return !!data.startDate && !!data.endDate;
  }
  return true;
}, {
  message: "휴가 기간을 입력해주세요.",
  path: ["startDate"],
}).refine((data) => {
  if (data.category === ApprovalCategory.LEAVE && data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "종료일은 시작일보다 빠를 수 없습니다.",
  path: ["endDate"],
}).refine((data) => {
  if (data.category === ApprovalCategory.EXPENSE) {
    return !!data.amount && !!data.budgetCategory;
  }
  return true;
}, {
  message: "비용 항목과 금액을 입력해주세요.",
  path: ["amount"],
});

export type ApprovalFormValues = z.infer<typeof approvalFormSchema>;

// 결재 처리(승인/반려) 스키마
export const approvalActionSchema = z.object({
  approvalId: z.string(),
  stepOrder: z.number(),
  status: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
}).refine((data) => {
  if (data.status === "REJECTED") {
    return !!data.comment && data.comment.length >= 2;
  }
  return true;
}, {
  message: "반려 시에는 반드시 사유를 입력해야 합니다.",
  path: ["comment"],
});

export type ApprovalActionValues = z.infer<typeof approvalActionSchema>;

// ── 도메인 인터페이스 (Domain Interfaces) ──────────────────────────────────────

export interface ApprovalStep {
  id: string;
  approvalId: string;
  stepOrder: number;
  role: string;
  status: ApprovalStepStatus | string;
  approverEmployeeCode?: string | null;
  snapshotApproverName: string;
  snapshotApproverPosition: string;
  comment?: string | null;
  actionAt?: Date | string | null;
}

export interface ApprovalDocument {
  id: string;
  category: ApprovalCategory | string;
  title: string;
  content: string;
  status: ApprovalStatus | string;
  authorEmployeeCode: string;
  snapshotAuthorName: string;
  snapshotOrgName: string;
  snapshotPosition: string;
  snapshotApproverLine?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  amount?: number | null;
  budgetCategory?: string | null;
  createdAt: Date | string;
  steps: ApprovalStep[];
  authorName?: string; // Virtual field for UI
}
