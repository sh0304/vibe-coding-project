"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { 
  approvalFormSchema, 
  approvalActionSchema
} from "./schemas";
import { ApprovalService, ApproverInfo } from "@/services/approval";
import { ActionResult } from "@/types/action-result";

/**
 * 기안자의 직급과 부서에 따른 결재선을 미리 조회합니다.
 * (UI 미리보기용)
 */
export async function getApprovalLine(employeeCode: string): Promise<ActionResult<ApproverInfo[]>> {
  try {
    const line = await ApprovalService.getApprovalLine(employeeCode);
    return { success: true, data: line };
  } catch (error: any) {
    console.error("Failed to get approval line:", error);
    return { success: false, error: error.message || "결재선을 불러오지 못했습니다." };
  }
}

/**
 * 결재 상신 처리
 */
export async function submitApproval(formData: any): Promise<ActionResult<{ id: string }>> {
  const session = await auth.api.getSession();
  if (!session?.user?.employeeCode) return { success: false, error: "인증 정보가 없습니다." };

  const parsed = approvalFormSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: "입력값이 유효하지 않습니다." };

  try {
    const doc = await ApprovalService.submitWithTransaction({
      ...parsed.data,
      authorCode: session.user.employeeCode,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    });

    revalidatePath("/approval");
    return { success: true, data: { id: doc.id } };
  } catch (error: any) {
    console.error("Approval submission failed:", error);
    return { success: false, error: error.message || "결재 상신 중 오류가 발생했습니다." };
  }
}

/**
 * 결재자가 결재를 승인 또는 반려합니다.
 */
export async function processApprovalStep(formData: any): Promise<ActionResult<null>> {
  const session = await auth.api.getSession();
  const employeeCode = session?.user?.employeeCode;
  
  if (!employeeCode) return { success: false, error: "인증 정보가 없습니다." };

  const parsed = approvalActionSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { approvalId, stepOrder, status, comment } = parsed.data;

  try {
    await ApprovalService.processStep({
      approvalId,
      stepOrder,
      employeeCode,
      status,
      comment
    });

    revalidatePath("/approval");
    revalidatePath(`/approval/${approvalId}`);
    return { success: true, data: null };
  } catch (error: any) {
    console.error("Approval processing failed:", error);
    return { success: false, error: error.message || "결재 처리 중 오류가 발생했습니다." };
  }
}
