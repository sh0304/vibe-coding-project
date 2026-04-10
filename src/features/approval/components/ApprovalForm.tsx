"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ApprovalCategory,
  ApprovalFormValues,
  approvalFormSchema,
  getCategoryLabel
} from "../schemas";
import { submitApproval, getApprovalLine } from "../actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, Calendar, User, ShieldCheck, AlertCircle } from "lucide-react";

interface ApprovalFormProps {
  currentEmployeeCode: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ApprovalForm({ currentEmployeeCode, onSuccess, onCancel }: ApprovalFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 결재선 데이터
  const [approvalLine, setApprovalLine] = useState<any[]>([]);
  const [isLineLoading, setIsLineLoading] = useState(true);

  // 폼 상태
  const [category, setCategory] = useState<string>(ApprovalCategory.LEAVE);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 페이지 로드 시 결재선 미리보기 로드
  useEffect(() => {
    async function fetchLine() {
      setIsLineLoading(true);
      const res = await getApprovalLine(currentEmployeeCode);
      if (res.success && res.data) {
        setApprovalLine(res.data);
      } else {
        setError(res.error || "결재선을 불러오지 못했습니다.");
      }
      setIsLineLoading(false);
    }
    fetchLine();
  }, [currentEmployeeCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = {
      category,
      title,
      content,
      startDate: category === ApprovalCategory.LEAVE ? startDate : undefined,
      endDate: category === ApprovalCategory.LEAVE ? endDate : undefined,
    };

    // 클라이언트 유효성 검사
    const validation = approvalFormSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      const result = await submitApproval(formData);
      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/approval");
        }
        router.refresh();
      } else {
        setError(result.error || "결재 상신에 실패했습니다.");
      }
    });
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-none shadow-2xl bg-white rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
        <CardHeader className="bg-indigo-600 text-white p-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">전자결재 상신</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-10 overflow-y-auto custom-scrollbar">
          {/* 결재선 미리보기 섹션 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <h3 className="font-bold">결재선 미리보기</h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              {isLineLoading ? (
                <div className="w-full flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : approvalLine.length === 0 ? (
                <div className="w-full text-center py-4 text-slate-400 font-medium">
                  결재선을 구성할 수 없습니다. (관리자 문의)
                </div>
              ) : (
                <>
                  {approvalLine.map((step, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm w-40">
                        <Badge variant="outline" className="mb-2 bg-indigo-50 text-indigo-700 border-indigo-100">
                          {index + 1}차 결재 ({step.role === 'HR_DEPT' ? '인사팀' : '팀장'})
                        </Badge>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-bold text-slate-900">{step.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{step.position}</span>
                      </div>
                      {index < approvalLine.length - 1 && (
                        <ArrowRight className="h-5 w-5 text-slate-300 hidden sm:block" />
                      )}
                    </div>
                  ))}
                  {approvalLine.length === 1 && approvalLine[0].role === 'HR_DEPT' && (
                    <p className="text-xs text-slate-400 font-medium ml-4 italic">(본부장은 인사팀 1회 결재로 종료됩니다)</p>
                  )}
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold flex-shrink-0 animate-in shake-in-from-bottom duration-500">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="category" className="text-sm font-bold text-slate-700 ml-1">결재 종류 *</Label>
                <Select value={category} onValueChange={(val: any) => { if (val) setCategory(val); }}>
                  <SelectTrigger id="category" className="h-12 rounded-xl bg-white border-slate-200 focus:ring-indigo-500">
                    <SelectValue>
                      {getCategoryLabel(category)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ApprovalCategory.LEAVE}>{getCategoryLabel(ApprovalCategory.LEAVE)}</SelectItem>
                    <SelectItem value={ApprovalCategory.EXPENSE}>{getCategoryLabel(ApprovalCategory.EXPENSE)}</SelectItem>
                    <SelectItem value={ApprovalCategory.CERT}>{getCategoryLabel(ApprovalCategory.CERT)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-bold text-slate-700 ml-1">제목 *</Label>
                <Input
                  id="title"
                  placeholder="결재 제목을 입력하세요"
                  className="h-12 rounded-xl bg-white border-slate-200 focus:ring-indigo-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="content" className="text-sm font-bold text-slate-700 ml-1">상세 내용 *</Label>
              <Textarea
                id="content"
                placeholder="결재 상세 사유를 입력하세요 (최소 10자)"
                className="min-h-[150px] rounded-2xl bg-white border-slate-200 focus:ring-indigo-500 p-4"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            {category === ApprovalCategory.LEAVE && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 border-dashed animate-in slide-in-from-top-4 duration-500">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 ml-1">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <Label htmlFor="startDate" className="text-sm font-bold text-slate-700">휴가 시작일 *</Label>
                  </div>
                  <Input
                    id="startDate"
                    type="date"
                    className="h-12 rounded-xl bg-white border-slate-200 focus:ring-indigo-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 ml-1">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <Label htmlFor="endDate" className="text-sm font-bold text-slate-700">휴가 종료일 *</Label>
                  </div>
                  <Input
                    id="endDate"
                    type="date"
                    className="h-12 rounded-xl bg-white border-slate-200 focus:ring-indigo-500"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                className="h-12 px-8 rounded-xl font-bold text-slate-600 border-slate-200 hover:bg-slate-50"
                onClick={() => onCancel ? onCancel() : router.back()}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="h-12 px-10 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 disabled:opacity-50"
                disabled={isPending || isLineLoading || approvalLine.length === 0}
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    처리 중...
                  </div>
                ) : "결재 상신"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
