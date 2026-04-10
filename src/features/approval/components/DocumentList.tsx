import React from 'react';
import { Badge } from "@/components/ui/badge";
import { FileText, User, AlertCircle } from "lucide-react";
import { getCategoryLabel, getCategoryTheme, ApprovalDocument } from "../schemas";

interface DocumentListProps {
  documents: ApprovalDocument[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * 결재 문서 목록을 렌더링하는 컴포넌트
 */
export function DocumentList({ documents, selectedId, onSelect }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        <AlertCircle className="h-10 w-10 mx-auto opacity-10 mb-2" />
        <p className="text-xs font-bold uppercase tracking-widest leading-none">항목이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {documents.map((doc) => (
        <button
          key={doc.id}
          onClick={() => onSelect(doc.id)}
          className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group flex items-start gap-4 ${selectedId === doc.id
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 translate-x-1'
            : 'hover:bg-indigo-50/30 text-slate-700'
            }`}
        >
          <div className={`p-2 rounded-xl shrink-0 transition-colors ${selectedId === doc.id ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-white'
            }`}>
            <FileText className={`h-4 w-4 ${selectedId === doc.id ? 'text-white' : 'text-slate-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Badge variant="outline" className={`h-4 px-1 text-[9px] font-black uppercase tracking-tighter border ${getCategoryTheme(doc.category, selectedId === doc.id)}`}>
                  {getCategoryLabel(doc.category)}
                </Badge>
                <span className={`text-[10px] font-black uppercase tracking-tighter truncate ${selectedId === doc.id ? 'text-white/70' : 'text-slate-400'
                  }`}>
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>
              {doc.status === 'PENDING' && (
                <div className={`w-2 h-2 rounded-full ${selectedId === doc.id ? 'bg-white' : 'bg-indigo-500'} animate-pulse`} />
              )}
            </div>
            <p className={`font-black text-sm truncate leading-tight ${selectedId === doc.id ? 'text-white' : 'text-slate-900 group-hover:text-indigo-600'
              }`}>
              {doc.title}
            </p>
            <div className={`flex items-center gap-1.5 mt-1.5 ${selectedId === doc.id ? 'text-white/60' : 'text-slate-400'
              }`}>
              <User className="h-3 w-3" />
              <p className="text-[11px] font-bold truncate">
                {doc.authorName}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
