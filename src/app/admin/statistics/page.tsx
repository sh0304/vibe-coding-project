import { prisma } from "@/lib/prisma";
import { StatisticsConsole } from "@/features/statistics/components/StatisticsConsole";
import { seedBudgetPolicies } from "@/features/statistics/actions";
import { OrganizationService } from "@/services/organization";

export default async function StatisticsPage() {
  // 1. 초기 데이터 준비 (예산 정책 시드)
  await seedBudgetPolicies();

  // 2. 공통 도메인 서비스를 통한 트리 데이터 조회
  const treeData = await OrganizationService.getOrganizationTree();

  // 3. 통계 대시보드에서 추가로 필요한 원본 데이터 (Raw Data) 로드
  const [orgs, employees] = await Promise.all([
    prisma.organization.findMany({ where: { isActive: true } }),
    prisma.employee.findMany({ where: { isActive: true } }),
  ]);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50/50">
      <header className="px-10 py-6 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between gap-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px]">
              <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
              Analytics Dashboard
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              전사 통계 분석
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden min-h-0">
        <StatisticsConsole 
          treeData={treeData} 
          rawData={{ orgs, employees }} 
        />
      </main>
    </div>
  );
}
