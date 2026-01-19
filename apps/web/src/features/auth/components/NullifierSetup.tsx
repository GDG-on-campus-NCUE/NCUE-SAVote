import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNullifierSecret } from '../hooks/useNullifierSecret';
import { Button } from '../../../components/m3/Button';
import { Loader2, ShieldCheck, Eye, EyeOff, Copy, Download, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { clsx } from 'clsx';

export const NullifierSetup = () => {
  const { t } = useTranslation();
  const { secret, generateNewSecret, isReady, validationError } = useNullifierSecret();
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!secret && isReady) {
      generateNewSecret().catch(() => {
        // Best effort
      });
    }
  }, [secret, generateNewSecret, isReady]);

  const handleCopySecret = async () => {
    if (secret) {
      try {
        await navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleDownloadSecret = () => {
    if (secret) {
      const blob = new Blob([`Voting System Anonymous Key Backup\nGenerated: ${new Date().toLocaleString()}\n\nKey:\n${secret}\n\nWARNING:\nThis key is for anonymous voting. Please keep it safe.\nIf lost, it cannot be recovered.\nDo not share this key.`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voting-secret-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadComplete(true);
    }
  };

  const handleContinue = () => {
    if (confirmed) {
      navigate('/', { replace: true });
    }
  };

  if (!isReady) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-[var(--color-surface-variant)] rounded w-3/4 mx-auto" />
        <div className="h-24 bg-[var(--color-surface-variant)] rounded" />
        <div className="h-12 bg-[var(--color-surface-variant)] rounded" />
      </div>
    );
  }

  if (!secret) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-[var(--color-primary)]" />
        <p className="text-[var(--color-on-surface-variant)] font-medium">{t('auth.generating_key', 'Generating anonymous key...')}</p>
        {validationError && (
          <p className="text-[var(--color-error)] text-sm mt-2">
            {validationError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Icon */}
      <div className="text-center animate-scale-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary-container)] to-[var(--color-secondary-container)] mb-6 shadow-lg">
          <ShieldCheck className="w-10 h-10 text-[var(--color-on-primary-container)]" />
        </div>
        <h3 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">
          {t('auth.key_generated', 'Key Generated')}
        </h3>
        <p className="text-[var(--color-on-surface-variant)] max-w-sm mx-auto">
          {t('auth.backup_instruction', 'Your key is ready. Please backup securely.')}
        </p>
      </div>

      {/* Secret Display Card */}
      <div className="bg-[var(--color-surface-container)] rounded-2xl border border-[var(--color-outline-variant)] overflow-hidden shadow-sm animate-fade-in-up">
        {/* Card Header */}
        <div className="px-4 py-3 bg-[var(--color-surface-container-high)] border-b border-[var(--color-outline-variant)] flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-on-surface)]">
                <Key className="w-4 h-4 text-[var(--color-primary)]" />
                {t('auth.your_key', 'Your Anonymous Key')}
            </div>
            <button
                onClick={() => setShowSecret(!showSecret)}
                className="text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--color-surface-variant)]/50 transition-colors"
            >
                {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showSecret ? t('common.hide', 'Hide') : t('common.show', 'Show')}
            </button>
        </div>

        {/* Code Block */}
        <div className="p-6 relative bg-[var(--color-surface)]">
            <div className={clsx(
                "font-mono text-sm break-all leading-relaxed p-4 rounded-xl transition-all duration-300",
                showSecret 
                    ? "bg-[var(--color-surface-variant)]/30 text-[var(--color-on-surface)]" 
                    : "bg-[var(--color-surface-variant)]/10 text-transparent select-none blur-sm"
            )}>
                {secret}
            </div>
            
            {!showSecret && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-[var(--color-inverse-surface)] text-[var(--color-inverse-on-surface)] px-4 py-2 rounded-full text-xs font-medium shadow-md">
                         {t('auth.click_show', 'Click Show to reveal')}
                    </span>
                </div>
            )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 divide-x divide-[var(--color-outline-variant)] border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
            <button
                onClick={handleCopySecret}
                disabled={!showSecret}
                className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
            </button>
            <button
                onClick={handleDownloadSecret}
                className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)]/50 transition-colors"
            >
                {downloadComplete ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Download className="w-4 h-4" />}
                {downloadComplete ? t('common.downloaded', 'Downloaded') : t('common.download', 'Download')}
            </button>
        </div>
      </div>

      {/* Warning */}
      <div className="flex gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/30 animate-fade-in delay-100">
        <AlertTriangle className="h-6 w-6 flex-shrink-0" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold">{t('auth.warning_title', 'Important Security Warning')}</h3>
          <p className="text-xs opacity-90 leading-relaxed">
            {t('auth.warning_1', 'This key is stored temporarily in your browser.')} {t('auth.warning_2', 'If lost, it cannot be recovered.')}
          </p>
        </div>
      </div>

      {/* Confirmation */}
      <label className="flex items-start p-4 rounded-xl border-2 border-transparent hover:border-[var(--color-outline-variant)] cursor-pointer transition-all animate-fade-in delay-200">
        <div className="flex items-center h-6">
            <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
        </div>
        <div className="ml-3">
            <span className="block text-sm font-medium text-[var(--color-on-surface)]">
                {t('auth.i_have_backed_up', 'I have backed up this key and understand it cannot be recovered.')}
            </span>
        </div>
      </label>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!confirmed}
        className="w-full h-12 text-base shadow-lg hover:shadow-xl transition-shadow"
        variant="filled"
        icon={<CheckCircle2 className="w-5 h-5" />}
      >
        {t('auth.continue', 'Enter System')}
      </Button>
    </div>
  );
};