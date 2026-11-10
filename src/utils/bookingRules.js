import { validateTimes } from './validationSchemas';
import { hasBookingConflict, isOvernight } from './bookingTime';
import { isTimeWithinOperatingHours } from './operatinghours';

export const ALREADY_BOOKED_MESSAGE =
  'You already have a booking for this space. Cancel it from your bookings page to make a new one.';

const isOpen24Hours = (hours) => hours === '24/7' || hours === 'Open 24/7';

// The booking rules in one place, used by the booking form and the change form.
// Returns null when the request is fine, otherwise { field, code, message }
// for the first rule it breaks, in this order:
// already-booked, same-time, closed-overnight, start-outside-hours,
// end-outside-hours, overlap.
// ignoreBookingId: the booking being changed, so it never counts against itself.
export const checkBookingRequest = ({ space, values, bookings, userEmail, ignoreBookingId = null }) => {
  const { bookingDate, startTime, endTime } = values;
  const others = ignoreBookingId == null ? bookings : bookings.filter((b) => b.id !== ignoreBookingId);

  // One booking per space per user
  const alreadyBooked = others.some((b) =>
    b.spaceId === space.id && b.userEmail === userEmail && b.status === 'confirmed');
  if (alreadyBooked) {
    return { field: 'form', code: 'already-booked', message: ALREADY_BOOKED_MESSAGE };
  }

  if (!validateTimes(startTime, endTime)) {
    return { field: 'endTime', code: 'same-time', message: 'End time must be different from start time' };
  }

  if (!isOpen24Hours(space.hours)) {
    if (isOvernight(startTime, endTime)) {
      return {
        field: 'endTime',
        code: 'closed-overnight',
        message: 'This space closes at night. Choose an end time later than the start time.',
      };
    }
    if (!isTimeWithinOperatingHours(startTime, space.hours)) {
      return {
        field: 'startTime',
        code: 'start-outside-hours',
        message: `Start time must be within operating hours (${space.hours})`,
      };
    }
    if (!isTimeWithinOperatingHours(endTime, space.hours)) {
      return {
        field: 'endTime',
        code: 'end-outside-hours',
        message: `End time must be within operating hours (${space.hours})`,
      };
    }
  }

  if (hasBookingConflict(bookings, { spaceId: space.id, bookingDate, startTime, endTime }, ignoreBookingId)) {
    return {
      field: 'startTime',
      code: 'overlap',
      message: 'This time overlaps an existing booking for this space. Please choose another time.',
    };
  }

  return null;
};
