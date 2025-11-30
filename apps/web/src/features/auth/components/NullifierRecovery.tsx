import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNullifierSecret } from '../hooks/useNullifierSecret';
import { Button } from '../../../components/ui/Button';

interface NullifierRecoveryProps {
  onSuccess: () => void;
  subtitle?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  SECRET_MISMATCH: '此裝置上的金鑰紀錄與目前登入帳號不符，請確認是否輸入正確。',
  INVALID_FORMAT: '金鑰格式錯誤，請確認為 64 位元十六進位字串。',
  UNKNOWN_ERROR: '驗證時發生錯誤，請稍後再試。',
};

export const NullifierRecovery = ({ onSuccess, subtitle }: NullifierRecoveryProps) => {
  const navigate = useNavigate();
  const { restoreSecret, validationError } = useNullifierSecret();
  const [secretInput, setSecretInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!secretInput.trim()) {
      setError('請輸入您備份的匿名金鑰');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await restoreSecret(secretInput.trim());

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 400);
    } else {
      const messageKey = result.message ?? 'UNKNOWN_ERROR';
      setError(ERROR_MESSAGES[messageKey] || ERROR_MESSAGES.UNKNOWN_ERROR);
    }

    setIsSubmitting(false);
  };

  const derivedError = error || (validationError ? ERROR_MESSAGES[validationError] || validationError : null);

  return (
    <div data-testid="nullifier-recovery">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', margin: 0 }}>
          找回匿名金鑰
        </h3>
        <p style={{ marginTop: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          {subtitle || '請輸入您先前備份的 64 位元匿名金鑰，系統僅會在您的瀏覽器中驗證並儲存。'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div>
          <label htmlFor="nullifier" style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-xs)' }}>
            匿名金鑰
          </label>
          <textarea
            id="nullifier"
            name="nullifier"
            rows={3}
            value={secretInput}
            onChange={(event) => setSecretInput(event.target.value)}
            style={{
              width: '100%',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: 'var(--font-size-base)',
              fontFamily: 'monospace',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            placeholder="例如：a4f0..."
          />
        </div>

        {derivedError && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-error)', margin: 0 }} data-testid="recovery-error">
            {derivedError}
          </p>
        )}

        {success && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success)', margin: 0 }} data-testid="recovery-success">
            已成功驗證，即將前往儀表板。
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isSubmitting}
        >
          確認並恢復
        </Button>
      </form>

      <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)' }}>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
          第一次使用或找不到備份？
        </p>
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => navigate('/auth/setup')}
        >
          建立新的匿名金鑰
        </Button>
      </div>
    </div>
  );
};
