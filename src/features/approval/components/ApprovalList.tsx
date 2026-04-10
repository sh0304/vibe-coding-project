"use client";

import Link from "next/link";
import { 
  ApprovalCategory,
  ApprovalStatus, 
  ApprovalStepStatus,
  getBudgetCategoryLabel
} from "../schemas";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PlayCircle, 
  ArrowRight,
  ChevronRight,
  Calendar
} from "lucide-react";

interface ApprovalListProps {
  approvals: any[];
  title: string;
}

export function ApprovalList({ approvals, title }: ApprovalListProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case ApprovalStatus.PENDING:
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200">대기 중</Badge>;
      case ApprovalStatus.IN_PROGRESS:
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">진행 중</Badge>;
      case ApprovalStatus.APPROVED:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 text-xs">승인 완료</Badge>;
      case ApprovalStatus.REJECTED:
        return <Badge className="bg-red-50 text-red-700 border-red-100 hover:bg-red-50 text-xs">반려됨</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case ApprovalStepStatus.APPROVED:
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case ApprovalStepStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case ApprovalStepStatus.WAITING:
        return <Clock className="h-4 w-4 text-slate-300" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-slate-200" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
          <div className="h-6 w-1 bg-indigo-600 rounded-full" />
          {title}
        </h2>
        <span className="text-sm font-bold text-slate-400">총 {approvals.length}건</span>
      </div>

      {approvals.length === 0 ? (
        <Card className="border-none shadow-sm bg-slate-50 rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <div className="p-4 bg-white rounded-full shadow-sm">
              <FileText className="h-10 w-10 opacity-20" />
            </div>
            <p className="font-bold">표시할 결재 문서가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {approvals.map((item) => (
            <Link key={item.id} href={`/approval/${item.id}`} className="group">
              <Card className="border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-500 rounded-3xl overflow-hidden bg-white hover:bg-indigo-50/10">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center">
                    {/* 상단/좌측 정보 */}
                    <div className="flex-1 p-6 md:p-8 space-y-4">
                      <div className="flex items-center gap-3 mb-1">
                        {getStatusBadge(item.status)}
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()} 상신
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium line-clamp-1 opacity-70">
                          {item.content}
                        </p>
                      </div>

                      {item.category === ApprovalCategory.LEAVE && item.startDate && (
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50/50 w-fit px-3 py-1.5 rounded-lg border border-indigo-100">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(item.startDate).toLocaleDateString()} ~ {new Date(item.endDate).toLocaleDateString()}
                        </div>
                      )}

                      {item.category === ApprovalCategory.EXPENSE && item.amount && (
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50/50 w-fit px-3 py-1.5 rounded-lg border border-amber-100">
                          <PlayCircle className="h-3.5 w-3.5" />
                          {item.budgetCategory ? getBudgetCategoryLabel(item.budgetCategory) : '기타 항목'}
                          <span className="mx-1 text-slate-300">|</span>
                          {item.amount.toLocaleString()}원
                        </div>
                      )}
                    </div>

                    {/* 우측 진행 단게 스텝퍼 (Snapshot 데이터 기반) */}
                    <div className="bg-slate-50/50 md:bg-transparent border-t md:border-t-0 md:border-l border-slate-100 p-6 md:p-8 md:w-80 shrink-0">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <PlayCircle className="h-3 w-3" />
                          Current Progress
                        </p>
                        
                        <div className="flex items-center gap-2">
                          {item.steps.map((step: any, idx: number) => (
                            <div key={step.id} className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {getStepIcon(step.status)}
                                  <span className={`text-[11px] font-bold truncate ${
                                    step.status === 'APPROVED' ? 'text-emerald-600' : 'text-slate-500'
                                  }`}>
                                    {step.snapshotApproverName}
                                  </span>
                                </div>
                                <div className={`h-1 w-full rounded-full ${
                                  step.status === 'APPROVED' ? 'bg-emerald-500' : 
                                  step.status === 'REJECTED' ? 'bg-red-500' : 'bg-slate-200'
                                }`} />
                              </div>
                              {idx < item.steps.length - 1 && (
                                <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-end pt-2">
                          <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            문서 보기 <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// 명칭 중복 방지를 위한 아이콘 임포트
import { FileText } from "lucide-react";
