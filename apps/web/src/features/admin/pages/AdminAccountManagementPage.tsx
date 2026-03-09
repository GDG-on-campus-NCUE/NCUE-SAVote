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
  Plus, 
  Trash2, 
  ShieldAlert, 
  Search, 
  UserPlus, 
  Fingerprint, 
  ShieldCheck, 
  User, 
  Clock, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { UserRole, ApiResponse } from '@savote/shared-types';
import { clsx } from 'clsx';

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
  if (user && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  if (!user) return null;

  // Fetch Admins
  const { data, isLoading, error } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      // res.data should be ApiResponse<AdminPermission[]>
      const res = await api.get<ApiResponse<AdminPermission[]>>('/admins');
      return res.data;
    },
  });

  const admins = data?.data || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof newAdmin) => api.post('/admins', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setNewAdmin({ synologySub: '', name: '', role: UserRole.ADMIN });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });

  // Update Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string, role: UserRole }) => api.patch(`/admins/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-10">
      <AdminHeader 
        title="管理員權限管理"
        subtitle="管理系統管理員名單及其權限級別 (基於 Synology OIDC 授權)"
      />

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Create Admin Form - Side Panel */}
        <div className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1 sticky top-24">
            <Card className="border-0 shadow-2xl bg-[var(--color-surface)] overflow-hidden transition-all duration-300 hover:shadow-primary/5">
                <div className="p-6 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-fixed-dim)] text-[var(--color-on-primary)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">
                            新增授權
                        </h2>
                    </div>
                    <p className="text-white/70 text-sm">授權新的 OIDC 帳號存取後台</p>
                </div>
                
                <form onSubmit={handleCreate} className="p-6 space-y-5">
                    <TextField
                        label="顯示名稱"
                        placeholder="例如：王小明"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        endAdornment={<User className="w-5 h-5" />}
                    />
                    
                    <TextField
                        label="OIDC Sub (UID)"
                        placeholder="例如：NCUESA\S12345"
                        value={newAdmin.synologySub}
                        onChange={(e) => setNewAdmin({ ...newAdmin, synologySub: e.target.value })}
                        endAdornment={<Fingerprint className="w-5 h-5" />}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[var(--color-on-surface-variant)] px-1">權限角色</label>
                        <select 
                            className="w-full h-12 px-4 rounded-2xl bg-[var(--color-surface-container-high)] border-0 text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary)] transition-all outline-none"
                            value={newAdmin.role}
                            onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as UserRole })}
                        >
                            <option value={UserRole.ADMIN}>系統管理員 (ADMIN)</option>
                            {isSuperAdmin && <option value={UserRole.SUPER_ADMIN}>超級管理員 (SUPER)</option>}
                        </select>
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full h-12 shadow-lg shadow-primary/20 mt-4 group"
                        disabled={createMutation.isPending || !newAdmin.synologySub || !newAdmin.name}
                        loading={createMutation.isPending}
                        icon={<Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />}
                    >
                        授權並加入
                    </Button>
                </form>
            </Card>

            <Card variant="outlined" className="mt-4 p-4 border-dashed border-2 opacity-70">
                <div className="flex gap-3 items-start text-xs text-[var(--color-on-surface-variant)]">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-warning)]" />
                    <p>
                        注意：Sub 為 Synology 提供的唯一識別碼。若輸入錯誤將導致使用者無法正確登入。
                    </p>
                </div>
            </Card>
        </div>

        {/* Admin List - Main Panel */}
        <div className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2 space-y-6">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[var(--color-surface-container)] p-4 rounded-3xl">
                <div className="relative w-full sm:max-w-md group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] group-focus-within:text-[var(--color-primary)] transition-colors">
                        <Search className="w-5 h-5" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="搜尋管理員姓名或 UID..."
                        className="w-full h-12 pl-12 pr-4 bg-[var(--color-surface)] rounded-2xl border-0 focus:ring-2 focus:ring-[var(--color-primary)] transition-all outline-none text-[var(--color-on-surface)] shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] bg-[var(--color-surface)] px-4 py-2 rounded-xl shadow-sm border border-[var(--color-outline-variant)]">
                    <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
                    目前共有 <span className="font-bold text-[var(--color-on-surface)]">{admins.length}</span> 位授權管理員
                </div>
            </div>

            {/* Admin Table/Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
                    <p className="text-[var(--color-on-surface-variant)] animate-pulse">正在載入授權名單...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-[var(--color-error-container)] rounded-3xl p-8">
                    <AlertCircle className="w-16 h-16 text-[var(--color-error)]" />
                    <div>
                        <h3 className="text-xl font-bold text-[var(--color-on-error-container)]">資料讀取失敗</h3>
                        <p className="text-[var(--color-on-error-container)] opacity-80">請檢查網路連線或重新登入</p>
                    </div>
                    <Button variant="outlined" onClick={() => queryClient.invalidateQueries({ queryKey: ['admins'] })}>
                        重新嘗試
                    </Button>
                </div>
            ) : filteredAdmins.length === 0 ? (
                <div className="bg-[var(--color-surface-container-low)] rounded-3xl border-2 border-dashed border-[var(--color-outline-variant)] py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-[var(--color-surface)] rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <Search className="w-10 h-10 text-[var(--color-on-surface-variant)] opacity-20" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[var(--color-on-surface)]">未找到任何結果</h3>
                        <p className="text-[var(--color-on-surface-variant)] text-sm">請嘗試不同的關鍵字或新增授權</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredAdmins.map((admin) => (
                        <Card 
                            key={admin.id} 
                            className={clsx(
                                "group p-1 border-0 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
                                admin.synologySub === user?.synologySub ? "ring-2 ring-[var(--color-primary)]" : ""
                            )}
                        >
                            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-5">
                                {/* Avatar/Icon */}
                                <div className={clsx(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors",
                                    admin.role === UserRole.SUPER_ADMIN 
                                        ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700" 
                                        : "bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]"
                                )}>
                                    {admin.role === UserRole.SUPER_ADMIN ? <ShieldCheck className="w-8 h-8" /> : <User className="w-8 h-8" />}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <h3 className="text-xl font-bold text-[var(--color-on-surface)] truncate">
                                            {admin.name}
                                        </h3>
                                        <div className="flex gap-2 justify-center sm:justify-start">
                                            <span className={clsx(
                                                "px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase",
                                                admin.role === UserRole.SUPER_ADMIN 
                                                    ? "bg-amber-500 text-white" 
                                                    : "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                                            )}>
                                                {admin.role}
                                            </span>
                                            {admin.synologySub === user?.synologySub && (
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)]">
                                                    自己
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-sm text-[var(--color-on-surface-variant)]">
                                        <div className="flex items-center gap-1.5 bg-[var(--color-surface-container-high)] px-2 py-1 rounded-lg">
                                            <Fingerprint className="w-4 h-4" />
                                            <code className="text-xs font-mono">{admin.synologySub}</code>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-70">
                                            <Clock className="w-4 h-4" />
                                            <span>加入於 {new Date(admin.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-4 sm:pt-0 sm:pl-4 sm:border-l border-[var(--color-outline-variant)]">
                                    {isSuperAdmin && admin.synologySub !== user?.synologySub && (
                                        <>
                                            <select 
                                                className="h-10 px-3 rounded-xl bg-[var(--color-surface-container-high)] border-0 text-xs font-bold focus:ring-2 focus:ring-[var(--color-primary)] transition-all outline-none"
                                                value={admin.role}
                                                onChange={(e) => updateRoleMutation.mutate({ id: admin.id, role: e.target.value as UserRole })}
                                            >
                                                <option value={UserRole.ADMIN}>ADMIN</option>
                                                <option value={UserRole.SUPER_ADMIN}>SUPER</option>
                                            </select>
                                            
                                            <Button 
                                                variant="tonal"
                                                className="w-10 h-10 p-0 rounded-xl hover:bg-[var(--color-error)] hover:text-white transition-all"
                                                onClick={() => {
                                                    if(window.confirm(`確定要移除 ${admin.name} 的管理權限嗎？`)) {
                                                        deleteMutation.mutate(admin.id);
                                                    }
                                                }}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </>
                                    )}
                                    
                                    {admin.synologySub === user?.synologySub && (
                                        <p className="text-xs text-[var(--color-on-surface-variant)] italic opacity-50 px-4">
                                            不可編輯自己
                                        </p>
                                    )}

                                    {!isSuperAdmin && admin.synologySub !== user?.synologySub && (
                                        <p className="text-xs text-[var(--color-on-surface-variant)] italic opacity-50 px-4">
                                            需要超級管理員權限
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
