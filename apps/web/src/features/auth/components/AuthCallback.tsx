import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth.store';
import { authApi } from '../services/auth.api';
import { storage } from '../../../lib/localStorage';
import { Card } from '../../../components/m3/Card';
import { Button } from '../../../components/m3/Button';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  const setNullifierSecretStatus = useAuthStore(state => state.setNullifierSecretStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isProcessing) return;

    const handleCallback = async () => {
      setIsProcessing(true);
      
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');

      if (accessToken && refreshToken) {
        try {
          await storage.setAccessToken(accessToken);
          await storage.setRefreshToken(refreshToken);

          const user = await authApi.getCurrentUser();
          setAuth(accessToken, refreshToken, user);

          // Handle Admin Redirect
          if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
            navigate('/admin', { replace: true });
            return;
          }

          const storedSecret = await storage.getNullifierSecret();
          const hasSecretForUser = storedSecret && storedSecret.studentIdHash === user.studentIdHash;

          if (hasSecretForUser) {
            setNullifierSecretStatus(true);
            navigate('/', { replace: true });
            return;
          }

          setNullifierSecretStatus(false);
          // Directly navigate to setup if no key found (Auto-generate flow)
          navigate('/auth/setup', { replace: true });
          
        } catch (error) {
          console.error('Callback error:', error);
          setErrorMessage('登入驗證失敗，請稍後再試。');
        }
      } else {
        setErrorMessage('缺少必要的參數，請重新登入。');
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  if (errorMessage) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4 bg-[var(--color-background)]">
        <div className="w-full max-w-md">
          <Card className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[var(--color-error-container)] mb-4">
              <AlertTriangle className="h-6 w-6 text-[var(--color-on-error-container)]" />
            </div>
            <p className="text-[var(--color-error)] font-medium mb-6">{errorMessage}</p>
            <Button
              onClick={() => navigate('/auth/login')}
              className="w-full"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              返回登入
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen px-4 bg-[var(--color-background)]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[var(--color-primary)]" />
        <h2 className="text-2xl font-bold text-[var(--color-on-background)] mb-2">正在驗證登入身分...</h2>
        <p className="text-[var(--color-on-surface-variant)]">請稍候</p>
      </div>
    </div>
  );
};
