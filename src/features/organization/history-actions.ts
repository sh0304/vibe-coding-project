"use server"

import { prisma } from "@/lib/prisma"

export async function getOrganizationSnapshot(dateStr: string) {
  try {
    // 00:00:00 대신 해당 날짜의 끝(23:59:59)까지 포함하도록 설정
    const targetDate = new Date(dateStr)
    targetDate.setHours(23, 59, 59, 999)

    console.log(`[getOrganizationSnapshot] Querying for date: ${targetDate.toISOString()}`);

    const orgsPromise = prisma.organization.findMany({
      where: {
        validFrom: { lte: targetDate },
        OR: [
          { validTo: null }, 
          { validTo: { gt: targetDate } }
        ],
      },
      orderBy: { validFrom: "desc" },
    })

    const empsPromise = prisma.employee.findMany({
      where: {
        validFrom: { lte: targetDate },
        OR: [
          { validTo: null }, 
          { validTo: { gt: targetDate } }
        ],
      },
      orderBy: { name: "asc" },
    })

    const [organizations, employees] = await Promise.all([orgsPromise, empsPromise])

    console.log(`[getOrganizationSnapshot] Found ${organizations.length} orgs and ${employees.length} emps`);

    return {
      success: true,
      organizations,
      employees,
    }
  } catch (error) {
    console.error("Failed to fetch history snapshot:", error)
    return { success: false, error: "과거 스냅샷을 불러오는데 실패했습니다." }
  }
}
