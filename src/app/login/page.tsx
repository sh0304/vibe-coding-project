import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { LoginForm } from "@/features/auth/components/LoginForm"

export const metadata: Metadata = {
  title: "로그인 | HR System",
  description: "조직 및 인사 관리 시스템 로그인",
}

export default async function LoginPage() {
  // 이미 로그인된 사용자는 메인 페이지로 리다이렉트
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/admin/organization")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 px-4">
      {/* 배경 장식 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-100/40 to-indigo-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-slate-100/40 to-gray-200/40 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <LoginForm />

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} HR System — 이력 관리 시스템
        </p>
      </div>
    </div>
  )
}
