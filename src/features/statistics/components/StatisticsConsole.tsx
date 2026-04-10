"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  Info,
  Wallet,
  RefreshCw,
  Building2,
  Users,
  Target,
  ArrowUpRight,
  User,
  CheckCircle2
} from "lucide-react";
import { getOrganizationStats, getTeamMemberStats } from "../actions";
import { OrganizationStat, TeamDetailStat } from "../schemas";
import { format } from "date-fns";
import { OrganizationTree, TreeNode } from "@/features/organization/components/OrganizationTree";
import { Badge } from "@/components/ui/badge";

interface StatisticsConsoleProps {
  treeData: TreeNode[];
  rawData: {
    orgs: any[];
    employees: any[];
  };
}

export function StatisticsConsole({ treeData }: StatisticsConsoleProps) {
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");
  const [stats, setStats] = useState<OrganizationStat[]>([]);
  const [selectedOrgCode, setSelectedOrgCode] = useState<string | null>(null);
  const [teamDetail, setTeamDetail] = useState<TeamDetailStat | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 전사 요약 통계 조회
  const fetchGlobalStats = async () => {
    startTransition(async () => {
      const result = await getOrganizationStats({ targetDate, period });
      if (result.success && result.data) {
        setStats(result.data);
      }
    });
  };

  // 특정 부서 상세 통계 조회
  const fetchTeamStats = async (orgCode: string) => {
    startTransition(async () => {
      const result = await getTeamMemberStats(orgCode, targetDate);
      if (result.success && result.data) {
        setTeamDetail(result.data);
      }
    });
  };

  useEffect(() => {
    fetchGlobalStats();
    if (selectedOrgCode) {
      fetchTeamStats(selectedOrgCode);
    }
  }, [targetDate, period]);

  const handleOrgSelect = (type: 'org' | 'employee', code: string) => {
    if (type === 'org') {
      setSelectedOrgCode(code);
      fetchTeamStats(code);
    } else {
      // 사원 선택 시 해당 사원이 소속된 부서를 선택한 것으로 처리하거나, 
      // 현재는 부서 단위 통계이므로 부서 코드를 찾아 선택함
      // (OrganizationTree 구조상 사원은 부서의 하위에 있음)
    }
  };

  const resetSelection = () => {
    setSelectedOrgCode(null);
    setTeamDetail(null);
  };

  const totalPlanned = stats.reduce((acc, s) => acc + s.plannedBudget, 0);
  const totalActual = stats.reduce((acc, s) => acc + s.actualExpense, 0);
  const totalHeadcount = stats.reduce((acc, s) => acc + s.headcount, 0);

  if (!isMounted) return null;

  return (
    <div className="flex h-full gap-6 p-6 animate-in fade-in duration-500 overflow-hidden">
      {/* 좌측: 조직도 트리 패널 */}
      <div className="w-1/4 min-w-[300px] flex flex-col gap-4 h-full overflow-hidden">
        <div className="flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">조직 탐색</h3>
              <p className="text-[10px] font-bold text-slate-400">부서별 상세 분석</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200">
            <Input
              type="date"
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 font-bold text-indigo-600 text-sm h-9"
              value={format(targetDate, "yyyy-MM-dd")}
              onChange={(e) => setTargetDate(new Date(e.target.value))}
            />
            <div className="w-px h-6 bg-slate-100 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={fetchGlobalStats}
              disabled={isPending}
            >
              <RefreshCw className={`h-4 w-4 text-slate-600 ${isPending ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden shadow-sm border border-slate-200 rounded-3xl bg-white">
          <div 
            className="p-3 border-b bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={resetSelection}
          >
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${!selectedOrgCode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600'}`}>
              <Target className={`h-4 w-4 ${!selectedOrgCode ? 'text-white' : 'text-indigo-500'}`} />
              <span className="text-xs font-black">전사 통계 (종합)</span>
            </div>
          </div>
          <div className="h-[calc(100%-60px)] orientation-tree-container">
            <OrganizationTree
              nodes={treeData}
              onSelect={handleOrgSelect}
              selectedCode={selectedOrgCode || ''}
            />
          </div>
        </div>
      </div>

      {/* 우측: 상세 통계 대시보드 패널 */}
      <div className={`flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 transition-all duration-300 ${isPending ? 'opacity-40 pointer-events-none grayscale-[0.5]' : 'opacity-100'}`}>
        {!selectedOrgCode ? (
          /* 전사 요약 화면 (Global View) */
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wallet className="h-24 w-24" />
                </div>
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Planned Budget</CardDescription>
                  <CardTitle className="text-3xl font-black italic tracking-tighter">
                    {(totalPlanned).toLocaleString()} <span className="text-xs not-italic ml-1">원</span>
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden ring-1 ring-slate-100 group">
                <div className="h-1.5 w-full bg-indigo-600" />
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Actual Expenditure</CardDescription>
                  <CardTitle className="text-3xl font-black text-slate-900 italic tracking-tighter">
                    {(totalActual).toLocaleString()} <span className="text-xs not-italic ml-1">원</span>
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden ring-1 ring-slate-100">
                <div className="h-1.5 w-full bg-slate-200" />
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Active Personnel</CardDescription>
                  <CardTitle className="text-3xl font-black text-slate-900 italic tracking-tighter">
                    {totalHeadcount}<span className="text-xs not-italic ml-1">명</span>
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="flex-1 rounded-[3rem] border-none shadow-2xl bg-white p-10 ring-1 ring-slate-100 overflow-hidden flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <ArrowUpRight className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">부서별 예산 집행 분석</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">실시간 승인 데이터를 기반으로 한 예산 대비 지출 현황</p>
                  </div>
                </div>
                
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        className="h-12 px-6 rounded-2xl border-slate-200 font-black gap-2 text-slate-600 bg-white hover:bg-slate-50 shadow-sm"
                      >
                        <Info className="h-5 w-5 text-indigo-500" />
                        산출 기준
                      </Button>
                    }
                  />
                  <DialogContent className="rounded-[2.5rem] max-w-lg p-0 overflow-hidden border-none shadow-2xl bg-white">
                    <div className="bg-slate-900 p-10 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-3xl font-black tracking-tighter italic">Budget Guidelines</DialogTitle>
                        <p className="text-slate-400 text-sm font-bold mt-2">현행 시스템에 적용된 인당 단가 정책입니다.</p>
                      </DialogHeader>
                    </div>
                    <div className="p-10 space-y-6">
                      <div className="grid gap-4">
                        {[
                          { label: "복리후생비 (WELFARE)", value: "100,000" },
                          { label: "교육훈련비 (EDUCATION)", value: "50,000" },
                          { label: "부서활동비 (ACTIVITY)", value: "80,000" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                            <span className="font-bold text-slate-700">{item.label}</span>
                            <span className="font-black text-indigo-600 italic">{item.value} / 인</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="orgName"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 800 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                      tickFormatter={(v) => `${(v / 10000).toLocaleString()}만`}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{
                        borderRadius: '2rem',
                        border: 'none',
                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                        padding: '1.5rem',
                        fontWeight: 900
                      }}
                    />
                    <Bar name="배정 예산" dataKey="plannedBudget" radius={[12, 12, 12, 12]} barSize={40}>
                      {stats.map((entry, index) => (
                        <Cell key={`cell-planned-${index}`} fill="#f1f5f9" />
                      ))}
                    </Bar>
                    <Bar name="실제 지출" dataKey="actualExpense" radius={[12, 12, 12, 12]} barSize={40}>
                      {stats.map((entry, index) => (
                        <Cell key={`cell-actual-${index}`} fill="#4f46e5" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        ) : (
          /* 부서 상세 화면 (Drill-down View) */
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {teamDetail ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                  <Card className="rounded-3xl border-none shadow-lg bg-indigo-600 text-white p-4">
                    <CardDescription className="text-indigo-200 font-bold uppercase text-[9px]">구성원 수</CardDescription>
                    <div className="flex items-center justify-between mt-1">
                      <CardTitle className="text-2xl font-black italic">{teamDetail.totalHeadcount}명</CardTitle>
                      <Users className="h-6 w-6 opacity-40" />
                    </div>
                  </Card>
                  <Card className="rounded-3xl border-none shadow-lg bg-white p-4 ring-1 ring-slate-100">
                    <CardDescription className="text-slate-400 font-bold uppercase text-[9px]">팀 총 예산</CardDescription>
                    <div className="flex items-center justify-between mt-1">
                      <CardTitle className="text-2xl font-black text-slate-900 italic tracking-tighter">{teamDetail.totalPlanned.toLocaleString()}</CardTitle>
                      <Badge variant="secondary" className="bg-slate-100 text-[10px] font-bold">KRW</Badge>
                    </div>
                  </Card>
                  <Card className="rounded-3xl border-none shadow-lg bg-white p-4 ring-1 ring-slate-100">
                    <CardDescription className="text-slate-400 font-bold uppercase text-[9px]">실제 지출액</CardDescription>
                    <div className="flex items-center justify-between mt-1">
                      <CardTitle className="text-2xl font-black text-indigo-600 italic tracking-tighter">{teamDetail.totalActual.toLocaleString()}</CardTitle>
                      <ArrowUpRight className="h-5 w-5 text-indigo-500 opacity-40" />
                    </div>
                  </Card>
                  <Card className={`rounded-3xl border-none shadow-lg p-4 ring-1 ring-slate-100 ${teamDetail.totalPlanned - teamDetail.totalActual < 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <CardDescription className="text-slate-500 font-bold uppercase text-[9px]">팀 잔액</CardDescription>
                    <div className="flex items-center justify-between mt-1">
                      <CardTitle className={`text-2xl font-black italic tracking-tighter ${teamDetail.totalPlanned - teamDetail.totalActual < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {(teamDetail.totalPlanned - teamDetail.totalActual).toLocaleString()}
                      </CardTitle>
                      <CheckCircle2 className={`h-5 w-5 opacity-40 ${teamDetail.totalPlanned - teamDetail.totalActual < 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                    </div>
                  </Card>
                </div>

                <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden ring-1 ring-slate-100 min-h-[500px]">
                  <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <div className="h-5 w-1 bg-indigo-600 rounded-full" />
                        {teamDetail.orgName} 상세 집행 내역
                      </CardTitle>
                      <p className="text-xs font-bold text-slate-400 mt-1">사원별 배정 예산 대비 실제 지출 현황 (이력 기준)</p>
                    </div>
                    <Button variant="ghost" className="rounded-xl text-slate-400 hover:text-slate-900" onClick={resetSelection}>
                      전체 보기로 돌아가기
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                          <TableHead className="w-[150px] font-black text-slate-400 text-[10px] uppercase tracking-widest pl-8">성명</TableHead>
                          <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">부서</TableHead>
                          <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">직급</TableHead>
                          <TableHead className="text-right font-black text-slate-400 text-[10px] uppercase tracking-widest">배정 예산</TableHead>
                          <TableHead className="text-right font-black text-slate-400 text-[10px] uppercase tracking-widest">실 집행액</TableHead>
                          <TableHead className="text-right font-black text-slate-400 text-[10px] uppercase tracking-widest pr-8">잔고</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamDetail.members.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-bold">해당 부서에 소속된 사원이 없습니다.</TableCell>
                          </TableRow>
                        ) : (
                          teamDetail.members.map((member) => (
                            <TableRow key={member.employeeCode} className="border-slate-50 hover:bg-indigo-50/30 transition-colors group">
                              <TableCell className="font-black text-slate-900 pl-8">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                    <User className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                                  </div>
                                  {member.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-bold text-slate-600">{member.orgName}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-bold border-slate-200 text-slate-500 rounded-lg">{member.position}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold text-slate-500">
                                {member.plannedBudget.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{member.actualExpense.toLocaleString()}</span>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                <span className={`font-black italic ${member.remainingBudget < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                  {member.remainingBudget.toLocaleString()}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-slate-200 rounded-[3rem] bg-white text-slate-400">
                <RefreshCw className="h-10 w-10 animate-spin opacity-20 mb-4" />
                <p className="font-bold">부서 데이터를 불러오는 중입니다...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
