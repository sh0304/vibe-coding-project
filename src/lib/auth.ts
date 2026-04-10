import { prisma } from "./prisma"
import { cookies } from "next/headers"
import { encrypt, decrypt } from "./session-utils" // We will create this

/**
 * 단순 세션 관리 로직.
 * 쿠키에서 세션 토큰을 읽어 사용자 정보를 반환합니다.
 */
export const auth = {
  api: {
    getSession: async (options?: { headers?: Headers }) => {
      // Server-side only for now
      const cookieStore = await cookies()
      const sessionToken = cookieStore.get("session_token")?.value

      if (!sessionToken) return null

      try {
        const payload = await decrypt(sessionToken)
        if (!payload || !payload.userId) return null

        const user = await prisma.user.findUnique({
          where: { id: payload.userId as string },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            employeeCode: true,
          },
        })

        if (!user) return null

        return {
          user: {
            ...user,
            id: user.id,
          },
          session: {
            id: sessionToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // Dummy
          }
        } as any
      } catch (e) {
        return null
      }
    }
  }
}
