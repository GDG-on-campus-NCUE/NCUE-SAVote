import { useState, useEffect } from 'react';
import { X, PlusSquare, Smartphone } from 'lucide-react';
import { Button } from './m3/Button';
import { Card } from './m3/Card';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    // If it's iOS and not already in standalone mode, suggest "Add to Home Screen"
    if (isIOSDevice && !(window.navigator as any).standalone) {
        // Show after a short delay to ensure initial load is smooth
        const timer = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(timer);
    }

    // Handler for PWA install prompt (Chrome / Android / Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after a short delay
      setTimeout(() => setIsVisible(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-slide-up selection:bg-transparent">
      <Card className="max-w-md mx-auto bg-[var(--color-surface)] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border border-[var(--color-outline-variant)]/30 rounded-[32px] overflow-hidden">
        <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] elevation-1">
                        <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[var(--color-on-surface)] leading-tight">
                            安裝投票系統 App
                        </h3>
                        <p className="text-xs text-[var(--color-on-surface-variant)] opacity-70 font-medium mt-1">
                            獲取更穩定、快速的投票體驗
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {isIOS ? (
                <div className="space-y-4">
                    <div className="bg-[var(--color-surface-container-high)] p-4 rounded-2xl border border-[var(--color-outline-variant)]/20">
                        <p className="text-xs font-bold text-[var(--color-on-surface-variant)] leading-relaxed">
                            iOS 裝置請點擊瀏覽器下方的 <span className="inline-block px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-sm mx-1">分享按鈕</span> 並選擇 <span className="font-black text-[var(--color-primary)]">「加入主畫面」</span> 以安裝此應用程式。
                        </p>
                    </div>
                    <Button 
                        className="w-full h-12 rounded-xl font-bold"
                        variant="tonal"
                        onClick={() => setIsVisible(false)}
                    >
                        我了解了
                    </Button>
                </div>
            ) : (
                <div className="flex gap-3">
                    <Button 
                        className="flex-1 h-14 rounded-2xl font-bold elevation-1" 
                        variant="filled"
                        onClick={handleInstallClick}
                        icon={<PlusSquare className="w-5 h-5" />}
                    >
                        立即安裝
                    </Button>
                    <Button 
                        className="h-14 px-6 rounded-2xl font-bold opacity-60"
                        variant="text"
                        onClick={() => setIsVisible(false)}
                    >
                        稍後再說
                    </Button>
                </div>
            )}
        </div>
      </Card>
    </div>
  );
};
