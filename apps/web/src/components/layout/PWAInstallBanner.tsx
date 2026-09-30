import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '../ui/Button';

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 inset-x-0 z-30 p-2 sm:p-3 bg-slate-900 text-white shadow-lg flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2.5 max-w-xl mx-auto px-2">
        <Download className="w-4 h-4 text-amber-400 shrink-0" />
        <p>
          <span className="font-semibold text-amber-300">Install TailorConnect:</span> Get instant order timeline notifications and fast offline access.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="secondary" onClick={handleInstall} className="h-7 text-xs px-3">
          Install App
        </Button>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 rounded-md text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
