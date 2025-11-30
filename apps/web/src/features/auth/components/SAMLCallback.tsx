import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/auth.api';
import { storage } from '../../../lib/localStorage';
import { NullifierRecovery } from './NullifierRecovery';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';

export const SAMLCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, setNullifierSecretStatus } = useAuthStore(state => ({
    setAuth: state.setAuth,
    setNullifierSecretStatus: state.setNullifierSecretStatus,
  }));
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const isNewUser = searchParams.get('isNewUser') === '1';

      if (accessToken && refreshToken) {
        try {
          // Store tokens temporarily to fetch user
          await storage.setAccessToken(accessToken);
          await storage.setRefreshToken(refreshToken);

          // Fetch user profile
          const user = await authApi.getCurrentUser();
          
          // Update store
          setAuth(accessToken, refreshToken, user);

          const storedSecret = await storage.getNullifierSecret();
          const hasSecretForUser = storedSecret && storedSecret.studentIdHash === user.studentIdHash;

          if (hasSecretForUser) {
            setNullifierSecretStatus(true);
            navigate('/');
            return;
          }

          setNullifierSecretStatus(false);

          if (isNewUser) {
            navigate('/auth/setup');
            return;
          }

          setNeedsRecovery(true);
        } catch (error) {
          console.error('Callback error:', error);
          setErrorMessage('登入驗證失敗，請重新嘗試。');
        }
      } else {
        setErrorMessage('缺少必要參數，請重新登入。');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuth, setNullifierSecretStatus]);

  if (needsRecovery) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)', padding: 'var(--spacing-md)' }}>
        <Card style={{ maxWidth: '480px', width: '100%' }}>
          <NullifierRecovery
            subtitle="我們偵測到此帳號尚未在此裝置保存匿名金鑰，請輸入您的備份以繼續。"
            onSuccess={() => {
              setNullifierSecretStatus(true);
              navigate('/');
            }}
          />
        </Card>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)', padding: 'var(--spacing-md)' }}>
        <Card style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-error)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-lg)' }}>{errorMessage}</p>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/auth/login')}
          >
            返回登入頁
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)', padding: 'var(--spacing-md)' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-sm)' }}>正在驗證登入...</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>請稍候</p>
        <Skeleton height="4px" width="200px" style={{ margin: '0 auto' }} />
      </div>
    </div>
  );
};
