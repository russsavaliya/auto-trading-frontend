import { useCallback, useEffect, useState } from 'react';

/**
 * Whether — and how — this dashboard can be installed as a phone app.
 *
 * Chrome/Edge/Android fire `beforeinstallprompt` once, early, often before
 * React has mounted anything. It is captured here at module load and kept, so
 * an Install button rendered later can still use it. iOS Safari has no such
 * event at all: the only route there is Share -> Add to Home Screen, which a
 * page can describe but not trigger, so that case is reported separately.
 */

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Suppress the browser's own mini-infobar; the dashboard offers its own
    // button where it makes sense instead of an unprompted banner.
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
}

function isIos() {
  const ua = window.navigator.userAgent;
  // iPadOS reports itself as a Mac; touch support is what gives it away.
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

export function useInstallPrompt() {
  const [, force] = useState(0);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const onChange = () => {
      setInstalled(isStandalone());
      force((n) => n + 1);
    };
    listeners.add(onChange);
    return () => listeners.delete(onChange);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // The event is single-use whatever the answer was.
    deferredPrompt = null;
    notify();
    return outcome === 'accepted';
  }, []);

  return {
    installed,
    canPrompt: !installed && Boolean(deferredPrompt),
    // Safari on iOS: installable, but only by hand.
    iosManual: !installed && isIos(),
    install,
  };
}

export default useInstallPrompt;
