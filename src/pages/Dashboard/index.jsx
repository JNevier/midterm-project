import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useBooking } from '../../contexts/BookingContext';
import ConfirmationModal from '../../components/ConfirmationModal';
import { FaCalendar, FaClock, FaUsers, FaTimes, FaExclamationTriangle, FaMapMarkerAlt } from 'react-icons/fa';
import { spacesData } from '../../data/spaces';

const Dashboard = () => {
  const { user } = useAuth();
  useDocumentTitle('My bookings | StudySpot PH');
  const { getUserBookings, cancelBooking } = useBooking();
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

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
      setShowModal(false);
      setSelectedBooking(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  const sortedBookings = enrichedBookings.sort((a, b) => {
    const dateA = new Date(`${a.bookingDate} ${a.startTime}`);
    const dateB = new Date(`${b.bookingDate} ${b.startTime}`);
    return dateB - dateA; // Most recent first
  });

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="welcome-section text-center mb-4 py-4 bg-light rounded">
          <h1 className="display-6">Welcome back, {user?.name}!</h1>
          <p className="lead text-muted">Manage your study space bookings</p>
        </div>

        {sortedBookings.length === 0 ? (
          <div className="no-bookings text-center py-5">
            <FaExclamationTriangle size={64} className="text-muted mb-3" />
            <h3>No bookings yet</h3>
            <p className="text-muted">Start exploring study spaces and make your first booking!</p>
            <Link to="/" className="btn btn-primary btn-lg">Explore Spaces</Link>
          </div>
        ) : (
          <div className="bookings-section">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-primary">
                <FaCalendar className="me-2" />
                Your Bookings ({sortedBookings.length})
              </h4>
            </div>
            
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
              
              return (
                <div key={booking.id} className={`booking-card card mb-4 shadow-sm ${isUpcoming ? 'border-primary' : 'bg-light'}`}>
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-md-2">
                        <img 
                          src={booking.spaceImage} 
                          alt={booking.spaceName}
                          className={`img-fluid rounded ${!isUpcoming ? 'opacity-75' : ''}`}
                          style={{height: '80px', width: '100%', objectFit: 'cover'}}
                          onError={(e) => {
                            const color = isUpcoming ? '0F766E' : '475569';
                            e.target.src = `https://via.placeholder.com/200x80/${color}/ffffff?text=${encodeURIComponent(booking.spaceName)}`;
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <h5 className={`card-title mb-1 ${isUpcoming ? 'text-primary' : 'text-muted'}`}>
                          {booking.spaceName}
                        </h5>
                        <p className="text-muted mb-2">
                          <FaMapMarkerAlt className="me-1" />{booking.spaceLocation}
                        </p>
                        <div className="booking-details">
                          <p className="mb-1">
                            <FaCalendar className="me-2 text-muted" />
                            <strong>{new Date(booking.bookingDate).toLocaleDateString()}</strong>
                          </p>
                          <p className="mb-1">
                            <FaClock className="me-2 text-muted" />
                            {booking.startTime} - {booking.endTime}
                          </p>
                          <p className="mb-0">
                            <FaUsers className="me-2 text-muted" />
                            {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                            {booking.totalPrice && (
                              <span className="ms-3">
                                <strong>₱{booking.totalPrice}</strong>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="col-md-2 text-center">
                        <div className="mt-2">
                          <small className={`${isUpcoming ? 'text-success' : 'text-muted'}`}>
                            {getBookingTimeDisplay()}
                          </small>
                        </div>
                      </div>
                      <div className="col-md-2 text-end">
                        {isUpcoming && (
                          <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleCancelClick(booking)}
                          >
                            <FaTimes className="me-1" /> Cancel
                          </button>
                        )}
                        {!isUpcoming && (
                          <span className="badge bg-secondary">Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions mt-5 pt-4 border-top">
          <div className="row text-center">
            <div className="col-md-6 mb-3">
              <Link to="/" className="btn btn-outline-primary btn-lg w-100">
                Explore More Spaces
              </Link>
            </div>
            <div className="col-md-6 mb-3">
              <Link to="/" className="btn btn-outline-secondary btn-lg w-100">
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        <ConfirmationModal
          show={showModal}
          onClose={handleCloseModal}
          onConfirm={handleConfirmCancel}
          booking={selectedBooking}
        />
      </div>
    </div>
  );
};

export default Dashboard;