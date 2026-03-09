import { useState, useEffect } from 'react';
import { Download, X, PlusSquare } from 'lucide-react';
import { Button } from './m3/Button';
import { Card } from './m3/Card';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if Android
    const ua = navigator.userAgent.toLowerCase();
    const isAndroidDevice = ua.includes('android');
    setIsAndroid(isAndroidDevice);

    // Handler for PWA install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if Android (as per requirement) or if we want to promote PWA generally
      if (isAndroidDevice) {
        setIsVisible(true);
      }
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

  const handleDownloadApk = () => {
    // Placeholder for APK download logic
    alert('APK 下載即將推出！目前請先使用「安裝應用程式」或「加入主畫面」。');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <Card className="bg-[var(--color-surface)] shadow-2xl border border-[var(--color-outline-variant)]">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <img src="/pwa-192x192.png" alt="App Icon" className="w-12 h-12 rounded-xl shadow-md" />
                <div>
                    <h3 className="font-bold text-[var(--color-on-surface)]">
                        安裝 彰師大學生會投票系統
                    </h3>
                    <p className="text-sm text-[var(--color-on-surface-variant)]">
                        安裝應用程式以獲得更好的使用體驗
                    </p>
                </div>
            </div>
            <button 
                onClick={() => setIsVisible(false)}
                className="p-1 rounded-full hover:bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="flex gap-3">
            {deferredPrompt && (
                <Button 
                    className="flex-1" 
                    variant="filled"
                    onClick={handleInstallClick}
                    icon={<PlusSquare className="w-4 h-4" />}
                >
                    安裝 App
                </Button>
            )}
            
            {isAndroid && (
                <Button 
                    className="flex-1"
                    variant="outlined"
                    onClick={handleDownloadApk}
                    icon={<Download className="w-4 h-4" />}
                >
                    下載 APK
                </Button>
            )}
        </div>
      </Card>
    </div>
  );
};
