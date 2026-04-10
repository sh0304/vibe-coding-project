import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ApprovalStatus } from '../schemas';

interface ApprovalStatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * 결재 문서의 상태를 표시하는 전용 배지 컴포넌트
 */
export function ApprovalStatusBadge({ status, className }: ApprovalStatusBadgeProps) {
  switch (status) {
    case ApprovalStatus.PENDING:
      return (
        <Badge className={`bg-slate-100 text-slate-600 border-none font-bold ${className}`}>
          대기 중
        </Badge>
      );
    case ApprovalStatus.IN_PROGRESS:
      return (
        <Badge className={`bg-indigo-50 text-indigo-700 border-none font-bold uppercase tracking-widest text-[10px] ${className}`}>
          진행 중
        </Badge>
      );
    case ApprovalStatus.APPROVED:
      return (
        <Badge className={`bg-emerald-50 text-emerald-700 border-none font-bold ${className}`}>
          승인 완료
        </Badge>
      );
    case ApprovalStatus.REJECTED:
      return (
        <Badge className={`bg-red-50 text-red-700 border-none font-bold ${className}`}>
          반려됨
        </Badge>
      );
    default:
      return <Badge variant="outline" className={className}>{status}</Badge>;
  }
}
