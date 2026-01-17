import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/auth.api';
import { storage } from '../../../lib/localStorage';
import { NullifierRecovery } from './NullifierRecovery';
import { PageShell } from '../../../components/layout/PageShell';
import { GlassCard } from '../../../components/ui/GlassCard';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  const setNullifierSecretStatus = useAuthStore(state => state.setNullifierSecretStatus);
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Prevent running multiple times
    if (isProcessing) return;

    const handleCallback = async () => {
      setIsProcessing(true);
      
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
            navigate('/', { replace: true });
            return;
          }

          setNullifierSecretStatus(false);

          if (isNewUser) {
            navigate('/auth/setup', { replace: true });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (needsRecovery) {
    return (
      <PageShell>
        <div className="flex justify-center items-center min-h-[60vh] px-4">
          <div className="w-full max-w-md">
            <GlassCard>
              <NullifierRecovery
                subtitle="我們偵測到此帳號尚未在此裝置保存匿名金鑰，請輸入您的備份以繼續。"
                onSuccess={() => {
                  setNullifierSecretStatus(true);
                  navigate('/');
                }}
              />
            </GlassCard>
          </div>
        </div>
      </PageShell>
    );
  }

  if (errorMessage) {
    return (
      <PageShell>
        <div className="flex justify-center items-center min-h-[60vh] px-4">
          <div className="w-full max-w-md">
            <GlassCard>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-red-300 font-medium mb-6">{errorMessage}</p>
                <button
                  onClick={() => navigate('/auth/login')}
                  className="w-full px-4 py-2 text-sm font-medium rounded-md text-white glass-strong border border-blue-400/50 hover:border-blue-400/80 hover:bg-blue-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 backdrop-blur-xl"
                >
                  返回登入頁
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex justify-center items-center min-h-[60vh] px-4">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">正在驗證登入...</h2>
          <p className="text-gray-300">請稍候</p>
        </div>
      </div>
    </PageShell>
  );
};
