import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Election, EligibleVoter } from '@savote/shared-types';
import { API_ENDPOINTS } from '../../../lib/constants';
import { api } from '../../auth/services/auth.api';
import { voterApi, type ImportVotersResponse } from '../../auth/services/voter.api';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ChevronDown, 
  Users, 
  Search, 
  Fingerprint,
  Database,
  Lock as LockIcon
} from 'lucide-react';

interface StatusState {
  type: 'idle' | 'success' | 'error';
  message?: string;
  result?: ImportVotersResponse;
}

export function VoterImport() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });
  const [voterSearch, setVoterSearch] = useState('');

  // 1. Fetch Elections
  const { data: elections = [] } = useQuery({
    queryKey: ['admin', 'elections'],
    queryFn: async () => {
      const response = await api.get<Election[]>(API_ENDPOINTS.ELECTIONS.LIST);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch Voter List for selected election
  const { data: voters = [], isLoading: isLoadingVoters, refetch: refetchVoters } = useQuery({
    queryKey: ['admin', 'voters', selectedElectionId],
    queryFn: async () => {
      if (!selectedElectionId) return [];
      const response = await api.get<EligibleVoter[]>(`${API_ENDPOINTS.ELECTIONS.CREATE}/${selectedElectionId}/voters`);
      return response.data;
    },
    enabled: !!selectedElectionId,
  });

  useEffect(() => {
    if (!selectedElectionId && elections.length > 0) {
      setSelectedElectionId(elections[0].id);
    }
  }, [elections, selectedElectionId]);

  const importMutation = useMutation({
    mutationFn: ({ electionId, file }: { electionId: string; file: File }) =>
      voterApi.importVoters({ electionId, file }),
    onSuccess: (result) => {
      setStatus({ type: 'success', result });
      setSelectedFile(null);
      refetchVoters();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : '匯入失敗';
      setStatus({ type: 'error', message });
    },
  });

  const isSubmitDisabled = useMemo(() => {
    const election = elections.find(e => e.id === selectedElectionId);
    const isLocked = election?.startTime ? new Date() >= new Date(election.startTime) : false;
    return !selectedElectionId || !selectedFile || importMutation.isPending || isLocked;
  }, [selectedElectionId, selectedFile, importMutation.isPending, elections]);

  const filteredVoters = voters.filter(v => 
    v.studentId.toLowerCase().includes(voterSearch.toLowerCase()) || 
    v.class.toLowerCase().includes(voterSearch.toLowerCase())
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setStatus({ type: 'idle' });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedElectionId || !selectedFile) {
      setStatus({ type: 'error', message: '請選擇選舉與 CSV 檔案。' });
      return;
    }
    importMutation.mutate({ electionId: selectedElectionId, file: selectedFile });
  };

  const handleDownloadTemplate = () => {
    const content = 'studentId,class\nS1354032,CSIE_3A\nS1354001,EE_4B';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'savote-voters-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedElection = elections.find(e => e.id === selectedElectionId);
  const isElectionLocked = selectedElection?.startTime ? new Date() >= new Date(selectedElection.startTime) : false;

  return (
    <div className="space-y-8 select-none">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Upload Controls */}
        <div className="lg:col-span-5 space-y-6">
            <Card className="p-0 overflow-hidden border border-[var(--color-outline-variant)]/30 elevation-1 rounded-xl bg-[var(--color-surface-container-low)]">
                <div className="p-6 bg-[var(--color-surface-container-high)]/50 border-b border-[var(--color-outline-variant)]/30 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                        <Upload className="w-5 h-5 text-[var(--color-primary)]" />
                        匯入名冊
                    </h2>
                    <Button variant="text" size="sm" onClick={handleDownloadTemplate} icon={<Download className="w-4 h-4" />} className="font-bold">
                        範本
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-[var(--color-on-surface-variant)] px-1">選擇選舉活動</label>
                        <div className="relative group">
                            <select
                                value={selectedElectionId}
                                onChange={(e) => setSelectedElectionId(e.target.value)}
                                className="w-full appearance-none px-5 py-4 rounded-xl bg-[var(--color-surface-container-high)] border-2 border-transparent focus:border-[var(--color-primary)]/30 text-[var(--color-on-surface)] font-bold transition-all cursor-pointer elevation-1"
                            >
                                {elections.map((e) => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                <ChevronDown className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <div 
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 text-center transition-all relative overflow-hidden group",
                            isElectionLocked 
                                ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 cursor-not-allowed' 
                                : selectedFile 
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-container)]/10 shadow-inner cursor-pointer' 
                                    : 'border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container-highest)] cursor-pointer'
                        )}
                        onClick={() => !isElectionLocked && fileInputRef.current?.click()}
                    >
                        <div className={cn(
                            "mx-auto w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 shadow-sm",
                            isElectionLocked 
                                ? 'bg-amber-500 text-white animate-pulse' 
                                : selectedFile 
                                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] scale-110 elevation-2' 
                                    : 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] group-hover:rotate-6'
                        )}>
                            {isElectionLocked ? <LockIcon className="w-8 h-8" /> : selectedFile ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                        </div>
                        
                        <p className={cn(
                            "font-bold text-lg",
                            isElectionLocked ? "text-amber-900 dark:text-amber-100" : "text-[var(--color-on-surface)]"
                        )}>
                            {isElectionLocked ? '名單已凍結' : selectedFile ? selectedFile.name : '點擊或拖曳 CSV 檔案'}
                        </p>
                        
                        <p className="mt-2 text-xs font-medium opacity-70">
                            {isElectionLocked ? '此選舉已進入正式階段，無法再匯入或修改名冊' : '必須包含 studentId 與 class 欄位'}
                        </p>
                        
                        <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" disabled={isElectionLocked} />
                    </div>

                    <Button 
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled} 
                        loading={importMutation.isPending}
                        variant="filled"
                        className="w-full h-14 rounded-xl text-base font-bold shadow-lg shadow-[var(--color-primary)]/10"
                        icon={<Database className="w-5 h-5" />}
                    >
                        確認執行匯入
                    </Button>

                    {status.type !== 'idle' && (
                        <div className={cn(
                            "p-4 rounded-xl border animate-slide-up flex gap-4",
                            status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                        )}>
                            <div className="shrink-0 p-1 bg-white/20 rounded-full">
                                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm">{status.type === 'success' ? '操作成功' : '操作失敗'}</p>
                                <p className="text-xs opacity-80 mt-0.5 break-words">
                                    {status.type === 'success' ? `成功匯入 ${status.result?.votersImported} 筆，略過 ${status.result?.duplicatesSkipped} 筆。` : status.message}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>

        {/* Right Side: Data Table */}
        <div className="lg:col-span-7 space-y-6">
            <Card className="p-0 overflow-hidden border border-[var(--color-outline-variant)]/30 elevation-1 rounded-xl bg-[var(--color-surface)] min-h-[600px] flex flex-col">
                <div className="p-6 border-b border-[var(--color-outline-variant)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--on-surface)] flex items-center gap-2">
                            <Users className="w-5 h-5 text-[var(--color-primary)]" />
                            已匯入名單 ({voters.length})
                        </h3>
                        <p className="text-xs text-[var(--color-on-surface-variant)] opacity-60 font-medium">目前的選舉人名單預覽</p>
                    </div>

                    <div className="relative group w-full sm:w-64">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none opacity-50">
                            <Search className="w-4 h-4" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="搜尋學號或班級..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--color-surface-container-high)] border-none text-sm font-bold transition-all outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                            value={voterSearch}
                            onChange={(e) => setVoterSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                    {isLoadingVoters ? (
                        <div className="p-8 space-y-4">
                            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-[var(--color-surface-container)] rounded-xl animate-pulse" />)}
                        </div>
                    ) : voters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 opacity-30">
                            <Database className="w-16 h-16 mb-4" />
                            <p className="font-bold">目前尚無任何選舉人名單</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-[var(--color-surface)] shadow-sm">
                                <tr className="bg-[var(--color-surface-container-high)]/80 backdrop-blur-md">
                                    <th className="px-8 py-4 text-[10px] font-black tracking-widest text-[var(--color-on-surface-variant)] uppercase">學號資訊</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest text-[var(--color-on-surface-variant)] uppercase">所屬班級</th>
                                    <th className="px-8 py-4 text-[10px] font-black tracking-widest text-[var(--color-on-surface-variant)] uppercase text-right">登記狀態</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-outline-variant)]/20">
                                {filteredVoters.map((voter) => (
                                    <tr key={voter.id} className="group hover:bg-[var(--color-surface-container-low)] transition-all">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center font-bold text-xs">
                                                    {voter.studentId.charAt(0)}
                                                </div>
                                                <span className="font-bold text-[var(--color-on-surface)]">{voter.studentId}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] text-xs font-bold border border-[var(--color-outline-variant)]/30">
                                                {voter.class}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            {voter.identityCommitment ? (
                                                <div className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-xs" title={voter.identityCommitment}>
                                                    <Fingerprint className="w-3.5 h-3.5" />
                                                    已登記
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-[var(--color-on-surface-variant)] opacity-40">未登記</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </div>
      </div>

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

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
