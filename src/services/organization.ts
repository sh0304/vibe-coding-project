import { prisma } from "@/lib/prisma";
import { TreeNode } from "@/features/organization/components/OrganizationTree";

export const OrganizationService = {
  /**
   * 전체 조직/사원 트리 데이터를 구성합니다 (공통 로직)
   */
  async getOrganizationTree(): Promise<TreeNode[]> {
    const [orgs, employees, positions] = await Promise.all([
      prisma.organization.findMany({ where: { isActive: true } }),
      prisma.employee.findMany({ where: { isActive: true } }),
      prisma.position.findMany({ where: { isActive: true }, orderBy: { level: 'asc' } }),
    ]);

    const buildTree = (parentCode: string | null = null): TreeNode[] => {
      const currentOrgs = orgs
        .filter((o: any) => o.parentCode === parentCode)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      return currentOrgs.map((org: any) => {
        const orgEmployees: TreeNode[] = employees
          .filter((e: any) => e.organizationCode === org.code)
          .map((e: any) => {
            const pos = positions.find((p: any) => p.code === (e as any).position);
            return {
              id: e.id,
              code: e.employeeCode,
              name: e.name,
              type: 'employee' as const,
              position: pos?.name || '사원',
              level: pos?.level || 999,
            };
          })
          .sort((a: any, b: any) => {
            if (a.level !== b.level) return (a.level ?? 999) - (b.level ?? 999);
            return a.name.localeCompare(b.name);
          });

        const subOrgs = buildTree(org.code);

        return {
          id: org.id,
          code: org.code,
          name: org.name,
          type: 'org' as const,
          children: [...orgEmployees, ...subOrgs],
        };
      });
    };

    return buildTree(null);
  },
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
