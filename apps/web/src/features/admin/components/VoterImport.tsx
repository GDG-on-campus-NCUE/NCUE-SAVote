import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Election } from '@savote/shared-types';
import { API_ENDPOINTS } from '../../../lib/constants';
import { api } from '../../auth/services/auth.api';
import { voterApi, type ImportVotersResponse } from '../../auth/services/voter.api';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';

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
      setStatus({ type: 'error', message: '請選擇選舉與 CSV 檔案' });
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
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <p style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-xs)' }}>Step 1</p>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', margin: 0 }}>
            匯入選舉資格名單
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
            上傳經班代或系辦確認的 CSV 名單，我們會自動計算 Merkle Root 並更新選舉紀錄。
          </p>
        </div>
        <Button variant="secondary" onClick={handleDownloadTemplate}>
          下載範本 CSV
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label htmlFor="election" style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
            選擇選舉
          </label>
          {isLoadingElections && <Skeleton height="2.5rem" />}
          {isElectionError && (
            <div style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--border-radius-md)', backgroundColor: '#fef2f2', color: 'var(--color-error)' }}>
              無法取得選舉資料，請重新整理或稍後再試
            </div>
          )}
          {!isLoadingElections && !isElectionError && (
            <select
              id="election"
              name="election"
              value={selectedElectionId}
              onChange={(event) => setSelectedElectionId(event.target.value)}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: 'var(--font-size-base)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)'
              }}
            >
              {elections.length === 0 && <option value="">尚無選舉</option>}
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label htmlFor="csv" style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
            上傳 CSV
          </label>
          <div style={{
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            padding: 'var(--spacing-xl)',
            backgroundColor: 'var(--color-surface-hover)',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              {selectedFile ? selectedFile.name : '拖曳或點擊以下按鈕選擇 CSV 檔'}
            </p>
            <p style={{ margin: 'var(--spacing-sm) 0 var(--spacing-md)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              檔案需包含 <code>studentId</code> 與 <code>class</code> 欄位，系統會自動清理重複與空白列。
            </p>
            <input
              ref={fileInputRef}
              id="csv"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              選擇檔案
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <Button type="submit" variant="primary" disabled={isSubmitDisabled}>
            {importMutation.isPending ? '匯入處理中...' : '開始匯入'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => refetch()}>
            重新整理選舉
          </Button>
        </div>
      </form>

      {status.type === 'success' && status.result && (
        <div style={{ 
          marginTop: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: '#ecfdf5',
          color: '#047857',
          border: '1px solid #bbf7d0'
        }}>
          <p style={{ margin: 0, fontWeight: 'var(--font-weight-bold)' }}>匯入成功</p>
          <p style={{ margin: '0.25rem 0 0' }}>新增 {status.result.votersImported} 筆，略過 {status.result.duplicatesSkipped} 筆重複資料</p>
          <p style={{ margin: '0.25rem 0 0', wordBreak: 'break-all' }}>Merkle Root：{status.result.merkleRootHash}</p>
        </div>
      )}

      {status.type === 'error' && (
        <div style={{ 
          marginTop: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fecdd3'
        }}>
          <p style={{ margin: 0, fontWeight: 'var(--font-weight-bold)' }}>匯入失敗</p>
          <p style={{ margin: '0.25rem 0 0' }}>{status.message ?? '請稍後再試，或檢查 CSV 格式'}</p>
        </div>
      )}

      <div style={{ 
        marginTop: 'var(--spacing-xl)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--border-radius-md)',
        backgroundColor: 'var(--color-surface-hover)',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
          CSV 規範
        </h3>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          <li>第一列需為欄位名稱：<code>studentId,class</code></li>
          <li>每列代表一位選民，<code>studentId</code> 需為大寫英數，<code>class</code> 會自動標準化為大寫底線格式</li>
          <li>匯入時會自動去除空白列、重複紀錄並計算 Merkle Root</li>
          <li>large CSV (1k+) 會在背景處理，請耐心等待完成提示</li>
        </ul>
      </div>
    </Card>
  );
}
