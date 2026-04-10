import { prisma } from "@/lib/prisma";

export const OrganizationService = {
  /**
   * 신규 부서를 생성합니다.
   */
  async createOrganization(params: {
    name: string;
    parentCode: string | null;
    applyDate: Date;
  }) {
    const code = `ORG_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return await prisma.organization.create({
      data: {
        code,
        name: params.name,
        parentCode: params.parentCode,
        validFrom: params.applyDate,
        isActive: true,
      },
    });
  },

  /**
   * 부서 정보를 변경합니다 (SCD Type 2: 기존 이력을 닫고 새 이력을 생성)
   */
  async updateHistory(params: {
    code: string;
    name: string;
    parentCode: string | null;
    applyDate: Date;
  }) {
    const { code, name, parentCode, applyDate } = params;

    return await prisma.$transaction(async (tx) => {
      const current = await tx.organization.findFirst({
        where: { code, isActive: true },
      });

      if (!current) throw new Error("활성화된 부서를 찾을 수 없습니다.");
      
      // 날짜 검증
      if (applyDate.getTime() <= current.validFrom.getTime()) {
        throw new Error("적용 일자는 기존 시작일보다 이후여야 합니다.");
      }

      // 1. 기존 기록 종료
      await tx.organization.update({
        where: { id: current.id },
        data: { 
          validTo: applyDate, 
          isActive: false 
        },
      });

      // 2. 새 기록 생성
      return await tx.organization.create({
        data: {
          code,
          name,
          parentCode,
          validFrom: applyDate,
          isActive: true,
        },
      });
    });
  },

  /**
   * 부서를 폐쇄합니다.
   */
  async deleteOrganization(code: string) {
    const current = await prisma.organization.findFirst({
      where: { code, isActive: true },
    });
    
    if (!current) throw new Error("활성화된 부서를 찾을 수 없습니다.");

    return await prisma.organization.update({
      where: { id: current.id },
      data: {
        validTo: new Date(),
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }
};
