import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { api } from '../../auth/services/auth.api';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { TextField } from '../../../components/m3/TextField';
import { AdminHeader } from '../components/AdminHeader';
import { Plus, Trash2, ShieldAlert, Shield, Search, KeyRound, MonitorSmartphone } from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  name: string;
  lastLoginIp?: string;
  createdAt: string;
}

export function AdminAccountManagementPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', name: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Access control
  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  if (!user) return null;

  // Fetch Admins
  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const res = await api.get<AdminUser[]>('/admins');
      return res.data;
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof newAdmin) => api.post('/admins', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setNewAdmin({ username: '', password: '', name: '' });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.username || !newAdmin.password || !newAdmin.name) return;
    createMutation.mutate(newAdmin);
  };

  const filteredAdmins = admins.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-8">
      <AdminHeader 
        title={t('admin.account_mgmt', 'Admin Management')}
        subtitle={t('admin.account_mgmt_desc', 'Manage system administrators')}
      />

      <div className="grid lg:grid-cols-12 gap-8 animate-fade-in-up">
        
        {/* Create Admin Form - Side Panel */}
        <div className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1">
            <Card className="sticky top-24 border-0 shadow-lg bg-[var(--color-surface)] overflow-hidden">
                <div className="p-6 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[var(--color-surface)]/20 rounded-xl backdrop-blur-sm">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold">
                            {t('admin.add_admin', 'Add Admin')}
                        </h2>
                    </div>
                    <p className="text-sm opacity-80 pl-1">Create a new administrator account with full privileges.</p>
                </div>
                
                <form onSubmit={handleCreate} className="p-6 space-y-5">
                    <TextField
                        label={t('admin.admin_name', 'Name')}
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        required
                        className="bg-[var(--color-surface-container-lowest)]"
                    />
                    <TextField
                        label={t('admin.admin_username', 'Username')}
                        value={newAdmin.username}
                        onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                        required
                        className="bg-[var(--color-surface-container-lowest)]"
                    />
                    <TextField
                        label={t('admin.admin_password', 'Password')}
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        required
                        className="bg-[var(--color-surface-container-lowest)]"
                    />
                    <Button
                        type="submit"
                        className="w-full mt-2 h-12 shadow-md hover:shadow-lg transition-shadow"
                        variant="filled"
                        loading={createMutation.isPending}
                        icon={<Plus className="w-5 h-5" />}
                    >
                        {t('common.add', 'Add Administrator')}
                    </Button>
                </form>
            </Card>
        </div>

        {/* Admin List - Main Content */}
        <div className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2 space-y-6">
            
            {/* Search and Filters */}
            <div className="flex items-center gap-4 bg-[var(--color-surface)] p-4 rounded-2xl shadow-sm border border-[var(--color-outline-variant)]/50">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-outline)]" />
                    <input 
                        type="text" 
                        placeholder={t('common.search', 'Search admins...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 text-[var(--color-on-surface)] placeholder-[var(--color-outline)]"
                    />
                </div>
                <div className="px-4 py-1 bg-[var(--color-secondary-container)] rounded-full text-xs font-medium text-[var(--color-on-secondary-container)]">
                    {filteredAdmins.length} Active
                </div>
            </div>

            <Card className="p-0 overflow-hidden border-0 shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)]">
                                <th className="p-4 py-5 font-semibold text-[var(--color-on-surface-variant)] text-sm w-16 text-center">#</th>
                                <th className="p-4 py-5 font-semibold text-[var(--color-on-surface-variant)] text-sm">{t('admin.admin_name', 'Name')} / {t('admin.admin_username', 'Username')}</th>
                                <th className="p-4 py-5 font-semibold text-[var(--color-on-surface-variant)] text-sm hidden sm:table-cell">{t('admin.status', 'Status')}</th>
                                <th className="p-4 py-5 font-semibold text-[var(--color-on-surface-variant)] text-sm text-right w-24">{t('common.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-outline-variant)]/50">
                            {isLoading ? (
                                [1,2,3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-8 w-8 bg-[var(--color-surface-variant)] rounded-full mx-auto" /></td>
                                        <td className="p-4"><div className="h-4 w-32 bg-[var(--color-surface-variant)] rounded mb-2" /><div className="h-3 w-20 bg-[var(--color-surface-variant)]/50 rounded" /></td>
                                        <td className="p-4 hidden sm:table-cell"><div className="h-6 w-16 bg-[var(--color-surface-variant)] rounded-full" /></td>
                                        <td className="p-4"></td>
                                    </tr>
                                ))
                            ) : filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-[var(--color-on-surface-variant)]">
                                        <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>{t('admin.no_admins', 'No administrators found.')}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmins.map((admin, index) => (
                                    <tr key={admin.id} className="group hover:bg-[var(--color-surface-container-high)] transition-colors">
                                        <td className="p-4 text-center">
                                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center text-xs font-bold mx-auto">
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[var(--color-surface-variant)] flex items-center justify-center text-[var(--color-on-surface-variant)]">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[var(--color-on-surface)]">{admin.name}</div>
                                                    <div className="text-xs text-[var(--color-on-surface-variant)] font-mono">@{admin.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden sm:table-cell">
                                            {admin.lastLoginIp ? (
                                                <div className="flex items-center gap-2">
                                                    <MonitorSmartphone className="w-4 h-4 text-green-600" />
                                                    <span className="text-xs text-[var(--color-on-surface-variant)]">
                                                        Online <span className="opacity-50">({admin.lastLoginIp})</span>
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-[var(--color-outline)]">Offline</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                variant="text"
                                                color="error"
                                                className="opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                                                icon={<Trash2 className="w-5 h-5" />}
                                                onClick={() => {
                                                    if (window.confirm(t('admin.delete_confirm'))) {
                                                        deleteMutation.mutate(admin.id);
                                                    }
                                                }}
                                                loading={deleteMutation.isPending && deleteMutation.variables === admin.id}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}
