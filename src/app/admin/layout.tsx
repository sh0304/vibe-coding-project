import { requireAdmin } from "@/lib/auth-utils"

/**
 * /admin 경로에 대한 보호 및 관리자 권한 레이아웃.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="flex-1 flex flex-col min-h-0 container mx-auto">
      {children}
    </div>
  )
}
