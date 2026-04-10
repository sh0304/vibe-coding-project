"use server"

import { prisma } from "@/lib/prisma"
import { setSession, clearSession } from "@/lib/session-utils"

/**
 * 직접 구현한 로그인 Server Action.
 */
export async function manualSignIn(email: string, password: unknown) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return { success: false, error: "사용자를 찾을 수 없습니다." }
    }

    // 보안상 실제로는 bcrypt 등으로 해싱 검증해야 하지만, POC를 위해 단순 비교
    // (시딩 시에도 평문으로 저장한다고 가정)
    if (user.password !== password) {
      return { success: false, error: "비밀번호가 일치하지 않습니다." }
    }

    // 세션 쿠키 설정
    await setSession(user.id)

    return { success: true }
  } catch (e) {
    console.error("Login error:", e)
    return { success: false, error: "서버 오류가 발생했습니다." }
  }
}

/**
 * 로그아웃 Server Action.
 */
export async function manualSignOut() {
  await clearSession()
  return { success: true }
}
