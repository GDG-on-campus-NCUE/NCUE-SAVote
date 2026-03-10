import { Navigate } from 'react-router-dom';
import { VoterImport } from '../components/VoterImport';
import { useAuth } from '../../auth/hooks/useAuth';
import { AdminHeader } from '../components/AdminHeader';
import { UserRole } from '@savote/shared-types';

export function VoterManagementPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  if (user && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!user) return null;

  return (
    <div className="animate-fade-in pb-24 space-y-8 select-none">
      <AdminHeader 
          title="選舉人名冊管理"
          subtitle="匯入與管理符合資格的選舉人名冊，設定投票權限。"
      />

      <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-6 md:p-10 border border-[var(--color-outline-variant)]/30 elevation-1 animate-slide-up w-full">
        <VoterImport />
      </div>
    </div>
  );
}
