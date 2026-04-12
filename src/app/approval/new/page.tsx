import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ApprovalForm } from "@/features/approval/components/ApprovalForm";

export default async function NewApprovalPage() {
  const session = await auth.api.getSession();
  if (!session?.user?.employeeCode) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50/50">
      <header className="bg-white border-b border-slate-100 shrink-0">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-8">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px]">
                <span className="w-8 h-1 bg-indigo-600 rounded-full"></span>
                Drafting Service
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                전자결재 상신
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden min-h-0 flex flex-col">
        <div className="flex-1 flex flex-col min-h-0 container mx-auto p-6 items-center">
          <div className="w-full max-w-4xl h-full flex flex-col">
            <ApprovalForm currentEmployeeCode={session.user.employeeCode} />
          </div>
        </div>
      </main>
    </div>
  );
}
