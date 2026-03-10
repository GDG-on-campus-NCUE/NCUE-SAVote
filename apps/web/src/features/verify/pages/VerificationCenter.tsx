import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { type Election, ElectionStatus } from '@savote/shared-types';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { TextField } from '../../../components/m3/TextField';
import { Loader2, ArrowLeft, Search, Download, ShieldCheck, AlertTriangle, CheckCircle2, History, Database, Code, Fingerprint, Info, Cpu, Globe, Lock as LockIcon } from 'lucide-react';
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
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-6">
        <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-[var(--color-primary)]" />
            <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[var(--color-primary)] opacity-50" />
            </div>
        </div>
        <div className="text-center space-y-2">
            <p className="text-xl font-bold text-[var(--color-on-surface)]">正在構建可驗證資料庫...</p>
            <p className="text-sm text-[var(--color-on-surface-variant)] opacity-70">系統正在同步去中心化稽核日誌並驗證密碼學證明。</p>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center gap-8 px-6 text-center animate-fade-in">
        <div className="p-8 rounded-full bg-[var(--color-error-container)] text-[var(--color-on-error-container)] shadow-inner">
            <AlertTriangle className="w-16 h-16" />
        </div>
        <div className="max-w-md">
            <h2 className="text-3xl font-bold text-[var(--color-on-background)] mb-3">查無此選舉項目</h2>
            <p className="text-[var(--color-on-surface-variant)] font-medium leading-relaxed">
                您所訪問的選舉編號無效，或者該項選舉已被系統撤回。
            </p>
        </div>
        <Link to="/">
            <Button variant="filled" className="h-14 px-10 rounded-2xl font-bold" icon={<ArrowLeft className="w-5 h-5" />}>
                返回投票首頁
            </Button>
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
      // Error handling
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
            ? '證明有效：該選票已通過橢圓曲線密碼學運算，確認其數學公正性。' 
            : '證明無效：該資料包可能已被竄改或與公開參數不符。' 
      });
    } catch (e: any) {
      setLocalVerifyStatus({ ok: false, message: `運算錯誤: ${e?.message ?? '核心引擎異常'}` });
    } finally {
      setIsVerifyingLocally(false);
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-fade-in select-none">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] hover:opacity-70 transition-opacity mb-2 uppercase tracking-widest">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Elections
            </Link>
            <h1 className="text-3xl md:text-5xl font-black text-[var(--color-on-surface)] tracking-tighter">
                驗證中心
            </h1>
            <p className="flex items-center gap-2 text-base md:text-lg text-[var(--color-on-surface-variant)] font-medium opacity-70 italic">
                <Globe className="w-5 h-5" />
                {election.name}
            </p>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] opacity-60">Audit Status</span>
                <span className="text-sm font-bold text-[var(--color-on-surface)]">
                    {canViewResults ? '稽核開放中' : '計票封存中'}
                </span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center elevation-1 ${canViewResults ? 'bg-green-500 text-white animate-pulse' : 'bg-[var(--color-surface-container-highest)] text-[var(--color-outline)]'}`}>
                <ShieldCheck className="w-6 h-6" />
            </div>
        </div>
      </div>

      {/* Hero Section: Nullifier Checker */}
      <Card className="relative overflow-hidden p-8 md:p-12 rounded-[40px] border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)] elevation-2">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--color-tertiary)]/5 blur-3xl rounded-full -ml-24 -mb-24 pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] text-[10px] font-black tracking-widest uppercase">
                    <Fingerprint className="w-3.5 h-3.5" />
                    Secure Voter Receipt
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-on-surface)] leading-[1.1]">
                    核對您的<br/><span className="text-[var(--color-primary)]">選票存根</span>
                </h2>
                <p className="text-[var(--color-on-surface-variant)] leading-relaxed font-medium">
                    輸入您投票時下載的 Nullifier Hash。如果系統正確接收了您的選票，下方將顯示該選票的寫入時間與加密存證。
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <TextField
                            label="POSEIDON NULLIFIER HASH"
                            placeholder="貼上您的存根雜湊值..."
                            value={nullifierInput}
                            onChange={(e) => setNullifierInput(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Button 
                        onClick={handleCheckNullifier} 
                        className="h-14 px-8 rounded-2xl font-bold shrink-0"
                        variant="filled"
                    >
                        查詢紀錄
                    </Button>
                </div>
            </div>

            <div className="relative">
                {nullifierResult ? (
                    <div className={`p-8 rounded-[32px] border-2 animate-scale-in flex flex-col gap-6 ${
                        nullifierResult.exists 
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' 
                            : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                    }`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${nullifierResult.exists ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} elevation-2`}>
                                {nullifierResult.exists ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                            </div>
                            <div>
                                <h4 className={`text-2xl font-bold ${nullifierResult.exists ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                                    {nullifierResult.exists ? '已成功存證' : '查無紀錄'}
                                </h4>
                                <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Database Sync Complete</p>
                            </div>
                        </div>
                        
                        <div className="h-px bg-current opacity-10" />
                        
                        <p className="text-sm font-medium leading-relaxed opacity-80">
                            {nullifierResult.exists
                            ? `您的選票已於系統後端完成零知識證明校驗，並於 ${new Date(nullifierResult.createdAt!).toLocaleString()} 正式寫入不可篡改的資料庫。`
                            : '系統找不到與此雜湊值對應的選票。請確認您複製的內容是否完整，或該項選舉的寫入程序是否仍在排隊中。'}
                        </p>
                    </div>
                ) : (
                    <div className="p-12 border-2 border-dashed border-[var(--color-outline-variant)] rounded-[40px] flex flex-col items-center justify-center text-center opacity-30">
                        <Search className="w-16 h-16 mb-4" />
                        <p className="font-bold">等待輸入驗證碼</p>
                    </div>
                )}
            </div>
        </div>
      </Card>

      {!canViewResults && (
        <Card className="p-16 flex flex-col items-center gap-8 rounded-[40px] border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)] text-center">
          <div className="relative">
            <History className="w-20 h-20 text-[var(--color-outline)] opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
                <LockIcon className="w-8 h-8 text-[var(--color-primary)] animate-bounce" />
            </div>
          </div>
          <div className="max-w-xl space-y-3">
              <h3 className="text-3xl font-bold text-[var(--color-on-surface)]">計票結果封存中</h3>
              <p className="text-[var(--color-on-surface-variant)] font-medium text-lg leading-relaxed">
                為維護選舉公正，詳細得票數據與加密稽核日誌將在<br className="hidden md:block"/><strong>投票正式截止</strong>後自動解鎖並向公眾開放。
              </p>
          </div>
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-[var(--color-surface-container-highest)] border border-[var(--color-outline-variant)]/30">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <span className="text-xs font-black tracking-[0.2em] text-[var(--color-on-surface-variant)] uppercase">
                {election.status === ElectionStatus.VOTING_OPEN ? 'Voting in Progress' : 'Pending Start'}
            </span>
          </div>
        </Card>
      )}

      {canViewResults && (
        <div className="grid gap-8 lg:grid-cols-12 animate-slide-up">
            {/* Tally Results Section */}
            <div className="lg:col-span-5 space-y-8">
                <Card className="p-8 md:p-10 rounded-[32px] bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 elevation-1">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-bold text-[var(--color-on-surface)] flex items-center gap-3">
                            <Database className="w-6 h-6 text-[var(--color-primary)]" />
                            得票統計
                        </h2>
                        <div className="px-4 py-1.5 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm shadow-md shadow-[var(--color-primary)]/20">
                            總票數 {totalVotes}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {election.candidates.map(candidate => {
                            const votes = tally?.[candidate.id] || 0;
                            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                            return (
                                <div key={candidate.id} className="group space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[var(--color-on-surface)] text-lg group-hover:text-[var(--color-primary)] transition-colors">{candidate.name}</span>
                                            <span className="text-[10px] font-black text-[var(--color-primary)] opacity-60 tracking-[0.15em] uppercase">{percentage.toFixed(1)}% Weight</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black tabular-nums">{votes}</span>
                                            <span className="text-sm font-bold opacity-40">VOTES</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-4 bg-[var(--color-surface-container-highest)] rounded-full overflow-hidden border border-[var(--color-outline-variant)]/20 p-0.5">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)]/80 rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-sm" 
                                            style={{ width: `${percentage}%` }} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Secure Tech Banner */}
                <div className="p-8 rounded-[32px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-white shadow-xl shadow-[var(--color-primary)]/10 flex flex-col gap-4 relative overflow-hidden group">
                    <Cpu className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-lg">數學公正性保證</h4>
                    </div>
                    <p className="text-sm font-medium leading-relaxed opacity-90">
                        本選舉採用 <strong>Groth16 零知識證明</strong> 協議。每一張選票均由選民端生成證明，在不洩露投票內容的前提下，經由數學運算確認其投票資格。
                    </p>
                </div>
            </div>

            {/* Audit Logs Section */}
            <div className="lg:col-span-7">
                <Card className="p-8 md:p-10 rounded-[40px] border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)] elevation-1 flex flex-col h-full min-h-[700px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--color-on-surface)] flex items-center gap-3">
                                <Code className="w-6 h-6 text-[var(--color-primary)]" />
                                稽核日誌
                            </h2>
                            <p className="text-xs text-[var(--color-on-surface-variant)] font-medium opacity-60 mt-1">
                                可供公眾與第三方獨立驗證的原始證明資料
                            </p>
                        </div>
                        {logs && logs.length > 0 && (
                            <Button 
                                variant="tonal" 
                                size="sm" 
                                className="rounded-xl px-5 h-11 font-bold shrink-0" 
                                onClick={handleExportLogs} 
                                icon={<Download className="w-4 h-4" />}
                            >
                                匯出稽核封裝
                            </Button>
                        )}
                    </div>

                    {selectedLog && (
                        <div className="mb-8 p-6 rounded-[28px] bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)]/20 animate-slide-up shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-[var(--color-primary)] text-white elevation-1">
                                        <Cpu className="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <span className="font-bold text-sm block">證明驗證引擎</span>
                                        <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">Groth16 Local Worker</span>
                                    </div>
                                </div>
                                <Button 
                                    variant="filled" 
                                    className="h-11 px-6 rounded-xl font-bold elevation-1 active:scale-95 transition-transform"
                                    onClick={handleLocalVerify}
                                    disabled={isVerifyingLocally}
                                    loading={isVerifyingLocally}
                                >
                                    執行數學校驗
                                </Button>
                            </div>
                            
                            {localVerifyStatus && (
                                <div className={`p-4 rounded-xl mb-4 font-bold text-sm border flex gap-3 ${
                                    localVerifyStatus.ok 
                                        ? 'bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400' 
                                        : 'bg-red-500/5 border-red-500/20 text-red-700'
                                }`}>
                                    <div className="shrink-0 mt-0.5">
                                        {localVerifyStatus.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                    </div>
                                    {localVerifyStatus.message}
                                </div>
                            )}
                            
                            <p className="text-[11px] text-[var(--color-on-surface-variant)] opacity-70 font-medium leading-relaxed bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-outline-variant)]/10">
                                <Info className="w-3.5 h-3.5 inline mr-1 opacity-50" />
                                驗證程序將在您的瀏覽器端沙盒環境中執行，載入 <code>verification_key.json</code> 並重新運算該 ZK-Proof。若通過，則證明該選票內容未被伺服器篡改。
                            </p>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid gap-4">
                            {logs?.map((log, index) => (
                                <div
                                    key={log.id}
                                    className={`p-6 rounded-[24px] transition-all duration-300 border flex flex-col gap-4 group cursor-pointer ${
                                        selectedLog?.id === log.id
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-container)]/10 elevation-1'
                                            : 'border-[var(--color-outline-variant)]/20 bg-[var(--color-surface-container-low)] hover:border-[var(--color-primary)]/30 hover:elevation-1'
                                    }`}
                                    onClick={() => {
                                        setSelectedLog(log);
                                        setLocalVerifyStatus(null);
                                    }}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="w-9 h-9 rounded-xl bg-[var(--color-surface-container-highest)] flex items-center justify-center font-black text-[11px] tabular-nums">
                                                #{index + 1}
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-[var(--color-on-surface)]">
                                                    {new Date(log.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] font-medium opacity-50">
                                                    {new Date(log.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all duration-500 ${
                                            selectedLog?.id === log.id 
                                                ? 'bg-[var(--color-primary)] text-white' 
                                                : 'bg-[var(--color-surface-container-highest)] opacity-0 group-hover:opacity-100'
                                        }`}>
                                            Details
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest opacity-60">
                                            <span>Nullifier Identity Hash</span>
                                            <div className="flex gap-1">
                                                <div className="w-1 h-1 rounded-full bg-current opacity-20" />
                                                <div className="w-1 h-1 rounded-full bg-current opacity-40" />
                                                <div className="w-1 h-1 rounded-full bg-current opacity-60" />
                                            </div>
                                        </div>
                                        <code className="block break-all bg-[var(--color-surface)]/80 p-4 rounded-xl text-[10px] font-mono border border-[var(--color-outline-variant)]/20 leading-relaxed text-[var(--color-on-surface-variant)] shadow-inner">
                                            {log.nullifier}
                                        </code>
                                    </div>
                                </div>
                            ))}
                            {(!logs || logs.length === 0) && (
                                <div className="flex flex-col items-center justify-center py-24 text-[var(--color-on-surface-variant)] opacity-30">
                                    <Database className="w-16 h-16 mb-4" />
                                    <p className="font-bold text-lg">目前尚無存證紀錄</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
            background: var(--color-outline-variant); 
            border-radius: 10px; 
            opacity: 0.3;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-primary); }
      `}} />
    </div>
  );
}
