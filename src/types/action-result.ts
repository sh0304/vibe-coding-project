/**
 * Server Action의 표준 응답 구조
 */
export type ActionResult<T = any> =
  | { success: true; data?: T; error?: never; fieldErrors?: never }
  | { success: false; error: string; fieldErrors?: Record<string, string[]>; data?: never }
