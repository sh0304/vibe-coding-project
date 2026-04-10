import { z } from "zod"

/**
 * ── 조직(Organization) 스키마 ──────────────────────────────────────────────────
 */
export const organizationSchema = z.object({
  name: z
    .string()
    .min(2, "부서명은 2자 이상이어야 합니다.")
    .max(20, "부서명은 20자를 초과할 수 없습니다."),
  parentCode: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v === "" || v === "none" ? null : v)),
  applyDate: z.coerce.date().refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: "적용 일자는 과거일 수 없습니다.",
  }),
})

// update 시에는 code가 필요함 (Internal 전용 또는 Form 대응)
export const updateOrganizationSchema = organizationSchema.extend({
  code: z.string().min(1, "부서 코드는 필수입니다."),
})

/**
 * ── 사원(Employee) 스키마 ──────────────────────────────────────────────────────
 */
export const createEmployeeSchema = z.object({
  name: z
    .string()
    .min(2, "이름은 2자 이상이어야 합니다.")
    .max(10, "이름 길이가 너무 깁니다."),
  organizationCode: z.string().min(1, "소속 부서를 선택하세요."),
  positionCode: z.string().min(1, "직급을 선택하세요."),
  applyDate: z.coerce.date(),
})

export const transferEmployeeSchema = z.object({
  employeeCode: z.string().min(1),
  targetOrgCode: z.string().min(1, "이동 대상 부서를 선택하세요."),
  targetPositionCode: z.string().min(1, "변경 직급을 선택하세요."),
  applyDate: z.coerce.date().refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: "과거 날짜로 발령낼 수 없습니다.",
  }),
})

export type OrganizationInput = z.infer<typeof organizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type TransferEmployeeInput = z.infer<typeof transferEmployeeSchema>
