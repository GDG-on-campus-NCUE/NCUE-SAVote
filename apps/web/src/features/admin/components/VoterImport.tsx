import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Election } from '@savote/shared-types';
import { API_ENDPOINTS } from '../../../lib/constants';
import { api } from '../../auth/services/auth.api';
import { voterApi, type ImportVotersResponse } from '../../auth/services/voter.api';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { Upload, Download, RefreshCw, AlertCircle, CheckCircle2, FileText, ChevronDown } from 'lucide-react';

interface StatusState {
  type: 'idle' | 'success' | 'error';
  message?: string;
  result?: ImportVotersResponse;
}

export function VoterImport() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<StatusState>({ type: 'idle' });

  const { data: elections = [], isLoading: isLoadingElections, isError: isElectionError, refetch } = useQuery({
    queryKey: ['admin', 'elections'],
    queryFn: async () => {
      const response = await api.get<Election[]>(API_ENDPOINTS.ELECTIONS.LIST);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'IMPORT_FAILED';
      setStatus({ type: 'error', message });
    },
  });

  const isSubmitDisabled = useMemo(() => {
    return !selectedElectionId || !selectedFile || importMutation.isPending;
  }, [selectedElectionId, selectedFile, importMutation.isPending]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setStatus({ type: 'idle' });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedElectionId || !selectedFile) {
      setStatus({ type: 'error', message: t('admin.import_error_missing', 'Please select an election and a CSV file.') });
      return;
    }
    importMutation.mutate({ electionId: selectedElectionId, file: selectedFile });
  };

  const handleDownloadTemplate = () => {
    const content = 'studentId,class\nA123456789,CSIE_3A\nA223456789,EE_4B';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eligible-voters-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-0 overflow-hidden border border-[var(--color-outline-variant)]">
      <div className="p-6 bg-[var(--color-surface-container-low)] flex justify-between items-center border-b border-[var(--color-outline-variant)]/50">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] flex items-center gap-2">
            <Upload className="w-5 h-5 text-[var(--color-primary)]" />
            {t('admin.import_voters', 'Import Eligible Voters')}
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-1">
            {t('admin.import_desc', 'Upload a CSV file to update the voter list and Merkle Tree.')}
          </p>
        </div>
        <Button variant="outlined" size="sm" onClick={handleDownloadTemplate} icon={<Download className="w-4 h-4" />}>
          {t('admin.download_template', 'Template CSV')}
        </Button>
      </div>

      <div className="p-6 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Election Select */}
            <div className="space-y-2">
                <label htmlFor="election" className="block text-sm font-medium text-[var(--color-on-surface-variant)] ml-1">
                    {t('admin.select_election', 'Select Election')}
                </label>
                {isLoadingElections ? (
                    <div className="h-12 bg-[var(--color-surface-variant)] rounded-lg animate-pulse" />
                ) : isElectionError ? (
                    <div className="p-3 rounded-lg bg-[var(--color-error-container)] text-[var(--color-on-error-container)] flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {t('admin.error_fetch_elections', 'Failed to fetch elections.')}
                        <Button size="sm" variant="text" onClick={() => refetch()} icon={<RefreshCw className="w-4 h-4" />}>Retry</Button>
                    </div>
                ) : (
                    <div className="relative">
                        <select
                            id="election"
                            name="election"
                            value={selectedElectionId}
                            onChange={(event) => setSelectedElectionId(event.target.value)}
                            className="w-full appearance-none px-4 py-3 rounded-lg bg-[var(--color-surface-variant)]/50 border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all cursor-pointer hover:bg-[var(--color-surface-variant)]"
                        >
                            {elections.length === 0 && <option value="">{t('admin.no_elections', 'No elections found')}</option>}
                            {elections.map((election) => (
                                <option key={election.id} value={election.id}>
                                {election.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-on-surface-variant)]">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                )}
            </div>

            {/* File Upload Area */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--color-on-surface-variant)] ml-1">
                    {t('admin.upload_csv', 'Upload CSV')}
                </label>
                <div 
                    className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer group relative overflow-hidden ${selectedFile 
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-container)]/10' 
                        : 'border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-variant)]/50'}`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${selectedFile ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] group-hover:scale-110 duration-300'}`}>
                        {selectedFile ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                    </div>
                    
                    <p className="font-bold text-lg text-[var(--color-on-surface)]">
                        {selectedFile ? selectedFile.name : t('admin.drag_drop_csv', 'Click to select CSV file')}
                    </p>
                    
                    {selectedFile && (
                        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                    )}

                    {!selectedFile && (
                        <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
                            {t('admin.csv_requirements', 'File must contain "studentId" and "class" columns.')}
                        </p>
                    )}
                    
                    <input
                        ref={fileInputRef}
                        id="csv"
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 items-center pt-2">
                <Button 
                    type="submit" 
                    disabled={isSubmitDisabled} 
                    loading={importMutation.isPending}
                    variant="filled"
                    className="flex-1 h-12 text-base shadow-md"
                    icon={<Upload className="w-5 h-5" />}
                >
                    {t('admin.start_import', 'Start Import')}
                </Button>
            </div>
        </form>

        {/* Status Feedback */}
        {status.type === 'success' && status.result && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 animate-slide-up flex gap-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full h-fit text-green-700 dark:text-green-300">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-green-800 dark:text-green-200">{t('admin.import_success', 'Import Successful')}</h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        {t('admin.import_stats', 'Added {{count}} voters, skipped {{skipped}} duplicates.', { count: status.result.votersImported, skipped: status.result.duplicatesSkipped })}
                    </p>
                    <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg text-xs font-mono break-all border border-green-200 dark:border-green-800/50">
                        Merkle Root: <span className="font-bold">{status.result.merkleRootHash}</span>
                    </div>
                </div>
            </div>
        )}

        {status.type === 'error' && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-slide-up flex gap-4 items-start">
                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full h-fit text-red-700 dark:text-red-300">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-red-800 dark:text-red-200">{t('admin.import_failed', 'Import Failed')}</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {status.message ?? t('common.unknown_error', 'Unknown error occurred.')}
                    </p>
                </div>
            </div>
        )}

        {/* Info Box */}
        <div className="bg-[var(--color-surface-container)] rounded-xl p-5 border border-[var(--color-outline-variant)]/50">
            <h3 className="text-sm font-bold text-[var(--color-on-surface)] mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[var(--color-primary)]" />
                {t('admin.csv_specs', 'CSV Specifications')}
            </h3>
            <ul className="grid md:grid-cols-2 gap-2 text-sm text-[var(--color-on-surface-variant)]">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-outline)]"/>{t('admin.csv_header_req', 'Headers: studentId, class')}</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-outline)]"/>{t('admin.csv_id_req', 'Alphanumeric IDs')}</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-outline)]"/>{t('admin.csv_class_req', 'Normalized class names')}</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-outline)]"/>{t('admin.csv_auto_clean', 'Auto-remove duplicates')}</li>
            </ul>
        </div>
      </div>
    </Card>
  );
}