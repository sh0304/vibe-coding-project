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
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  Info,
  Wallet,
  RefreshCw
} from "lucide-react";
import { getOrganizationStats } from "../actions";
import { OrganizationStat } from "../schemas";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export function StatisticsConsole() {
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<"MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");
  const [stats, setStats] = useState<OrganizationStat[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchStats = async () => {
    startTransition(async () => {
      const result = await getOrganizationStats({ targetDate, period });
      if (result.success && result.data) {
        setStats(result.data);
      }
    });
  };

  useEffect(() => {
    fetchStats();
  }, [targetDate, period]);

  const totalPlanned = stats.reduce((acc, s) => acc + s.plannedBudget, 0);
  const totalActual = stats.reduce((acc, s) => acc + s.actualExpense, 0);
  const totalHeadcount = stats.reduce((acc, s) => acc + s.headcount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Controls Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200">
            <Input
              type="date"
              className="w-40 border-0 bg-transparent focus-visible:ring-0 font-bold text-indigo-600"
              value={format(targetDate, "yyyy-MM-dd")}
              onChange={(e) => setTargetDate(new Date(e.target.value))}
            />
            <div className="w-px h-6 bg-slate-100 mx-1" />
            <Select value={period} onValueChange={(v: "MONTHLY" | "QUARTERLY" | "YEARLY" | null) => v && setPeriod(v)}>
              <SelectTrigger className="w-28 h-10 border-0 bg-transparent focus:ring-0 font-bold text-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">월간</SelectItem>
                <SelectItem value="QUARTERLY">분기</SelectItem>
                <SelectItem value="YEARLY">연간</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-2xl border-slate-200 bg-white"
            onClick={fetchStats}
            disabled={isPending}
          >
            <RefreshCw className={`h-5 w-5 text-slate-600 ${isPending ? 'animate-spin' : ''}`} />
          </Button>

          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className="h-12 px-6 rounded-2xl border-slate-200 font-bold gap-2 text-slate-600 bg-white"
                />
              }
            >
              <Info className="h-5 w-5" />
              예산 책정 기준
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-lg p-0 overflow-hidden border-none shadow-2xl bg-white text-slate-900">
              <div className="bg-slate-900 p-8 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">예산 책정 가이드라인</DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-bold text-slate-700">복리후생비 (WELFARE)</span>
                    <span className="font-black text-indigo-600">100,000 / 인</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-bold text-slate-700">교육훈련비 (EDUCATION)</span>
                    <span className="font-black text-indigo-600">50,000 / 인</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="font-bold text-slate-700">부서활동비 (ACTIVITY)</span>
                    <span className="font-black text-indigo-600">80,000 / 인</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-0 shadow-lg bg-slate-900 text-white overflow-hidden relative p-4">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-bold">전사 팀 합산 예산</CardDescription>
            <CardTitle className="text-4xl font-black italic">
              {(totalPlanned).toLocaleString()} 원
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-[2rem] border-0 shadow-lg bg-white overflow-hidden border-b-4 border-indigo-500 p-4">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-bold">실제 집행 총액</CardDescription>
            <CardTitle className="text-4xl font-black text-slate-900 italic">
              {(totalActual).toLocaleString()} 원
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-[2rem] border-0 shadow-lg bg-white overflow-hidden border-b-4 border-slate-200 p-4">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-bold">팀 소속 총 인원</CardDescription>
            <CardTitle className="text-4xl font-black text-slate-900 italic">
              {totalHeadcount}명
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-[3rem] border-0 shadow-2xl bg-white p-10 ring-1 ring-slate-100">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">부서별 예산 분석</h3>
          </div>
        </div>
        <div className="h-[500px] w-full">
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
                  borderRadius: '1.5rem',
                  border: 'none',
                  boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                  padding: '1.5rem',
                  fontWeight: 800
                }}
              />
              <Bar name="목표 예산" dataKey="plannedBudget" fill="#eceff1" radius={[12, 12, 12, 12]} barSize={40} />
              <Bar name="실제 지출" dataKey="actualExpense" fill="#4f46e5" radius={[12, 12, 12, 12]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
