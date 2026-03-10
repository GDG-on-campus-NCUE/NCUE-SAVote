import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import { api } from "../../auth/services/auth.api";
import { API_ENDPOINTS } from "../../../lib/constants";
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { AdminHeader } from '../components/AdminHeader';
import { type Election, type Candidate, UserRole } from "@savote/shared-types";
import { Loader2, RefreshCw, BarChart3, Trophy, Users, PieChart, Activity, CheckCircle2 } from "lucide-react";
import { Navigate } from "react-router-dom";

interface VoteServiceTally {
    tally: Record<string, number>;
    totalVotes: number;
    totalEligibleVoters: number;
    candidates: (Candidate & { voteCount: number })[];
    result: {
        type?: string;
        winner?: Candidate;
        winners?: Candidate[];
        threshold?: number;
        tie?: boolean;
        note?: string;
        isElected?: boolean;
    };
}

interface AdminSummaryResponse {
  election: Election;
  totalVotes: number;
  tally: VoteServiceTally;
}

export function AdminMonitoringPage() {
  const { user } = useAuth();
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  const { data: elections = [] } = useQuery({
    queryKey: ["elections"],
    queryFn: async () => {
      const res = await api.get<Election[]>(API_ENDPOINTS.ELECTIONS.LIST);
      return res.data;
    },
  });

  const { data: summary, isLoading, refetch, isFetching } = useQuery<AdminSummaryResponse>({
    queryKey: ["admin-summary", selectedElectionId],
    queryFn: async () => {
      if (!selectedElectionId) throw new Error("No election selected");
      const base = API_ENDPOINTS.ELECTIONS.GET(selectedElectionId);
      const res = await api.get<AdminSummaryResponse>(`${base}/admin-summary`);
      return res.data;
    },
    enabled: !!selectedElectionId,
    refetchOnWindowFocus: false,
  });

  if (user && !isAdmin) return <Navigate to="/" replace />;
  if (!user) return null;

  const now = new Date();
  const monitorableElections = elections.filter(
    (e) => e.endTime && now > new Date(e.endTime)
  );

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      <AdminHeader 
        title="開票監控中心"
        subtitle="查看已結束選舉的即時統計結果與當選情況。"
      />

      <div className="grid gap-8">
        {/* Selection Card */}
        <Card className="p-8 rounded-[32px] border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)] elevation-1">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
                <div className="flex-1 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface-variant)] px-1">
                        <Activity className="w-4 h-4 text-[var(--color-primary)]" />
                        選擇欲監控的選舉案件
                    </label>
                    <div className="relative group">
                        <select
                            className="w-full appearance-none rounded-2xl bg-[var(--color-surface-container-high)] border-2 border-transparent focus:border-[var(--color-primary)]/30 text-[var(--color-on-surface)] px-6 py-4 focus:outline-none transition-all cursor-pointer hover:bg-[var(--color-surface-container-highest)] font-bold text-lg elevation-1"
                            value={selectedElectionId}
                            onChange={(e) => setSelectedElectionId(e.target.value)}
                        >
                            <option value="">請選擇已結束的選舉...</option>
                            {monitorableElections.map((election) => (
                                <option key={election.id} value={election.id}>
                                    {election.name} — 已於 {new Date(election.endTime!).toLocaleDateString()} 結束
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center text-[var(--color-on-surface-variant)]">
                            <svg className="fill-current h-5 w-5 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => selectedElectionId && refetch()}
                    disabled={!selectedElectionId || isFetching}
                    loading={isFetching}
                    variant="tonal"
                    className="h-16 px-8 rounded-2xl font-bold elevation-1 hover:elevation-2"
                    icon={<RefreshCw className={cn("w-5 h-5", isFetching && "animate-spin")} />}
                >
                    同步最新數據
                </Button>
            </div>
            {monitorableElections.length === 0 && (
                <p className="mt-4 text-sm text-[var(--color-error)] font-medium bg-[var(--color-error-container)]/20 px-4 py-2 rounded-xl border border-[var(--color-error-container)]">
                    目前暫無已結束的選舉項目。
                </p>
            )}
        </Card>

        {isLoading && selectedElectionId && (
            <div className="flex flex-col items-center justify-center py-24 bg-[var(--color-surface-container-low)] rounded-[40px] animate-pulse">
                <Loader2 className="w-12 h-12 animate-spin text-[var(--color-primary)] mb-4" />
                <p className="text-lg font-bold text-[var(--color-on-surface-variant)]">正在安全取得計票統計數據...</p>
            </div>
        )}

        {summary && summary.tally && (
            <div className="grid gap-8 md:grid-cols-12 animate-slide-up">
                {/* Statistics Sidebar */}
                <div className="md:col-span-4 space-y-6">
                    <Card className="p-8 rounded-[32px] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border-none elevation-2">
                        <div className="flex items-center gap-3 mb-8">
                             <div className="p-2 bg-[var(--color-on-primary-container)]/10 rounded-xl">
                                <BarChart3 className="w-6 h-6" />
                             </div>
                             <h3 className="type-title-large font-black uppercase tracking-widest">數據統計</h3>
                        </div>
                        
                        <div className="space-y-8">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold opacity-60 mb-1">總投票數</span>
                                <span className="text-5xl font-black tracking-tighter tabular-nums leading-none">
                                    {summary.totalVotes}
                                </span>
                            </div>
                            
                            <div className="flex flex-col border-t border-[var(--color-on-primary-container)]/10 pt-6">
                                <span className="text-xs font-bold opacity-60 mb-1">合格選舉人數</span>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 opacity-60" />
                                    <span className="text-3xl font-black tabular-nums">
                                        {summary.tally.totalEligibleVoters}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col border-t border-[var(--color-on-primary-container)]/10 pt-6">
                                <span className="text-xs font-bold opacity-60 mb-2">投票參與率</span>
                                <div className="h-4 bg-[var(--color-on-primary-container)]/10 rounded-full overflow-hidden mb-2 border border-[var(--color-on-primary-container)]/10">
                                    <div 
                                        className="h-full bg-[var(--color-on-primary-container)] rounded-full transition-all duration-1000"
                                        style={{ width: `${(summary.totalVotes / (summary.tally.totalEligibleVoters || 1)) * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm font-black text-right opacity-80">
                                    {((summary.totalVotes / (summary.tally.totalEligibleVoters || 1)) * 100).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Result Card */}
                    <Card className="p-8 rounded-[32px] bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 elevation-1">
                        <div className="flex items-start gap-4 mb-4">
                             <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
                                <Trophy className="w-6 h-6" />
                             </div>
                             <div>
                                 <h4 className="type-title-medium font-bold text-[var(--color-on-surface)]">選舉結論</h4>
                                 <p className="text-xs text-[var(--color-on-surface-variant)] opacity-70">官方判定結果</p>
                             </div>
                        </div>
                        <p className="text-lg font-bold text-[var(--color-on-surface)] leading-relaxed bg-[var(--color-surface-container-high)] p-4 rounded-2xl border border-[var(--color-outline-variant)]/30">
                            {summary.tally.result.note || '正在核對中...'}
                        </p>
                        {summary.tally.result.threshold && (
                            <div className="mt-4 flex items-center justify-between px-2 text-xs font-bold text-[var(--color-on-surface-variant)]">
                                <span>法定當選門檻</span>
                                <span className="px-2 py-1 bg-[var(--color-surface-container-highest)] rounded-lg tabular-nums">
                                    {summary.tally.result.threshold} 票
                                </span>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Candidate Breakdown */}
                <div className="md:col-span-8">
                    <Card className="p-8 rounded-[40px] border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)] elevation-1">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-[var(--color-on-surface)] flex items-center gap-3">
                                <PieChart className="w-7 h-7 text-[var(--color-primary)]" />
                                詳細計票數據
                            </h2>
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] font-bold text-xs border border-[var(--color-outline-variant)]/30">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                官方稽核完成
                            </div>
                        </div>

                        {(!summary.tally.candidates || summary.tally.candidates.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-20 text-[var(--color-on-surface-variant)] opacity-40">
                                <BarChart3 className="w-16 h-16 mb-4" />
                                <p className="font-bold">尚無任何有效的計票資料</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {summary.tally.candidates
                                     .sort((a, b) => b.voteCount - a.voteCount)
                                     .map((candidate, index) => {
                                    const count = candidate.voteCount;
                                    const percentage = summary.totalVotes > 0 ? (count / summary.totalVotes) * 100 : 0;
                                    
                                    const isWinner = summary.tally.result.winner?.id === candidate.id || 
                                                     summary.tally.result.winners?.some(w => w.id === candidate.id);
                                    
                                    return (
                                        <div
                                            key={candidate.id}
                                            className={cn(
                                                "p-6 rounded-[28px] border transition-all duration-500 relative group overflow-hidden",
                                                isWinner 
                                                    ? "bg-[var(--color-primary-container)]/10 border-[var(--color-primary)] elevation-2" 
                                                    : "bg-[var(--color-surface-container-low)] border-transparent hover:bg-[var(--color-surface-container-high)]"
                                            )}
                                        >
                                            {isWinner && (
                                                <div className="absolute top-0 right-0 px-4 py-1 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-black text-[10px] tracking-widest uppercase rounded-bl-xl elevation-2">
                                                    Winner
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-between items-start mb-4 relative z-10">
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-all duration-500",
                                                        isWinner 
                                                            ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] elevation-3 rotate-6" 
                                                            : "bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)]"
                                                    )}>
                                                        {isWinner ? <Trophy className="w-6 h-6" /> : index + 1}
                                                    </div>
                                                    <div>
                                                        <span className={cn(
                                                            "text-xl font-black block mb-1",
                                                            isWinner ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface)]"
                                                        )}>
                                                            {candidate.name}
                                                        </span>
                                                        <span className="text-xs font-medium text-[var(--color-on-surface-variant)] opacity-60">
                                                            {candidate.bio || '候選人描述尚無'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-3xl font-black text-[var(--color-on-surface)] tabular-nums leading-none">
                                                            {count}
                                                        </span>
                                                        <span className="text-sm font-bold opacity-50">票</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-[var(--color-primary)] opacity-70 mt-1">
                                                        {percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full h-4 bg-[var(--color-surface-container-highest)] rounded-full overflow-hidden border border-[var(--color-outline-variant)]/20">
                                                <div 
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000 ease-out",
                                                        isWinner ? "bg-[var(--color-primary)]" : "bg-[var(--color-secondary)] opacity-60"
                                                    )} 
                                                    style={{ width: `${percentage}%` }} 
                                                />
                                            </div>
                                        </div>
                                    )
                                    }
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
