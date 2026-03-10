import { Navigate } from 'react-router-dom';
import { VoterImport } from '../components/VoterImport';
import { useAuth } from '../../auth/hooks/useAuth';
import { AdminHeader } from '../components/AdminHeader';
import { UserRole } from '@savote/shared-types';
import { Users } from 'lucide-react';

export function VoterManagementPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  if (user && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!user) return null;

  return (
    <div className="space-y-10 animate-fade-in pb-24 flex flex-col items-center">
      <div className="w-full">
        <AdminHeader 
            title="選舉人名冊管理"
            subtitle="匯入與管理符合資格的選舉人名冊，設定投票權限。"
        />
      </div>

      <div className="w-full max-w-6xl animate-slide-up">
         <div className="bg-[var(--color-surface-container-low)] rounded-[40px] p-4 md:p-8 border border-[var(--color-outline-variant)]/30 elevation-1">
            <VoterImport />
         </div>
      </div>
      
      {/* Visual background hint */}
      <div className="fixed bottom-0 right-0 p-12 opacity-[0.02] pointer-events-none">
        <Users className="w-64 h-64" />
      </div>
    </div>
  );
}
