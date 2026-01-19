import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { CheckCircle, AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export const VoteSuccess: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const receipt = location.state?.receipt;

  if (!receipt) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] p-4 animate-fade-in">
        <Card className="max-w-md w-full p-8 text-center flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-[var(--color-error-container)] text-[var(--color-on-error-container)]">
             <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)]">{t('vote.no_receipt', 'No Receipt Found')}</h2>
          <p className="text-[var(--color-on-surface-variant)]">{t('vote.no_receipt_desc', 'Please return to the dashboard.')}</p>
          <Link to="/" className="w-full">
            <Button variant="outlined" className="w-full" icon={<ArrowLeft className="w-4 h-4" />}>
               {t('common.back_home', 'Back to Home')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[80vh] p-4 animate-fade-in pb-24">
      <Card className="max-w-xl w-full p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--color-primary-container)] mb-2 shadow-lg animate-scale-in">
          <CheckCircle className="w-12 h-12 text-[var(--color-on-primary-container)]" />
        </div>
        
        <div>
            <h1 className="text-3xl font-bold text-[var(--color-on-surface)] mb-2">{t('vote.vote_success', 'Vote Cast Successfully!')}</h1>
            <p className="text-[var(--color-on-surface-variant)]">
            {t('vote.success_desc', 'Your vote has been anonymously recorded. Below is your digital receipt.')}
            </p>
        </div>

        <div className="p-6 bg-[var(--color-surface-variant)] rounded-xl border border-[var(--color-outline-variant)] text-left">
          <h3 className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2">
            {t('vote.receipt_label', 'Vote Receipt (Nullifier Hash)')}
          </h3>
          <code className="block p-3 bg-[var(--color-surface)] border border-[var(--color-outline)] rounded-lg text-sm break-all font-mono text-[var(--color-on-surface)]">
            {receipt.nullifier}
          </code>
          <p className="text-xs text-[var(--color-on-surface-variant)] mt-3 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {t('vote.receipt_hint', 'Keep this hash to verify your vote was counted in the final tally.')}
          </p>
        </div>

        <div className="pt-4">
          <Link to="/">
            <Button className="w-full h-12 text-lg" icon={<Home className="w-5 h-5" />}>
              {t('vote.return_dashboard', 'Return to Dashboard')}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
