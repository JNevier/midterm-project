import * as yup from 'yup';
import { getDurationMinutes, isOvernight } from './bookingTime';

export const loginSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().email('Invalid email format').required('Email is required')
});

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get current time in HH:MM format
const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Helper function to check if a date is today
const isToday = (dateString) => {
  return dateString === getTodayDateString();
};

// Helper function to check if time is in the past for today
const isTimeInPastForToday = (dateString, timeString) => {
  if (!isToday(dateString)) {
    return false; // If not today, time can't be in the past
  }
  
  const currentTime = getCurrentTimeString();
  return timeString <= currentTime;
};

export const bookingSchema = yup.object({
  bookingDate: yup
    .string()
    .required('Booking date is required')
    .test('not-past-date', 'Date cannot be in the past', function(value) {
      if (!value) return false;
      
      const selectedDate = new Date(value + 'T00:00:00'); // Add time to avoid timezone issues
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return selectedDate >= today;
    }),
  startTime: yup
    .string()
    .required('Start time is required')
    .test('not-past-time', 'Start time cannot be in the past', function(value) {
      const { bookingDate } = this.parent;
      
      if (!value || !bookingDate) return true;
      
      if (isToday(bookingDate)) {
        return !isTimeInPastForToday(bookingDate, value);
      }
      
      return true;
    }),
  endTime: yup
    .string()
    .required('End time is required')
    .test('different-from-start', 'End time must be different from start time', function(value) {
      const { startTime } = this.parent;
      
      if (!value || !startTime) return true;
      
      return validateTimes(startTime, value);
    })
    .test('not-past-time', 'End time cannot be in the past', function(value) {
      const { bookingDate, startTime } = this.parent;
      
      if (!value || !bookingDate) return true;

      // An overnight booking ends tomorrow, so its end time is never in the past
      if (startTime && isOvernight(startTime, value)) return true;
      
      if (isToday(bookingDate)) {
        return !isTimeInPastForToday(bookingDate, value);
      }
      
      return true;
    }),
  guests: yup
    .number()
    .typeError('Number of guests must be a whole number')
    .required('Number of guests is required')
    .min(1, 'At least 1 guest required')
    .max(10, 'Maximum 10 guests allowed')
    .integer('Must be a whole number')
    .test('no-decimal', 'Decimal numbers are not allowed', value => {
      return value === undefined || value === null || Number.isInteger(value);
    })
});

// Start and end must differ. An end earlier than the start is an overnight
// booking (allowed only for 24/7 spaces, checked in the booking form).
export const validateTimes = (startTime, endTime) => {
  if (startTime && endTime) {
    return getDurationMinutes(startTime, endTime) > 0;
  }
  return true;
};

export const isBookingForToday = (bookingDate) => {
  return isToday(bookingDate);
};

export const isCurrentTimeAfter = (timeString) => {
  const currentTime = getCurrentTimeString();
  return currentTime > timeString;
};