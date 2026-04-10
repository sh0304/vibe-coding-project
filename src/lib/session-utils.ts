import { cookies } from "next/headers"

// Simple mock for encryption/decryption (In production, use something like jose or iron-session)
export async function encrypt(payload: any) {
  return Buffer.from(JSON.stringify(payload)).toString("base64")
}

export async function decrypt(token: string) {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"))
  } catch (e) {
    return null
  }
}

export async function setSession(userId: string) {
  const token = await encrypt({ userId })
  const cookieStore = await cookies()
  cookieStore.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session_token")
}
