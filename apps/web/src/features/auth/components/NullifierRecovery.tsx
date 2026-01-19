import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNullifierSecret } from '../hooks/useNullifierSecret';
import { Button } from '../../../components/m3/Button';
import { TextField } from '../../../components/m3/TextField';
import { KeyRound, ClipboardPaste, Upload, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface NullifierRecoveryProps {
  onSuccess: () => void;
  subtitle?: string;
}

export const NullifierRecovery = ({ onSuccess, subtitle }: NullifierRecoveryProps) => {
  const { t } = useTranslation();
  const { restoreSecret, validationError } = useNullifierSecret();
  const [secretInput, setSecretInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const ERROR_MESSAGES: Record<string, string> = {
    SECRET_MISMATCH: t('auth.error_secret_mismatch', 'Key mismatch. Please verify you are using the correct key for this account.'),
    INVALID_FORMAT: t('auth.error_invalid_format', 'Invalid format. Key must be a 64-character hex string.'),
    UNKNOWN_ERROR: t('common.unknown_error', 'An unknown error occurred.'),
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSecretInput(text.trim());
      setError(null);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setError(t('auth.error_clipboard', 'Failed to read clipboard. Please paste manually.'));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Extract the key from the backup file
        // Match standard format: "Key:\n[key]" or just look for long hex string
        const match = text.match(/([a-f0-9]{64})/i); 
        if (match && match[1]) {
          setSecretInput(match[1]);
          setError(null);
        } else {
          setError(t('auth.error_file_read', 'Could not find a valid key in the file.'));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!secretInput.trim()) {
      setError(t('auth.error_missing_key', 'Please enter your key.'));
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

  const isValidFormat = secretInput.length === 64 && /^[0-9a-fA-F]{64}$/.test(secretInput);

  return (
    <div className="space-y-6" data-testid="nullifier-recovery">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-secondary-container)] mb-4 shadow-sm animate-scale-in">
          <KeyRound className="w-8 h-8 text-[var(--color-on-secondary-container)]" />
        </div>
        <h3 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">
          {t('auth.recover_key', 'Recover Anonymous Key')}
        </h3>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          {subtitle || t('auth.recover_desc', 'Please enter your 64-bit hex key to restore access on this device.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <TextField
            label={t('auth.key_label', 'Anonymous Key (64-char hex)')}
            type={showSecret ? 'text' : 'password'}
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder="e.g. 1a2b3c..."
            className="font-mono text-sm"
            error={derivedError || undefined}
          />
          
          <div className="absolute right-2 top-2 flex items-center gap-1">
             <Button
                type="button"
                variant="text"
                className="h-8 w-8 p-0 min-w-0"
                onClick={handlePaste}
                title={t('common.paste', 'Paste')}
             >
                 <ClipboardPaste className="w-4 h-4" />
             </Button>
             
             <div className="relative">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  title={t('common.upload', 'Upload backup file')}
                />
                <Button
                    type="button"
                    variant="text"
                    className="h-8 w-8 p-0 min-w-0 pointer-events-none" // pointer-events handled by input
                >
                    <Upload className="w-4 h-4" />
                </Button>
             </div>

             <Button
                type="button"
                variant="text"
                className="h-8 w-8 p-0 min-w-0"
                onClick={() => setShowSecret(!showSecret)}
             >
                 {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
             </Button>
          </div>

          {/* Validation Hint */}
          {secretInput && !derivedError && (
            <div className={`mt-1 flex items-center gap-1 text-xs ${isValidFormat ? 'text-[var(--color-primary)]' : 'text-[var(--color-error)]'}`}>
               {isValidFormat ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
               {isValidFormat 
                 ? t('auth.format_valid', 'Format valid') 
                 : t('auth.format_invalid_length', 'Length: {{current}}/64', { current: secretInput.length })
               }
            </div>
          )}
        </div>

        {success && (
          <div className="p-4 rounded-lg bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{t('auth.recovery_success', 'Key verified. Redirecting...')}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || !isValidFormat}
          loading={isSubmitting}
          className="w-full"
          icon={<KeyRound className="w-4 h-4" />}
        >
          {t('auth.confirm_restore', 'Confirm & Restore')}
        </Button>
      </form>
    </div>
  );
};
