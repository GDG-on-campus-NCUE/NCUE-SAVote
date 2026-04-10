import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import { api } from "../../auth/services/auth.api";
import { API_ENDPOINTS } from "../../../lib/constants";
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { AdminHeader } from '../components/AdminHeader';
import { type Election, type Candidate, UserRole } from "@savote/shared-types";
import { Loader2, RefreshCw, Activity } from "lucide-react";
import { Navigate } from "react-router-dom";
import { TallyResultsBoard } from '../../../components/TallyResultsBoard';

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
        <Card className="p-8 rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)] elevation-1">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
                <div className="flex-1 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface-variant)] px-1">
                        <Activity className="w-4 h-4 text-[var(--color-primary)]" />
                        選擇欲監控的選舉案件
                    </label>
                    <div className="relative group">
                        <select
                            className="w-full appearance-none rounded-xl bg-[var(--color-surface-container-high)] border-2 border-transparent focus:border-[var(--color-primary)]/30 text-[var(--color-on-surface)] px-6 py-4 focus:outline-none transition-all cursor-pointer hover:bg-[var(--color-surface-container-highest)] font-bold text-lg elevation-1"
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
                    className="h-16 px-8 rounded-xl font-bold elevation-1 hover:elevation-2"
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
            <div className="flex flex-col items-center justify-center py-24 bg-[var(--color-surface-container-low)] rounded-3xl animate-pulse">
                <Loader2 className="w-12 h-12 animate-spin text-[var(--color-primary)] mb-4" />
                <p className="text-lg font-bold text-[var(--color-on-surface-variant)]">正在安全取得計票統計數據...</p>
            </div>
        )}

        {summary && summary.tally && (
            <TallyResultsBoard summary={summary} />
        )}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
