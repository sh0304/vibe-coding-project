'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { getEmployeeHistory } from '../actions';
import { CalendarDays, Building, Award, ArrowDown, Clock } from 'lucide-react';

interface EmployeeHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeCode: string;
  employeeName: string;
  orgList: { code: string; name: string }[];
  positions: { code: string; name: string }[];
}

export function EmployeeHistoryModal({
  open,
  onOpenChange,
  employeeCode,
  employeeName,
  orgList,
  positions
}: EmployeeHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && employeeCode) {
      console.log(`[EmployeeHistoryModal] Opening for: ${employeeName} (${employeeCode})`);
      startTransition(async () => {
        setError(null);
        const res = await getEmployeeHistory(employeeCode);
        console.log(`[EmployeeHistoryModal] Received history:`, res);
        if (res.success) {
          setHistory(res.history || []);
        } else {
          setError(res.error || '이력을 불러오지 못했습니다.');
        }
      });
    }
  }, [open, employeeCode, employeeName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl min-h-[500px] flex flex-col p-0 overflow-hidden bg-slate-50 border-none shadow-2xl">
        <DialogHeader className="p-8 bg-white border-b shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">{employeeName}님의 이력</DialogTitle>
              <DialogDescription className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">
                사번: {employeeCode}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isPending ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-400">데이터 로딩 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 font-bold">{error}</div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-medium">기록된 이력이 없습니다.</div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-10 py-2">
              {history.map((record, index) => {
                const orgName = orgList.find(o => o.code === record.organizationCode)?.name || record.organizationCode;
                const posName = positions.find(p => p.code === record.position)?.name || record.position;

                return (
                  <div key={record.id} className="relative animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm shadow-slate-400 ${index === 0 ? 'bg-indigo-600 ring-4 ring-indigo-50' : 'bg-slate-300'
                      }`} />

                    <div className={`p-5 rounded-2xl border transition-all hover:shadow-md ${index === 0 ? 'bg-white border-indigo-100 shadow-sm' : 'bg-white border-slate-100'
                      }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(record.validFrom).toLocaleDateString()}
                          {record.validTo ? ` ~ ${new Date(record.validTo).toLocaleDateString()}` : ' ~ 현재'}
                        </div>
                        {index === 0 && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">현재</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-[1.3fr_1fr] gap-4">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">소속 부서</p>
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <Building className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-sm font-bold text-slate-700">{orgName}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">직급</p>
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <Award className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-sm font-bold text-slate-700">{posName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
