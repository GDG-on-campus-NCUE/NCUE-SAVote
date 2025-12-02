import { Navigate } from 'react-router-dom';
import { CandidateManager } from '../components/CandidateManager';
import { useAuth } from '../../auth/hooks/useAuth';
import { PageShell } from '../../../components/layout/PageShell';
import { GlassCard } from '../../../components/ui/GlassCard';

export function ElectionManagementPage() {
  const { user } = useAuth();

  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  if (!user) {
    return null;
  }

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">選舉管理</h1>
        <div className="grid gap-6">
          <GlassCard>
            <CandidateManager />
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}
