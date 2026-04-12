import { prisma } from '@/lib/prisma';
import { OrganizationManager } from '@/features/organization/components/OrganizationManager';
import { OrganizationService } from '@/services/organization';
import { Users, Settings } from 'lucide-react';

export default async function AdminOrganizationPage() {
  // 1. 공통 도메인 서비스를 통한 트리 데이터 및 기초 데이터 로드
  const [treeData, orgs, employees, positions] = await Promise.all([
    OrganizationService.getOrganizationTree(),
    prisma.organization.findMany({ where: { isActive: true } }),
    prisma.employee.findMany({ where: { isActive: true } }),
    (prisma as any).position.findMany({ where: { isActive: true }, orderBy: { level: 'asc' } }),
  ]);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50/50">
      <header className="bg-white border-b border-slate-100 shrink-0">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-8">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px]">
                <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
                Admin Management
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                조직도 관리
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Count</span>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  <span className="text-xl font-black text-slate-900">{employees.length}명</span>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-100 mx-2" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departments</span>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-indigo-500" />
                  <span className="text-xl font-black text-slate-900">{orgs.length}개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 overflow-hidden min-h-0 flex flex-col">
        <div className="flex-1 flex flex-col min-h-0 container mx-auto p-6">
          <OrganizationManager
            treeData={treeData}
            positions={positions.map((p: any) => ({ code: p.code, name: p.name, level: p.level }))}
            orgList={orgs.map((o: any) => ({ code: o.code, name: o.name }))}
            rawData={{ orgs, employees }}
          />
        </div>
      </main>
    </div>
  );
}
