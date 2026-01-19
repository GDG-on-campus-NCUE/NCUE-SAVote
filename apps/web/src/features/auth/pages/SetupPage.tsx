import { useTranslation } from 'react-i18next';
import { NullifierSetup } from '../components/NullifierSetup';
import { Card } from '../../../components/m3/Card';
import { MainLayout } from '../../../components/layout/MainLayout';

export const SetupPage = () => {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="flex justify-center items-center min-h-[80vh] px-4 animate-fade-in">
        <div className="w-full max-w-lg">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">
                  {t('auth.setup_key_title', 'Setup Anonymous Voting Key')}
              </h2>
              <p className="text-[var(--color-on-surface-variant)]">
                  {t('auth.setup_key_desc', 'To ensure anonymity, the system has generated a unique key for you. Please keep it safe.')}
              </p>
            </div>
            <NullifierSetup />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

