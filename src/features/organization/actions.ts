"use server"

import { revalidatePath } from "next/cache"
import {
  organizationSchema,
  updateOrganizationSchema,
  createEmployeeSchema,
  transferEmployeeSchema,
} from "./schemas"
import { OrganizationService } from "@/services/organization"
import { EmployeeService } from "@/services/employee"
import { prisma } from "@/lib/prisma"
import { ActionResult } from "@/types/action-result"

/**
 * 전용 헬퍼: useActionState와 직접 호출 모두 대응
 */
function getFormData(arg1: unknown, arg2: unknown): FormData {
  return (arg2 instanceof FormData ? arg2 : arg1) as FormData;
}

// ── 부서 관련 액션 ───────────────────────────────────────────────────────────

/**
 * 신규 부서 생성
 */
export async function createOrganization(
  arg1: unknown,
  arg2?: unknown
): Promise<ActionResult> {
  const formData = getFormData(arg1, arg2);
  const rawData = Object.fromEntries(formData.entries())
  const parsed = organizationSchema.safeParse(rawData)

  if (!parsed.success) {
    return {
      success: false,
      error: "입력값을 확인해주세요.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const org = await OrganizationService.createOrganization({
      name: parsed.data.name,
      parentCode: parsed.data.parentCode || null,
      applyDate: parsed.data.applyDate,
    })

    revalidatePath("/admin/organization")
    return { success: true, data: org }
  } catch (e: any) {
    console.error(e)
    return { success: false, error: e.message || "부서 생성 중 오류가 발생했습니다." }
  }
}

/**
 * 조직 개편 (SCD Type 2)
 */
export async function updateOrganizationHistory(
  code: string, // 이 버전은 첫 인자가 code임 (admin-organization 스타일)
  arg1: unknown,
  arg2?: unknown
): Promise<ActionResult> {
  const formData = getFormData(arg1, arg2);
  const rawData = Object.fromEntries(formData.entries())
  const parsed = updateOrganizationSchema.safeParse({ ...rawData, code })

  if (!parsed.success) {
    return {
      success: false,
      error: "입력값을 확인해주세요.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { name, parentCode, applyDate } = parsed.data

  try {
    const result = await OrganizationService.updateHistory({
      code,
      name,
      parentCode: parentCode || null,
      applyDate,
    })

    revalidatePath("/admin/organization")
    return { success: true, data: result }
  } catch (e: any) {
    console.error(e)
    return { success: false, error: e.message || "조직 개편 중 오류가 발생했습니다." }
  }
}

/**
 * 부서 폐쇄
 */
export async function deleteOrganization(code: string): Promise<ActionResult> {
  try {
    await OrganizationService.deleteOrganization(code)
    revalidatePath("/admin/organization")
    return { success: true }
  } catch (e: any) {
    console.error(e)
    return { success: false, error: e.message || "부서 폐쇄 중 오류가 발생했습니다." }
  }
}

// ── 사원 관련 액션 ───────────────────────────────────────────────────────────

/**
 * 신규 사원 등록
 */
export async function createEmployee(
  arg1: unknown,
  arg2?: unknown
): Promise<ActionResult> {
  const formData = getFormData(arg1, arg2);
  const rawData = Object.fromEntries(formData.entries())
  const parsed = createEmployeeSchema.safeParse(rawData)

  if (!parsed.success) {
    return {
      success: false,
      error: "입력값을 확인해주세요.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { name, organizationCode, positionCode, applyDate } = parsed.data

  try {
    const emp = await EmployeeService.createEmployee({
      name,
      organizationCode,
      positionCode,
      applyDate,
    })

    revalidatePath("/admin/organization")
    return { success: true, data: emp }
  } catch (e: any) {
    console.error(e)
    return { success: false, error: e.message || "사원 등록 중 오류가 발생했습니다." }
  }
}

/**
 * 인사 발령 처리 (SCD Type 2)
 */
export async function transferEmployee(
  arg1: unknown,
  arg2?: unknown
): Promise<ActionResult> {
  const formData = getFormData(arg1, arg2);
  const rawData = Object.fromEntries(formData.entries())
  const parsed = transferEmployeeSchema.safeParse(rawData)

  if (!parsed.success) {
    return {
      success: false,
      error: "입력값을 확인해주세요.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { employeeCode, targetOrgCode, targetPositionCode, applyDate } = parsed.data

  try {
    const result = await EmployeeService.transferEmployee({
      employeeCode,
      targetOrgCode,
      targetPositionCode,
      applyDate,
    })

    revalidatePath("/admin/organization")
    return { success: true, data: result }
  } catch (e: any) {
    console.error(e)
    return { success: false, error: e.message || "인사 발령 중 오류가 발생했습니다." }
  }
}

/**
 * 사원 이력 조회
 */
export async function getEmployeeHistory(employeeCode: string) {
  try {
    const history = await prisma.employee.findMany({
      where: { employeeCode },
      orderBy: { validFrom: "desc" },
    })
    return { success: true, history }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: "이력을 불러오는데 실패했습니다." }
  }
}
