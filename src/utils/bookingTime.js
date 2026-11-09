// Booking time rules as pure functions (no React), so they can be unit tested.

const MINUTES_PER_DAY = 24 * 60;

// "HH:MM" -> minutes since midnight
export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Minutes between start and end. An end earlier than the start means the
// booking runs overnight into the next day. Equal times give 0.
export const getDurationMinutes = (startTime, endTime) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (end === start) return 0;
  return end > start ? end - start : end + MINUTES_PER_DAY - start;
};

export const isOvernight = (startTime, endTime) =>
  timeToMinutes(endTime) < timeToMinutes(startTime);

// Every started hour is billed: 1h 45m -> 2 hours, exactly 1h -> 1 hour.
export const getBilledHours = (durationMinutes) => Math.ceil(durationMinutes / 60);

// 105 -> "1h 45m", 120 -> "2h", 45 -> "45m", 0 -> "0m"
export const formatDuration = (durationMinutes) => {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
};

// One shared calculation for the price summary and the saved total.
export const getPriceSummary = (startTime, endTime, hourlyRate, guests) => {
  const guestCount = Number(guests) || 1;
  const durationMinutes = startTime && endTime ? getDurationMinutes(startTime, endTime) : 0;
  const billedHours = getBilledHours(durationMinutes);
  return {
    durationMinutes,
    billedHours,
    total: billedHours * hourlyRate * guestCount,
  };
};

// A booking as a real time range in minutes, counted from 1970-01-01 (UTC is
// used only as a fixed calendar, so the local time zone does not matter).
export const getBookingRange = ({ bookingDate, startTime, endTime }) => {
  const [year, month, day] = bookingDate.split('-').map(Number);
  const dayStart = Date.UTC(year, month - 1, day) / 60000;
  const start = dayStart + timeToMinutes(startTime);
  return { start, end: start + getDurationMinutes(startTime, endTime) };
};

// Ranges overlap when each one starts before the other ends.
// Back-to-back ranges (one ends 13:00, the next starts 13:00) do not overlap.
export const rangesOverlap = (a, b) => a.start < b.end && b.start < a.end;

// True when the new booking overlaps any confirmed booking for the same space,
// by any user, on any date (overnight bookings included).
export const hasBookingConflict = (bookings, newBooking) => {
  const newRange = getBookingRange(newBooking);
  return bookings.some(
    (booking) =>
      booking.spaceId === newBooking.spaceId &&
      booking.status === 'confirmed' &&
      rangesOverlap(getBookingRange(booking), newRange)
  );
};

// "2026-11-10" -> "Tue, Nov 10, 2026". The date is built from its parts as a
// local date. new Date('2026-11-10') would be read as midnight UTC, which is
// still the previous day for a visitor in the Americas.
export const formatBookingDate = (bookingDate) => {
  const [year, month, day] = bookingDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// "13:00" -> "1:00 PM", "00:30" -> "12:30 AM"
export const formatTime12h = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
};

// "9:00 AM to 1:00 PM", with " (next day)" for an overnight booking
export const formatTimeRange = (startTime, endTime) =>
  `${formatTime12h(startTime)} to ${formatTime12h(endTime)}${isOvernight(startTime, endTime) ? ' (next day)' : ''}`;
