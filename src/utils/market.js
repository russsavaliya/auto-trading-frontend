const IST = 'Asia/Kolkata';

/**
 * True between 09:15 and 15:30 IST on a weekday. NSE holidays are not known
 * here, so a holiday reads as open — on the Home card that only means "waiting
 * for a signal" instead of "market closed", which is harmless.
 */
export function isMarketHours(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value;

  const day = get('weekday');
  if (day === 'Sat' || day === 'Sun') return false;
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  return minutes >= 9 * 60 + 15 && minutes < 15 * 60 + 30;
}

/** Whether an ISO timestamp falls on today's IST date. */
export function isTodayIST(iso, now = new Date()) {
  if (!iso) return false;
  const day = (d) => d.toLocaleDateString('en-CA', { timeZone: IST });
  return day(new Date(iso)) === day(now);
}
