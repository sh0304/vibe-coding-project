import { auth } from "./auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

/**
 * 인증된 사용자의 세션을 반환합니다.
 * 인증되지 않은 경우 /login으로 리다이렉트합니다.
 */
export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  return session
}

/**
 * 어드민 권한을 가진 사용자의 세션을 반환합니다.
 * 권한이 없거나 미인증 시 적절한 페이지로 리다이렉트합니다.
 */
export async function requireAdmin() {
  const session = await requireAuth()

  if (session.user.role !== "admin") {
    // 권한이 없는 경우 홈으로 리다이렉트 (추후 403 페이지로 대체 가능)
    redirect("/")
  }

  return session
}
