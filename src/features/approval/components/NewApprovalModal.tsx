"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ApprovalForm } from "./ApprovalForm";
import { useState } from "react";

interface NewApprovalModalProps {
  currentEmployeeCode: string;
}

export function NewApprovalModal({ currentEmployeeCode }: NewApprovalModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-sm font-black shadow-lg shadow-indigo-100 rounded-2xl gap-2">
          <PlusCircle className="h-4 w-4" /> 새 결재 기안
        </Button>
      } />
      <DialogContent className="sm:max-w-5xl w-[95vw] p-0 bg-transparent border-none overflow-hidden shadow-2xl">
        <ApprovalForm
          currentEmployeeCode={currentEmployeeCode}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
