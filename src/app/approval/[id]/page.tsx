import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ApprovalDetail } from "@/features/approval/components/ApprovalDetail";

export default async function ApprovalDetailPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession();
  if (!session?.user?.employeeCode) {
    redirect("/auth/login");
  }

  const { id } = await params;

  const approval = await prisma.approval.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" }
      }
    }
  });

  if (!approval) {
    notFound();
  }

  // 접근 권한 체크: 기안자 본인이거나 결재선상에 있는 사람이어야 함
  const isAuthor = approval.authorEmployeeCode === session.user.employeeCode;
  const isApprover = approval.steps.some((s: any) => s.approverEmployeeCode === session.user.employeeCode);

  if (!isAuthor && !isApprover) {
    redirect("/approval"); // 또는 권한 없음 안내
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50/50">
      <header className="bg-white border-b border-slate-100 shrink-0">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-8">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px]">
                <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
                Document Viewer
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                결재 문서 상세
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden min-h-0 flex flex-col">
        <div className="flex-1 flex flex-col min-h-0 container mx-auto p-6 items-center">
          <div className="w-full max-w-4xl h-full flex flex-col">
            <ApprovalDetail 
              approval={approval} 
              currentEmployeeCode={session.user.employeeCode} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
