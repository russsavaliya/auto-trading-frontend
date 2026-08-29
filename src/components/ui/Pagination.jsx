import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

/**
 * Centred on desktop; pushed to the two edges on a phone, where the corners
 * are where a thumb already is and the middle of the screen is the furthest
 * point from it. The buttons also grow to h-9 on touch.
 */
export function Pagination({ page, totalPages, onPrev, onNext, disablePrev, disableNext }) {
  return (
    <div className="border-line mt-4 flex items-center justify-between gap-3 border-t pt-4 sm:justify-center sm:gap-4">
      <Button size="sm" onClick={onPrev} disabled={disablePrev} className="h-9 sm:h-8">
        <ChevronLeft className="size-3.5" aria-hidden="true" />
        Prev
      </Button>
      <span className="text-muted tnum text-xs whitespace-nowrap">
        Page {page} of {totalPages}
      </span>
      <Button size="sm" onClick={onNext} disabled={disableNext} className="h-9 sm:h-8">
        Next
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
