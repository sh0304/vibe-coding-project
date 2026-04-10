'use client';

import { useState, useEffect, useTransition } from 'react';
import { Organization, Employee } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { OrganizationTree, TreeNode } from './OrganizationTree';
import { getOrganizationSnapshot } from '../history-actions';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HistoryExplorerModal({
  open,
  onOpenChange,
  currentPositions = []
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPositions?: { code: string; name: string; level: number }[];
}) {
  const [targetDate, setTargetDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [snapshotOrgs, setSnapshotOrgs] = useState<Organization[]>([]);
  const [snapshotEmps, setSnapshotEmps] = useState<Employee[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const buildTree = (orgs: any[], emps: any[], parentCode: string | null = null): TreeNode[] => {
    const currentOrgs = orgs.filter((o: any) => {
      if (parentCode === null) {
        return !o.parentCode || o.parentCode === "none";
      }
      return o.parentCode === parentCode;
    }).sort((a: any, b: any) => a.name.localeCompare(b.name));

    return currentOrgs.map((org: any) => {
      const orgEmployees: TreeNode[] = emps
        .filter((e: any) => e.organizationCode === org.code)
        .map((e: any) => {
          const pos = currentPositions.find(p => p.code === (e as any).position);
          return {
            id: e.id,
            code: e.employeeCode,
            name: e.name,
            type: 'employee' as const,
            position: pos?.name || (e as any).position,
            level: pos?.level || 999,
          };
        })
        .sort((a: any, b: any) => (a.level ?? 999) - (b.level ?? 999));

      const subOrgs = buildTree(orgs, emps, org.code);

      return {
        id: org.id,
        code: org.code,
        name: org.name,
        type: 'org' as const,
        children: [...orgEmployees, ...subOrgs],
      };
    });
  };

  useEffect(() => {
    if (!open) return;

    startTransition(async () => {
      setError(null);
      const res = await getOrganizationSnapshot(targetDate);
      if (res.success) {
        setSnapshotOrgs(res.organizations || []);
        setSnapshotEmps(res.employees || []);
      } else {
        setError(res.error || '데이터를 불러오는데 실패했습니다.');
      }
    });
  }, [open, targetDate]);

  const treeData = buildTree(snapshotOrgs, snapshotEmps);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false} // 기본 버튼 대신 커스텀 버튼 사용
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[96vw] max-w-[1000px] h-[90vh] p-0 overflow-hidden flex flex-col bg-white border-none shadow-2xl rounded-3xl"
      >
        <div className="relative px-10 py-8 border-b bg-slate-50/50 z-10 shrink-0 flex flex-col items-start justify-start gap-4">
          {/* 커스텀 닫기 버튼 추가 */}
          <DialogClose className="absolute top-6 right-6 outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1 transition-colors hover:bg-slate-200/50">
            <XIcon className="h-6 w-6 text-slate-500" />
            <span className="sr-only">닫기</span>
          </DialogClose>

          <div className="flex items-center gap-5">
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 leading-none">조직도 이력 조회</DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-2 font-bold">
                {targetDate} 시점의 조직도를 확인합니다.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 shadow-sm">
            <span className="text-xs font-black text-slate-600 pl-2">조회 기준일</span>
            <Input
              type="date"
              className="w-48 h-11 font-mono bg-white border-none rounded-xl focus:ring-0 font-bold text-indigo-600"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden p-2 flex flex-col items-center bg-slate-50/30 relative">
          {error ? (
            <div className="flex-1 w-full flex flex-col items-center justify-center text-red-500 bg-red-50 rounded-3xl border border-red-100 border-dashed">
              <p className="font-black text-lg">데이터 호출 실패</p>
              <p className="font-bold opacity-70">{error}</p>
            </div>
          ) : (
            <div className={`w-full max-w-4xl flex-1 min-h-0 flex flex-col transition-all duration-500 ${isPending ? 'opacity-30 blur-[2px] pointer-events-none' : 'opacity-100'}`}>
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-6 px-6">
                {treeData.length > 0 ? (
                  <OrganizationTree
                    nodes={treeData}
                    onSelect={() => { }}
                    selectedCode=""
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                    <div className="p-5 bg-slate-50 rounded-full">
                      <svg className="h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="font-black text-slate-400">해당 일자의 조직 정보를 찾을 수 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/40 backdrop-blur-sm">
              <div className="px-10 py-5 bg-indigo-600 text-white font-black text-lg rounded-3xl shadow-2xl flex items-center gap-4 animate-bounce">
                <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                LOADING...
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
