import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/hooks/useAuth';
import { candidateApi } from '../../auth/services/candidate.api';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { AdminHeader } from '../components/AdminHeader';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { Dialog } from '../../../components/m3/Dialog';
import { TextField } from '../../../components/m3/TextField';
import { Plus, Trash2, Edit2, UserCircle } from 'lucide-react';
import type { Election, Candidate } from '@savote/shared-types';

// Extended type since shared-types might be out of sync with backend DTO
interface ExtendedCandidate extends Candidate {
    bio?: string;
    photoUrl?: string;
}

export function CandidateManagementPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { electionId } = useParams();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<ExtendedCandidate | null>(null);
  const [formData, setFormData] = useState({ name: '', bio: '', photoUrl: '' });

  // 1. Fetch Election Details (to show name)
  const { data: election, isLoading: isLoadingElection } = useQuery({
    queryKey: ['election', electionId],
    queryFn: async () => {
      if (!electionId) return null;
      const res = await api.get<Election>(API_ENDPOINTS.ELECTIONS.GET(electionId));
      return res.data;
    },
    enabled: !!electionId,
  });

  // 2. Fetch Candidates
  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery({
    queryKey: ['admin', 'candidates', electionId],
    queryFn: async () => {
        const res = await candidateApi.findAll(electionId!);
        return res as ExtendedCandidate[];
    },
    enabled: !!electionId,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => candidateApi.create(electionId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'candidates', electionId] });
      setIsCreateOpen(false);
      setFormData({ name: '', bio: '', photoUrl: '' });
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; dto: typeof formData }) => candidateApi.update(data.id, data.dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'candidates', electionId] });
      setEditingCandidate(null);
      setFormData({ name: '', bio: '', photoUrl: '' });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => candidateApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'candidates', electionId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCandidate) {
      updateMutation.mutate({ id: editingCandidate.id, dto: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreate = () => {
    setEditingCandidate(null);
    setFormData({ name: '', bio: '', photoUrl: '' });
    setIsCreateOpen(true);
  };

  const openEdit = (candidate: ExtendedCandidate) => {
    setEditingCandidate(candidate);
    setFormData({ 
        name: candidate.name, 
        bio: candidate.bio || (candidate.description as string) || '', 
        photoUrl: candidate.photoUrl || '' 
    });
    setIsCreateOpen(true);
  };

  if (user && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  if (!user) return null;
  if (!electionId) return <Navigate to="/admin/elections" replace />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-6">
      <AdminHeader 
        title={isLoadingElection ? 'Loading...' : `${election?.name} - Candidates`}
        subtitle={t('admin.candidate_mgmt', 'Manage candidates for this election')}
        actions={
            <Button variant="filled" icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
                {t('admin.add_candidate', 'Add Candidate')}
            </Button>
        }
      />

      {/* Candidates List - Redesigned Grid */}
      {isLoadingCandidates ? (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-[var(--color-surface-variant)]/50 rounded-xl animate-pulse" />)}
         </div>
      ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--color-surface-container)] rounded-2xl border border-[var(--color-outline-variant)] border-dashed">
              <UserCircle className="w-16 h-16 text-[var(--color-outline)] mb-4" />
              <p className="text-[var(--color-on-surface-variant)] text-lg">{t('admin.no_candidates', 'No candidates found.')}</p>
              <Button variant="text" onClick={openCreate} className="mt-2">
                 {t('admin.add_candidate', 'Add Candidate')}
              </Button>
          </div>
      ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {candidates.map((candidate) => (
                  <Card key={candidate.id} className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="p-6 flex flex-col h-full">
                          <div className="flex items-start gap-4 mb-4">
                                {candidate.photoUrl ? (
                                    <img 
                                        src={candidate.photoUrl} 
                                        alt={candidate.name} 
                                        className="w-16 h-16 rounded-full object-cover ring-2 ring-[var(--color-surface-variant)]" 
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-on-primary-container)] text-2xl font-bold ring-2 ring-[var(--color-surface-variant)]">
                                        {candidate.name.charAt(0)}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-[var(--color-on-surface)] truncate" title={candidate.name}>
                                        {candidate.name}
                                    </h3>
                                    <p className="text-sm text-[var(--color-on-surface-variant)] line-clamp-2 mt-1 min-h-[2.5em]">
                                        {candidate.bio || candidate.description || 'No bio provided'}
                                    </p>
                                </div>
                          </div>

                          <div className="mt-auto flex justify-end gap-2 pt-4 border-t border-[var(--color-outline-variant)]/50">
                                <Button 
                                    variant="tonal" 
                                    className="h-9 px-3" 
                                    onClick={() => openEdit(candidate)}
                                    icon={<Edit2 className="w-4 h-4" />}
                                >
                                    {t('common.edit', 'Edit')}
                                </Button>
                                <Button 
                                    variant="text" 
                                    color="error"
                                    className="h-9 px-3 hover:bg-red-50 dark:hover:bg-red-900/20" 
                                    onClick={() => {
                                        if(window.confirm(t('admin.delete_confirm', 'Are you sure?'))) {
                                            deleteMutation.mutate(candidate.id);
                                        }
                                    }}
                                    icon={<Trash2 className="w-4 h-4" />}
                                    loading={deleteMutation.isPending && deleteMutation.variables === candidate.id}
                                >
                                    {t('common.delete', 'Delete')}
                                </Button>
                          </div>
                      </div>
                  </Card>
              ))}
          </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={editingCandidate ? t('admin.edit_candidate', 'Edit Candidate') : t('admin.add_candidate', 'Add Candidate')}
        icon={<UserCircle className="w-6 h-6" />}
        actions={
            <>
                <Button variant="text" onClick={() => setIsCreateOpen(false)}>
                    {t('common.cancel')}
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    loading={createMutation.isPending || updateMutation.isPending}
                    variant="filled"
                >
                    {t('common.save')}
                </Button>
            </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <TextField 
                label={t('admin.candidate_name', 'Name')}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
                autoFocus
            />
            <TextField 
                label={t('admin.candidate_bio', 'Bio')}
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                multiline
                rows={3}
            />
            <TextField 
                label={t('admin.candidate_photo', 'Photo URL')}
                value={formData.photoUrl}
                onChange={e => setFormData({...formData, photoUrl: e.target.value})}
                placeholder="https://..."
            />
        </form>
      </Dialog>
    </div>
  );
}