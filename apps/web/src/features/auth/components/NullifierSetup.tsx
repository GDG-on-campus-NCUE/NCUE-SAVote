import { useState, useEffect } from 'react';
import { useNullifierSecret } from '../hooks/useNullifierSecret';
import { useNavigate } from 'react-router-dom';

export const NullifierSetup = () => {
  const { secret, generateNewSecret, isReady, validationError } = useNullifierSecret();
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!secret && isReady) {
      generateNewSecret().catch(() => {
        // Best effort - user will see error UI below
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
      const blob = new Blob([`投票系統匿名金鑰備份\n生成時間：${new Date().toLocaleString('zh-TW')}\n\n金鑰：\n${secret}\n\n⚠️ 警告：\n此金鑰用於匿名投票，請妥善保管。\n遺失將無法恢復，系統不會儲存此金鑰。\n請勿將此金鑰分享給他人。`], { type: 'text/plain' });
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
      // Navigate to home page after user confirms they have backed up their key
      navigate('/', { replace: true });
    }
  };

  if (!isReady) {
    return (
      <div className="space-y-4">
        <div className="glass-subtle h-6 rounded animate-pulse" />
        <div className="glass-subtle h-24 rounded animate-pulse" />
        <div className="glass-subtle h-12 rounded animate-pulse" />
      </div>
    );
  }

  if (!secret) {
    return (
      <div className="text-center py-8">
        <div className="spinner h-8 w-8 mx-auto mb-4" />
        <p className="text-gray-300">正在產生匿名金鑰，請稍候...</p>
        {validationError && (
          <p className="text-red-300 text-sm mt-2">
            {validationError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Icon */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 mb-4 shadow-lg" style={{ animation: 'bounceIn 0.6s ease-out' }}>
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          建立匿名金鑰
        </h3>
        <p className="text-sm text-gray-300">
          您的金鑰已生成，請務必妥善備份
        </p>
      </div>

      {/* Warning Banner */}
      <div className="glass-subtle border-l-4 border-amber-400 p-4 rounded-r-xl" style={{ animation: 'fadeInUp 0.4s ease-out 0.1s backwards' }}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-300">⚠️ 小心保管！</h3>
            <div className="mt-2 text-sm text-amber-200">
              <p>系統已為您<strong>生成一組隨機的 64 位元匿名金鑰</strong>，用於保護投票隱私。</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>此金鑰<strong>僅儲存於您的瀏覽器</strong>，伺服器無法取得</li>
                <li>遺失後<strong>永久無法找回</strong></li>
                <li>請<strong>立即複製或下載</strong>保存至安全處</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Secret Display */}
      <div style={{ animation: 'fadeInUp 0.4s ease-out 0.2s backwards' }}>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">您的匿名金鑰（64 位元）</label>
          <button
            onClick={() => setShowSecret(!showSecret)}
            className="text-sm text-blue-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {showSecret ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              )}
            </svg>
            {showSecret ? '隱藏' : '顯示'}
          </button>
        </div>
        
        <div className="relative">
          <input
            type={showSecret ? 'text' : 'password'}
            value={secret}
            readOnly
            className="w-full glass-subtle p-4 rounded-xl font-mono text-sm border border-blue-400/30 text-white cursor-text select-all"
            data-testid="nullifier-secret"
          />
          {!showSecret && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-gray-400 text-xs font-medium glass px-3 py-1 rounded-lg">點擊右上「顯示」查看金鑰</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3" style={{ animation: 'fadeInUp 0.4s ease-out 0.3s backwards' }}>
        <button
          onClick={handleCopySecret}
          disabled={!showSecret}
          className="flex items-center justify-center gap-2 px-4 py-3 glass-strong border border-blue-400/50 rounded-xl text-sm font-medium text-blue-200 hover:text-white hover:border-blue-400/80 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all backdrop-blur-xl group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {copied ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            )}
          </svg>
          {copied ? '✓ 已複製！' : '複製金鑰'}
        </button>

        <button
          onClick={handleDownloadSecret}
          className="flex items-center justify-center gap-2 px-4 py-3 glass-strong border border-green-400/50 rounded-xl text-sm font-medium text-green-200 hover:text-white hover:border-green-400/80 hover:bg-green-500/20 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all backdrop-blur-xl group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {downloadComplete ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            )}
          </svg>
          {downloadComplete ? '✓ 已下載' : '下載備份'}
        </button>
      </div>

      {/* Backup Tips */}
      <div className="glass-subtle border-l-4 border-blue-400 p-4 rounded-r-xl" style={{ animation: 'fadeInUp 0.4s ease-out 0.4s backwards' }}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-300">備份建議</h3>
            <div className="mt-2 text-sm text-blue-200">
              <ul className="list-disc list-inside space-y-1">
                <li>將金鑰保存在安全的密碼管理器中</li>
                <li>可以將下載的檔案保存到雲端硬碟</li>
                <li>建議多處備份以防遺失</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div className="flex items-start p-4 glass-subtle rounded-xl border border-blue-400/30" style={{ animation: 'fadeInUp 0.4s ease-out 0.5s backwards' }}>
        <div className="flex items-center h-5">
          <input
            id="confirm"
            name="confirm"
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-500 rounded focus:ring-blue-500/50 bg-white/10"
          />
        </div>
        <div className="ml-3">
          <label htmlFor="confirm" className="text-sm font-medium text-white cursor-pointer">
            我已完成備份此金鑰，並了解遺失後無法找回
          </label>
          <p className="text-xs text-gray-400 mt-1">
            請確保您已使用上方的複製或下載功能保存金鑰
          </p>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!confirmed}
        className={`w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white transition-all ${
          confirmed 
            ? 'glass-strong border border-green-400/50 hover:border-green-400/80 hover:bg-green-500/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/30 focus:outline-none focus:ring-2 focus:ring-green-500/50 backdrop-blur-xl' 
            : 'bg-gray-500/40 cursor-not-allowed'
        }`}
        style={{ animation: confirmed ? 'fadeInUp 0.4s ease-out 0.6s backwards' : 'none' }}
      >
        ✓ 已備份，繼續使用系統
      </button>
    </div>
  );
};
