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
    <div className="container mx-auto py-12 px-4">
      <ApprovalDetail 
        approval={approval} 
        currentEmployeeCode={session.user.employeeCode} 
      />
    </div>
  );
}
