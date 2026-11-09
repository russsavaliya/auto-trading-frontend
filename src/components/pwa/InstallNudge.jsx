import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const DISMISS_KEY = 'install-nudge-dismissed';

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * A one-line "install the app" offer on the Home screen, phone only. Shown
 * until the app is installed or the offer is dismissed once; the full card
 * stays on Settings either way, so dismissing it never loses the option.
 */
export default function InstallNudge() {
  const { canPrompt, iosManual, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed || (!canPrompt && !iosManual)) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Private mode or blocked storage — it simply comes back next visit.
    }
  }

  return (
    <div className="border-brand-ring bg-brand-soft mb-5 flex items-center gap-3 rounded-xl border py-2 pr-1.5 pl-3.5 md:hidden">
      <Download className="text-brand size-4 shrink-0" aria-hidden="true" />
      <span className="text-ink min-w-0 flex-1 text-[0.8125rem] font-medium">Get the phone app</span>
      {canPrompt ? (
        <button
          type="button"
          onClick={install}
          className="bg-brand text-canvas shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold active:opacity-80"
        >
          Install
        </button>
      ) : (
        <Link
          to="/settings"
          className="bg-brand text-canvas shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold active:opacity-80"
        >
          How
        </Link>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-muted active:bg-brand-ring/40 flex size-8 shrink-0 items-center justify-center rounded-full"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
