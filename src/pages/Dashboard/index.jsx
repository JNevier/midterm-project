import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useBooking } from '../../contexts/BookingContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import SpaceImage from '../../components/SpaceImage';
import { spacesData } from '../../data/spaces';
import { formatBookingDate, formatTimeRange } from '../../utils/bookingTime';
import { getNoticeText, getNoticeTone } from '../../utils/bookingNotice';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  useDocumentTitle('My bookings | StudySpot PH');
  const { getUserBookings, cancelBooking } = useBooking();
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const headingRef = useRef(null);
  const justCancelledRef = useRef(false);

  // One notice for the latest action (confirmed, updated or cancelled).
  // A new booking arrives in router state from the booking form: keep it for
  // this visit, then clear the router state so a refresh does not show it again.
  const [notice, setNotice] = useState(() => location.state?.notice ?? null);
  useEffect(() => {
    if (location.state?.notice) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  // Use email instead of ID for persistent bookings
  const userBookings = getUserBookings(user?.email);

  // Get space details for each booking
  const enrichedBookings = userBookings.map(booking => {
    const space = spacesData.find(s => s.id === booking.spaceId);
    return {
      ...booking,
      spaceLocation: space?.location || 'Unknown Location',
      spaceImage: space?.main_image || '/space-1.jpg'
    };
  });

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleConfirmCancel = () => {
    if (selectedBooking) {
      cancelBooking(selectedBooking.id);
      // The cancellation replaces any earlier notice (for example "Booking confirmed")
      setNotice({
        type: 'cancelled',
        spaceName: selectedBooking.spaceName,
        bookingDate: selectedBooking.bookingDate,
        startTime: selectedBooking.startTime,
        endTime: selectedBooking.endTime,
      });
      justCancelledRef.current = true;
      setShowModal(false);
      setSelectedBooking(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
    // The button that opened the dialog is gone after a cancel; move focus to the heading
    if (justCancelledRef.current) {
      justCancelledRef.current = false;
      headingRef.current?.focus();
    }
  };

  const sortedBookings = enrichedBookings.sort((a, b) => {
    const dateA = new Date(`${a.bookingDate} ${a.startTime}`);
    const dateB = new Date(`${b.bookingDate} ${b.startTime}`);
    return dateB - dateA; // Most recent first
  });

  const count = sortedBookings.length;
  const welcomeLine = count === 0
    ? `Welcome back, ${user?.name}. You have no bookings yet.`
    : `Welcome back, ${user?.name}. You have ${count} ${count === 1 ? 'booking' : 'bookings'}.`;

  return (
    <div className="dashboard container">
      <div className="dashboard__header">
        <h1 ref={headingRef} tabIndex={-1} className="dashboard__title">My bookings</h1>
        <p className="dashboard__welcome">{welcomeLine}</p>
      </div>

      {/* Always in the page, so screen readers announce each new notice */}
      <div className="dashboard__notice-slot" role="status" aria-live="polite">
        {notice && (
          <div className={`alert dashboard__alert ${getNoticeTone(notice) === 'neutral' ? 'alert-neutral' : 'alert-success'}`}>
            <p className="mb-0">{getNoticeText(notice)}</p>
            <button type="button" className="dashboard__dismiss" aria-label="Dismiss" onClick={() => setNotice(null)}>
              <FaTimes aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {count === 0 ? (
        <div className="dashboard__empty ss-card">
          <h2>No bookings yet</h2>
          <p className="text-muted">Pick a study space and book your first time slot.</p>
          <Link to="/#spaces" className="btn btn-primary btn-lg">Browse spaces</Link>
        </div>
      ) : (
        <>
          <ul className="dashboard__list">
            {sortedBookings.map(booking => {
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

              const bookingDate = new Date(booking.bookingDate + 'T00:00:00'); // Add time to avoid timezone issues
              const bookingDateTime = new Date(booking.bookingDate + 'T' + booking.startTime + ':00');

              const isUpcoming = bookingDateTime > now;

              const getBookingTimeDisplay = () => {
                // Compare dates only (ignore time for day calculation)
                const diffTime = bookingDate.getTime() - today.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                  // It's today - check if time has passed
                  const currentTime = now.getHours() * 60 + now.getMinutes();
                  const [bookingHour, bookingMin] = booking.startTime.split(':').map(Number);
                  const bookingTimeInMinutes = bookingHour * 60 + bookingMin;

                  if (bookingTimeInMinutes > currentTime) {
                    return 'Today';
                  } else {
                    return 'Today (Started)';
                  }
                } else if (diffDays === 1) {
                  return 'Tomorrow';
                } else if (diffDays > 1) {
                  return `In ${diffDays} days`;
                } else {
                  const pastDays = Math.abs(diffDays);
                  if (pastDays === 1) return 'Yesterday';
                  return `${pastDays} days ago`;
                }
              };

              const titleId = `booking-${booking.id}-title`;

              return (
                <li key={booking.id}>
                  <article className={`booking-item ss-card${isUpcoming ? '' : ' booking-item--past'}`} aria-labelledby={titleId}>
                    <div className="booking-item__media">
                      <SpaceImage src={booking.spaceImage} name={booking.spaceName} ratio="16 / 10" />
                    </div>
                    <div className="booking-item__body">
                      <div className="booking-item__top">
                        <div>
                          <h2 id={titleId} className="ss-card-title booking-item__title">{booking.spaceName}</h2>
                          <p className="booking-item__location">
                            <FaMapMarkerAlt aria-hidden="true" />
                            {booking.spaceLocation}
                          </p>
                        </div>
                        <p className="booking-item__status">
                          <span className={`ss-chip${isUpcoming ? '' : ' ss-chip-neutral'}`}>
                            {isUpcoming ? 'Upcoming' : 'Completed'}
                          </span>
                          <span className="booking-item__relative">{getBookingTimeDisplay()}</span>
                        </p>
                      </div>

                      <dl className="booking-item__details">
                        <div>
                          <dt>Date</dt>
                          <dd>{formatBookingDate(booking.bookingDate)}</dd>
                        </div>
                        <div>
                          <dt>Time</dt>
                          <dd>{formatTimeRange(booking.startTime, booking.endTime)}</dd>
                        </div>
                        <div>
                          <dt>Guests</dt>
                          <dd className="ss-num">{booking.guests}</dd>
                        </div>
                        <div>
                          <dt>Total</dt>
                          <dd className="ss-num">{booking.totalPrice ? `₱${booking.totalPrice}` : '—'}</dd>
                        </div>
                      </dl>

                      {isUpcoming && (
                        <div className="booking-item__actions">
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleCancelClick(booking)}
                          >
                            Cancel booking
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>

          <Link to="/#spaces" className="btn btn-outline-primary dashboard__more">
            Browse more spaces
          </Link>
        </>
      )}

      <ConfirmationModal
        show={showModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmCancel}
        booking={selectedBooking}
      />
    </div>
  );
};

export default Dashboard;
