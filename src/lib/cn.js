import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class names and lets a later Tailwind utility win over an earlier one
 * in the same group. Without twMerge, a `className` passed into a component
 * would sit alongside the component's own utility rather than replacing it,
 * and which one applied would come down to stylesheet order.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
