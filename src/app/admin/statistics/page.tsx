import { StatisticsConsole } from "@/features/statistics/components/StatisticsConsole";
import { getOrganizationStats, seedBudgetPolicies } from "@/features/statistics/actions";

export default async function StatisticsPage() {
  // 초기 데이터 준비 (간단한 시드 실행)
  await seedBudgetPolicies();

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50/50">
      <header className="px-10 py-8 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between gap-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px]">
              <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
              Analytics Dashboard
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              전사 통계
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <StatisticsConsole />
      </main>
    </div>
  );
}
