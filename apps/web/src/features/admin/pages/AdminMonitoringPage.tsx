import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/hooks/useAuth";
import { api } from "../../auth/services/auth.api";
import { API_ENDPOINTS } from "../../../lib/constants";
import { Card } from "../../../components/m3/Card";
import { Button } from "../../../components/m3/Button";
import { type Election, ElectionStatus, type Candidate } from "@savote/shared-types";
import { Loader2, RefreshCw, BarChart3, ArrowLeft, Trophy, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  status: ElectionStatus | string;
  totalVotes: number;
  tally: VoteServiceTally;
}

export function AdminMonitoringPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");

  const { data: elections = [] } = useQuery({
    queryKey: ["elections"],
    queryFn: async () => {
      const res = await api.get<Election[]>(API_ENDPOINTS.ELECTIONS.LIST);
      return res.data;
    },
  });

  const { data: summary, isLoading, refetch, isFetching, error } = useQuery<
    AdminSummaryResponse
  >({
    queryKey: ["admin-summary", selectedElectionId],
    queryFn: async () => {
      if (!selectedElectionId) throw new Error("No election selected");
      const base = API_ENDPOINTS.ELECTIONS.GET(selectedElectionId);
      const res = await api.get<AdminSummaryResponse>(
        `${base}/admin-summary`,
      );
      return res.data;
    },
    enabled: !!selectedElectionId,
    refetchOnWindowFocus: false,
  });

  const closedOrTallied = elections.filter(
    (e) =>
      e.status === ElectionStatus.VOTING_CLOSED ||
      e.status === ElectionStatus.TALLIED,
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-24 space-y-6">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
            <Button variant="tonal" className="rounded-full w-10 h-10 p-0 shrink-0" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-on-background)]">{t('admin.monitoring', 'Vote Monitoring')}</h1>
                <p className="text-[var(--color-on-surface-variant)] mt-1">
                {t('admin.monitoring_desc', 'View results for closed elections.')}
                </p>
            </div>
        </div>
        {user && (
          <div className="flex items-center gap-2 self-start bg-[var(--color-surface-container)] px-4 py-2 rounded-full border border-[var(--color-outline-variant)]">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-xs font-mono font-medium text-[var(--color-on-surface)]">
                ADMIN: {user.name || user.studentIdHash?.substring(0, 6)}
             </span>
          </div>
        )}
      </header>

      <div className="animate-slide-up delay-100">
        <Card className="p-6 mb-6 border-l-4 border-[var(--color-secondary)]">
            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface-variant)] mb-2 px-1">
                {t('admin.select_closed_election', 'Select Closed Election')}
                </label>
                <div className="relative">
                    <select
                        className="w-full appearance-none rounded-lg bg-[var(--color-surface-container-high)] border-b-2 border-[var(--color-outline)] text-[var(--color-on-surface)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none transition-colors cursor-pointer hover:bg-[var(--color-surface-container-highest)]"
                        value={selectedElectionId}
                        onChange={(e) => setSelectedElectionId(e.target.value)}
                    >
                    <option value="">{t('common.select', 'Select...')}</option>
                    {closedOrTallied.map((election) => (
                        <option key={election.id} value={election.id}>
                        {election.name} ({election.status})
                        </option>
                    ))}
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-on-surface-variant)]">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
                {closedOrTallied.length === 0 && (
                <p className="mt-2 text-xs text-[var(--color-error)] flex items-center gap-1">
                     <span className="w-1 h-1 rounded-full bg-current" />
                    {t('admin.no_closed_elections', 'No closed or tallied elections found.')}
                </p>
                )}
            </div>

            <div className="flex items-center justify-between pt-2">
                <Button
                    onClick={() => selectedElectionId && refetch()}
                    disabled={!selectedElectionId || isFetching}
                    loading={isFetching}
                    variant="tonal"
                    icon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
                >
                {t('common.refresh', 'Refresh Data')}
                </Button>
                {error && (
                <p className="text-xs text-[var(--color-error)] bg-[var(--color-error-container)] px-3 py-1 rounded-full">
                    {t('common.error_loading', 'Error loading data.')}
                </p>
                )}
            </div>
            </div>
        </Card>

        {isLoading && selectedElectionId && (
            <div className="flex justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
                    <p className="text-sm text-[var(--color-on-surface-variant)] animate-pulse">Fetching results...</p>
                </div>
            </div>
        )}

        {summary && summary.tally && (
            <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
            {/* Summary Card */}
            <Card className="md:col-span-1 p-6 h-fit bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-container)] space-y-6">
                <div className="flex items-center gap-2 mb-2 text-[var(--color-primary)]">
                    <div className="p-2 bg-[var(--color-primary-container)] rounded-lg text-[var(--color-on-primary-container)]">
                         <BarChart3 className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-wider">
                    {t('admin.summary', 'Summary')}
                    </h2>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <p className="text-xs font-medium text-[var(--color-on-surface-variant)] uppercase mb-1">{t('common.election', 'Election')}</p>
                        <p className="text-xl font-bold text-[var(--color-on-surface)] leading-tight">
                        {summary.election.name}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-medium text-[var(--color-on-surface-variant)] uppercase mb-1">{t('admin.total_votes', 'Total Votes')}</p>
                            <p className="text-2xl font-black text-[var(--color-primary)] tracking-tight">
                            {summary.totalVotes}
                            </p>
                        </div>
                        <div>
                             <p className="text-xs font-medium text-[var(--color-on-surface-variant)] uppercase mb-1">Total Eligible</p>
                             <div className="flex items-center gap-1 text-[var(--color-on-surface)]">
                                <Users className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
                                <span className="text-xl font-bold">{summary.tally.totalEligibleVoters}</span>
                             </div>
                        </div>
                    </div>

                    <div className="h-px bg-[var(--color-outline-variant)] opacity-50" />

                    {/* Result Note */}
                     <div className="bg-[var(--color-surface-container-high)] p-4 rounded-xl border border-[var(--color-outline-variant)]">
                        <div className="flex items-start gap-2">
                             <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                             <div>
                                 <p className="text-xs font-bold uppercase text-[var(--color-on-surface-variant)] mb-1">Result</p>
                                 <p className="text-sm font-medium text-[var(--color-on-surface)]">
                                     {summary.tally.result.note}
                                 </p>
                                 {summary.tally.result.threshold && (
                                     <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">
                                         Threshold: {summary.tally.result.threshold} votes
                                     </p>
                                 )}
                             </div>
                        </div>
                     </div>
                </div>
            </Card>

            {/* Detailed Results */}
            <Card className="md:col-span-2 p-6">
                <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-6 flex items-center gap-2">
                    {t('admin.tally_results', 'Tally Results')}
                    <span className="text-xs font-normal text-[var(--color-on-surface-variant)] bg-[var(--color-surface-variant)] px-2 py-1 rounded-full ml-auto">
                        Official Count
                    </span>
                </h2>
                {(!summary.tally.candidates || summary.tally.candidates.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--color-on-surface-variant)] opacity-60">
                     <BarChart3 className="w-12 h-12 mb-2" />
                    <p className="text-sm">
                        {t('admin.no_tally', 'No tally data available.')}
                    </p>
                </div>
                ) : (
                <div className="space-y-4">
                    {summary.tally.candidates
                         .sort((a, b) => b.voteCount - a.voteCount)
                         .map((candidate, index) => {
                        const count = candidate.voteCount;
                        const percentage = summary.totalVotes > 0 ? (count / summary.totalVotes) * 100 : 0;
                        
                        // Determine if winner based on result object
                        let isWinner = false;
                        if (summary.tally.result.winner?.id === candidate.id) isWinner = true;
                        if (summary.tally.result.winners?.some(w => w.id === candidate.id)) isWinner = true;
                        
                        return (
                            <div
                                key={candidate.id}
                                className={`p-4 rounded-xl border transition-all duration-500 ${isWinner ? 'bg-[var(--color-primary-container)]/20 border-[var(--color-primary)]' : 'bg-[var(--color-surface-variant)]/30 border-transparent'}`}
                            >
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {isWinner ? (
                                             <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-on-primary)] shadow-sm">
                                                 <Trophy className="w-4 h-4" />
                                             </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-[var(--color-surface-variant)] flex items-center justify-center text-[var(--color-on-surface-variant)] font-bold text-xs">
                                                {index + 1}
                                            </div>
                                        )}
                                        <div>
                                            <span className={`text-base font-bold truncate block ${isWinner ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface)]'}`}>
                                                {candidate.name}
                                            </span>
                                            <span className="text-xs text-[var(--color-on-surface-variant)] truncate">
                                                {candidate.bio}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-[var(--color-on-surface)] tabular-nums block leading-none">
                                            {count}
                                        </span>
                                        <span className="text-xs text-[var(--color-on-surface-variant)] font-medium">
                                            {percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full h-3 bg-[var(--color-surface-variant)] rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isWinner ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-secondary)]'}`} 
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
        )}
      </div>
    </div>
  );
}