import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ApprovalConsole } from "@/features/approval/components/ApprovalConsole";
import { ApprovalService } from "@/services/approval";

export default async function ApprovalPage() {
  const session = await auth.api.getSession();
  if (!session?.user?.employeeCode) {
    redirect("/auth/login");
  }

  const isAdmin = session.user.role === "admin";
  const employeeCode = session.user.employeeCode;

  // 1. 서비스 레이어를 통한 데이터 조회 (Any 캐스팅 제거 및 로직 캡슐화)
  const [toApprove, myRequests] = await Promise.all([
    ApprovalService.getApprovals({ employeeCode, isAdmin, mode: "TO_APPROVE" }),
    isAdmin ? Promise.resolve([]) : ApprovalService.getApprovals({ employeeCode, isAdmin, mode: "MY_REQUESTS" })
  ]);

  // 2. 데이터 전처리
  const processedToApprove = toApprove.map((a: any) => ({
    ...a,
    authorName: a.snapshotAuthorName || "기안자"
  }));

  const processedMyRequests = myRequests.map((a: any) => ({
    ...a,
    authorName: session.user.name || a.snapshotAuthorName || "본인"
  }));

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50/50">
      <header className="bg-white border-b border-slate-100 shrink-0">
        <div className="container mx-auto px-6 py-6">
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
        </div>
      </header>

      <main className="flex-1 overflow-hidden min-h-0 flex flex-col">
        <div className="flex-1 flex flex-col min-h-0 container mx-auto p-6">
          <ApprovalConsole
            toApprove={processedToApprove}
            myRequests={processedMyRequests}
            isAdmin={isAdmin}
            currentUserCode={employeeCode}
          />
        </div>
      </main>
    </div>
  );
}
