import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import { candidateApi } from '../../auth/services/candidate.api';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { AdminHeader } from '../components/AdminHeader';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { Dialog } from '../../../components/m3/Dialog';
import { TextField } from '../../../components/m3/TextField';
import { Plus, Trash2, Edit2, UserCircle, Image as ImageIcon, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { type Election, type Candidate, UserRole } from '@savote/shared-types';
import { useToastStore } from '../../../stores/toastStore';

interface ExtendedCandidate extends Candidate {
    bio?: string;
    photoUrl?: string;
}

export function CandidateManagementPage() {
  const { user } = useAuth();
  const { electionId } = useParams();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<ExtendedCandidate | null>(null);
  const [formData, setFormData] = useState({ name: '', bio: '', photoUrl: '' });

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  const { data: election, isLoading: isLoadingElection } = useQuery({
    queryKey: ['election', electionId],
    queryFn: async () => {
      if (!electionId) return null;
      const res = await api.get<Election>(API_ENDPOINTS.ELECTIONS.GET(electionId));
      return res.data;
    },
    enabled: !!electionId,
  });

  const isLocked = election?.startTime ? new Date() >= new Date(election.startTime) : false;

  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery({
    queryKey: ['admin', 'candidates', electionId],
    queryFn: async () => {
        const res = await candidateApi.findAll(electionId!);
        return res as ExtendedCandidate[];
    },
    enabled: !!electionId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => candidateApi.create(electionId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'candidates', electionId] });
      setIsCreateOpen(false);
      setFormData({ name: '', bio: '', photoUrl: '' });
      addToast('候選人已成功新增', 'success');
    },
    onError: (error: any) => {
        addToast(`新增失敗: ${error.response?.data?.message || '未知錯誤'}`, 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; dto: any }) => candidateApi.update(data.id, data.dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'candidates', electionId] });
      setIsCreateOpen(false);
      setEditingCandidate(null);
      setFormData({ name: '', bio: '', photoUrl: '' });
      addToast('候選人資訊已更新', 'success');
    },
    onError: (error: any) => {
        addToast(`更新失敗: ${error.response?.data?.message || '未知錯誤'}`, 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => candidateApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'candidates', electionId] });
      addToast('候選人已移除', 'info');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    
    if (!formData.name.trim()) {
        addToast('請輸入候選人姓名', 'warning');
        return;
    }

    const payload: any = { name: formData.name, bio: formData.bio };
    if (formData.photoUrl && formData.photoUrl.trim() !== '') {
        payload.photoUrl = formData.photoUrl;
    }

    if (editingCandidate) {
      updateMutation.mutate({ id: editingCandidate.id, dto: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openCreate = () => {
    if (isLocked) return;
    setEditingCandidate(null);
    setFormData({ name: '', bio: '', photoUrl: '' });
    setIsCreateOpen(true);
  };

  const openEdit = (candidate: ExtendedCandidate) => {
    if (isLocked) return;
    setEditingCandidate(candidate);
    setFormData({ 
        name: candidate.name, 
        bio: candidate.bio || '', 
        photoUrl: candidate.photoUrl || '' 
    });
    setIsCreateOpen(true);
  };

  if (user && !isAdmin) return <Navigate to="/" replace />;
  if (!user) return null;
  if (!electionId) return <Navigate to="/admin/elections" replace />;

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      <AdminHeader 
        title={isLoadingElection ? '載入中...' : `${election?.name}`}
        subtitle="管理此選舉活動的候選人名單與簡介資訊"
        actions={
            !isLocked && (
                <Button 
                    variant="filled" 
                    icon={<Plus className="w-5 h-5" />} 
                    onClick={openCreate}
                    className="h-12 px-6 rounded-xl shadow-lg shadow-[var(--color-primary)]/20 font-bold"
                >
                    新增候選人
                </Button>
            )
        }
      />

      {isLocked && (
          <Card className="bg-amber-100/80 dark:bg-amber-900/40 border-amber-500/50 p-6 rounded-2xl flex items-center gap-5 text-amber-900 dark:text-amber-100 animate-slide-up border-2 backdrop-blur-md shadow-lg selection:bg-transparent">
              <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-md animate-pulse">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                  <p className="font-black text-xl tracking-tight">名單已凍結</p>
                  <p className="text-sm font-medium opacity-80">本場選舉已進入正式階段或已結束，為維護公平性，系統已鎖定候選人資訊修改功能。</p>
              </div>
          </Card>
      )}

      {isLoadingCandidates ? (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-[var(--color-surface-container)] rounded-2xl animate-pulse" />)}
         </div>
      ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-[var(--color-surface-container-low)] rounded-3xl border-2 border-dashed border-[var(--color-outline-variant)] opacity-60">
              <div className="p-6 rounded-full bg-[var(--color-surface-container-high)] mb-6">
                <UserCircle className="w-16 h-16 text-[var(--color-outline)] opacity-40" />
              </div>
              <p className="text-xl font-bold text-[var(--color-on-surface-variant)]">目前尚無候選人</p>
              {!isLocked && (
                <Button variant="text" onClick={openCreate} className="mt-4 font-bold">
                    點擊此處新增第一位候選人
                </Button>
              )}
          </div>
      ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {candidates.map((candidate) => (
                  <Card 
                    key={candidate.id} 
                    className="group relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:elevation-2 rounded-2xl border border-[var(--color-outline-variant)]/30 p-6 md:p-8 bg-[var(--color-surface)]"
                  >
                      {/* Subtle Glow Background */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

                      <div className="flex flex-col h-full relative z-10">
                          <div className="flex items-start justify-between mb-6">
                                {candidate.photoUrl ? (
                                    <div className="relative">
                                        <img 
                                            src={candidate.photoUrl} 
                                            alt={candidate.name} 
                                            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover elevation-1 group-hover:scale-105 transition-transform duration-500 ring-2 ring-[var(--color-primary)]/10" 
                                        />
                                        <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] elevation-2">
                                            <Sparkles className="w-3 h-3" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-on-primary-container)] text-3xl font-bold elevation-1">
                                        {candidate.name.charAt(0)}
                                    </div>
                                )}
                                
                                {!isLocked && (
                                    <div className="flex gap-1.5">
                                        <button 
                                            onClick={() => openEdit(candidate)}
                                            className="w-9 h-9 rounded-lg hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] text-[var(--color-on-surface-variant)] transition-all flex items-center justify-center border border-transparent hover:border-[var(--color-primary)]/20"
                                            title="編輯"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => { if(window.confirm('確定要刪除此候選人嗎？')) deleteMutation.mutate(candidate.id); }}
                                            className="w-9 h-9 rounded-lg hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center border border-transparent hover:border-[var(--color-error)]/20"
                                            title="刪除"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                          </div>

                          <div className="flex-1">
                                <h3 className="text-xl md:text-2xl font-bold text-[var(--color-on-surface)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                                    {candidate.name}
                                </h3>
                                <div className="h-px w-8 bg-[var(--color-primary)]/30 mb-4" />
                                <p className="text-[var(--color-on-surface-variant)] leading-relaxed text-sm md:text-base opacity-80 line-clamp-4 font-medium italic">
                                    {candidate.bio || '尚未提供候選人詳細簡介。'}
                                </p>
                          </div>
                      </div>
                  </Card>
              ))}
          </div>
      )}

      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={editingCandidate ? '編輯候選人' : '新增候選人'}
        className="w-full max-w-xl select-none"
        actions={
            <>
                <Button variant="text" onClick={() => setIsCreateOpen(false)} className="font-bold">
                    取消
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    loading={createMutation.isPending || updateMutation.isPending}
                    variant="filled"
                    className="px-8 rounded-xl font-bold shadow-lg shadow-[var(--color-primary)]/20"
                >
                    確認儲存
                </Button>
            </>
        }
      >
        <form onSubmit={handleSubmit} className="py-2 space-y-6">
            <div className="space-y-1">
                <TextField 
                    label="候選人姓名"
                    placeholder="請輸入真實姓名或名稱"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                />
                <p className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary)] px-1">
                    <AlertCircle className="w-3 h-3" />
                    此為必填欄位
                </p>
            </div>

            <TextField 
                label="照片網址 (選填)"
                value={formData.photoUrl}
                onChange={e => setFormData({...formData, photoUrl: e.target.value})}
                placeholder="例如：https://imgur.com/..."
                helperText="請提供公開且有效的圖片連結"
                endAdornment={<ImageIcon className="w-4 h-4 opacity-40" />}
            />

            <TextField 
                label="候選人簡介 / 政見"
                placeholder="請輸入政見或自我介紹..."
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                multiline
                rows={6}
            />
        </form>
      </Dialog>
    </div>
  );
}
