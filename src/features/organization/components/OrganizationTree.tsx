'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, User, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type TreeNode = {
  id: string;
  code: string;
  name: string;
  type: 'org' | 'employee';
  position?: string;
  children?: TreeNode[];
};

interface OrganizationTreeProps {
  nodes: TreeNode[];
  onSelect: (type: 'org' | 'employee', code: string) => void;
  selectedCode?: string;
}

export function OrganizationTree({ nodes, onSelect, selectedCode }: OrganizationTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'TEAM_EXEC': true });

  const toggle = (code: string) => {
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const renderNode = (node: TreeNode, depth: number) => {
    const isExpanded = expanded[node.code];
    const isSelected = selectedCode === node.code;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.code} className="select-none">
        <div
          className={`group flex items-center py-1.5 px-2 rounded-md transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'
            }`}
          style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
          onClick={() => onSelect(node.type, node.code)}
        >
          {node.type === 'org' ? (
            <div className="flex items-center gap-1.5 w-full">
              <span onClick={(e) => { e.stopPropagation(); toggle(node.code); }}>
                {hasChildren ? (
                  isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />
                ) : (
                  <div className="w-4" />
                )}
              </span>
              <Folder className={`h-4 w-4 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`} />
              <span className="text-sm font-medium">{node.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-4">
              <User className={`h-3.5 w-3.5 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`} />
              <span className="text-sm">{node.name}</span>
              {node.position && (
                <span className="text-[10px] text-slate-400 font-normal">({node.position})</span>
              )}
            </div>
          )}
        </div>

        {node.type === 'org' && isExpanded && hasChildren && (
          <div className="mt-0.5">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">조직도</h3>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {nodes.map((node) => renderNode(node, 0))}
      </div>
    </div>
  );
}
