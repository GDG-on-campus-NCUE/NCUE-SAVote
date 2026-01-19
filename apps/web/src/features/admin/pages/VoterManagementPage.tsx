import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { VoterImport } from '../components/VoterImport';
import { useAuth } from '../../auth/hooks/useAuth';
import { Button } from '../../../components/m3/Button';
import { ArrowLeft } from 'lucide-react';

export function VoterManagementPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-24 space-y-6">
      <div className="flex items-start gap-4 mb-6">
        <Button variant="tonal" className="rounded-full w-10 h-10 p-0 shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
           <h1 className="text-3xl font-bold text-[var(--color-on-background)]">{t('admin.voter_mgmt', 'Voter Management')}</h1>
           <p className="text-[var(--color-on-surface-variant)] mt-1">{t('admin.voter_mgmt_desc', 'Import and manage eligible voters.')}</p>
        </div>
      </div>

      <div className="animate-slide-up delay-100">
         <VoterImport />
      </div>
    </div>
  );
}