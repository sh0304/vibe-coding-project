import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Proxy: 쿠키 존재 여부만 확인하는 빠른 리다이렉트 레이어.
 * 실제 세션 유효성 검증은 Server Component(layout)에서 수행합니다.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /admin 하위 경로는 세션 쿠키가 있어야 접근 가능
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("session_token")
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
