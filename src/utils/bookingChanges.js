import { formatDateTime, formatTime12h } from './bookingTime';

// Demo rules for changing a booking. Every text that mentions these numbers is
// built from these constants.
export const CHANGE_GRACE_MINUTES = 30; // minutes after booking that a change is always allowed
export const CHANGE_CUTOFF_HOURS = 2; // otherwise, changes close this many hours before the start
export const MAX_CHANGES = 2; // how many times one booking can be changed
export const CHANGE_WARNING_MINUTES = 5; // the note turns into a warning at this many minutes left

const MINUTE = 60 * 1000;
const SOON_MINUTES = 60; // from here on the note counts minutes instead of giving a date

const pad = (n) => String(n).padStart(2, '0');
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// The booking's start as a local date and time (the same way the bookings page decides "upcoming")
export const getBookingStart = (booking) => {
  const [year, month, day] = booking.bookingDate.split('-').map(Number);
  const [hours, minutes] = booking.startTime.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

// deadline = min(start, max(start - cutoff, createdAt + grace))
// Until the cutoff before the start, or for the grace period after booking if
// that is later, and never after the start. Without a valid createdAt only the
// cutoff applies. Always from the CURRENT start, so moving a booking later moves it too.
export const getChangeDeadline = (booking) => {
  const start = getBookingStart(booking).getTime();
  const cutoff = start - CHANGE_CUTOFF_HOURS * 60 * MINUTE;
  const created = Date.parse(booking.createdAt);
  const latest = Number.isFinite(created) ? Math.max(cutoff, created + CHANGE_GRACE_MINUTES * MINUTE) : cutoff;
  return new Date(Math.min(start, latest));
};

// Whether the booking can be changed at `now`, and why not.
// reason: 'ok' | 'not-confirmed' | 'started' | 'no-changes-left' | 'window-closed'
export const getChangeStatus = (booking, now = new Date()) => {
  const changesLeft = Math.max(0, MAX_CHANGES - (booking.changeCount ?? 0));
  const result = (reason, minutesLeft = 0) => ({ canChange: reason === 'ok', reason, minutesLeft, changesLeft });

  if (booking.status !== 'confirmed') return result('not-confirmed');
  if (getBookingStart(booking) <= now) return result('started');
  if (changesLeft === 0) return result('no-changes-left');

  const msLeft = getChangeDeadline(booking).getTime() - now.getTime();
  if (msLeft <= 0) return result('window-closed');
  return result('ok', Math.max(1, Math.ceil(msLeft / MINUTE)));
};

const timeOf = (date) => formatTime12h(`${pad(date.getHours())}:${pad(date.getMinutes())}`);

// The note under the Change booking button: { text, tone } or null.
// tone: 'normal' | 'warning' | 'muted'
export const getChangeNote = (status, deadline) => {
  const left = `${plural(status.changesLeft, 'change')} left.`;
  const m = status.minutesLeft;

  switch (status.reason) {
    case 'ok':
      if (m <= CHANGE_WARNING_MINUTES) {
        return { tone: 'warning', text: `Only ${plural(m, 'minute')} left to change this booking (until ${timeOf(deadline)}). ${left}` };
      }
      if (m <= SOON_MINUTES) {
        return { tone: 'normal', text: `You can change this booking for ${m} more ${m === 1 ? 'minute' : 'minutes'}, until ${timeOf(deadline)}. ${left}` };
      }
      return { tone: 'normal', text: `You can change this booking until ${formatDateTime(deadline)}. ${left}` };
    case 'window-closed':
      return { tone: 'muted', text: 'The time to change this booking has ended. You can still cancel it.' };
    case 'no-changes-left':
      return { tone: 'muted', text: `You have used all ${MAX_CHANGES} changes for this booking. You can still cancel it.` };
    default:
      return null; // started or not confirmed: no note
  }
};
