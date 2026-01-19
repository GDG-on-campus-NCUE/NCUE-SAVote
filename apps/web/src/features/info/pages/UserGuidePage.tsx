import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/m3/Button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserGuideContent } from '../components/UserGuideContent';

export function UserGuidePage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-24">
      <div className="mb-6">
        <Link to="/" className="inline-block mb-2">
            <Button variant="text" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('common.back_home', 'Back to Home')}
            </Button>
        </Link>
        <h1 className="text-3xl font-normal text-[var(--color-on-background)]">{t('info.guide_title', 'Voting Guide')}</h1>
      </div>

      <UserGuideContent />
    </div>
  );
}