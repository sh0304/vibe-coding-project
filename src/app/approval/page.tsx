import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ApprovalConsole } from "@/features/approval/components/ApprovalConsole";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  PlusCircle,
  ListTodo,
  FileSpreadsheet,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { ApprovalStatus } from "@/features/approval/schemas";

export default async function ApprovalPage() {
  const session = await auth.api.getSession();
  if (!session?.user?.employeeCode) {
    redirect("/auth/login");
  }

  const isAdmin = session.user.role === "admin";
  const employeeCode = session.user.employeeCode;

  // 관리자일 경우 전사 문서 조회, 일반 유저일 경우 본인 관련 문서 조회
  let displayApprovals: any[] = [];
  let myRequests: any[] = [];

  if (isAdmin) {
    // any 캐스팅을 통해 Prisma 관계 타입 에러(never) 우회
    displayApprovals = await (prisma.approval as any).findMany({
      include: {
        steps: true
      },
      orderBy: { createdAt: "desc" }
    });
  } else {
    // 일반 유저: 내가 결재해야 할 문서 (내 사번이 포함된 Step이 있는 문서)
    displayApprovals = await (prisma.approval as any).findMany({
      where: {
        steps: {
          some: {
            approverEmployeeCode: employeeCode,
            status: "WAITING"
          }
        }
      },
      include: {
        steps: true
      },
      orderBy: { createdAt: "desc" }
    });

    // 일반 유저용: 내 상신 현황
    myRequests = await (prisma.approval as any).findMany({
      where: { authorEmployeeCode: employeeCode },
      include: {
        steps: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  // 데이터 전처리: 기안자 이름 등을 포함
  const processedToApprove = displayApprovals.map((a: any) => ({
    ...a,
    authorName: a.snapshotAuthorName || "기안자"
  }));

  const processedMyRequests = myRequests.map((a: any) => ({
    ...a,
    authorName: session.user.name || a.snapshotAuthorName || "본인"
  }));

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50/50">
      <header className="px-10 py-8 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between gap-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px]">
              <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
              {isAdmin ? "Administrative Console" : "Employee Service"}
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              {isAdmin ? "결재 관리" : "전자 결재"}
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-hidden min-h-0">
        <ApprovalConsole
          toApprove={processedToApprove}
          myRequests={processedMyRequests}
          isAdmin={isAdmin}
          currentUserCode={employeeCode}
        />
      </main>
    </div>
  );
}
