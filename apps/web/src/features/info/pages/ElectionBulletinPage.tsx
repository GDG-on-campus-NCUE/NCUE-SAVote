import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ElectionBulletinPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-24">
      <div className="mb-6">
        <Link to="/" className="inline-block mb-2">
            <Button variant="text" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('common.back_home', 'Back to Home')}
            </Button>
        </Link>
        <h1 className="text-3xl font-normal text-[var(--color-on-background)]">{t('info.bulletin_title', 'Election Bulletin')}</h1>
        <p className="text-[var(--color-on-surface-variant)]">{t('info.bulletin_desc')}</p>
      </div>

      <Card className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="p-4 rounded-full bg-[var(--color-surface-variant)] mb-4">
            <FileText className="w-12 h-12 text-[var(--color-primary)]" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-[var(--color-on-surface)]">{t('info.bulletin_title', 'Election Bulletin')}</h2>
        
        {/* Placeholder for PDF Viewer or Iframe */}
        <div className="w-full h-[600px] bg-[var(--color-surface-variant)]/30 border border-[var(--color-outline-variant)] rounded-lg flex items-center justify-center mt-6">
            <p className="text-[var(--color-outline)]">{t('info.bulletin_placeholder', 'PDF Placeholder')}</p>
        </div>
      </Card>
    </div>
  );
}