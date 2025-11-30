import { useState, useEffect } from 'react';
import { useNullifierSecret } from '../hooks/useNullifierSecret';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';

export const NullifierSetup = () => {
  const { secret, generateNewSecret, isReady, validationError } = useNullifierSecret();
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!secret && isReady) {
      generateNewSecret().catch(() => {
        // Best effort - user will see error UI below
      });
    }
  }, [secret, generateNewSecret, isReady]);

  const handleContinue = () => {
    if (confirmed) {
      navigate('/');
    }
  };

  if (!isReady) {
    return (
      <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Skeleton height="1.5rem" width="60%" />
        <Skeleton height="3rem" />
        <Skeleton height="2.5rem" width="100%" />
      </div>
    );
  }

  if (!secret) {
    return (
      <div>
        <p style={{ color: 'var(--color-text-secondary)' }}>正在產生匿名金鑰，請稍候...</p>
        {validationError && (
          <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)', marginTop: '0.5rem' }}>
            {validationError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ 
        backgroundColor: '#fefce8', 
        borderLeft: '4px solid var(--color-warning)', 
        padding: '1rem' 
      }}>
        <div style={{ display: 'flex' }}>
          <div style={{ marginLeft: '0.75rem' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: '#a16207', margin: 0 }}>
              這是您的匿名投票金鑰。請務必妥善保存，遺失將無法恢復！
              系統不會儲存此金鑰。
            </p>
          </div>
        </div>
      </div>

      <div 
        style={{ 
          backgroundColor: 'var(--color-surface-hover)', 
          padding: '1rem', 
          borderRadius: 'var(--border-radius-md)', 
          fontFamily: 'monospace', 
          fontSize: 'var(--font-size-sm)',
          wordBreak: 'break-all'
        }} 
        data-testid="nullifier-secret"
      >
        {secret}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '1.25rem' }}>
          <input
            id="confirm"
            name="confirm"
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ 
              height: '1rem', 
              width: '1rem', 
              color: 'var(--color-primary)', 
              borderColor: 'var(--border-color)', 
              borderRadius: '0.25rem' 
            }}
          />
        </div>
        <div style={{ marginLeft: '0.75rem', fontSize: 'var(--font-size-sm)' }}>
          <label htmlFor="confirm" style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
            我已備份此金鑰，並了解遺失後無法找回。
          </label>
        </div>
      </div>

      <Button
        onClick={handleContinue}
        disabled={!confirmed}
        variant="primary"
        style={{ width: '100%' }}
      >
        繼續
      </Button>
    </div>
  );
};
