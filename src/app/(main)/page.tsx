import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

/**
 * 루트 페이지 — 세션 유무에 따라 적절한 페이지로 리다이렉트합니다.
 * - 로그인된 경우: /admin/organization
 * - 미로그인: /login
 */
export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    // 관리자는 조직 관리로, 일반 사용자는 결재 센터로 리다이렉트
    if (session.user.role === "admin") {
      redirect("/admin/organization")
    } else {
      redirect("/approval")
    }
  }

  redirect("/login")
}
