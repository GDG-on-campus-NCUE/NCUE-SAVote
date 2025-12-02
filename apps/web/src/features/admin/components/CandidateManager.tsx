import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../auth/services/auth.api';
import { candidateApi } from '../../auth/services/candidate.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import type { Election } from '@savote/shared-types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';

export function CandidateManager() {
  const queryClient = useQueryClient();
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [newCandidate, setNewCandidate] = useState({ name: '', bio: '', photoUrl: '' });

  // Fetch Elections
  const { data: elections = [], isLoading: isLoadingElections } = useQuery({
    queryKey: ['admin', 'elections'],
    queryFn: async () => {
      const response = await api.get<Election[]>(API_ENDPOINTS.ELECTIONS.LIST);
      return response.data;
    },
  });

  useEffect(() => {
    if (!selectedElectionId && elections.length > 0) {
      setSelectedElectionId(elections[0].id);
    }
  }, [elections, selectedElectionId]);

  // Fetch Candidates
  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery({
    queryKey: ['admin', 'candidates', selectedElectionId],
    queryFn: () => candidateApi.findAll(selectedElectionId),
    enabled: !!selectedElectionId,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof newCandidate) => candidateApi.create(selectedElectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'candidates', selectedElectionId] });
      setNewCandidate({ name: '', bio: '', photoUrl: '' });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => candidateApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'candidates', selectedElectionId] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name) return;
    createMutation.mutate(newCandidate);
  };

  return (
    <Card>
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-lg)' }}>
        候選人管理
      </h2>

      {/* Election Selector */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 'var(--font-weight-medium)' }}>選擇選舉</label>
        {isLoadingElections ? (
          <Skeleton height="40px" />
        ) : (
          <select
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(e.target.value)}
            style={{ 
              width: '100%', 
              padding: 'var(--spacing-sm)', 
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)'
            }}
          >
            {elections.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
      </div>

      {/* Add Candidate Form */}
      <form onSubmit={handleCreate} style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-md)', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--border-radius-md)' }}>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>新增候選人</h3>
        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
          <input
            placeholder="姓名"
            value={newCandidate.name}
            onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })}
            style={{ padding: 'var(--spacing-sm)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}
          />
          <textarea
            placeholder="簡介 (Bio)"
            value={newCandidate.bio}
            onChange={e => setNewCandidate({ ...newCandidate, bio: e.target.value })}
            style={{ padding: 'var(--spacing-sm)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', minHeight: '80px' }}
          />
          <input
            placeholder="照片 URL"
            value={newCandidate.photoUrl}
            onChange={e => setNewCandidate({ ...newCandidate, photoUrl: e.target.value })}
            style={{ padding: 'var(--spacing-sm)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}
          />
          <Button type="submit" variant="primary" disabled={createMutation.isPending || !selectedElectionId}>
            {createMutation.isPending ? '新增中...' : '新增候選人'}
          </Button>
        </div>
      </form>

      {/* Candidates List */}
      <div>
        <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>候選人列表</h3>
        {isLoadingCandidates ? (
          <Skeleton height="100px" />
        ) : candidates.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>尚無候選人</p>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {candidates.map(candidate => (
              <div key={candidate.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  {candidate.photoUrl && (
                    <img src={candidate.photoUrl} alt={candidate.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{candidate.name}</div>
                    <div style={{ fontSize: '0.9em', color: 'var(--color-text-secondary)' }}>{candidate.bio}</div>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => deleteMutation.mutate(candidate.id)} disabled={deleteMutation.isPending}>
                  刪除
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
