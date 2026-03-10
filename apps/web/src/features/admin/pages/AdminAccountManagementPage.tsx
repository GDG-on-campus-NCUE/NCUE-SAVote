import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { api } from '../../auth/services/auth.api';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { TextField } from '../../../components/m3/TextField';
import { AdminHeader } from '../components/AdminHeader';
import { 
  Trash2, 
  Search, 
  UserPlus, 
  Fingerprint, 
  ShieldCheck, 
  User, 
  Clock, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { UserRole, ApiResponse } from '@savote/shared-types';

interface AdminPermission {
  id: string;
  synologySub: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export function AdminAccountManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newAdmin, setNewAdmin] = useState({ synologySub: '', name: '', role: UserRole.ADMIN });
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  // Access control
  if (user && !isAdmin) return <Navigate to="/" replace />;
  if (!user) return null;

  // Fetch Admins
  const { data, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AdminPermission[]>>('/admins');
      return res.data;
    },
  });

  const admins = data?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: typeof newAdmin) => api.post('/admins', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admins'] }); setNewAdmin({ synologySub: '', name: '', role: UserRole.ADMIN }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admins/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admins'] }); },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string, role: UserRole }) => api.patch(`/admins/${id}/role`, { role }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admins'] }); },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.synologySub || !newAdmin.name) return;
    createMutation.mutate(newAdmin);
  };

  const filteredAdmins = admins.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.synologySub.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-fade-in pb-24 select-none">
      <AdminHeader 
        title="後台權限管理"
        subtitle="管理系統管理員名單及其權限級別，確保系統操作的安全性。"
      />

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Create Admin Form */}
        <div className="lg:col-span-4 order-2 lg:order-1 sticky top-24">
            <Card className="p-8 rounded-[32px] bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 elevation-1">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] rounded-2xl elevation-1">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--color-on-surface)]">新增管理權限</h2>
                        <p className="text-xs text-[var(--color-on-surface-variant)] opacity-70">授權新的 OIDC 帳號</p>
                    </div>
                </div>
                
                <form onSubmit={handleCreate} className="space-y-6">
                    <TextField
                        label="Admin Name"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        required
                    />
                    
                    <TextField
                        label="OIDC Sub (UID)"
                        placeholder="e.g. S1234567"
                        value={newAdmin.synologySub}
                        onChange={(e) => setNewAdmin({ ...newAdmin, synologySub: e.target.value })}
                        required
                        endAdornment={<Fingerprint className="w-4 h-4 opacity-50" />}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[var(--color-on-surface-variant)] px-1">權限管理</label>
                        <select 
                            className="w-full h-14 px-6 rounded-2xl bg-[var(--color-surface-container-high)] border-none text-[var(--color-on-surface)] font-bold transition-all outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 cursor-pointer appearance-none elevation-1"
                            value={newAdmin.role}
                            onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as UserRole })}
                        >
                            <option value={UserRole.ADMIN}>系統管理員 (ADMIN)</option>
                            {isSuperAdmin && <option value={UserRole.SUPER_ADMIN}>超級管理員 (SUPER)</option>}
                        </select>
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full h-14 rounded-2xl shadow-lg shadow-[var(--color-primary)]/10 mt-4 font-bold"
                        disabled={createMutation.isPending || !newAdmin.synologySub || !newAdmin.name}
                        loading={createMutation.isPending}
                        variant="filled"
                    >
                        確認授權加入
                    </Button>
                </form>

                <div className="mt-8 flex gap-3 items-start text-[11px] text-[var(--color-on-surface-variant)] opacity-60 bg-[var(--color-surface-container-highest)]/50 p-4 rounded-2xl border border-[var(--color-outline-variant)]/20">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                    <p>Sub 為 Synology 提供之唯一識別碼，若輸入錯誤將導致該員無法登入管理介面。</p>
                </div>
            </Card>
        </div>

        {/* Admin List (Table Format) */}
        <div className="lg:col-span-8 order-1 lg:order-2 space-y-6">
            
            {/* Search */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-[var(--color-outline)] group-focus-within:text-[var(--color-primary)] transition-colors" />
                </div>
                <input 
                    type="text" 
                    placeholder="搜尋管理員姓名或 UID..."
                    className="w-full h-16 pl-16 pr-6 bg-[var(--color-surface-container-low)] rounded-[32px] border border-transparent focus:border-[var(--color-primary)]/30 focus:bg-[var(--color-surface)] text-[var(--color-on-surface)] transition-all outline-none elevation-1 focus:elevation-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            {isLoading ? (
                <div className="grid gap-4">
                    {[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--color-surface-container)] rounded-[24px] animate-pulse" />)}
                </div>
            ) : filteredAdmins.length === 0 ? (
                <div className="bg-[var(--color-surface-container-low)] rounded-[40px] border-2 border-dashed border-[var(--color-outline-variant)] py-24 text-center">
                    <div className="p-6 rounded-full bg-[var(--color-surface-container-high)] w-fit mx-auto mb-6">
                        <User className="w-12 h-12 text-[var(--color-outline)] opacity-20" />
                    </div>
                    <p className="text-xl font-bold text-[var(--color-on-surface-variant)] opacity-50">未找到符合條件的管理員</p>
                </div>
            ) : (
                <div className="bg-[var(--color-surface-container-low)] rounded-[32px] border border-[var(--color-outline-variant)]/30 overflow-hidden elevation-1">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--color-surface-container-high)]/50 border-b border-[var(--color-outline-variant)]/30">
                                    <th className="px-8 py-5 text-sm font-bold text-[var(--color-on-surface-variant)] opacity-70">管理員資訊</th>
                                    <th className="px-6 py-5 text-sm font-bold text-[var(--color-on-surface-variant)] opacity-70">權限級別</th>
                                    <th className="px-6 py-5 text-sm font-bold text-[var(--color-on-surface-variant)] opacity-70 hidden md:table-cell">加入時間</th>
                                    <th className="px-8 py-5 text-sm font-bold text-[var(--color-on-surface-variant)] opacity-70 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-outline-variant)]/20">
                                {filteredAdmins.map((admin) => (
                                    <tr 
                                        key={admin.id} 
                                        className={cn(
                                            "group transition-all duration-300",
                                            admin.synologySub === user?.synologySub 
                                                ? "bg-[var(--color-primary-container)]/5" 
                                                : "hover:bg-[var(--color-surface)]"
                                        )}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 elevation-1 transition-transform group-hover:scale-105",
                                                    admin.role === UserRole.SUPER_ADMIN 
                                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                                                        : "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]"
                                                )}>
                                                    {admin.role === UserRole.SUPER_ADMIN ? <ShieldCheck className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-[var(--color-on-surface)] text-lg truncate">
                                                            {admin.name}
                                                        </span>
                                                        {admin.synologySub === user?.synologySub && (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)] uppercase tracking-widest">
                                                                ME
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-on-surface-variant)] opacity-60 font-mono">
                                                        <Fingerprint className="w-3 h-3" />
                                                        {admin.synologySub}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
                                                    admin.role === UserRole.SUPER_ADMIN 
                                                        ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20" 
                                                        : "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                                                )}>
                                                    {admin.role}
                                                </span>
                                                
                                                {isSuperAdmin && admin.synologySub !== user?.synologySub && (
                                                    <select 
                                                        className="h-8 px-2 rounded-lg bg-[var(--color-surface-container-high)] border-none text-[10px] font-black focus:ring-2 focus:ring-[var(--color-primary)]/30 transition-all outline-none cursor-pointer appearance-none elevation-1"
                                                        value={admin.role}
                                                        onChange={(e) => updateRoleMutation.mutate({ id: admin.id, role: e.target.value as UserRole })}
                                                    >
                                                        <option value={UserRole.ADMIN}>ADMIN</option>
                                                        <option value={UserRole.SUPER_ADMIN}>SUPER</option>
                                                    </select>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 hidden md:table-cell">
                                            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-on-surface-variant)] opacity-60">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(admin.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {isSuperAdmin && admin.synologySub !== user?.synologySub && (
                                                <button 
                                                    className="w-10 h-10 rounded-xl hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center inline-flex"
                                                    onClick={() => { if(window.confirm(`確定要移除 ${admin.name} 的管理權限嗎？`)) deleteMutation.mutate(admin.id); }}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                            {admin.synologySub !== user?.synologySub && (
                                                <ChevronRight className="w-5 h-5 text-[var(--color-outline)] opacity-20 group-hover:translate-x-1 transition-all inline-flex ml-2" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
