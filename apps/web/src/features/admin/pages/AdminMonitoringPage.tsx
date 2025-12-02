import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import { api } from "../../auth/services/auth.api";
import { API_ENDPOINTS } from "../../../lib/constants";
import { PageShell } from "../../../components/layout/PageShell";
import { GlassCard } from "../../../components/ui/GlassCard";
import { type Election, ElectionStatus } from "@savote/shared-types";

interface AdminSummaryResponse {
  election: Election;
  status: ElectionStatus | string;
  totalVotes: number;
  tally: Record<string, number>;
}

export function AdminMonitoringPage() {
  const { user } = useAuth();
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
    <PageShell>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">開票監控</h1>
            <p className="mt-1 text-sm text-gray-300">
              僅在投票結束後開放，提供總票數與候選人得票情況。
            </p>
          </div>
          {user && (
            <span className="px-3 py-1 glass-subtle text-purple-200 rounded-full text-xs font-semibold">
              Admin {user.studentIdHash?.substring(0, 6)}
            </span>
          )}
        </header>

        <GlassCard>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                選擇已結束之選舉
              </label>
              <select
                className="w-full rounded-md bg-black/40 border border-white/10 text-sm text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-purple-400/60 backdrop-blur"
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionId(e.target.value)}
              >
                <option value="">請選擇選舉</option>
                {closedOrTallied.map((election) => (
                  <option key={election.id} value={election.id}>
                    {election.name} ({election.status})
                  </option>
                ))}
              </select>
              {closedOrTallied.length === 0 && (
                <p className="mt-2 text-xs text-gray-400">
                  目前沒有狀態為「VOTING_CLOSED」或「TALLIED」的選舉。
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => selectedElectionId && refetch()}
                disabled={!selectedElectionId || isFetching}
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white glass-strong border border-purple-400/60 hover:border-purple-300 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isFetching ? "重新整理中..." : "重新整理資料"}
              </button>
              {error && (
                <p className="text-xs text-red-400">
                  無法載入資料，請稍後再試。
                </p>
              )}
            </div>
          </div>
        </GlassCard>

        {isLoading && selectedElectionId && (
          <GlassCard>
            <div className="py-10 text-center text-gray-300">
              載入中...
            </div>
          </GlassCard>
        )}

        {summary && (
          <div className="grid gap-4 md:grid-cols-3">
            <GlassCard className="md:col-span-1">
              <h2 className="text-sm font-semibold text-gray-200 mb-2">
                概要資訊
              </h2>
              <p className="text-base font-medium text-white mb-1">
                {summary.election.name}
              </p>
              <p className="text-xs text-gray-300 mb-1">
                狀態：{summary.status}
              </p>
              <p className="text-xs text-gray-300">
                總投票數：
                <span className="font-semibold text-white ml-1">
                  {summary.totalVotes}
                </span>
              </p>
            </GlassCard>

            <GlassCard className="md:col-span-2">
              <h2 className="text-sm font-semibold text-gray-200 mb-3">
                候選人得票統計
              </h2>
              {Object.keys(summary.tally).length === 0 ? (
                <p className="text-sm text-gray-300">
                  尚無任何票數或 tally 資料。
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(summary.tally).map(
                    ([candidateId, count]) => (
                      <div
                        key={candidateId}
                        className="flex items-center justify-between text-sm text-gray-100"
                      >
                        <span className="truncate mr-2" title={candidateId}>
                          {candidateId}
                        </span>
                        <span className="font-mono text-right min-w-[3rem]">
                          {count as number}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </GlassCard>
          </div>
        )}
      </main>
    </PageShell>
  );
}
