import React from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { ApprovalStepStatus } from '../schemas';

interface ApprovalStepIconProps {
  status: string;
  className?: string;
}

/**
 * 결재 단계별 상태를 시각화하는 아이콘 컴포넌트
 */
export function ApprovalStepIcon({ status, className = "h-4 w-4" }: ApprovalStepIconProps) {
  switch (status) {
    case ApprovalStepStatus.APPROVED:
      return <CheckCircle2 className={`${className} text-emerald-500`} />;
    case ApprovalStepStatus.REJECTED:
      return <XCircle className={`${className} text-red-500`} />;
    case ApprovalStepStatus.WAITING:
      return <Clock className={`${className} text-slate-300`} />;
    default:
      return <div className={`${className} rounded-full border-2 border-slate-200`} />;
  }
}
