import { prisma } from "@/lib/prisma";

export const EmployeeService = {
  /**
   * 신규 사원을 등록하고 로그인 계정(User)을 함께 생성합니다.
   */
  async createEmployee(params: {
    name: string;
    email: string;
    role: "admin" | "user";
    organizationCode: string;
    positionCode: string;
    applyDate: Date;
  }) {
    const employeeCode = `EMP${Math.floor(1000 + Math.random() * 9000)}`;

    return await prisma.$transaction(async (tx) => {
      // 1. Employee 생성
      const employee = await tx.employee.create({
        data: {
          employeeCode,
          name: params.name,
          organizationCode: params.organizationCode,
          position: params.positionCode,
          validFrom: params.applyDate,
          isActive: true,
        },
      });

      // 2. User 생성 (로그인 계정)
      await tx.user.create({
        data: {
          email: params.email,
          password: "password123", // POC용 기본 비밀번호
          name: params.name,
          role: params.role,
          employeeCode: employeeCode,
        },
      });

      return employee;
    });
  },

  /**
   * 인사 발령을 처리합니다 (SCD Type 2)
   */
  async transferEmployee(params: {
    employeeCode: string;
    targetOrgCode: string;
    targetPositionCode: string;
    applyDate: Date;
  }) {
    const { employeeCode, targetOrgCode, targetPositionCode, applyDate } = params;

    return await prisma.$transaction(async (tx) => {
      const current = await tx.employee.findFirst({
        where: { employeeCode, isActive: true },
      });

      if (!current) throw new Error("사원 정보를 찾을 수 없습니다.");
      
      if (applyDate.getTime() <= current.validFrom.getTime()) {
        throw new Error("발령일은 기존 시작일보다 이후여야 합니다.");
      }

      // 1. 기존 이력 종료
      await tx.employee.update({
        where: { id: current.id },
        data: { 
          validTo: applyDate, 
          isActive: false 
        },
      });

      // 2. 새 이력 생성
      return await tx.employee.create({
        data: {
          employeeCode,
          name: current.name,
          organizationCode: targetOrgCode,
          position: targetPositionCode,
          validFrom: applyDate,
          isActive: true,
        },
      });
    });
  }
};
