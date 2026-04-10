"use client";

import { useState, useTransition, useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  FileText,
  ChevronRight,
  User,
  Calendar,
  Building2,
  ListTodo,
  FileSpreadsheet,
  Loader2,
  Check,
  Ban,
  MessageSquare
} from "lucide-react";
import { 
  ApprovalCategory,
  ApprovalStatus, 
  ApprovalStepStatus, 
  getCategoryLabel, 
  getCategoryTheme,
  getBudgetCategoryLabel,
  ApprovalDocument,
  ApprovalStep
} from "../schemas";
import { processApprovalStep } from "../actions";
import { useRouter } from 'next/navigation';
import { NewApprovalModal } from './NewApprovalModal';
import { DocumentList } from './DocumentList';
import { ApprovalStatusBadge } from './ApprovalStatusBadge';
import { ApprovalStepIcon } from './ApprovalStepIcon';

interface ApprovalConsoleProps {
  toApprove: ApprovalDocument[];
  myRequests: ApprovalDocument[];
  isAdmin: boolean;
  currentUserCode: string;
}

/**
 * 결재 시스템의 메인 콘솔 화면
 * 좌측은 문서 목록, 우측은 선택된 문서의 상세 정보 및 액션 패널로 구성됨
 */
export function ApprovalConsole({ toApprove, myRequests, isAdmin, currentUserCode }: ApprovalConsoleProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const allDocs = useMemo(() => [...toApprove, ...myRequests], [toApprove, myRequests]);
  const selectedDoc = useMemo(() => allDocs.find(d => d.id === selectedId), [allDocs, selectedId]);

  // 현재 사용자가 결재할 차례인지 확인
  const currentStep = selectedDoc?.steps?.find((s: ApprovalStep) =>
    s.approverEmployeeCode === currentUserCode &&
    s.status === 'WAITING'
  );

  const canApprove = !!currentStep;

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedId || !currentStep) return;

    startTransition(async () => {
      const result = await processApprovalStep({
        approvalId: selectedId,
        stepOrder: currentStep.stepOrder,
        status,
        comment: ""
      });

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  };

  const filteredToApprove = toApprove.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMyRequests = myRequests.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-1 min-h-0 gap-6 animate-in fade-in duration-500">
      {/* 좌측: 문서 목록 패널 */}
      <div className="w-1/3 min-w-[380px] flex flex-col gap-4 min-h-0">
        <div className="flex flex-col gap-3 shrink-0">
          {!isAdmin && (
            <NewApprovalModal currentEmployeeCode={currentUserCode} />
          )}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="문서 제목, 기안자 검색"
              className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden border border-slate-200 rounded-3xl bg-white shadow-sm flex flex-col">
          {isAdmin ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-indigo-600 rounded-full" />
                  <h3 className="font-black text-sm text-slate-900 tracking-tight text-indigo-600">전체 결재 아카이브</h3>
                </div>
                <Badge variant="secondary" className="bg-white border-slate-200 text-slate-500 font-bold text-[10px]">
                  ALL RECORDS
                </Badge>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
                <DocumentList
                  documents={filteredToApprove}
                  selectedId={selectedId}
                  onSelect={(id) => { setSelectedId(id); }}
                />
              </div>
            </div>
          ) : (
            <Tabs defaultValue="to-approve" className="flex-1 min-h-0 flex flex-col">
              <TabsList className="grid grid-cols-2 bg-slate-50/50 p-1.5 h-14 rounded-none border-b border-slate-100">
                <TabsTrigger
                  value="to-approve"
                  className="rounded-xl font-black text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all"
                >
                  <ListTodo className="h-3.5 w-3.5 mr-2" />
                  결재 대기함
                  {filteredToApprove.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-lg text-[10px]">
                      {filteredToApprove.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="my-requests"
                  className="rounded-xl font-black text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-2" />
                  내 기안함
                  {filteredMyRequests.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded-lg text-[10px]">
                      {filteredMyRequests.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
                <TabsContent value="to-approve" className="m-0 focus-visible:ring-0">
                  <DocumentList
                    documents={filteredToApprove}
                    selectedId={selectedId}
                    onSelect={(id) => { setSelectedId(id); }}
                  />
                </TabsContent>
                <TabsContent value="my-requests" className="m-0 focus-visible:ring-0">
                  <DocumentList
                    documents={filteredMyRequests}
                    selectedId={selectedId}
                    onSelect={(id) => { setSelectedId(id); }}
                  />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </div>

      {/* 우측: 상세 정보 패널 */}
      <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden relative">
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar h-full">
          {!selectedDoc ? (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white text-slate-400">
              <div className="text-center space-y-4">
                <div className="p-6 bg-slate-50 rounded-full w-fit mx-auto">
                  <FileText className="h-12 w-12 opacity-10" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-900 leading-none">문서를 선택하세요</p>
                  <p className="text-sm font-medium mt-2 opacity-60">좌측 리스트에서 상세 내용을 확인할 결재 문서를 선택해 주세요.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6 pb-20">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 relative">
                  <div className="absolute top-0 right-0 p-8">
                    <div className="flex flex-col items-end gap-2">
                      <Badge className="bg-white border-2 border-indigo-100 text-indigo-600 font-black px-4 py-1.5 rounded-xl shadow-sm tracking-tight text-xs">
                        {getCategoryLabel(selectedDoc.category)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <ApprovalStatusBadge status={selectedDoc.status} />
                      <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-bold uppercase tracking-tighter text-[10px]">
                        ID: {selectedDoc.id.slice(0, 8)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4 pr-32">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                      {selectedDoc.title}
                    </h2>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="flex items-center gap-2 bg-white text-slate-600 px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                        <User className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm font-black">{selectedDoc.authorName || '기안자'}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-1">기안</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white text-slate-400 px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold">{new Date(selectedDoc.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8 space-y-10">
                  {/* 항목별 핵심 정보 (휴가기간/비용내역) - 상단 배치 */}
                  {selectedDoc.category === ApprovalCategory.LEAVE && (
                    <div className="flex items-center gap-6 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 animate-in slide-in-from-top-2 duration-500">
                      <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Calendar className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1">Leave Period</p>
                        <div className="flex items-center gap-3">
                          <p className="text-xl font-black text-slate-900">
                            {selectedDoc.startDate ? new Date(selectedDoc.startDate).toLocaleDateString() : '-'} ~ {selectedDoc.endDate ? new Date(selectedDoc.endDate).toLocaleDateString() : '-'}
                          </p>
                          {selectedDoc.startDate && selectedDoc.endDate && (
                            <Badge className="bg-indigo-100 text-indigo-600 border-none font-black px-2 py-0.5 rounded-lg text-[11px]">
                              {differenceInDays(new Date(selectedDoc.endDate), new Date(selectedDoc.startDate)) + 1}일
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedDoc.category === ApprovalCategory.EXPENSE && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-amber-50/50 rounded-3xl border border-amber-100 animate-in slide-in-from-top-2 duration-500">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
                          <FileSpreadsheet className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider">Category</p>
                          <p className="text-base font-black text-slate-900 leading-tight">
                            {selectedDoc.budgetCategory ? getBudgetCategoryLabel(selectedDoc.budgetCategory) : '기타 항목'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 border-l border-amber-100 pl-6">
                        <div>
                          <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider">Amount</p>
                          <p className="text-xl font-black text-indigo-600">
                            {selectedDoc.amount?.toLocaleString()} <span className="text-xs text-slate-400 font-bold ml-0.5">KRW</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">결재 내용</p>
                    <div className="p-8 bg-slate-50/80 rounded-[2rem] border border-slate-100 min-h-[150px] leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                      {selectedDoc.content}
                    </div>
                  </div>

                  {/* 결재선 타임라인 */}
                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">결재 진행 상태</p>
                    <div className="flex items-center gap-2 px-1">
                      {selectedDoc.steps.map((step: ApprovalStep, idx: number) => (
                        <div key={step.id} className="flex items-center gap-3 flex-1">
                          <div className="flex flex-col items-center gap-3 flex-1 group">
                            <div className={`p-4 rounded-2xl shadow-sm border transition-all duration-300 w-full flex flex-col items-center gap-2 ${step.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100' :
                              step.status === 'REJECTED' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'
                              }`}>
                              <ApprovalStepIcon status={step.status} />
                              <span className={`text-xs font-black truncate max-w-full ${step.status === 'APPROVED' ? 'text-emerald-700' : 'text-slate-700'
                                }`}>
                                {step.snapshotApproverName}
                              </span>
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[9px] font-bold text-slate-400 opacity-60 uppercase">{step.snapshotApproverPosition}</span>
                                {step.actionAt && (
                                  <span className="text-[8px] font-medium text-slate-400">{new Date(step.actionAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${step.status === 'APPROVED' ? 'bg-emerald-500 shadow-sm shadow-emerald-100' :
                              step.status === 'REJECTED' ? 'bg-red-500 shadow-sm shadow-red-100' : 'bg-slate-200'
                              }`} />
                          </div>
                          {idx < selectedDoc.steps.length - 1 && (
                            <ChevronRight className="h-5 w-5 text-slate-200 mt-[-24px] shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 인라인 결재 처리 폼 */}
                  {canApprove && (
                    <div className="pt-10 border-t-2 border-dashed border-slate-100 animate-in slide-in-from-bottom-4 duration-700">
                      <div className="bg-indigo-50/50 rounded-[2.5rem] p-8 space-y-6 border border-indigo-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-600 rounded-xl text-white">
                            <MessageSquare className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900">결재 처리</h3>
                            <p className="text-[11px] font-bold text-slate-500">본인이 기안을 승인하거나 반려할 수 있는 단계입니다.</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1 h-14 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-black gap-2 transition-all active:scale-95"
                            onClick={() => handleAction("REJECTED")}
                            disabled={isPending}
                          >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                            반려하기
                          </Button>
                          <Button
                            className="flex-2 h-14 rounded-2xl bg-indigo-600 hover:bg-slate-900 text-white font-black gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                            onClick={() => handleAction("APPROVED")}
                            disabled={isPending}
                          >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            기안 승인 (Approve)
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
