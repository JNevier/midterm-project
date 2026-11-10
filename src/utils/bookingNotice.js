import { formatBookingDate, formatTimeRange } from './bookingTime';

// The text of the one notice on the bookings page, for the latest action.
// notice: { type: 'confirmed' | 'cancelled', spaceName, bookingDate, startTime, endTime }
export const getNoticeText = (notice) => {
  if (!notice) return null;
  const details = `${notice.spaceName} on ${formatBookingDate(notice.bookingDate)}, ${formatTimeRange(notice.startTime, notice.endTime)}`;
  switch (notice.type) {
    case 'confirmed':
      return `Booking confirmed: ${details}.`;
    case 'cancelled':
      return `Booking cancelled: ${details}.`;
    default:
      return null;
  }
};

// Confirmed and updated notices are green; a cancellation is neutral
export const getNoticeTone = (notice) => (notice?.type === 'cancelled' ? 'neutral' : 'success');
