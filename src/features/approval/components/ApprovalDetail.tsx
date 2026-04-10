"use client";

import { useState, useTransition } from "react";
import { differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";
import { 
  ApprovalCategory,
  ApprovalStatus, 
  ApprovalStepStatus,
  ApprovalDocument,
  ApprovalStep,
  getCategoryLabel,
  getBudgetCategoryLabel
} from "../schemas";
import { processApprovalStep } from "../actions";
import { ApprovalStatusBadge } from "./ApprovalStatusBadge";
import { ApprovalStepIcon } from "./ApprovalStepIcon";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  User, 
  Building, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  ArrowLeft,
  FileSpreadsheet
} from "lucide-react";

interface ApprovalDetailProps {
  approval: ApprovalDocument;
  currentEmployeeCode: string;
}

export function ApprovalDetail({ approval, currentEmployeeCode }: ApprovalDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 현재 사용자가 결재할 수 있는 단계인지 확인
  const currentActingStep = approval.steps.find((s: ApprovalStep) => 
    s.status === ApprovalStepStatus.WAITING && 
    s.approverEmployeeCode === currentEmployeeCode
  );

  // 이전 단계들이 모두 승인되었는지 확인 (순서대로 결재)
  const isMyTurn = currentActingStep && 
    approval.steps
      .filter((s: ApprovalStep) => s.stepOrder < currentActingStep.stepOrder)
      .every((s: ApprovalStep) => s.status === ApprovalStepStatus.APPROVED);

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    if (!currentActingStep) return;
    setError(null);

    if (status === "REJECTED" && (!comment || comment.length < 2)) {
      setError("반려 시에는 반드시 사유를 입력해야 합니다.");
      return;
    }

    startTransition(async () => {
      const res = await processApprovalStep({
        approvalId: approval.id,
        stepOrder: currentActingStep.stepOrder,
        status,
        comment
      });

      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "처리에 실패했습니다.");
      }
    });
  };


  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      {/* 액션바 */}
      <div className="flex items-center justify-between sticky top-4 z-20 bg-white/60 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-xl shadow-slate-200/50">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl hover:bg-slate-100 font-bold gap-2 text-slate-600">
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </Button>
        <div className="flex items-center gap-3">
          <ApprovalStatusBadge status={approval.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽: 문서 내용 */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-100 font-bold">
                      {getCategoryLabel(approval.category)}
                    </Badge>
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(approval.createdAt).toLocaleString()} 상신
                    </span>
                  </div>
                  <CardTitle className="text-3xl font-black text-slate-900 leading-tight">
                    {approval.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* 항목별 핵심 정보 (휴가기간/비용내역) - 상단 배치 */}
              {approval.category === ApprovalCategory.LEAVE && (
                <div className="flex items-center gap-6 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 animate-in slide-in-from-top-2 duration-500">
                  <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1">Leave Period</p>
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-black text-slate-900">
                        {approval.startDate ? new Date(approval.startDate).toLocaleDateString() : '-'} ~ {approval.endDate ? new Date(approval.endDate).toLocaleDateString() : '-'}
                      </p>
                      {approval.startDate && approval.endDate && (
                        <Badge className="bg-indigo-100 text-indigo-600 border-none font-black px-2 py-0.5 rounded-lg text-[11px]">
                          {differenceInDays(new Date(approval.endDate), new Date(approval.startDate)) + 1}일
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {approval.category === ApprovalCategory.EXPENSE && (
                <div className="relative overflow-hidden group animate-in slide-in-from-top-2 duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/10 rounded-3xl" />
                  <div className="relative flex items-center gap-6 p-7 bg-white/40 backdrop-blur-sm rounded-3xl border border-amber-100 shadow-sm transition-all hover:shadow-md">
                    <div className="h-16 w-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 transition-transform group-hover:scale-110 duration-500">
                      <FileSpreadsheet className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Expenses Category</p>
                        <p className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {approval.budgetCategory ? getBudgetCategoryLabel(approval.budgetCategory) : '기타 항목'}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Statement of Amount</p>
                        <p className="text-2xl font-black text-indigo-600 tracking-tight">
                          {approval.amount?.toLocaleString()} <span className="text-sm text-slate-400 font-bold ml-0.5">KRW</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 기안자 정보 (Snapshot) */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <User className="h-20 w-20" />
                </div>
                <div className="flex items-center gap-2 mb-6 text-slate-800">
                  <div className="h-4 w-1 bg-indigo-600 rounded-full" />
                  <h4 className="font-black text-sm uppercase tracking-wider">기안자 정보 (Snapshot)</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">이름</p>
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="h-4 w-4 opacity-40" />
                      <span className="font-black tracking-tight">{approval.snapshotAuthorName}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">소속</p>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building className="h-4 w-4 opacity-40" />
                      <span className="font-black tracking-tight">{approval.snapshotOrgName}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">직급</p>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Award className="h-4 w-4 opacity-40" />
                      <span className="font-black tracking-tight">{approval.snapshotPosition}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-6 flex items-center gap-1.5 font-bold italic">
                  <AlertTriangle className="h-3 w-3" /> 결재 상신 시점의 데이터로 박제되었습니다.
                </p>
              </div>

              {/* 문서 본문 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800">
                  <div className="h-4 w-1 bg-indigo-600 rounded-full" />
                  <h4 className="font-black text-sm uppercase tracking-wider">상세 내용</h4>
                </div>
                <div className="min-h-[200px] p-8 bg-white rounded-3xl border border-slate-100 shadow-inner whitespace-pre-wrap leading-relaxed text-slate-700 font-medium">
                  {approval.content}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽: 결재선 현황 및 처리 */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-3xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="p-8 bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">결재 진행 현황</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              {approval.steps.map((step: ApprovalStep, idx: number) => (
                <div key={idx} className="relative group">
                  {idx < approval.steps.length - 1 && (
                    <div className="absolute left-6 top-14 bottom-[-40px] w-0.5 bg-slate-800 group-last:hidden" />
                  )}
                  
                  <div className="flex items-start gap-5">
                    <div className={`z-10 flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-all duration-500 scale-100 group-hover:scale-110 ${
                      step.status === 'APPROVED' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 
                      step.status === 'REJECTED' ? 'bg-red-500 shadow-lg shadow-red-500/30' : 
                      step.status === 'WAITING' && idx === approval.steps.findIndex((s:any) => s.status === 'WAITING') ? 
                      'bg-indigo-500 animate-pulse' : 'bg-slate-800'
                    }`}>
                      {step.status === 'APPROVED' ? <CheckCircle2 className="h-6 w-6" /> : 
                       step.status === 'REJECTED' ? <XCircle className="h-6 w-6" /> : 
                       <Clock className="h-6 w-6 opacity-40" />}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{idx + 1}차 결재</p>
                        {step.actionAt && (
                          <span className="text-[10px] text-slate-500">{new Date(step.actionAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black">{step.snapshotApproverName}</span>
                        <Badge variant="outline" className="text-[9px] font-bold border-slate-700 text-slate-400 capitalize whitespace-nowrap">
                          {step.snapshotApproverPosition}
                        </Badge>
                      </div>
                      {step.comment && (
                        <div className="mt-3 p-3 bg-slate-800 rounded-xl text-xs text-slate-300 italic border-l-2 border-slate-600">
                          "{step.comment}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 결재 처리 UI (내 차례일 때만 노출) */}
          {isMyTurn && (
            <Card className="border-2 border-indigo-600 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-500">
              <CardHeader className="bg-indigo-600 p-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-white" />
                  <CardTitle className="text-white text-lg font-bold">결재 처리</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="comment" className="text-sm font-bold text-slate-700 ml-1">결제 의견 (반려 시 필수)</Label>
                  <Textarea
                    id="comment"
                    placeholder="승인 또는 반려 의견을 입력하세요"
                    className="min-h-[100px] rounded-2xl bg-slate-50 border-slate-200 focus:ring-indigo-600 p-4"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  {error && <p className="text-xs text-red-500 font-bold ml-1">{error}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl text-red-600 border-red-100 hover:bg-red-50 font-black"
                    onClick={() => handleAction("REJECTED")}
                    disabled={isPending}
                  >
                    반려 처리
                  </Button>
                  <Button
                    className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100"
                    onClick={() => handleAction("APPROVED")}
                    disabled={isPending}
                  >
                    {isPending ? "처리 중..." : "최종 승인"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// 아이콘 임포트 보강
import { ShieldCheck } from "lucide-react";
