import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    where: {
      name: { in: ["김사원", "이팀장", "최백엔"] },
      isActive: true
    }
  });

  console.log("=== Employee Data Check ===");
  employees.forEach(e => {
    console.log(`[${e.name}] Code: ${e.employeeCode}, Org: ${e.organizationCode}, Position: ${(e as any).position}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
