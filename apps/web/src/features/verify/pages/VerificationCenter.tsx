import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { type Election, ElectionStatus } from '@savote/shared-types';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { TextField } from '../../../components/m3/TextField';
import { Loader2, ArrowLeft, Search, Download, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
      <div className="min-h-[60vh] flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="px-6 py-10 text-center">
        <h2 className="text-[var(--color-on-background)] text-xl font-semibold mb-2">找不到選舉</h2>
        <Link to="/">
            <Button variant="text">返回首頁</Button>
        </Link>
      </div>
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
      // Silent fail
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
      // verification_key.json is public
      const vkRes = await fetch('/zk/verification_key.json');
      const vk = await vkRes.json();
      const ok = await snarkjs.groth16.verify(vk, selectedLog.publicSignals, selectedLog.proof);
      setLocalVerifyStatus({ 
          ok, 
          message: ok 
            ? '本地驗證成功：證明與公開訊號及驗證金鑰相符。' 
            : '本地驗證失敗：證明無效或已被篡改。' 
      });
    } catch (e: any) {
      setLocalVerifyStatus({ ok: false, message: `本地驗證時發生錯誤: ${e?.message ?? '未知錯誤'}` });
    } finally {
      setIsVerifyingLocally(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <header className="mb-6">
        <Link to="/" className="inline-block mb-3">
            <Button variant="text" icon={<ArrowLeft className="w-4 h-4" />}>
                返回首頁
            </Button>
        </Link>
        <h1 className="text-3xl font-normal text-[var(--color-on-background)]">驗證中心</h1>
        <p className="text-[var(--color-on-surface-variant)]">選舉: {election.name}</p>
      </header>

      {/* Nullifier Checker */}
      <Card variant="filled" className="p-6">
        <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-lg font-medium text-[var(--color-on-surface)]">核對我的選票</h3>
        </div>
        <p className="text-sm text-[var(--color-on-surface-variant)] mb-4">
          輸入您的 Nullifier Hash 以驗證您的選票是否已被記錄。這不會洩露您的投票選擇。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <TextField
            label="Nullifier Hash"
            placeholder="Poseidon(secret, electionId)..."
            value={nullifierInput}
            onChange={(e) => setNullifierInput(e.target.value)}
            className="flex-1 w-full mb-0"
          />
          <Button onClick={handleCheckNullifier} className="mb-[2px]">
            搜尋
          </Button>
        </div>
        {nullifierResult && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${nullifierResult.exists ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
            {nullifierResult.exists ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <p>
              {nullifierResult.exists
                ? `選票已於 ${nullifierResult.createdAt ? new Date(nullifierResult.createdAt).toLocaleString() : ''} 成功記錄。`
                : '找不到此 Nullifier 的記錄。'}
            </p>
          </div>
        )}
      </Card>

      {!canViewResults && (
        <Card className="text-center p-8 flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]">
             <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
              <h3 className="text-xl font-medium text-[var(--color-on-surface)]">結果尚未公佈</h3>
              <p className="text-[var(--color-on-surface-variant)]">
                選舉結果與驗證資料將在選舉結束後開放查詢。
              </p>
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            election.status === ElectionStatus.VOTING_OPEN 
                ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' 
                : 'bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]'
          }`}>
            {election.status === ElectionStatus.VOTING_OPEN ? '投票進行中' : election.status}
          </div>
        </Card>
      )}

      {canViewResults && <div className="grid gap-6 md:grid-cols-2">
        {/* Results Section */}
        <Card className="p-6 h-fit">
          <h2 className="text-xl font-medium text-[var(--color-on-surface)] mb-6">選舉結果</h2>
          <div className="mb-4">
            <p className="text-[var(--color-primary)] font-bold">總票數: {totalVotes}</p>
          </div>
          <div className="grid gap-4">
            {election.candidates.map(candidate => {
              const votes = tally?.[candidate.id] || 0;
              const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
              return (
                <div key={candidate.id} className="p-4 rounded-lg bg-[var(--color-surface-variant)]/30 border border-[var(--color-outline-variant)]">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="font-medium text-[var(--color-on-surface)]">{candidate.name}</span>
                    <span className="font-bold text-[var(--color-primary)]">{votes} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--color-surface-variant)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] transition-[width] duration-1000 ease-out" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Audit Logs Section */}
        <Card className="p-6 h-fit">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-medium text-[var(--color-on-surface)]">稽核日誌</h2>
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                供第三方稽核使用的原始零知識證明資料。
              </p>
            </div>
            {logs && logs.length > 0 && (
              <Button variant="outlined" className="h-8 text-xs px-3" onClick={handleExportLogs} icon={<Download className="w-3 h-3" />}>
                JSON
              </Button>
            )}
          </div>

          {selectedLog && (
            <div className="mb-4 p-4 rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> 開發者驗證工具</span>
                <Button 
                    variant="filled" 
                    className="h-6 text-[10px] px-2"
                    onClick={handleLocalVerify}
                    disabled={isVerifyingLocally}
                    loading={isVerifyingLocally}
                >
                  驗證證明
                </Button>
              </div>
              {localVerifyStatus && (
                <p className={`mb-2 font-bold ${localVerifyStatus.ok ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {localVerifyStatus.message}
                </p>
              )}
              <p className="opacity-70">
                從瀏覽器載入 verification_key.json 並本地驗證證明與公開訊號。
              </p>
            </div>
          )}

          <div className="max-h-[500px] overflow-y-auto grid gap-2 pr-1 custom-scrollbar">
            {logs?.map((log, index) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg text-sm cursor-pointer transition-colors border ${
                  selectedLog?.id === log.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-container)]/30'
                    : 'border-transparent hover:bg-[var(--color-surface-variant)]'
                }`}
                onClick={() => {
                  setSelectedLog(log);
                  setLocalVerifyStatus(null);
                }}
              >
                <div className="flex justify-between mb-1 text-[var(--color-on-surface-variant)] text-xs">
                  <span>#{index + 1}</span>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <div className="mb-1">
                  <span className="font-medium text-[var(--color-on-surface)] text-xs">Nullifier:</span>
                  <code className="block break-all bg-[var(--color-surface)] p-1.5 rounded mt-1 text-[10px] border border-[var(--color-outline-variant)]">
                    {log.nullifier}
                  </code>
                </div>
              </div>
            ))}
            {logs?.length === 0 && (
              <p className="text-center text-[var(--color-on-surface-variant)] py-4">尚無投票記錄。</p>
            )}
          </div>
        </Card>
      </div>}
    </div>
  );
}
