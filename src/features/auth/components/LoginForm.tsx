"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

// Re-using UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Importing a manual sign-in action we will create
import { manualSignIn } from "@/features/auth/actions"

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    startTransition(async () => {
      const result = await manualSignIn(email, password)

      if (result.success) {
        router.push("/admin/organization")
        router.refresh()
      } else {
        setError(result.error || "로그인에 실패했습니다.")
      }
    })
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-md rounded-[2rem] overflow-hidden">
      <CardHeader className="space-y-4 text-center pt-12 pb-8 px-10">
        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-xl ring-4 ring-slate-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-white"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-black tracking-tight text-slate-900">
            HR 시스템
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            조직 및 인사 관리 시스템에 로그인하세요
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-10 pb-12 pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="login-email" className="text-sm font-bold text-slate-700 ml-1">
              이메일
            </Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@company.com"
              className="h-12 rounded-xl border-slate-200 bg-slate-50/50 transition-all focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="login-password" className="text-sm font-bold text-slate-700 ml-1">
              비밀번호
            </Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-12 rounded-xl border-slate-200 bg-slate-50/50 transition-all focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 font-semibold text-white shadow-lg transition-all hover:from-slate-700 hover:to-slate-600 hover:shadow-xl disabled:opacity-60"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                로그인 중...
              </span>
            ) : (
              "로그인"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
