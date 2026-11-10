import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { hasBookingConflict } from '../utils/bookingTime';

const BookingContext = createContext();

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useLocalStorage('studyspot_bookings', []);

  const addBooking = (booking) => {
    const newBooking = {
      id: Date.now(),
      ...booking,
      createdAt: new Date().toISOString(),
      userEmail: booking.userEmail // Store user email for persistence
    };
    setBookings(prev => [...prev, newBooking]);
    return newBooking;
  };

  // Replaces one booking with its changed details and leaves the others alone.
  // It does not decide whether a change is allowed; the caller does.
  const updateBooking = (bookingId, changes) => {
    setBookings(prev => prev.map(booking => (
      booking.id === bookingId ? { ...booking, ...changes } : booking
    )));
  };

  const cancelBooking = (bookingId) => {
    setBookings(prev => prev.filter(booking => booking.id !== bookingId));
  };

  const getUserBookings = (userEmail) => {
    // Use email instead of ID for persistence across sessions
    return bookings.filter(booking => booking.userEmail === userEmail);
  };

  const hasUserBookedSpace = (spaceId, userEmail) => {
    return bookings.some(booking => 
      booking.spaceId === spaceId &&
      booking.userEmail === userEmail &&
      booking.status === 'confirmed'
    );
  };

  // Get user's existing booking for a space
  const getUserBookingForSpace = (spaceId, userEmail) => {
    return bookings.find(booking => 
      booking.spaceId === spaceId &&
      booking.userEmail === userEmail &&
      booking.status === 'confirmed'
    );
  };

  // True when the time overlaps any confirmed booking for this space, by anyone
  const isBookingConflict = (spaceId, bookingDate, startTime, endTime, ignoreBookingId = null) => {
    return hasBookingConflict(bookings, { spaceId, bookingDate, startTime, endTime }, ignoreBookingId);
  };

  const value = {
    bookings,
    addBooking,
    updateBooking,
    cancelBooking,
    getUserBookings,
    isBookingConflict,
    hasUserBookedSpace,
    getUserBookingForSpace
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};