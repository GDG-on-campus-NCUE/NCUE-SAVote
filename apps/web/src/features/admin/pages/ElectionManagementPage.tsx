import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import { Button } from '../../../components/m3/Button';
import { Card } from '../../../components/m3/Card';
import { Dialog } from '../../../components/m3/Dialog';
import { TextField } from '../../../components/m3/TextField';
import { AdminHeader } from '../components/AdminHeader';
import { api } from '../../auth/services/auth.api';
import { API_ENDPOINTS } from '../../../lib/constants';
import { ElectionType, type Election, UserRole } from '@savote/shared-types';
import { Plus, CalendarPlus, Link as LinkIcon, Users, Trash2, Edit2, Search, Calendar, Clock, ArrowRight } from 'lucide-react';
import { useToastStore } from '../../../stores/toastStore';

interface ExtendedElection extends Election {
    description?: string;
}

export const ELECTION_TYPE_LABELS: Record<string, string> = {
  [ElectionType.PRESIDENTIAL]: '正副會長選舉',
  [ElectionType.DISTRICT_COUNCILOR]: '選區議員選舉',
  [ElectionType.AT_LARGE_COUNCILOR]: '不分區議員選舉',
};

export function ElectionManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
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

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  // Fetch Elections
  const { data: elections = [], isLoading } = useQuery({
    queryKey: ['admin', 'elections'],
    queryFn: async () => {
      const response = await api.get<ExtendedElection[]>(API_ENDPOINTS.ELECTIONS.LIST);
      return response.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(API_ENDPOINTS.ELECTIONS.CREATE, data),
    onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ['admin', 'elections'] }); 
        setIsCreateOpen(false); 
        resetForm(); 
        addToast('選舉建立成功', 'success');
    },
    onError: (error: any) => {
        const msg = error.response?.data?.message;
        addToast(`建立失敗：${Array.isArray(msg) ? msg.join(', ') : msg || '伺服器錯誤'}`, 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) => api.patch(`${API_ENDPOINTS.ELECTIONS.CREATE}/${data.id}`, data.payload),
    onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ['admin', 'elections'] }); 
        setIsCreateOpen(false); 
        resetForm(); 
        addToast('選舉修改成功', 'success');
    },
    onError: (error: any) => {
        const msg = error.response?.data?.message;
        addToast(`修改失敗：${Array.isArray(msg) ? msg.join(', ') : msg || '伺服器錯誤'}`, 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${API_ENDPOINTS.ELECTIONS.CREATE}/${id}`),
    onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ['admin', 'elections'] }); 
        addToast('選舉已刪除', 'info');
    },
  });

  const resetForm = () => {
    setEditingElection(null);
    setFormData({ name: '', description: '', type: ElectionType.PRESIDENTIAL, startTime: '', endTime: '', bulletinUrl: '' });
  };

  const handleOpenCreate = () => { resetForm(); setIsCreateOpen(true); };

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
    
    // Frontend Validation
    if (!formData.name.trim()) return addToast('請填寫選舉名稱', 'warning');
    if (!formData.type) return addToast('請選擇選舉種類', 'warning');
    if (!formData.startTime) return addToast('請設定開始投票時間', 'warning');
    if (!formData.endTime) return addToast('請設定結束投票時間', 'warning');

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    if (end <= start) return addToast('結束時間必須晚於開始時間', 'warning');

    const payload: any = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      config: { bulletinUrl: formData.bulletinUrl },
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
    
    if (editingElection) updateMutation.mutate({ id: editingElection.id, payload });
    else createMutation.mutate(payload);
  };

  const getStatusDisplay = (election: Election) => {
    const now = new Date();
    const start = election.startTime ? new Date(election.startTime) : null;
    const end = election.endTime ? new Date(election.endTime) : null;

    if (!start || !end) {
        return { label: '設定未完成', color: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-500' };
    }

    if (now < start) {
        return { 
            label: '即將開始', 
            color: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700', 
            dot: 'bg-blue-600 dark:bg-blue-400' 
        };
    }
    if (now >= start && now <= end) {
        return { 
            label: '投票進行中', 
            color: 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900/40 dark:text-green-100 dark:border-green-700', 
            dot: 'bg-green-600 dark:bg-green-400 animate-pulse' 
        };
    }
    if (now > end) {
        return { 
            label: '已結束(待計票)', 
            color: 'bg-gray-200 text-gray-900 border-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600', 
            dot: 'bg-gray-600' 
        };
    }

    return { label: '狀態未知', color: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' };
  };

  if (user && !isAdmin) return <Navigate to="/" replace />;
  if (!user) return null;

  const filteredElections = (elections as ExtendedElection[]).filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 pb-24 animate-fade-in">
       <AdminHeader 
         title="選舉管理"
         subtitle="在此建立與修改學生會各項選舉活動，狀態將隨時間自動判定"
         actions={
            <Button 
                variant="filled"
                icon={<Plus className="w-5 h-5" />} 
                onClick={handleOpenCreate}
                className="h-12 px-6 rounded-xl shadow-lg shadow-[var(--color-primary)]/20"
            >
                建立選舉
            </Button>
         }
       />
        
        <div className="space-y-6">
            {/* Search Bar & Action - M3 Search Style */}
            <div className="relative group w-full">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-[var(--color-outline)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                </div>
                <input 
                    type="text" 
                    placeholder="搜尋選舉名稱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 h-14 bg-[var(--color-surface-container-high)] border border-transparent focus:border-[var(--color-primary)]/30 focus:bg-[var(--color-surface)] rounded-xl text-[var(--color-on-surface)] transition-all duration-300 elevation-1 focus:elevation-2 outline-none"
                />
            </div>

             {isLoading ? (
                 <div className="grid gap-4">
                     {[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--color-surface-container)] rounded-xl animate-pulse" />)}
                 </div>
             ) : elections.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-24 bg-[var(--color-surface-container-low)] rounded-xl border-2 border-dashed border-[var(--color-outline-variant)]">
                     <div className="p-6 rounded-full bg-[var(--color-surface-container-high)] mb-6">
                        <CalendarPlus className="w-12 h-12 text-[var(--color-outline)] opacity-40" />
                     </div>
                     <p className="text-xl font-bold text-[var(--color-on-surface-variant)] opacity-60">尚無任何選舉項目</p>
                     <Button variant="text" onClick={handleOpenCreate} className="mt-4 font-bold">
                        點擊此處建立第一筆選舉
                     </Button>
                 </div>
             ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)]/30 overflow-hidden elevation-1 transition-standard hover:elevation-2">
                        <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[var(--color-surface-container-high)]/50 border-b border-[var(--color-outline-variant)]/30">
                                            <th className="px-8 py-5 type-label-large text-[var(--color-on-surface-variant)] opacity-70">選舉資訊</th>
                                            <th className="px-6 py-5 type-label-large text-[var(--color-on-surface-variant)] opacity-70">即時狀態</th>
                                            <th className="px-6 py-5 type-label-large text-[var(--color-on-surface-variant)] opacity-70 hidden lg:table-cell">時間排程</th>
                                            <th className="px-8 py-5 type-label-large text-[var(--color-on-surface-variant)] opacity-70 text-right">管理操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-outline-variant)]/20">
                                        {filteredElections.map((election: ExtendedElection) => {
                                            const status = getStatusDisplay(election);
                                            return (
                                                <tr key={election.id} className="group hover:bg-[var(--color-surface)] transition-all duration-300">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center font-bold text-lg elevation-1 group-hover:scale-110 transition-transform">
                                                                {election.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-[var(--color-on-surface)] text-lg mb-1">{election.name}</div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2 py-0.5 rounded-md bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] text-[10px] font-bold uppercase tracking-wider">
                                                                        {ELECTION_TYPE_LABELS[election.type] || election.type}
                                                                    </span>
                                                                    {election.description && (
                                                                        <span className="text-xs text-[var(--color-on-surface-variant)] opacity-60 line-clamp-1 max-w-[150px]">
                                                                            {election.description}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className={cn(
                                                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-standard border",
                                                            status.color
                                                        )}>
                                                            <div className={cn("w-2 h-2 rounded-full", status.dot)} />
                                                            {status.label}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 hidden lg:table-cell">
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-on-surface-variant)]">
                                                                <Calendar className="w-3.5 h-3.5 opacity-50" />
                                                                <span>{election.startTime ? new Date(election.startTime).toLocaleDateString() : '-'}</span>
                                                                <Clock className="w-3.5 h-3.5 ml-1 opacity-50" />
                                                                <span>{election.startTime ? new Date(election.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-primary)]">
                                                                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                                                                <span>{election.endTime ? new Date(election.endTime).toLocaleDateString() : '-'}</span>
                                                                <Clock className="w-3.5 h-3.5 ml-1 opacity-50" />
                                                                <span>{election.endTime ? new Date(election.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end items-center gap-2">
                                                            <Link to={`/admin/elections/${election.id}/candidates`}>
                                                                <Button variant="tonal" size="sm" className="rounded-xl px-4 font-bold" icon={<Users className="w-4 h-4" />}>
                                                                    管理候選人
                                                                </Button>
                                                            </Link>
                                                            
                                                            {/* Actions restricted after start */}
                                                            {(!election.startTime || new Date() < new Date(election.startTime)) && (
                                                                <>
                                                                    <div className="h-8 w-[1px] bg-[var(--color-outline-variant)]/30 mx-1" />
                                                                    <button 
                                                                        onClick={() => handleOpenEdit(election)}
                                                                        className="w-10 h-10 rounded-xl hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] text-[var(--color-on-surface-variant)] transition-all flex items-center justify-center"
                                                                        title="編輯選舉"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => { if(window.confirm('確定要刪除此選舉嗎？')) deleteMutation.mutate(election.id); }}
                                                                        className="w-10 h-10 rounded-xl hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                                                                        title="刪除選舉"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="grid gap-4 md:hidden">
                        {filteredElections.map((election: ExtendedElection) => {
                            const status = getStatusDisplay(election);
                            return (
                                <Card key={election.id} className="p-6 rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)] elevation-1 overflow-hidden">
                                    <div className="flex flex-col gap-4 mb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center font-bold text-lg shrink-0">
                                                    {election.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-[var(--color-on-surface)] text-lg truncate leading-tight">{election.name}</h3>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] opacity-70">
                                                        {ELECTION_TYPE_LABELS[election.type] || election.type}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border shrink-0",
                                                status.color
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                                                {status.label}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6 bg-[var(--color-surface-container-high)]/50 p-4 rounded-xl">
                                        <div className="flex items-center gap-3 text-xs font-medium text-[var(--color-on-surface-variant)]">
                                            <Calendar className="w-3.5 h-3.5 opacity-50" />
                                            <span>開始：{election.startTime ? new Date(election.startTime).toLocaleString() : '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-medium text-[var(--color-primary)]">
                                            <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                                            <span>結束：{election.endTime ? new Date(election.endTime).toLocaleString() : '-'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <Link to={`/admin/elections/${election.id}/candidates`} className="flex-1 min-w-[120px]">
                                            <Button variant="tonal" size="sm" className="w-full rounded-xl font-bold" icon={<Users className="w-4 h-4" />}>
                                                候選人
                                            </Button>
                                        </Link>
                                        
                                        {(!election.startTime || new Date() < new Date(election.startTime)) && (
                                            <div className="flex gap-2 shrink-0">
                                                <Button 
                                                    variant="outlined" 
                                                    size="sm" 
                                                    onClick={() => handleOpenEdit(election)}
                                                    className="w-10 h-10 p-0 rounded-xl"
                                                    icon={<Edit2 className="w-4 h-4" />}
                                                />
                                                <Button 
                                                    variant="outlined" 
                                                    size="sm" 
                                                    onClick={() => { if(window.confirm('確定要刪除此選舉嗎？')) deleteMutation.mutate(election.id); }}
                                                    className="w-10 h-10 p-0 rounded-xl text-[var(--color-error)] border-[var(--color-error)]/30"
                                                    icon={<Trash2 className="w-4 h-4" />}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </>
             )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog 
            open={isCreateOpen} 
            onClose={() => setIsCreateOpen(false)}
            title={editingElection ? '編輯選舉' : '建立選舉'}
            className="w-full max-w-2xl select-none"
            actions={
                <>
                    <Button variant="text" onClick={() => setIsCreateOpen(false)} className="font-bold">
                        取消
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        loading={createMutation.isPending || updateMutation.isPending}
                        variant="filled"
                        className="px-8 rounded-xl font-bold"
                    >
                        確認儲存
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="py-4 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TextField 
                        label="選舉名稱"
                        placeholder="請輸入選舉名稱 (必填)"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                        className="md:col-span-2"
                    />
                    
                    <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-sm font-bold text-[var(--color-on-surface-variant)] px-1 mb-2">
                            選舉種類 <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { id: ElectionType.PRESIDENTIAL, label: '正副會長選舉' },
                                { id: ElectionType.DISTRICT_COUNCILOR, label: '選區議員選舉' },
                                { id: ElectionType.AT_LARGE_COUNCILOR, label: '不分區議員選舉' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFormData({...formData, type: type.id as ElectionType})}
                                    className={cn(
                                        "px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all",
                                        formData.type === type.id 
                                            ? "bg-[var(--color-primary-container)] border-[var(--color-primary)] text-[var(--color-on-primary-container)]" 
                                            : "bg-[var(--color-surface)] border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]/50"
                                    )}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <TextField 
                        label="開始投票時間"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                        required
                        helperText="請設定正確的開始時間 (必填)"
                    />
                    <TextField 
                        label="結束投票時間"
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                        required
                        helperText="結束時間必須晚於開始時間 (必填)"
                    />

                    <TextField 
                        label="選舉公報檔案連結"
                        value={formData.bulletinUrl}
                        onChange={e => setFormData({...formData, bulletinUrl: e.target.value})}
                        placeholder="請輸入 Google Drive 共享連結"
                        endAdornment={<LinkIcon className="w-4 h-4 opacity-50" />}
                        className="md:col-span-2"
                    />

                    <TextField 
                        label="選舉詳細描述 (選填)"
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

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
