import { formatBookingDate, formatTimeRange, formatDateTime } from './bookingTime';
import { MAX_CHANGES } from './bookingChanges';

// The text of the one notice on the bookings page, for the latest action.
// notice: { type: 'confirmed' | 'updated' | 'cancelled', spaceName, bookingDate, startTime, endTime }
// Confirmed and updated notices also have deadline (ISO string); updated ones
// also have canChange and changesLeft.
export const getNoticeText = (notice) => {
  if (!notice) return null;
  const details = `${notice.spaceName} on ${formatBookingDate(notice.bookingDate)}, ${formatTimeRange(notice.startTime, notice.endTime)}`;
  switch (notice.type) {
    case 'confirmed':
      return notice.deadline
        ? `Booking confirmed: ${details}. You can change it up to ${MAX_CHANGES} times until ${formatDateTime(new Date(notice.deadline))}.`
        : `Booking confirmed: ${details}.`;
    case 'updated':
      if (notice.canChange) {
        const n = notice.changesLeft;
        return `Booking updated: ${details}. You can change it ${n} more ${n === 1 ? 'time' : 'times'} until ${formatDateTime(new Date(notice.deadline))}.`;
      }
      return `Booking updated: ${details}. It can't be changed again.`;
    case 'cancelled':
      return `Booking cancelled: ${details}.`;
    default:
      return null;
  }
};

// Confirmed and updated notices are green; a cancellation is neutral
export const getNoticeTone = (notice) => (notice?.type === 'cancelled' ? 'neutral' : 'success');
