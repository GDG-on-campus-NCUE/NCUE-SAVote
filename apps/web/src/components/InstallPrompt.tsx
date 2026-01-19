import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X, PlusSquare } from 'lucide-react';
import { Button } from './m3/Button';
import { Card } from './m3/Card';

export const InstallPrompt = () => {
  const { t } = useTranslation();
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
    alert(t('app.apk_download_coming_soon', 'APK download coming soon! Please use "Install App" or "Add to Home Screen" for now.'));
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
                        {t('app.install_title', 'Install NCUESA Vote')}
                    </h3>
                    <p className="text-sm text-[var(--color-on-surface-variant)]">
                        {t('app.install_desc', 'Install for a better experience')}
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
                    {t('app.install_app', 'Install App')}
                </Button>
            )}
            
            {isAndroid && (
                <Button 
                    className="flex-1"
                    variant="outlined"
                    onClick={handleDownloadApk}
                    icon={<Download className="w-4 h-4" />}
                >
                    {t('app.download_apk', 'Download APK')}
                </Button>
            )}
        </div>
      </Card>
    </div>
  );
};
