import { prisma } from '@/lib/prisma';
import { OrganizationManager } from '@/features/organization/components/OrganizationManager';
import { TreeNode } from '@/features/organization/components/OrganizationTree';
import { Badge } from '@/components/ui/badge';
import { Settings, Users } from 'lucide-react';

export default async function AdminOrganizationPage() {
  // 1. 데이터 병렬 로드
  const [orgs, employees, positions] = await Promise.all([
    prisma.organization.findMany({ where: { isActive: true } }),
    prisma.employee.findMany({ where: { isActive: true } }),
    (prisma as any).position.findMany({ where: { isActive: true }, orderBy: { level: 'asc' } }),
  ]);

  // 2. 트리 데이터 조립 (Recursion)
  const buildTree = (parentCode: string | null = null): TreeNode[] => {
    const currentOrgs = orgs.filter((o: any) => o.parentCode === parentCode).sort((a: any, b: any) => a.name.localeCompare(b.name));

    return currentOrgs.map((org: any) => {
      // 해당 부서의 사원들을 가져오고 직급 레벨순(오름차순, 숫자가 작을수록 높음) 정렬
      const orgEmployees: TreeNode[] = employees
        .filter((e: any) => e.organizationCode === org.code)
        .map((e: any) => {
          // positionCode -> position 필드명 동기화
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
        .sort((a: any, b: any) => (a.level ?? 999) - (b.level ?? 999));

      // 하위 부서 재귀 호출
      const subOrgs = buildTree(org.code);

      return {
        id: org.id,
        code: org.code,
        name: org.name,
        type: 'org' as const,
        // 사원을 부서보다 앞에 배치하여 대표/팀장이 항상 먼저 보이게 함
        children: [...orgEmployees, ...subOrgs],
      };
    });
  };

  const treeData = buildTree(null);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50/50">
      <header className="px-10 py-8 bg-white border-b border-slate-100 shrink-0">
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
                <span className="text-xl font-black text-slate-900">{employees.length}</span>
              </div>
            </div>
            <div className="w-px h-10 bg-slate-100 mx-2" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departments</span>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-500" />
                <span className="text-xl font-black text-slate-900">{orgs.length}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 p-8 overflow-hidden">
        <OrganizationManager
          treeData={treeData}
          positions={positions.map((p: any) => ({ code: p.code, name: p.name, level: p.level }))}
          orgList={orgs.map((o: any) => ({ code: o.code, name: o.name }))}
          rawData={{ orgs, employees }}
        />
      </main>
    </div>
  );
}
