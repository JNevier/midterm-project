import React, { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { Link, useNavigate } from 'react-router-dom';
import { bookingSchema, validateTimes } from '../../utils/validationSchemas';
import { getPriceSummary, formatDuration, isOvernight } from '../../utils/bookingTime';
import { parseTimeSlot } from '../../utils/timeSlots';
import './BookingForm.css';

const BookingForm = ({ spaceId, spaceName, price, timeSlots, operatingHours }) => {
  const { user, isAuthenticated } = useAuth();
  const { addBooking, hasUserBookedSpace, getUserBookingForSpace, isBookingConflict } = useBooking();
  const navigate = useNavigate();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [warning, setWarning] = useState(null);
  const fieldId = useId();
  const ids = {
    heading: `${fieldId}-heading`,
    slots: `${fieldId}-slots`,
    slotsHelp: `${fieldId}-slots-help`,
    date: `${fieldId}-date`,
    start: `${fieldId}-start`,
    end: `${fieldId}-end`,
    guests: `${fieldId}-guests`,
  };

  const existingBooking = isAuthenticated ? getUserBookingForSpace(spaceId, user?.email) : null;

  const { register, handleSubmit, formState: { errors }, watch, setValue, setError, clearErrors } = useForm({
    resolver: yupResolver(bookingSchema),
    defaultValues: {
      guests: 1,
      startTime: '09:00',
      endTime: '10:00'
    }
  });

  const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

  const watchStartTime = watch('startTime');
  const watchEndTime = watch('endTime');
  const watchGuests = watch('guests');

  const parseOperatingHours = (hours) => {
    if (hours === '24/7' || hours === 'Open 24/7') {
      return { start: '00:00', end: '23:59' };
    }
    
    const match = hours.match(/(\d+):?(\d*)\s*(AM|PM)?\s*-\s*(\d+):?(\d*)\s*(AM|PM)?/i);
    if (match) {
      let startHour = parseInt(match[1]);
      const startMin = match[2] ? parseInt(match[2]) : 0;
      const startPeriod = match[3]?.toUpperCase();
      let endHour = parseInt(match[4]);
      const endMin = match[5] ? parseInt(match[5]) : 0;
      const endPeriod = match[6]?.toUpperCase();
      
      if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
      if (startPeriod === 'AM' && startHour === 12) startHour = 0;
      if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
      if (endPeriod === 'AM' && endHour === 12) endHour = 0;
      
      return {
        start: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
        end: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
      };
    }
    
    return { start: '09:00', end: '21:00' };
  };

  const operatingHoursParsed = parseOperatingHours(operatingHours || '9:00 AM - 9:00 PM');
  const isOpen24Hours = operatingHours === '24/7' || operatingHours === 'Open 24/7';

  // Validate time against operating hours
  const isTimeWithinOperatingHours = (time) => {
    if (operatingHours === '24/7' || operatingHours === 'Open 24/7') {
      return true; // 24/7 spaces accept any time
    }
    return time >= operatingHoursParsed.start && time <= operatingHoursParsed.end;
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
    const times = parseTimeSlot(slot, operatingHoursParsed.start);
    setValue('startTime', times.startTime);
    setValue('endTime', times.endTime);
    clearErrors('startTime');
    clearErrors('endTime');
  };

  // One shared calculation for the Duration row and the Total
  const priceSummary = getPriceSummary(watchStartTime, watchEndTime, price, watchGuests);
  const billedLabel = `${priceSummary.billedHours} ${priceSummary.billedHours === 1 ? 'hour' : 'hours'}`;

  const onSubmit = (data) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (hasUserBookedSpace(spaceId, user.email)) {
      setWarning('You already have a booking for this space. Cancel it from your bookings page to make a new one.');
      return;
    }

    if (!validateTimes(data.startTime, data.endTime)) {
      setError('endTime', {
        type: 'manual',
        message: 'End time must be different from start time'
      });
      return;
    }

    if (!isOpen24Hours && isOvernight(data.startTime, data.endTime)) {
      setError('endTime', {
        type: 'manual',
        message: 'This space closes at night. Choose an end time later than the start time.'
      });
      return;
    }

    if (!isOpen24Hours) {
      if (!isTimeWithinOperatingHours(data.startTime)) {
        setError('startTime', {
          type: 'manual',
          message: `Start time must be within operating hours (${operatingHours})`
        });
        return;
      }

      if (!isTimeWithinOperatingHours(data.endTime)) {
        setError('endTime', {
          type: 'manual',
          message: `End time must be within operating hours (${operatingHours})`
        });
        return;
      }
    }

    if (isBookingConflict(spaceId, data.bookingDate, data.startTime, data.endTime)) {
      setError('startTime', {
        type: 'manual',
        message: 'This time overlaps an existing booking for this space. Please choose another time.'
      });
      return;
    }

    const booking = {
      spaceId,
      spaceName,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      bookingDate: data.bookingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      guests: parseInt(data.guests),
      totalPrice: getPriceSummary(data.startTime, data.endTime, price, data.guests).total,
      timeSlot: selectedTimeSlot,
      status: 'confirmed'
    };

    addBooking(booking);
    // The bookings page shows the confirmation from this router state
    navigate('/dashboard/my-bookings', {
      state: {
        bookingConfirmed: {
          spaceName,
          bookingDate: data.bookingDate,
          startTime: data.startTime,
          endTime: data.endTime,
        },
      },
    });
  };

  // Props that link an input to its error message
  const fieldA11y = (name) => (
    errors[name]
      ? { 'aria-invalid': true, 'aria-describedby': `${fieldId}-${name}-error` }
      : { 'aria-invalid': false }
  );

  const fieldError = (name) => errors[name] && (
    <div id={`${fieldId}-${name}-error`} className="invalid-feedback">
      {errors[name].message}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <section className="booking-card ss-card" aria-labelledby={ids.heading}>
        <div className="booking-card__body">
          <h2 id={ids.heading} className="booking-card__title">Log in to book this space</h2>
          <p className="text-muted">Log in with any name and email to book a time slot.</p>
          <Link to="/login" className="btn btn-primary w-100">
            Log in
          </Link>
        </div>
      </section>
    );
  }

  if (existingBooking) {
    return (
      <section className="booking-card ss-card" aria-labelledby={ids.heading}>
        <div className="booking-card__body">
          <h2 id={ids.heading} className="booking-card__title">You already have a booking here</h2>
          <dl className="booking-summary">
            <div>
              <dt>Date</dt>
              <dd>{new Date(existingBooking.bookingDate).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{existingBooking.startTime} to {existingBooking.endTime}</dd>
            </div>
            <div>
              <dt>Guests</dt>
              <dd>{existingBooking.guests}</dd>
            </div>
            <div className="booking-summary__total">
              <dt>Total</dt>
              <dd className="ss-num">₱{existingBooking.totalPrice}</dd>
            </div>
          </dl>
          <p className="booking-card__note">
            You can only have one booking per space. You can cancel it from your bookings page.
          </p>
          <Link to="/dashboard/my-bookings" className="btn btn-primary w-100">
            Go to my bookings
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-card ss-card" aria-labelledby={ids.heading}>
      <div className="booking-card__body">
        <h2 id={ids.heading} className="booking-card__title">Book this space</h2>

        {warning && (
          <div className="alert alert-warning" role="alert">
            {warning}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {timeSlots && timeSlots.length > 0 && (
            <div className="booking-field" role="group" aria-labelledby={ids.slots} aria-describedby={ids.slotsHelp}>
              <p id={ids.slots} className="form-label mb-1">Quick time slots</p>
              <p id={ids.slotsHelp} className="booking-help">Choose a slot to fill in the start and end time.</p>
              <div className="booking-slots">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className="btn btn-sm btn-outline-primary booking-slot"
                    aria-pressed={selectedTimeSlot === slot}
                    onClick={() => handleTimeSlotSelect(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="booking-field">
            <label htmlFor={ids.date} className="form-label">Booking date</label>
            <input
              id={ids.date}
              type="date"
              className={`form-control ${errors.bookingDate ? 'is-invalid' : ''}`}
              {...register('bookingDate')}
              min={getTodayDateString()}
              {...fieldA11y('bookingDate')}
            />
            {fieldError('bookingDate')}
          </div>

          <div className="row g-3 booking-field">
            <div className="col-sm-6">
              <label htmlFor={ids.start} className="form-label">Start time</label>
              <input
                id={ids.start}
                type="time"
                className={`form-control ${errors.startTime ? 'is-invalid' : ''}`}
                {...register('startTime')}
                min={operatingHours === '24/7' ? '00:00' : operatingHoursParsed.start}
                max={operatingHours === '24/7' ? '23:59' : operatingHoursParsed.end}
                onChange={(e) => {
                  setSelectedTimeSlot(null);
                  register('startTime').onChange(e);
                }}
                {...fieldA11y('startTime')}
              />
              {fieldError('startTime')}
            </div>
            <div className="col-sm-6">
              <label htmlFor={ids.end} className="form-label">End time</label>
              <input
                id={ids.end}
                type="time"
                className={`form-control ${errors.endTime ? 'is-invalid' : ''}`}
                {...register('endTime')}
                min={operatingHours === '24/7' ? '00:00' : operatingHoursParsed.start}
                max={operatingHours === '24/7' ? '23:59' : operatingHoursParsed.end}
                onChange={(e) => {
                  setSelectedTimeSlot(null);
                  register('endTime').onChange(e);
                }}
                {...fieldA11y('endTime')}
              />
              {fieldError('endTime')}
            </div>
          </div>

          <div className="booking-field">
            <label htmlFor={ids.guests} className="form-label">Number of guests</label>
            <input
              id={ids.guests}
              type="number"
              inputMode="numeric"
              className={`form-control ${errors.guests ? 'is-invalid' : ''}`}
              {...register('guests')}
              min="1"
              max="10"
              {...fieldA11y('guests')}
            />
            {fieldError('guests')}
          </div>

          <dl className="booking-summary booking-summary--price">
            <div>
              <dt>Hourly rate</dt>
              <dd className="ss-num">₱{price}</dd>
            </div>
            <div>
              <dt>Guests</dt>
              <dd className="ss-num">{watchGuests || 1}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{formatDuration(priceSummary.durationMinutes)} (billed as {billedLabel})</dd>
            </div>
            <div className="booking-summary__total">
              <dt>Total</dt>
              <dd className="ss-num">₱{priceSummary.total}</dd>
            </div>
          </dl>

          <button type="submit" className="btn btn-primary btn-lg w-100">
            Confirm booking
          </button>
        </form>
      </div>
    </section>
  );
};

export default BookingForm;
