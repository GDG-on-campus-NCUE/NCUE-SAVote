import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { type Election, ElectionStatus } from '@savote/shared-types';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { TextField } from '../../../components/m3/TextField';
import { Loader2, ArrowLeft, Search, Download, ShieldCheck, AlertTriangle, CheckCircle2, History, Database, Code } from 'lucide-react';
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

  if (isLoadingElection || (canViewResults && (isLoadingTally || isLoadingLogs))) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--color-primary)]" />
        <p className="text-[var(--color-on-surface-variant)] font-medium">正在取得加密驗證資料...</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-6 px-6 text-center">
        <div className="p-6 rounded-full bg-[var(--color-error-container)] text-[var(--color-on-error-container)]">
            <AlertTriangle className="w-12 h-12" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-[var(--color-on-background)] mb-2">找不到此項選舉</h2>
            <p className="text-[var(--color-on-surface-variant)]">該選舉可能已被移除或連結無效。</p>
        </div>
        <Link to="/">
            <Button variant="tonal" icon={<ArrowLeft className="w-4 h-4" />}>返回首頁</Button>
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
      // Error handling can be added here if needed
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
      const vkRes = await fetch('/zk/verification_key.json');
      const vk = await vkRes.json();
      const ok = await snarkjs.groth16.verify(vk, selectedLog.publicSignals, selectedLog.proof);
      setLocalVerifyStatus({ 
          ok, 
          message: ok 
            ? '驗證成功：此證明在數學上是有效的，且與公開訊號完全一致。' 
            : '驗證失敗：此證明無效或已被篡改。' 
      });
    } catch (e: any) {
      setLocalVerifyStatus({ ok: false, message: `驗證時發生技術錯誤: ${e?.message ?? '未知錯誤'}` });
    } finally {
      setIsVerifyingLocally(false);
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-fade-in">
      <header className="flex flex-col gap-4">
        <Link to="/" className="w-fit">
            <Button variant="text" icon={<ArrowLeft className="w-4 h-4" />} className="px-0 opacity-70 hover:opacity-100">
                返回投票列表
            </Button>
        </Link>
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-[var(--color-primary)] rounded-full" />
                <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-on-surface)] tracking-tight">驗證與稽核中心</h1>
            </div>
            <p className="text-[var(--color-on-surface-variant)] font-medium opacity-70 ml-4">
                選舉項目：{election.name}
            </p>
        </div>
      </header>

      {/* Nullifier Checker */}
      <Card className="p-8 rounded-[32px] border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)] elevation-1">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]">
                <Search className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-[var(--color-on-surface)]">核對我的選票</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)] opacity-70 font-medium">
                    輸入 Nullifier Hash 以確認您的選票是否已被正確記錄。
                </p>
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-end max-w-4xl">
          <TextField
            label="Nullifier Hash"
            placeholder="請貼上您的選票存根雜湊值 (Poseidon Hash)"
            value={nullifierInput}
            onChange={(e) => setNullifierInput(e.target.value)}
            className="flex-1 w-full"
          />
          <Button 
            onClick={handleCheckNullifier} 
            className="h-14 px-10 rounded-2xl font-bold"
            variant="filled"
          >
            核對紀錄
          </Button>
        </div>

        {nullifierResult && (
          <div className={`mt-6 p-5 rounded-2xl flex items-center gap-4 animate-slide-up ${
            nullifierResult.exists 
                ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' 
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
          }`}>
            <div className={`p-2 rounded-full ${nullifierResult.exists ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {nullifierResult.exists ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">
                {nullifierResult.exists ? '選票確認已記錄' : '查無此選票記錄'}
              </p>
              <p className="text-sm opacity-80 font-medium">
                {nullifierResult.exists
                  ? `該選票已於 ${new Date(nullifierResult.createdAt!).toLocaleString()} 被區塊鏈驗證系統接收。`
                  : '請檢查雜湊值是否正確，或該選票可能尚未完成寫入。'}
              </p>
            </div>
          </div>
        )}
      </Card>

      {!canViewResults && (
        <Card className="p-12 flex flex-col items-center gap-6 rounded-[40px] border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)] text-center opacity-80">
          <div className="p-6 rounded-full bg-[var(--color-surface-container-high)]">
             <History className="w-12 h-12 text-[var(--color-outline)]" />
          </div>
          <div>
              <h3 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">計票結果尚未公開</h3>
              <p className="text-[var(--color-on-surface-variant)] font-medium max-w-md">
                為了確保選舉公正，詳細計票結果與稽核日誌將在投票正式結束後開放。
              </p>
          </div>
          <div className="px-6 py-2 rounded-full bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] font-black text-xs tracking-widest uppercase border border-[var(--color-outline-variant)]/30">
            {election.status === ElectionStatus.VOTING_OPEN ? '投票進行中' : '尚未開始'}
          </div>
        </Card>
      )}

      {canViewResults && (
        <div className="grid gap-8 md:grid-cols-12 animate-slide-up">
            {/* Results Section */}
            <div className="md:col-span-5 space-y-8">
                <Card className="p-8 rounded-[32px] bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 elevation-1">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-[var(--color-on-surface)] flex items-center gap-3">
                            <Database className="w-7 h-7 text-[var(--color-primary)]" />
                            最終得票統計
                        </h2>
                        <div className="px-4 py-1.5 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] font-bold text-xs">
                            總票數：{totalVotes}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {election.candidates.map(candidate => {
                            const votes = tally?.[candidate.id] || 0;
                            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                            return (
                                <div key={candidate.id} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[var(--color-on-surface)] text-lg">{candidate.name}</span>
                                            <span className="text-[10px] font-black text-[var(--color-primary)] opacity-70 tracking-widest uppercase">{percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black tabular-nums">{votes}</span>
                                            <span className="text-xs font-bold opacity-50">票</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-3 bg-[var(--color-surface-container-highest)] rounded-full overflow-hidden border border-[var(--color-outline-variant)]/20">
                                        <div 
                                            className="h-full bg-[var(--color-primary)] transition-[width] duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
                                            style={{ width: `${percentage}%` }} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Verification Explanation */}
                <div className="p-6 rounded-[28px] bg-[var(--color-surface-container-highest)]/50 border border-[var(--color-outline-variant)]/20">
                    <h4 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        數學公正性聲明
                    </h4>
                    <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed font-medium opacity-80">
                        本系統採用 Groth16 零知識證明協議。每一張選票在寫入資料庫前，都必須通過橢圓曲線配對運算驗證其合法性，確保投票者具有資格且未重複投票，同時保護投票內容完全隱密。
                    </p>
                </div>
            </div>

            {/* Audit Logs Section */}
            <div className="md:col-span-7">
                <Card className="p-8 rounded-[40px] border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)] elevation-1 flex flex-col h-full min-h-[600px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-[var(--color-on-surface)] flex items-center gap-3">
                                <Code className="w-7 h-7 text-[var(--color-primary)]" />
                                原始稽核日誌
                            </h2>
                            <p className="text-xs text-[var(--color-on-surface-variant)] font-medium opacity-70">
                                供研究人員與第三方機構下載並獨立驗證
                            </p>
                        </div>
                        {logs && logs.length > 0 && (
                            <Button 
                                variant="tonal" 
                                size="sm" 
                                className="rounded-xl px-4 font-bold" 
                                onClick={handleExportLogs} 
                                icon={<Download className="w-4 h-4" />}
                            >
                                匯出 JSON
                            </Button>
                        )}
                    </div>

                    {selectedLog && (
                        <div className="mb-6 p-6 rounded-3xl bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] border border-[var(--color-secondary)]/20 animate-slide-up">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-[var(--color-on-secondary-container)]/10">
                                        <ShieldCheck className="w-5 h-5"/>
                                    </div>
                                    <span className="font-black text-sm tracking-wide">本地驗證工具 (Client-side Verify)</span>
                                </div>
                                <Button 
                                    variant="filled" 
                                    className="h-10 px-6 rounded-xl font-bold elevation-1"
                                    onClick={handleLocalVerify}
                                    disabled={isVerifyingLocally}
                                    loading={isVerifyingLocally}
                                >
                                    即刻驗證此證明
                                </Button>
                            </div>
                            
                            {localVerifyStatus && (
                                <div className={`p-4 rounded-2xl mb-4 font-bold text-sm ${
                                    localVerifyStatus.ok 
                                        ? 'bg-white/20 text-[var(--color-on-secondary-container)]' 
                                        : 'bg-red-500/20 text-red-700 dark:text-red-300'
                                }`}>
                                    {localVerifyStatus.message}
                                </div>
                            )}
                            
                            <p className="text-[11px] opacity-70 font-medium leading-relaxed">
                                點擊按鈕後，瀏覽器將載入與系統完全一致的 <code>verification_key.json</code>，並在您的電腦上重新運算該 ZK-Proof。這能確保後端沒有偽造投票結果。
                            </p>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid gap-3">
                            {logs?.map((log, index) => (
                                <div
                                    key={log.id}
                                    className={`p-5 rounded-[24px] transition-all duration-300 border flex flex-col gap-3 group ${
                                        selectedLog?.id === log.id
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-container)]/20 elevation-1'
                                            : 'border-[var(--color-outline-variant)]/20 bg-[var(--color-surface-container-low)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface)]'
                                    }`}
                                    onClick={() => {
                                        setSelectedLog(log);
                                        setLocalVerifyStatus(null);
                                    }}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-[var(--color-surface-container-highest)] flex items-center justify-center font-black text-[10px] tabular-nums">
                                                #{index + 1}
                                            </span>
                                            <span className="text-xs font-black text-[var(--color-on-surface-variant)] opacity-60">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity">
                                            點擊檢視詳情
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest opacity-70">Nullifier Hash</span>
                                        <code className="block break-all bg-[var(--color-surface)]/50 p-3 rounded-xl text-[10px] font-mono border border-[var(--color-outline-variant)]/30 leading-normal">
                                            {log.nullifier}
                                        </code>
                                    </div>
                                </div>
                            ))}
                            {(!logs || logs.length === 0) && (
                                <div className="flex flex-col items-center justify-center py-20 text-[var(--color-on-surface-variant)] opacity-40">
                                    <Database className="w-12 h-12 mb-4" />
                                    <p className="font-bold">尚無任何可用的稽核紀錄</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}
