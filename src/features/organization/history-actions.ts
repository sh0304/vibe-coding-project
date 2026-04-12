"use server"

import { prisma } from "@/lib/prisma"

export async function getOrganizationSnapshot(dateStr: string) {
  try {
    // 해당 날짜의 시작 시점(00:00:00)을 기준으로 조회하여 경계값 밀리초 오차 방지
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)

    console.log(`[getOrganizationSnapshot] Querying for date: ${targetDate.toISOString()}`);

    const orgsPromise = prisma.organization.findMany({
      where: {
        validFrom: { lte: targetDate },
        OR: [
          { validTo: null }, 
          { validTo: { gte: targetDate } }
        ],
      },
      orderBy: { validFrom: "desc" },
    })

    const empsPromise = prisma.employee.findMany({
      where: {
        validFrom: { lte: targetDate },
        OR: [
          { validTo: null }, 
          { validTo: { gte: targetDate } }
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
