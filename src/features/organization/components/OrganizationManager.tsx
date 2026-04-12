'use client';

import { useState, useTransition, useEffect } from 'react';
import { OrganizationTree, TreeNode } from './OrganizationTree';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircle,
  History,
  UserPlus,
  ArrowRightLeft,
  Building2,
  UserCircle,
  X,
  Timer
} from 'lucide-react';
import {
  createOrganization,
  updateOrganizationHistory,
  createEmployee,
  transferEmployee
} from '../actions';
import { HistoryExplorerModal } from './HistoryExplorerModal';
import { EmployeeHistoryModal } from './EmployeeHistoryModal';

interface OrganizationManagerProps {
  treeData: TreeNode[];
  positions: { code: string; name: string; level: number }[];
  orgList: { code: string; name: string }[];
  rawData: {
    orgs: any[];
    employees: any[];
  };
}

export function OrganizationManager({ treeData, positions, orgList, rawData }: OrganizationManagerProps) {
  const [selected, setSelected] = useState<{ type: 'org' | 'employee' | 'new-org' | 'new-emp'; code: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEmpHistory, setShowEmpHistory] = useState(false);
  const [targetEmp, setTargetEmp] = useState<{ code: string; name: string } | null>(null);

  const handleSelect = (type: 'org' | 'employee' | 'new-org' | 'new-emp', code: string = '') => {
    setSelected({ type, code });
    setMsg(null);
  };

  const selectedOrg = selected?.type === 'org' ? rawData.orgs.find(o => o.code === selected.code) : null;
  const selectedEmp = selected?.type === 'employee' ? rawData.employees.find(e => e.employeeCode === selected.code) : null;

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="flex h-full gap-6 p-1">
      {/* 좌측 트리 패널 */}
      <div className="w-1/4 min-w-[300px] flex flex-col gap-4">
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold h-9 shadow-sm"
              onClick={() => handleSelect('new-emp')}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              신규 입사
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 h-9"
              onClick={() => handleSelect('new-org')}
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              부서 추가
            </Button>
          </div>
          <Button
            variant="secondary"
            className="w-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 h-9"
            onClick={() => setShowHistoryModal(true)}
          >
            <Timer className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
            조직도 이력 조회
          </Button>
        </div>
        <div className="flex-1 overflow-hidden border rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
          <OrganizationTree
            nodes={treeData}
            onSelect={handleSelect}
            selectedCode={selected?.code}
          />
        </div>
      </div>

      {/* 우측 액션 패널 */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
        {msg && (
          <div className={`absolute top-0 right-0 z-50 p-4 rounded-xl shadow-lg border animate-in slide-in-from-top-4 duration-300 ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            {msg.text}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          {!selected ? (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white text-slate-400">
              <div className="text-center space-y-2">
                <Building2 className="h-12 w-12 mx-auto opacity-20" />
                <p className="text-sm font-medium">관리할 부서나 사원을 선택하세요.</p>
              </div>
            </div>
          ) : selected.type === 'new-org' ? (
            <NewOrgPanel
              orgList={orgList}
              isPending={isPending}
              startTransition={startTransition}
              onSuccess={() => { setSelected(null); showMsg('success', '신규 부서가 생성되었습니다.'); }}
              onError={(e: string) => showMsg('error', e)}
              onCancel={() => setSelected(null)}
            />
          ) : selected.type === 'new-emp' ? (
            <NewEmployeePanel
              orgList={orgList}
              positions={positions}
              isPending={isPending}
              startTransition={startTransition}
              onSuccess={() => { setSelected(null); showMsg('success', '신규 사원이 등록되었습니다.'); }}
              onError={(e: string) => showMsg('error', e)}
              onCancel={() => setSelected(null)}
            />
          ) : selected.type === 'org' ? (
            <OrgActionPanel
              key={`org-${selected.code}`}
              org={selectedOrg}
              orgList={orgList}
              isPending={isPending}
              startTransition={startTransition}
              onSuccess={(m: string) => showMsg('success', m)}
              onError={(e: string) => showMsg('error', e)}
            />
          ) : (
            <EmployeeActionPanel
              key={`emp-${selected.code}`}
              emp={selectedEmp}
              orgList={orgList}
              positions={positions}
              isPending={isPending}
              startTransition={startTransition}
              onSuccess={(m: string) => showMsg('success', m)}
              onError={(e: string) => showMsg('error', e)}
              onOpenHistory={(name: string, code: string) => {
                setTargetEmp({ name, code });
                setShowEmpHistory(true);
              }}
            />
          )}
        </div>
      </div>

      <HistoryExplorerModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        currentPositions={positions}
      />

      {targetEmp && (
        <EmployeeHistoryModal
          open={showEmpHistory}
          onOpenChange={setShowEmpHistory}
          employeeCode={targetEmp.code}
          employeeName={targetEmp.name}
          orgList={orgList}
          positions={positions}
        />
      )}
    </div>
  );
}

// ── 상세 패널: 부서 관리 ──────────────────────────────────────────────────────────

function OrgActionPanel({ org, orgList, isPending, startTransition, onSuccess, onError }: any) {
  const [name, setName] = useState(org.name);
  const [parentCode, setParentCode] = useState(org.parentCode || 'none');

  useEffect(() => {
    setName(org.name);
    setParentCode(org.parentCode || 'none');
  }, [org]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set('name', name);
    formData.set('parentCode', parentCode);
    formData.set('applyDate', (e.currentTarget.elements.namedItem('applyDate') as HTMLInputElement).value);

    startTransition(async () => {
      const res = await updateOrganizationHistory(org.code, formData);
      if (res.success) onSuccess('부서 정보가 갱신되었습니다.');
      else onError(res.error);
    });
  };

  return (
    <Card className="min-h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 border-none shadow-sm ring-1 ring-slate-200">
      <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between space-y-0 rounded-t-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">{org.name} 관리</CardTitle>
            <CardDescription className="font-mono text-[10px]">CODE: {org.code}</CardDescription>
          </div>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">활성 부서</Badge>
      </CardHeader>

      <CardContent className="flex-1 pt-6 pb-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">부서명</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="h-10 border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">상위 부서</Label>
              <Select value={parentCode} onValueChange={(val) => setParentCode(val || 'none')}>
                <SelectTrigger className="h-10 w-full bg-white border-slate-200">
                  <SelectValue>
                    {parentCode === 'none' ? '없음 (최상위)' : orgList.find((o: any) => o.code === parentCode)?.name || '부서 선택'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음 (최상위)</SelectItem>
                  {orgList.filter((o: any) => o.code !== org.code).map((o: any) => (
                    <SelectItem key={o.code} value={o.code}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-4 border-t space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">적용 일자 (조직 개편일)</Label>
              <Input name="applyDate" type="date" required className="h-10 border-slate-200" defaultValue={new Date().toISOString().split('T')[0]} />
              <p className="text-[10px] font-medium text-slate-400 font-bold italic">※ 변경 시 기존 이력은 닫히고 새 이력이 시작됩니다.</p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-500 font-bold h-10 px-8">
                <History className="h-4 w-4 mr-2" />
                조직 개편 확정
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── 상세 패널: 사원 관리 ──────────────────────────────────────────────────────────

function EmployeeActionPanel({ emp, orgList, positions, isPending, startTransition, onSuccess, onError, onOpenHistory }: any) {
  const [orgCode, setOrgCode] = useState(emp.organizationCode);
  const [posCode, setPosCode] = useState(emp.position);

  useEffect(() => {
    setOrgCode(emp.organizationCode);
    setPosCode(emp.position);
  }, [emp]);

  const handleTransfer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('employeeCode', emp.employeeCode);
    formData.set('targetOrgCode', orgCode);
    formData.set('targetPositionCode', posCode);
    formData.set('applyDate', (e.currentTarget.elements.namedItem('applyDate') as HTMLInputElement).value);

    startTransition(async () => {
      const res = await transferEmployee(formData);
      if (res.success) onSuccess('인사 발령이 완료되었습니다.');
      else onError(res.error);
    });
  };

  const currentOrgName = orgList.find((o: any) => o.code === emp.organizationCode)?.name || '없음';
  const currentPosName = positions.find((p: any) => p.code === emp.position)?.name || '사원';

  return (
    <Card className="min-h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 border-none shadow-sm ring-1 ring-slate-200">
      <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between space-y-0 rounded-t-xl overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-lg shadow-sm shadow-amber-100">
            <UserCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900">{emp.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenHistory(emp.name, emp.employeeCode)}
                className="h-6 px-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <History className="h-3 w-3 mr-1" />
                이력 보기
              </Button>
            </div>
            <CardDescription className="font-mono text-[10px]">사번: {emp.employeeCode}</CardDescription>
          </div>
        </div>
        <div className="text-right">
          <Badge className="bg-indigo-600 text-white border-none font-bold px-3 py-1 shadow-sm shadow-indigo-100">{currentPosName}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-6 pb-12 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 ring-1 ring-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">소속 부서</p>
            <p className="font-bold text-slate-700">{currentOrgName}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 ring-1 ring-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">마지막 발령일</p>
            <p className="font-bold text-slate-700">{new Date(emp.validFrom).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 bg-amber-500 rounded-full" />
            <h3 className="text-sm font-bold text-slate-800">인사 발령</h3>
          </div>

          <form onSubmit={handleTransfer} className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/20 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">이동 대상 부서</Label>
                <Select value={orgCode} onValueChange={(val) => setOrgCode(val || '')}>
                  <SelectTrigger className="h-10 w-full bg-white border-slate-200">
                    <SelectValue>
                      {orgList.find((o: any) => o.code === orgCode)?.name || '부서 선택'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {orgList.map((o: any) => (
                      <SelectItem key={o.code} value={o.code}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">변경 직급</Label>
                <Select value={posCode} onValueChange={(val) => setPosCode(val || '')}>
                  <SelectTrigger className="h-10 w-full bg-white border-slate-200">
                    <SelectValue>
                      {positions.find((p: any) => p.code === posCode)?.name || '직급 선택'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((p: any) => (
                      <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 col-span-2">
                <Label className="text-xs font-bold text-slate-600">발령 실행일</Label>
                <Input name="applyDate" type="date" required className="h-10 bg-white border-slate-200" defaultValue={new Date().toISOString().split('T')[0]} />
                <p className="text-[10px] font-medium text-slate-400 font-bold italic">※ 발령 시 해당 일자부터 새로운 인사 정보가 이력으로 남습니다.</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto px-10 bg-indigo-600 hover:bg-indigo-500 font-bold h-10 shadow-lg shadow-indigo-200">
                인사 발령 최종 실행
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

// ── 신규 등록 패널 ────────────────────────────────────────────────────────────

function NewOrgPanel({ orgList, isPending, startTransition, onSuccess, onError, onCancel }: any) {
  const [parentCode, setParentCode] = useState('none');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('parentCode', parentCode);
    startTransition(async () => {
      const res = await createOrganization(formData);
      if (res.success) onSuccess();
      else onError(res.error);
    });
  };

  return (
    <Card className="min-h-full flex flex-col animate-in fade-in zoom-in-95 duration-200 border-none shadow-sm ring-1 ring-slate-200">
      <CardHeader className="bg-indigo-50/30 flex flex-row items-center justify-between space-y-0 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <PlusCircle className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-base font-bold">신규 부서 추가</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="hover:bg-indigo-100"><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="flex-1 pt-6 pb-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">부서명</Label>
              <Input name="name" placeholder="부서명을 입력하세요" required className="h-10 border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">상위 부서</Label>
              <Select value={parentCode} onValueChange={(val) => setParentCode(val || 'none')}>
                <SelectTrigger className="h-10 w-full bg-white border-slate-200">
                  <SelectValue>
                    {parentCode === 'none' ? '없음 (최상위)' : orgList.find((o: any) => o.code === parentCode)?.name || '부서 선택'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음 (최상위)</SelectItem>
                  {orgList.map((o: any) => (
                    <SelectItem key={o.code} value={o.code}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">생성 일자</Label>
              <Input name="applyDate" type="date" required className="h-10 border-slate-200" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isPending} className="bg-indigo-600 font-bold px-8 h-10 shadow-lg shadow-indigo-100">부서 생성하기</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function NewEmployeePanel({ orgList, positions, isPending, startTransition, onSuccess, onError, onCancel }: any) {
  const [orgCode, setOrgCode] = useState('');
  const [posCode, setPosCode] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('organizationCode', orgCode);
    formData.set('positionCode', posCode);
    startTransition(async () => {
      const res = await createEmployee(formData);
      if (res.success) onSuccess();
      else onError(res.error);
    });
  };

  return (
    <Card className="min-h-full flex flex-col animate-in fade-in zoom-in-95 duration-200 border-none shadow-sm ring-1 ring-slate-200">
      <CardHeader className="bg-amber-50/30 flex flex-row items-center justify-between space-y-0 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-lg">
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-base font-bold">신규 입사 등록</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="hover:bg-amber-100"><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="flex-1 pt-6 pb-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">사원 이름</Label>
              <Input name="name" placeholder="이름을 입력하세요" required className="h-10 border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">소속 부서</Label>
              <Select value={orgCode} onValueChange={(val) => setOrgCode(val || '')}>
                <SelectTrigger className="h-10 w-full bg-white border-slate-200">
                  <SelectValue>
                    {orgList.find((o: any) => o.code === orgCode)?.name || '부서 선택'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {orgList.map((o: any) => (
                    <SelectItem key={o.code} value={o.code}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">직급</Label>
              <Select value={posCode} onValueChange={(val) => setPosCode(val || '')}>
                <SelectTrigger className="h-10 w-full bg-white border-slate-200">
                  <SelectValue>
                    {positions.find((p: any) => p.code === posCode)?.name || '직급 선택'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {positions.map((p: any) => (
                    <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">입사 일자</Label>
              <Input name="applyDate" type="date" required className="h-10 border-slate-200" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-500 font-bold px-8 h-10 text-white shadow-lg shadow-amber-100">사원 등록하기</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
