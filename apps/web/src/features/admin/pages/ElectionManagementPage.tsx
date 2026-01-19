import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import { Button } from '../../../components/m3/Button';
import { Dialog } from '../../../components/m3/Dialog';
import { TextField } from '../../../components/m3/TextField';
import { Card } from '../../../components/m3/Card';
import { AdminHeader } from '../components/AdminHeader';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { ElectionType, type Election, ElectionStatus } from '@savote/shared-types';
import { Plus, CalendarPlus, Link as LinkIcon, Users, Trash2, Edit2, Search } from 'lucide-react';

interface ExtendedElection extends Election {
    description?: string;
}

export function ElectionManagementPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingElection, setEditingElection] = useState<ExtendedElection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: ElectionType.PRESIDENTIAL,
    startTime: '',
    endTime: '',
    bulletinUrl: '',
  });

  // Fetch Elections
  const { data: elections = [], isLoading } = useQuery({
    queryKey: ['admin', 'elections'],
    queryFn: async () => {
      const response = await api.get<ExtendedElection[]>(API_ENDPOINTS.ELECTIONS.LIST);
      return response.data;
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(API_ENDPOINTS.ELECTIONS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'elections'] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) => api.patch(`${API_ENDPOINTS.ELECTIONS.CREATE}/${data.id}`, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'elections'] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${API_ENDPOINTS.ELECTIONS.CREATE}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'elections'] });
    },
  });

  const resetForm = () => {
    setEditingElection(null);
    setFormData({
      name: '',
      description: '',
      type: ElectionType.PRESIDENTIAL,
      startTime: '',
      endTime: '',
      bulletinUrl: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (election: ExtendedElection) => {
    setEditingElection(election);
    setFormData({
      name: election.name,
      description: election.description || '',
      type: election.type as ElectionType,
      startTime: election.startTime ? new Date(election.startTime).toISOString().slice(0, 16) : '',
      endTime: election.endTime ? new Date(election.endTime).toISOString().slice(0, 16) : '',
      bulletinUrl: (election.config as any)?.bulletinUrl || '',
    });
    setIsCreateOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      config: {
          bulletinUrl: formData.bulletinUrl,
      },
      startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
      endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
    };

    if (editingElection) {
      updateMutation.mutate({ id: editingElection.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (user && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  if (!user) return null;

  const filteredElections = elections.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-6">
       <AdminHeader 
         title={t('admin.election_mgmt', 'Election Management')}
         subtitle={t('admin.election_mgmt_desc', 'Create and manage elections')}
         actions={
            <Button 
                variant="filled"
                icon={<Plus className="w-5 h-5" />} 
                onClick={handleOpenCreate}
            >
                {t('admin.create_election', 'Create Election')}
            </Button>
         }
       />
        
        <div className="animate-fade-in-up space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-4 bg-[var(--color-surface)] p-4 rounded-2xl shadow-sm border border-[var(--color-outline-variant)]/50">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-outline)]" />
                    <input 
                        type="text" 
                        placeholder={t('common.search', 'Search elections...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 text-[var(--color-on-surface)] placeholder-[var(--color-outline)]"
                    />
                </div>
            </div>

             {isLoading ? (
                 <div className="space-y-4">
                     {[1,2,3].map(i => <div key={i} className="h-20 bg-[var(--color-surface-variant)]/30 rounded-xl animate-pulse" />)}
                 </div>
             ) : elections.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 bg-[var(--color-surface-container)] rounded-2xl border border-[var(--color-outline-variant)] border-dashed">
                     <CalendarPlus className="w-16 h-16 text-[var(--color-outline)] mb-4" />
                     <p className="text-[var(--color-on-surface-variant)] text-lg">{t('admin.no_elections', 'No elections found.')}</p>
                     <Button variant="text" onClick={handleOpenCreate} className="mt-2">
                        {t('admin.create_election', 'Create Election')}
                     </Button>
                 </div>
             ) : (
                <Card className="p-0 overflow-hidden border-0 shadow-md">
                   <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)]">
                                    <th className="p-4 py-5 font-semibold text-[var(--color-on-surface-variant)] text-sm w-16 text-center">#</th>
                                    <th className="p-4 py-5 font-semibold text-[var(--color-on-surface-variant)] text-sm">{t('admin.election_name', 'Name')}</th>
                                    <th className="p-4 py-5 font-semibold text-[var(--color-on-surface-variant)] text-sm">{t('admin.status', 'Status')}</th>
                                    <th className="p-4 py-5 font-semibold text-[var(--color-on-surface-variant)] text-sm hidden lg:table-cell">{t('admin.election_time', 'Duration')}</th>
                                    <th className="p-4 py-5 font-semibold text-[var(--color-on-surface-variant)] text-sm text-right">{t('common.actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-outline-variant)]/50">
                                {filteredElections.map((election, index) => (
                                    <tr key={election.id} className="group hover:bg-[var(--color-surface-container-high)] transition-colors">
                                        <td className="p-4 text-center">
                                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center text-xs font-bold mx-auto">
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <div className="font-bold text-[var(--color-on-surface)] text-base">{election.name}</div>
                                                <div className="text-xs text-[var(--color-on-surface-variant)] flex items-center gap-1 mt-0.5">
                                                     <span className="opacity-80 line-clamp-1 max-w-[200px]">{election.description || 'No description'}</span>
                                                     {election.type && (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] text-[10px]">
                                                            {election.type}
                                                        </span>
                                                     )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                             <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                election.status === ElectionStatus.VOTING_OPEN ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                                election.status === ElectionStatus.VOTING_CLOSED ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                            }`}>
                                                <span className={`w-2 h-2 rounded-full mr-1.5 ${
                                                     election.status === ElectionStatus.VOTING_OPEN ? 'bg-green-500' : 
                                                     election.status === ElectionStatus.VOTING_CLOSED ? 'bg-gray-500' : 'bg-blue-500'
                                                }`} />
                                                {election.status}
                                            </span>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell">
                                            <div className="text-xs text-[var(--color-on-surface-variant)] space-y-1">
                                                <div className="flex items-center gap-2">
                                                     <span className="w-12 opacity-60">Start:</span>
                                                     <span className="font-mono">{election.startTime ? new Date(election.startTime).toLocaleString() : '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                     <span className="w-12 opacity-60">End:</span>
                                                     <span className="font-mono">{election.endTime ? new Date(election.endTime).toLocaleString() : '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <Link to={`/admin/elections/${election.id}/candidates`}>
                                                    <Button variant="text" size="sm" icon={<Users className="w-4 h-4" />}>
                                                        <span className="hidden xl:inline ml-1">{t('admin.candidate_mgmt', 'Candidates')}</span>
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    variant="text" 
                                                    size="sm"
                                                    className="w-8 h-8 p-0"
                                                    onClick={() => handleOpenEdit(election)}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="text" 
                                                    color="error" 
                                                    size="sm"
                                                    className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                        if(window.confirm(t('admin.delete_confirm', 'Are you sure?'))) {
                                                            deleteMutation.mutate(election.id);
                                                        }
                                                    }}
                                                    loading={deleteMutation.isPending && deleteMutation.variables === election.id}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                   </div>
                </Card>
             )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog 
            open={isCreateOpen} 
            onClose={() => setIsCreateOpen(false)}
            title={editingElection ? t('admin.edit_election', 'Edit Election') : t('admin.create_election', 'Create Election')}
            icon={<CalendarPlus className="w-6 h-6" />}
            className="w-full max-w-2xl"
            actions={
                <>
                    <Button variant="text" onClick={() => setIsCreateOpen(false)}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        loading={createMutation.isPending || updateMutation.isPending}
                        variant="filled"
                    >
                        {t('common.save', 'Save')}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="py-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TextField 
                        label={t('admin.election_name', 'Election Name')}
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                        className="md:col-span-2"
                    />
                    
                    <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-sm font-medium text-[var(--color-on-surface-variant)] px-1 mb-1">
                            {t('admin.election_type', 'Election Type')}
                        </label>
                        <div className="relative">
                            <select 
                                value={formData.type}
                                onChange={e => setFormData({...formData, type: e.target.value as ElectionType})}
                                className="w-full appearance-none rounded-lg bg-[var(--color-surface-variant)] border-0 border-b-2 border-[var(--color-outline-variant)] text-[var(--color-on-surface)] px-4 py-3 focus:border-[var(--color-primary)] focus:outline-none transition-colors cursor-pointer hover:bg-[var(--color-surface-variant)]/80"
                            >
                                <option value={ElectionType.PRESIDENTIAL}>{t('admin.election_type_presidential')}</option>
                                <option value={ElectionType.DISTRICT_COUNCILOR}>{t('admin.election_type_district')}</option>
                                <option value={ElectionType.AT_LARGE_COUNCILOR}>{t('admin.election_type_at_large')}</option>
                            </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-on-surface-variant)]">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>

                    <TextField 
                        label={t('admin.election_start', 'Start Time')}
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                    />
                    <TextField 
                        label={t('admin.election_end', 'End Time')}
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                    />

                    <TextField 
                        label={t('admin.bulletin_url', 'Bulletin URL (Google Drive)')}
                        value={formData.bulletinUrl}
                        onChange={e => setFormData({...formData, bulletinUrl: e.target.value})}
                        placeholder="https://drive.google.com/..."
                        endAdornment={<LinkIcon className="w-4 h-4" />}
                        className="md:col-span-2"
                    />

                    <TextField 
                        label={t('admin.election_description', 'Description')}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        multiline
                        rows={3}
                        className="md:col-span-2"
                    />
                </div>
            </form>
        </Dialog>
    </div>
  );
}
