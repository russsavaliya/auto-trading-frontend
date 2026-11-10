import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Matches the panel's transition below, so the dialog closes once it is off screen. */
const EXIT_MS = 240;

/**
 * The detail behind a row: a panel that slides up from the bottom on a phone
 * and opens as a centred dialog from `md` up.
 *
 * Built on the native <dialog> opened with showModal(). That one call gives
 * the parts a hand-rolled overlay always gets wrong: the page behind becomes
 * inert, focus moves in and comes back to the row on close, and Escape closes
 * it. The page behind is scroll-locked from CSS (`html:has(dialog[open])` in
 * styles/index.css), so there is no body style to forget to restore.
 *
 * Phone conventions it keeps:
 *   - drag the handle down (or flick it) to dismiss;
 *   - the Back gesture closes the sheet instead of leaving the page — an
 *     installed app has no browser chrome, so Back is the only way out that
 *     a thumb knows, and losing the list under it would be a surprise;
 *   - tapping the dimmed page closes it.
 *
 * `open` is owned by the caller. Keep the content mounted while closing (pass
 * the last item, not null) or it disappears before the slide-out finishes.
 */
export function Sheet({ open, onClose, label, header, children }) {
  const dialogRef = useRef(null);
  const panelRef = useRef(null);
  const [shown, setShown] = useState(false);

  // The handlers below are registered once; they read the latest props here.
  const closeRef = useRef(onClose);
  const openRef = useRef(open);
  useEffect(() => {
    closeRef.current = onClose;
    openRef.current = open;
  });

  // Open: showModal, flush styles in the off-screen position, then slide in.
  // Close: slide out, then close the dialog once the transition has run.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
        // A newly displayed element has no "before" style to transition
        // from; reading layout here commits the closed position first.
        panelRef.current?.getBoundingClientRect();
      }
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }

    setShown(false);
    if (!dialog.open) return undefined;
    const timer = setTimeout(() => dialog.close(), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  // Escape fires `cancel`: take it over so the sheet animates out. If the
  // browser closes the dialog anyway (Chrome does on a second Escape with no
  // user activation in between), sync the caller's state from `close`.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const onCancel = (e) => {
      e.preventDefault();
      closeRef.current();
    };
    const onNativeClose = () => {
      if (openRef.current) closeRef.current();
    };
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('close', onNativeClose);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('close', onNativeClose);
    };
  }, []);

  // Back closes the sheet. One history entry is pushed while it is open; Back
  // pops it, and any other close pops it ourselves so it never lingers.
  useEffect(() => {
    if (!open) return undefined;
    let poppedByBack = false;
    window.history.pushState({ ...window.history.state, sheet: true }, '');
    const onPop = () => {
      poppedByBack = true;
      closeRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!poppedByBack && window.history.state?.sheet) window.history.back();
    };
  }, [open]);

  // Drag-to-dismiss, on the handle and header only — the body keeps its own
  // scroll. The panel follows the finger with no transition, then either
  // closes (far enough, or flicked) or springs back.
  const drag = useRef(null);

  function onPointerDown(e) {
    if (e.pointerType === 'mouse') return; // a mouse has the close button
    if (e.target.closest('button, a')) return; // let the X stay a plain tap
    drag.current = { startY: e.clientY, startT: performance.now(), dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    panelRef.current.style.transition = 'none';
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    d.dy = Math.max(0, e.clientY - d.startY);
    panelRef.current.style.translate = `0 ${d.dy}px`;
  }

  function onPointerEnd() {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const panel = panelRef.current;
    panel.style.transition = '';
    panel.style.translate = '';
    const speed = d.dy / Math.max(1, performance.now() - d.startT); // px per ms
    if (d.dy > 110 || (d.dy > 24 && speed > 0.55)) closeRef.current();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      className="text-ink fixed inset-0 m-0 h-full max-h-none w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 backdrop:bg-transparent"
    >
      {/* The dimmed page. Its own element rather than ::backdrop so it fades
          in step with the panel, and so a tap on it is an ordinary click. */}
      <div
        aria-hidden="true"
        onClick={() => closeRef.current()}
        className={cn(
          'bg-ink/45 absolute inset-0 transition-opacity duration-200 motion-reduce:transition-none',
          shown ? 'opacity-100' : 'opacity-0'
        )}
      />

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center md:items-center md:p-6">
        <div
          ref={panelRef}
          className={cn(
            'bg-surface shadow-pop pointer-events-auto relative flex max-h-[92dvh] w-full flex-col',
            'rounded-t-[1.375rem] md:max-h-[85dvh] md:max-w-[26rem] md:rounded-2xl',
            'transition-[translate,opacity] duration-[240ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none',
            shown
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full md:translate-y-3 md:opacity-0'
          )}
        >
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            className="border-line shrink-0 touch-none border-b select-none md:touch-auto"
          >
            <div aria-hidden="true" className="flex justify-center pt-2 pb-1 md:hidden">
              <span className="bg-line-strong h-1 w-10 rounded-full" />
            </div>
            <div className="flex items-start gap-3 px-5 pt-2 pb-4 md:pt-5">
              <div className="min-w-0 flex-1">{header}</div>
              <button
                type="button"
                onClick={() => closeRef.current()}
                aria-label="Close"
                className="bg-subtle text-ink-soft hover:bg-subtle-strong active:bg-subtle-strong -mt-0.5 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
              >
                <X className="size-4" strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="pb-safe min-h-0 overflow-y-auto overscroll-contain">{children}</div>
        </div>
      </div>
    </dialog>
  );
}

export default Sheet;
