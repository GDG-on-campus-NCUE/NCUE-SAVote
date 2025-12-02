import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { type Election, ElectionStatus } from '@savote/shared-types';
import { PageShell } from '../../../components/layout/PageShell';
import { GlassCard } from '../../../components/ui/GlassCard';
// dev-only local verification (進階檢驗工具)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - snarkjs has no official types but is bundled already
import * as snarkjs from 'snarkjs';

interface Tally {
  [candidateId: string]: number;
}

interface AuditLog {
  id: string;
  nullifier: string;
  proof: any;
  publicSignals: string[];
  createdAt: string;
}

export function VerificationCenter() {
  const { electionId } = useParams<{ electionId: string }>();
  const [nullifierInput, setNullifierInput] = useState('');
  const [nullifierResult, setNullifierResult] = useState<null | { exists: boolean; createdAt?: string }>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [localVerifyStatus, setLocalVerifyStatus] = useState<null | { ok: boolean; message: string }>(null);
  const [isVerifyingLocally, setIsVerifyingLocally] = useState(false);

  const { data: election, isLoading: isLoadingElection } = useQuery({
    queryKey: ['election', electionId],
    queryFn: async () => {
      const response = await api.get<Election>(API_ENDPOINTS.ELECTIONS.GET(electionId!));
      return response.data;
    },
    enabled: !!electionId,
  });

  // Check if results are available (only after election is closed)
  const canViewResults = election?.status === ElectionStatus.VOTING_CLOSED || election?.status === ElectionStatus.TALLIED;

  const { data: tally, isLoading: isLoadingTally } = useQuery({
    queryKey: ['tally', electionId],
    queryFn: async () => {
      const response = await api.get<Tally>(API_ENDPOINTS.VOTES.TALLY(electionId!));
      return response.data;
    },
    enabled: !!electionId && canViewResults,
    retry: false,
  });

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['logs', electionId],
    queryFn: async () => {
      const response = await api.get<AuditLog[]>(API_ENDPOINTS.VOTES.LOGS(electionId!));
      return response.data;
    },
    enabled: !!electionId && canViewResults,
    retry: false,
  });

  if (isLoadingElection || isLoadingTally || isLoadingLogs) {
    return (
      <PageShell>
        <div className="min-h-[60vh] flex justify-center items-center">
          <div className="spinner h-12 w-12" />
        </div>
      </PageShell>
    );
  }

  if (!election) {
    return (
      <PageShell>
        <div className="px-6 py-10 text-center">
          <h2 className="text-white text-xl font-semibold mb-2">Election not found</h2>
          <Link to="/" className="text-blue-300 hover:text-white">Back to Home</Link>
        </div>
      </PageShell>
    );
  }

  const handleCheckNullifier = async () => {
    setNullifierResult(null);
    if (!nullifierInput.trim()) return;
    try {
      const res = await api.get(`/votes/${electionId}/check-nullifier/${nullifierInput.trim()}`);
      const data = res.data as { exists: boolean; vote?: { createdAt: string } };
      setNullifierResult({
        exists: data.exists,
        createdAt: data.vote?.createdAt,
      });
    } catch {
      // 靜默失敗即可
    }
  };

  const totalVotes = Object.values(tally || {}).reduce((a, b) => a + b, 0);

  const handleExportLogs = () => {
    if (!logs || logs.length === 0) return;
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savote-audit-${electionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLocalVerify = async () => {
    if (!selectedLog) return;
    setIsVerifyingLocally(true);
    setLocalVerifyStatus(null);
    try {
      // verification_key.json 由部署時放在 /zk 下，前端可讀
      const vkRes = await fetch('/zk/verification_key.json');
      const vk = await vkRes.json();
      const ok = await snarkjs.groth16.verify(vk, selectedLog.publicSignals, selectedLog.proof);
      setLocalVerifyStatus({ ok, message: ok ? '本地驗證成功：此 proof 與 publicSignals 與電路/verifier 相容。' : '本地驗證失敗：請檢查 verification_key 或資料是否被竄改。' });
    } catch (e: any) {
      setLocalVerifyStatus({ ok: false, message: `本地驗證時發生錯誤：${e?.message ?? '未知錯誤'}` });
    } finally {
      setIsVerifyingLocally(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <Link to="/" className="text-blue-200 hover:text-white inline-flex items-center mb-3">← Back to Home</Link>
          <h1 className="text-3xl font-bold text-white">Verification Center</h1>
          <p className="text-gray-300">Election: {election.name}</p>
        </header>

        <div className="mb-6 p-4 glass-subtle rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-2">使用自己的 Nullifier 驗證選票是否入匭</h3>
          <p className="text-xs text-gray-300 mb-3">
            將您本地計算或備份的 Nullifier 輸入下方欄位，我們只會檢查該值是否存在於此選舉的紀錄中，不會透露您投給誰。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              className="flex-1 rounded-lg bg-white/5 border border-white/20 px-3 py-2 text-white text-xs font-mono placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="貼上您的 Nullifier (例如：Poseidon(secret, electionId) 的結果)"
              value={nullifierInput}
              onChange={(e) => setNullifierInput(e.target.value)}
            />
            <button
              onClick={handleCheckNullifier}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white glass-strong border border-blue-400/60 hover:border-blue-300 hover:bg-blue-500/20 transition-all"
            >
              查詢
            </button>
          </div>
          {nullifierResult && (
            <p className="mt-3 text-xs text-gray-200">
              {nullifierResult.exists
                ? `✅ 找到對應紀錄，您的選票已於 ${nullifierResult.createdAt ? new Date(nullifierResult.createdAt).toLocaleString() : '系統紀錄時間'} 成功入匭。`
                : '❌ 此 Nullifier 在該選舉中尚未找到紀錄，請確認輸入是否正確。'}
            </p>
          )}
        </div>

        {!canViewResults && (
          <GlassCard className="mb-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/20 mb-4">
                <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">結果尚未開放</h3>
              <p className="text-gray-300 mb-4">
                此選舉的結果和驗證資料將在管理員設定為投票截止後開放查看。
              </p>
              <div className="inline-flex items-center px-3 py-1 glass-subtle rounded-full text-sm">
                <span className="text-gray-300">目前狀態：</span>
                <span className={`ml-2 font-medium ${
                  election.status === ElectionStatus.VOTING_OPEN ? 'text-green-300' : 'text-yellow-300'
                }`}>
                  {election.status === ElectionStatus.VOTING_OPEN ? '投票進行中' : election.status}
                </span>
              </div>
            </div>
          </GlassCard>
        )}

        {canViewResults && <div className="grid gap-6 md:grid-cols-2">
          {/* Results Section */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-white mb-6">Election Results</h2>
            <div className="mb-4">
              <p className="text-blue-200 font-medium">Total Votes: {totalVotes}</p>
            </div>
            <div className="grid gap-3">
              {election.candidates.map(candidate => {
                const votes = tally?.[candidate.id] || 0;
                const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                return (
                  <div key={candidate.id} className="glass-subtle border border-white/10 p-4 rounded-lg">
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-white/90 font-medium">{candidate.name}</span>
                      <span className="text-blue-200 font-semibold">{votes} votes ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-[width] duration-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Audit Logs Section */}
          <GlassCard>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div>
                <h2 className="text-xl font-semibold text-white">Audit Logs</h2>
                <p className="text-gray-300 text-sm">
                  這裡是所有匿名 ZK 證明的原始紀錄，可供第三方審計與本地驗證。
                </p>
              </div>
              {logs && logs.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportLogs}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-white glass-subtle border border-white/30 hover:border-white/60 hover:bg-white/10 transition-all"
                >
                  匯出 JSON
                </button>
              )}
            </div>
            {selectedLog && (
              <div className="mb-4 p-3 glass-subtle border border-blue-400/30 rounded-lg text-xs text-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-white">本地驗證工具 (Developer)</span>
                  <button
                    type="button"
                    onClick={handleLocalVerify}
                    disabled={isVerifyingLocally}
                    className="px-3 py-1 rounded-md text-xs font-medium text-white glass-strong border border-blue-400/60 hover:border-blue-300 hover:bg-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isVerifyingLocally ? '驗證中…' : '以 verification_key.json 驗證此 proof'}
                  </button>
                </div>
                {localVerifyStatus && (
                  <p className={localVerifyStatus.ok ? 'text-emerald-300' : 'text-red-300'}>
                    {localVerifyStatus.message}
                  </p>
                )}
                <p className="mt-2 text-[10px] text-gray-300">
                  提示：此功能會從 `/zk/verification_key.json` 載入 verifier key，在瀏覽器端直接對 `publicSignals` 與 `proof` 做數學驗證。
                </p>
              </div>
            )}
            <div className="max-h-[600px] overflow-y-auto grid gap-3 pr-1">
              {logs?.map((log, index) => (
                <div
                  key={log.id}
                  className={`glass-subtle border p-3 rounded-lg text-sm cursor-pointer transition-all ${
                    selectedLog?.id === log.id
                      ? 'border-blue-400/70 bg-blue-500/10'
                      : 'border-white/10 hover:border-blue-300/60 hover:bg-white/5'
                  }`}
                  onClick={() => {
                    setSelectedLog(log);
                    setLocalVerifyStatus(null);
                  }}
                >
                  <div className="flex justify-between mb-2 text-gray-300">
                    <span>Vote #{index + 1}</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-white">Nullifier Hash:</span>
                    <code className="block break-all bg-white/5 p-2 rounded mt-1 text-gray-200">
                      {log.nullifier}
                    </code>
                  </div>
                  <details>
                    <summary className="cursor-pointer text-blue-300 hover:text-white font-medium">View Proof Data</summary>
                    <pre className="mt-2 p-2 bg-white/5 rounded overflow-x-auto text-xs text-gray-100">
                      {JSON.stringify(log.proof, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
              {logs?.length === 0 && (
                <p className="text-gray-300 text-center">No votes cast yet.</p>
              )}
            </div>
          </GlassCard>
        </div>}
      </div>
    </PageShell>
  );
}
