import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ApprovalForm } from "@/features/approval/components/ApprovalForm";

export default async function NewApprovalPage() {
  const session = await auth.api.getSession();
  if (!session?.user?.employeeCode) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <ApprovalForm currentEmployeeCode={session.user.employeeCode} />
    </div>
  );
}
