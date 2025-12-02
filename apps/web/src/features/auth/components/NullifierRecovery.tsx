import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNullifierSecret } from '../hooks/useNullifierSecret';

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
  const [showPasteHint, setShowPasteHint] = useState(true);
  const [showSecret, setShowSecret] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSecretInput(text.trim());
      setShowPasteHint(false);
      setError(null);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setError('無法讀取剪貼簿，請手動貼上金鑰');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Extract the key from the backup file
        const match = text.match(/金鑰：\s*\n([a-f0-9]+)/);
        if (match && match[1]) {
          setSecretInput(match[1]);
          setShowPasteHint(false);
          setError(null);
        } else {
          setError('無法從檔案中讀取金鑰，請檢查檔案格式');
        }
      };
      reader.readAsText(file);
    }
  };

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
    <div data-testid="nullifier-recovery" className="space-y-6 mt-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          找回匿名金鑰
        </h3>
        <p className="text-sm text-gray-300">
          {subtitle || '請輸入您先前備份的 64 位元匿名金鑰，系統僅會在您的瀏覽器中驗證並儲存。'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nullifier" className="block text-sm font-medium text-gray-300 mb-2">
            匿名金鑰（64 位元十六進位字串）
          </label>
          <div className="relative">
            <input
              id="nullifier"
              name="nullifier"
              type={showSecret ? 'text' : 'password'}
              value={secretInput}
              onChange={(event) => {
                setSecretInput(event.target.value);
                setShowPasteHint(false);
              }}
              className="w-full px-4 py-3 pr-32 glass-subtle rounded-xl font-mono text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:glow-blue-border transition-all"
              placeholder="請貼上您的 64 位元十六進位金鑰..."
              maxLength={64}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={handlePaste}
                className="p-2 glass-subtle rounded-lg text-blue-300 hover:text-white hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all group"
                title="從剪貼簿貼上"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
              
              <label className="p-2 glass-subtle rounded-lg text-blue-300 hover:text-white hover:bg-blue-500/20 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all cursor-pointer group" title="上傳備份檔案">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="p-2 glass-subtle rounded-lg text-blue-300 hover:text-white hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all group"
                title={showSecret ? '隱藏金鑰' : '顯示金鑰'}
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showSecret ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          {secretInput && (
            <p className={`mt-2 text-xs flex items-center gap-1 ${
              secretInput.length === 64 && /^[0-9a-fA-F]{64}$/.test(secretInput)
                ? 'text-green-300'
                : 'text-amber-300'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {secretInput.length === 64 && /^[0-9a-fA-F]{64}$/.test(secretInput) ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {secretInput.length === 64 && /^[0-9a-fA-F]{64}$/.test(secretInput)
                ? '金鑰格式正確 ✓'
                : `已輸入 ${secretInput.length}/64 個字元${/^[0-9a-fA-F]*$/.test(secretInput) ? '' : '（包含無效字元）'}`
              }
            </p>
          )}
        </div>

        {derivedError && (
          <div className="glass-subtle border border-red-400/30 rounded-xl p-4" data-testid="recovery-error" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-300">{derivedError}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="glass-subtle border border-green-400/30 rounded-xl p-4" data-testid="recovery-success" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-300">已成功驗證，即將前往儀表板。</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !secretInput.trim() || secretInput.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(secretInput)}
          className={`w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white transition-all ${
            isSubmitting || !secretInput.trim() || secretInput.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(secretInput)
              ? 'bg-gray-500/40 cursor-not-allowed'
              : 'glass-strong border border-blue-400/50 hover:border-blue-400/80 hover:bg-blue-500/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-xl'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              驗證中...
            </>
          ) : '確認並恢復'}
        </button>
      </form>

      {!success && (
        <div className="pt-6 border-t border-white/10">
          <p className="text-sm text-gray-300 mb-3">
            第一次使用或找不到備份？
          </p>
          <button
            type="button"
            onClick={() => {
              // Navigate to setup page to create a new key
              // The setup page will handle generating a new key
              navigate('/auth/setup', { replace: true });
            }}
            className="w-full flex justify-center items-center py-3 px-4 glass-strong border border-blue-400/50 rounded-xl text-sm font-medium text-blue-200 hover:text-white hover:border-blue-400/80 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-xl"
          >
            建立新的匿名金鑰
          </button>
        </div>
      )}
    </div>
  );
};
