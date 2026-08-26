import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({ page, totalPages, onPrev, onNext, disablePrev, disableNext }) {
  return (
    <div className="border-line mt-4 flex items-center justify-center gap-4 border-t pt-4">
      <Button size="sm" onClick={onPrev} disabled={disablePrev}>
        <ChevronLeft className="size-3.5" aria-hidden="true" />
        Prev
      </Button>
      <span className="text-muted tnum text-xs">
        Page {page} of {totalPages}
      </span>
      <Button size="sm" onClick={onNext} disabled={disableNext}>
        Next
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
