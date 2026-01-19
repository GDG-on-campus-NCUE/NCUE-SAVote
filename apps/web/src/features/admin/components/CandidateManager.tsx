import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../auth/services/auth.api';
import { candidateApi } from '../../auth/services/candidate.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import type { Election } from '@savote/shared-types';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { TextField } from '../../../components/m3/TextField';
import { Trash2, Plus, UserCircle, Upload } from 'lucide-react';

export function CandidateManager() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [newCandidate, setNewCandidate] = useState<{ name: string; bio: string; photoFile: File | null }>({ name: '', bio: '', photoFile: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    mutationFn: (data: FormData) => candidateApi.create(selectedElectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'candidates', selectedElectionId] });
      setNewCandidate({ name: '', bio: '', photoFile: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
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

    const formData = new FormData();
    formData.append('name', newCandidate.name);
    formData.append('bio', newCandidate.bio);
    if (newCandidate.photoFile) {
        formData.append('photo', newCandidate.photoFile);
    }

    createMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setNewCandidate({ ...newCandidate, photoFile: e.target.files[0] });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-6 text-[var(--color-on-surface)]">
        {t('admin.candidate_mgmt', 'Candidate Management')}
      </h2>

      {/* Election Selector */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-[var(--color-on-surface-variant)]">
            {t('admin.select_election', 'Select Election')}
        </label>
        {isLoadingElections ? (
          <div className="h-10 bg-[var(--color-surface-variant)] rounded animate-pulse" />
        ) : (
          <select
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(e.target.value)}
            className="w-full rounded-lg bg-[var(--color-surface-variant)] border-0 text-[var(--color-on-surface)] px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
          >
            {elections.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
      </div>

      {/* Add Candidate Form */}
      <form onSubmit={handleCreate} className="mb-8 p-4 bg-[var(--color-surface-variant)]/30 rounded-lg border border-[var(--color-outline-variant)]">
        <h3 className="text-lg font-medium mb-4 text-[var(--color-on-surface)]">{t('admin.add_candidate', 'Add Candidate')}</h3>
        <div className="space-y-4">
          <TextField
            label={t('admin.candidate_name', 'Name')}
            value={newCandidate.name}
            onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })}
            className="bg-[var(--color-surface)]"
          />
          <TextField
             label={t('admin.candidate_bio', 'Bio')}
             value={newCandidate.bio}
             onChange={e => setNewCandidate({ ...newCandidate, bio: e.target.value })}
             className="bg-[var(--color-surface)]"
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-on-surface-variant)]">
                {t('admin.candidate_photo', 'Photo')}
            </label>
            <div className="flex items-center gap-4">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="photo-upload"
                />
                <Button 
                    type="button" 
                    variant="outlined" 
                    onClick={() => fileInputRef.current?.click()}
                    icon={<Upload className="w-4 h-4" />}
                >
                    {newCandidate.photoFile ? newCandidate.photoFile.name : t('common.upload_photo', 'Upload Photo')}
                </Button>
                {newCandidate.photoFile && (
                    <Button 
                        type="button" 
                        variant="text" 
                        color="error"
                        onClick={() => {
                            setNewCandidate({ ...newCandidate, photoFile: null });
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                    >
                        {t('common.clear', 'Clear')}
                    </Button>
                )}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={createMutation.isPending || !selectedElectionId}
            loading={createMutation.isPending}
            icon={<Plus className="w-4 h-4" />}
          >
            {t('common.add', 'Add')}
          </Button>
        </div>
      </form>

      {/* Candidates List */}
      <div>
        <h3 className="text-lg font-medium mb-4 text-[var(--color-on-surface)]">{t('admin.candidate_list', 'Candidate List')}</h3>
        {isLoadingCandidates ? (
          <div className="space-y-3">
              <div className="h-16 bg-[var(--color-surface-variant)] rounded animate-pulse" />
              <div className="h-16 bg-[var(--color-surface-variant)] rounded animate-pulse" />
          </div>
        ) : candidates.length === 0 ? (
          <p className="text-[var(--color-on-surface-variant)]">{t('admin.no_candidates', 'No candidates found.')}</p>
        ) : (
          <div className="grid gap-3">
            {candidates.map(candidate => (
              <div key={candidate.id} className="flex justify-between items-center p-4 border border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface)]">
                <div className="flex items-center gap-4">
                  {candidate.photoUrl ? (
                    <img src={candidate.photoUrl} alt={candidate.name} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-on-primary-container)]">
                        <UserCircle className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-[var(--color-on-surface)]">{candidate.name}</div>
                    <div className="text-sm text-[var(--color-on-surface-variant)] line-clamp-1">{candidate.bio}</div>
                  </div>
                </div>
                <Button 
                    variant="text" 
                    color="error"
                    onClick={() => deleteMutation.mutate(candidate.id)} 
                    disabled={deleteMutation.isPending}
                    icon={<Trash2 className="w-4 h-4" />}
                    className="min-w-0 px-2"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
