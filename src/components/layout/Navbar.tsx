"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { manualSignOut } from "@/features/auth/actions"

export function Navbar({ session }: { session: any }) {
  const pathname = usePathname()

  // 로그인 페이지에서는 네비게이션 바를 숨김
  if (pathname === "/login") return null

  const navItems = [
    { label: session?.user?.role === "admin" ? "결재 관리" : "결재 센터", href: "/approval" },
  ]

  // 관리자 전용 메뉴
  if (session?.user?.role === "admin") {
    navItems.unshift({ label: "전사 통계", href: "/admin/statistics" })
    navItems.unshift({ label: "조직도 관리", href: "/admin/organization" })
  }

  const handleSignOut = async () => {
    await manualSignOut()
    window.location.href = "/login"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              VIBE HR
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="hidden flex items-end sm:flex gap-1">
                <span className="text-sm font-semibold text-slate-900">
                  {session.user.name}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] h-4 uppercase ${session.user.role === "admin"
                    ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                    }`}
                >
                  {session.user.role}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-red-600 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mr-2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                로그아웃
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-slate-900">로그인</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
