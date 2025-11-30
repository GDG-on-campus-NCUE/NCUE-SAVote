import { Link, Navigate } from 'react-router-dom';
import { VoterImport } from '../components/VoterImport';
import { useAuth } from '../../auth/hooks/useAuth';
import { Layout } from '../../../components/Layout';
import { Button } from '../../../components/ui/Button';

export function VoterManagementPage() {
  const { user } = useAuth();

  if (user && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', margin: 0 }}>
            選舉資格管理
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
            Admin Panel
          </p>
        </div>
        <Link to="/">
          <Button variant="secondary">
            回首頁
          </Button>
        </Link>
      </div>

      <VoterImport />
    </Layout>
  );
}
