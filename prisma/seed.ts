import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding VIBE Company structure with more employees...');

  // 1. Positions (직급)
  const positions = [
    { code: 'POS_STAFF', name: '사원', level: 60, approvalGroup: 'GENERAL' },
    { code: 'POS_ASSOCIATE', name: '대리', level: 40, approvalGroup: 'GENERAL' },
    { code: 'POS_TEAM_LEAD', name: '팀장', level: 20, approvalGroup: 'TEAM_LEAD' },
    { code: 'POS_DEPT_HEAD', name: '본부장', level: 10, approvalGroup: 'DEPT_HEAD' },
    { code: 'POS_EXEC', name: '대표이사', level: 5, approvalGroup: 'EXEC' },
  ];

  for (const pos of positions) {
    // Prisma Client가 동기화되지 않았을 경우를 대비해 any 캐스팅 활용
    await (prisma as any).position.upsert({
      where: { code: pos.code },
      update: pos,
      create: pos,
    });
  }

  // 2. Organizations (부서)
  const organizations = [
    { code: 'ORG_ROOT', name: '(주)VIBE', parentCode: null },
    { code: 'ORG_DEV_DEPT', name: '개발본부', parentCode: 'ORG_ROOT' },
    { code: 'ORG_FE_TEAM', name: '프론트엔드팀', parentCode: 'ORG_DEV_DEPT' },
    { code: 'ORG_BE_TEAM', name: '백엔드팀', parentCode: 'ORG_DEV_DEPT' },
    { code: 'ORG_QA_TEAM', name: '품질관리팀', parentCode: 'ORG_DEV_DEPT' },
    { code: 'ORG_HR_TEAM', name: '인사팀', parentCode: 'ORG_ROOT' },
  ];

  for (const org of organizations) {
    await prisma.organization.upsert({
      where: { id: org.code },
      update: {
        name: org.name,
        parentCode: org.parentCode === 'none' ? null : org.parentCode,
        isActive: true,
      },
      create: {
        ...org,
        id: org.code,
        isActive: true,
      },
    });
  }

  // 3. Employees & Users
  const employees = [
    // 최상위 (회사 직속)
    { employeeCode: 'EMP001', name: '김대표', organizationCode: 'ORG_ROOT', position: 'POS_EXEC', email: 'admin@company.com', role: 'admin' },

    // 개발본부
    { employeeCode: 'EMP_HEAD', name: '홍본부', organizationCode: 'ORG_DEV_DEPT', position: 'POS_DEPT_HEAD', email: 'head@company.com', role: 'user' },

    // 프론트엔드팀
    { employeeCode: 'EMP_LEAD', name: '이팀장', organizationCode: 'ORG_FE_TEAM', position: 'POS_TEAM_LEAD', email: 'lead1@company.com', role: 'user' },
    { employeeCode: 'EMP_STAFF1', name: '김사원', organizationCode: 'ORG_FE_TEAM', position: 'POS_STAFF', email: 'user1@company.com', role: 'user' },
    { employeeCode: 'EMP_STAFF2', name: '이사원', organizationCode: 'ORG_FE_TEAM', position: 'POS_STAFF', email: 'user2@company.com', role: 'user' },

    // 백엔드팀
    { employeeCode: 'EMP_BE_LEAD', name: '최백엔', organizationCode: 'ORG_BE_TEAM', position: 'POS_TEAM_LEAD', email: 'lead2@company.com', role: 'user' },
    { employeeCode: 'EMP_BE_STAFF1', name: '정백엔', organizationCode: 'ORG_BE_TEAM', position: 'POS_STAFF', email: 'user3@company.com', role: 'user' },

    // 인사팀
    { employeeCode: 'EMP_HR_LEAD', name: '박인사', organizationCode: 'ORG_HR_TEAM', position: 'POS_TEAM_LEAD', email: 'lead3@company.com', role: 'user' },
    { employeeCode: 'EMP_HR_STAFF1', name: '차인사', organizationCode: 'ORG_HR_TEAM', position: 'POS_STAFF', email: 'user4@company.com', role: 'user' },
  ];

  for (const emp of employees) {
    // Employee 조회 (SCD 이므로 isActive인 것 기준)
    const existingEmp = await prisma.employee.findFirst({
      where: { employeeCode: emp.employeeCode, isActive: true }
    });

    if (!existingEmp) {
      await prisma.employee.create({
        data: {
          employeeCode: emp.employeeCode,
          name: emp.name,
          organizationCode: emp.organizationCode,
          position: emp.position,
          isActive: true,
          validFrom: new Date('2026-01-01'),
        },
      });
    } else {
      // 기존 사원이 다른 소속/직급이라면 업데이트 (테스트 환경 동기화)
      await prisma.employee.update({
        where: { id: existingEmp.id },
        data: {
          organizationCode: emp.organizationCode,
          position: emp.position,
          name: emp.name // 이름도 혹시 모르니 동기화
        }
      });
    }

    // User 중복 방지 (employeeCode 기반 식별로 이메일 변경 허용)
    const userWhere = emp.employeeCode 
      ? { employeeCode: emp.employeeCode } 
      : { email: emp.email };

    await prisma.user.upsert({
      where: userWhere as any,
      update: {
        email: emp.email,
        name: emp.name,
        role: emp.role,
      },
      create: {
        email: emp.email,
        password: emp.email === 'admin@company.com' ? 'admin123' : 'password123',
        name: emp.name,
        role: emp.role,
        employeeCode: emp.employeeCode,
      }
    });
  }

  // 4. Historical Data for History Explorer Testing (SCD Type 2 Mockups)
  console.log('📜 Adding historical records for history explorer testing...');

  // 과거 데이터: 김사원 (EMP_STAFF1)의 이전 기록 (인사팀 소속이었음)
  // 기존 레코드 검색해서 중복 방지
  const oldEmp1 = await prisma.employee.findFirst({
    where: { employeeCode: 'EMP_STAFF1', organizationCode: 'ORG_HR_TEAM' }
  });
  if (!oldEmp1) {
    await prisma.employee.create({
      data: {
        employeeCode: 'EMP_STAFF1',
        name: '김사원',
        organizationCode: 'ORG_HR_TEAM',
        position: 'POS_STAFF',
        isActive: false,
        validFrom: new Date('2025-01-01'),
        validTo: new Date('2025-12-31'),
      }
    });
  }

  // 과거 데이터: 프론트엔드팀 (ORG_FE_TEAM)의 이전 이름 (웹개발팀)
  const oldOrg1 = await prisma.organization.findFirst({
    where: { code: 'ORG_FE_TEAM', isActive: false }
  });
  if (!oldOrg1) {
    await prisma.organization.create({
      data: {
        id: 'ORG_FE_TEAM_OLD', // ID는 유니크해야 함 (SCD의 경우 보통 UUID나 별도 키)
        code: 'ORG_FE_TEAM',
        name: '웹개발팀',
        parentCode: 'ORG_DEV_DEPT',
        isActive: false,
        validFrom: new Date('2025-01-01'),
        validTo: new Date('2025-12-31'),
      }
    });
  }

  // 과거 데이터: 정백엔 (EMP_BE_STAFF1)이 작년에는 사원이 아닌 대리였다는 컨셉 등
  const oldEmp2 = await prisma.employee.findFirst({
    where: { employeeCode: 'EMP_BE_STAFF1', position: 'POS_ASSOCIATE' }
  });
  if (!oldEmp2) {
    await prisma.employee.create({
      data: {
        employeeCode: 'EMP_BE_STAFF1',
        name: '정백엔',
        organizationCode: 'ORG_BE_TEAM',
        position: 'POS_ASSOCIATE',
        isActive: false,
        validFrom: new Date('2025-01-01'),
        validTo: new Date('2025-06-30'),
      }
    });
  }

  console.log('✅ Seeding completed with staff members and history.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
