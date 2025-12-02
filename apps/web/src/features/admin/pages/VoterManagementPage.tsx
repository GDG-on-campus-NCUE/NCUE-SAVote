import { Link, Navigate } from 'react-router-dom';
import { VoterImport } from '../components/VoterImport';
import { useAuth } from '../../auth/hooks/useAuth';
import { PageShell } from '../../../components/layout/PageShell';
import { GlassCard } from '../../../components/ui/GlassCard';

export function VoterManagementPage() {
  const { user } = useAuth();

  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  if (!user) {
    return null;
  }

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white m-0">選舉資格管理</h1>
            <p className="text-gray-300 mt-1">Admin Panel</p>
          </div>
          <Link to="/" className="glass-subtle px-4 py-2 rounded-md text-blue-200 hover:text-white transition-colors">回首頁</Link>
        </div>

        <GlassCard>
          <VoterImport />
        </GlassCard>
      </div>
    </PageShell>
  );
}
