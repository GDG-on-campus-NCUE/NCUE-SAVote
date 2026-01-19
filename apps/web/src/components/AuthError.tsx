import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from './m3/Card';
import { Button } from './m3/Button';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

/**
 * Authentication Error Page
 * Displays error message from SAML SSO or other auth failures
 */
export function AuthError() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorMessage = searchParams.get('message') || t('auth.login_error_default', 'An error occurred during login.');

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-[var(--color-background)]">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[var(--color-error-container)] mb-6">
          <AlertCircle className="h-8 w-8 text-[var(--color-on-error-container)]" />
        </div>

        <h2 className="text-2xl font-bold mb-2 text-[var(--color-on-surface)]">
          {t('auth.login_failed', 'Login Failed')}
        </h2>

        <p className="text-[var(--color-on-surface-variant)] mb-8">
          {errorMessage}
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => navigate('/auth/login')}
            className="w-full"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {t('auth.try_again', 'Try Again')}
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            className="w-full"
            icon={<Home className="w-4 h-4" />}
          >
            {t('common.back_home', 'Back to Home')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
