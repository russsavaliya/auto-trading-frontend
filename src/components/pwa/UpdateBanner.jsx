import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const CHECK_EVERY_MS = 60 * 60 * 1000;

/**
 * "A new version is ready" — shown instead of swapping code underneath an
 * open dashboard. An installed app can sit open all trading day, so it also
 * asks the server for a new version once an hour rather than only at launch.
 */
export default function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update(), CHECK_EVERY_MS);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 px-3 pt-3 md:right-4 md:bottom-4 md:left-auto md:p-0"
    >
      <div className="bg-ink text-canvas shadow-pop mb-[4.5rem] flex items-center gap-3 rounded-2xl px-4 py-3 md:mb-0">
        <RefreshCw className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 text-[0.8125rem] font-medium">A new version is ready</span>
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="bg-canvas text-ink shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold active:opacity-80"
        >
          Update
        </button>
      </div>
    </div>
  );
}
