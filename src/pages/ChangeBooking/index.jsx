import React, { startTransition, useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useNow } from '../../hooks/useNow';
import { spacesData } from '../../data/spaces';
import { bookingSchema } from '../../utils/validationSchemas';
import { checkBookingRequest } from '../../utils/bookingRules';
import { parseTimeSlot } from '../../utils/timeSlots';
import { parseOperatingHours } from '../../utils/operatinghours';
import { formatBookingDate, formatDuration, formatTimeRange, getPriceSummary } from '../../utils/bookingTime';
import { MAX_CHANGES, getChangeDeadline, getChangeNote, getChangeStatus } from '../../utils/bookingChanges';
import NotFound from '../NotFound';
import ChangeNote from '../../components/ChangeNote';
import '../../components/BookingForm/BookingForm.css';
import './ChangeBooking.css';

const BOOKINGS_PAGE = '/dashboard/my-bookings';

const CANNOT_CHANGE_REASONS = {
  started: 'This booking has already started.',
  'window-closed': 'The time to change this booking has ended.',
  'no-changes-left': `You have used all ${MAX_CHANGES} changes for this booking.`,
};

const describeBooking = (b) => {
  const guests = `${b.guests} ${Number(b.guests) === 1 ? 'guest' : 'guests'}`;
  return `${b.spaceName} on ${formatBookingDate(b.bookingDate)}, ${formatTimeRange(b.startTime, b.endTime)}, ${guests}, ₱${b.totalPrice}`;
};

const ChangeBooking = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const { getUserBookings } = useBooking();
  const now = useNow(30000);
  const [savedTooLate, setSavedTooLate] = useState(false);

  // Only the visitor's own bookings; anything else looks like a missing page
  const booking = getUserBookings(user?.email).find((b) => String(b.id) === bookingId);
  useDocumentTitle(booking ? 'Change booking | StudySpot PH' : 'Page not found | StudySpot PH');

  if (!booking) return <NotFound />;

  if (savedTooLate) {
    return (
      <div className="change-page container">
        <div className="change-card ss-card">
          <h1 className="change-card__title">Change your booking</h1>
          <div className="alert alert-warning mb-3" role="alert">
            The time to change this booking has ended. Your booking was not changed.
          </div>
          <Link to={BOOKINGS_PAGE} className="btn btn-primary">Back to my bookings</Link>
        </div>
      </div>
    );
  }

  const status = getChangeStatus(booking, now);
  if (!status.canChange) {
    return (
      <div className="change-page container">
        <div className="change-card ss-card">
          <h1 className="change-card__title">This booking can't be changed</h1>
          <p className="text-muted">{CANNOT_CHANGE_REASONS[status.reason] ?? 'This booking can no longer be changed.'}</p>
          <Link to={BOOKINGS_PAGE} className="btn btn-primary">Back to my bookings</Link>
        </div>
      </div>
    );
  }

  return (
    <ChangeBookingForm
      booking={booking}
      note={getChangeNote(status, getChangeDeadline(booking))}
      onTooLate={() => setSavedTooLate(true)}
    />
  );
};

const ChangeBookingForm = ({ booking, note, onTooLate }) => {
  const { user } = useAuth();
  const { bookings, updateBooking } = useBooking();
  const navigate = useNavigate();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [formAlert, setFormAlert] = useState(null);
  const [nothingChanged, setNothingChanged] = useState(false);
  const fieldId = useId();
  const ids = {
    note: `${fieldId}-note`,
    space: `${fieldId}-space`,
    slots: `${fieldId}-slots`,
    slotsHelp: `${fieldId}-slots-help`,
    date: `${fieldId}-date`,
    start: `${fieldId}-start`,
    end: `${fieldId}-end`,
    guests: `${fieldId}-guests`,
  };

  const { register, handleSubmit, formState: { errors }, watch, setValue, setError, clearErrors } = useForm({
    resolver: yupResolver(bookingSchema),
    defaultValues: {
      spaceId: String(booking.spaceId),
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      guests: booking.guests,
    },
  });

  // The chosen space drives the quick slots, the opening hours and the price
  const space = spacesData.find((s) => s.id === Number(watch('spaceId'))) ?? spacesData[0];
  const hours = parseOperatingHours(space.hours);
  const isOpen24Hours = space.hours === '24/7';
  const priceSummary = getPriceSummary(watch('startTime'), watch('endTime'), space.price, watch('guests'));
  const billedLabel = `${priceSummary.billedHours} ${priceSummary.billedHours === 1 ? 'hour' : 'hours'}`;
  const difference = priceSummary.total - booking.totalPrice;
  const differenceText = difference > 0 ? `₱${difference} more` : difference < 0 ? `₱${-difference} less` : 'No change in price';

  // Spaces where the visitor already has ANOTHER booking cannot be chosen
  const bookedElsewhere = new Set(bookings
    .filter((b) => b.userEmail === user.email && b.status === 'confirmed' && b.id !== booking.id)
    .map((b) => b.spaceId));

  const todayString = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
    const times = parseTimeSlot(slot, hours.start);
    setValue('startTime', times.startTime);
    setValue('endTime', times.endTime);
    clearErrors(['startTime', 'endTime']);
  };

  const fieldA11y = (name) => (
    errors[name]
      ? { 'aria-invalid': true, 'aria-describedby': `${fieldId}-${name}-error` }
      : { 'aria-invalid': false }
  );
  const fieldError = (name) => errors[name] && (
    <div id={`${fieldId}-${name}-error`} className="invalid-feedback">{errors[name].message}</div>
  );

  const onSubmit = (data) => {
    setFormAlert(null);
    setNothingChanged(false);

    // 1. The deadline may have passed while the page was open
    if (!getChangeStatus(booking, new Date()).canChange) {
      onTooLate();
      return;
    }

    // 2. The same rules as a new booking; this booking never conflicts with itself
    const target = spacesData.find((s) => s.id === Number(data.spaceId));
    const problem = checkBookingRequest({
      space: { id: target.id, hours: target.hours },
      values: data,
      bookings,
      userEmail: user.email,
      ignoreBookingId: booking.id,
    });
    if (problem) {
      if (problem.field === 'form') {
        setFormAlert(`You already have a booking at ${target.name}. Choose another space.`);
      } else {
        setError(problem.field, { type: 'manual', message: problem.message }, { shouldFocus: true });
      }
      return;
    }

    // 3. Saving without a real change does not use up a chance
    const guests = parseInt(data.guests, 10);
    const unchanged = target.id === booking.spaceId
      && data.bookingDate === booking.bookingDate
      && data.startTime === booking.startTime
      && data.endTime === booking.endTime
      && guests === Number(booking.guests);
    if (unchanged) {
      setNothingChanged(true);
      return;
    }

    // 4. Save the new details; id, createdAt, user and status stay
    const changes = {
      spaceId: target.id,
      spaceName: target.name,
      bookingDate: data.bookingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      guests,
      totalPrice: getPriceSummary(data.startTime, data.endTime, target.price, guests).total,
      timeSlot: selectedTimeSlot,
      changeCount: (booking.changeCount ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    const updated = { ...booking, ...changes };
    const after = getChangeStatus(updated, new Date());

    // 5. Back to the bookings page with the notice. One transition, so this page
    // does not flash its "can't be changed" view before leaving.
    startTransition(() => {
      updateBooking(booking.id, changes);
      navigate(BOOKINGS_PAGE, {
        state: {
          notice: {
            type: 'updated',
            spaceName: target.name,
            bookingDate: data.bookingDate,
            startTime: data.startTime,
            endTime: data.endTime,
            deadline: getChangeDeadline(updated).toISOString(),
            canChange: after.canChange,
            changesLeft: after.changesLeft,
          },
        },
      });
    });
  };

  const spaceField = register('spaceId');
  const startField = register('startTime');
  const endField = register('endTime');

  return (
    <div className="change-page container">
      <section className="change-card ss-card" aria-labelledby={`${fieldId}-title`}>
        <h1 id={`${fieldId}-title`} className="change-card__title">Change your booking</h1>
        <p className="change-card__current">Current booking: {describeBooking(booking)}.</p>
        <ChangeNote note={note} id={ids.note} banner />

        {formAlert && (
          <div className="alert alert-warning mt-3 mb-0" role="alert">{formAlert}</div>
        )}

        <form className="change-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="booking-field">
            <label htmlFor={ids.space} className="form-label">Space</label>
            <select
              id={ids.space}
              className="form-select"
              {...spaceField}
              onChange={(e) => {
                setSelectedTimeSlot(null);
                setFormAlert(null);
                spaceField.onChange(e);
              }}
            >
              {spacesData.map((s) => {
                const taken = bookedElsewhere.has(s.id);
                return (
                  <option key={s.id} value={String(s.id)} disabled={taken}>
                    {taken ? `${s.name}, ${s.city} (you already booked this space)` : `${s.name}, ${s.city} (₱${s.price}/hour)`}
                  </option>
                );
              })}
            </select>
          </div>

          {space.time_slots?.length > 0 && (
            <div className="booking-field" role="group" aria-labelledby={ids.slots} aria-describedby={ids.slotsHelp}>
              <p id={ids.slots} className="form-label mb-1">Quick time slots</p>
              <p id={ids.slotsHelp} className="booking-help">Choose a slot to fill in the start and end time.</p>
              <div className="booking-slots">
                {space.time_slots.map((slot) => (
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
              min={todayString}
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
                {...startField}
                min={isOpen24Hours ? '00:00' : hours.start}
                max={isOpen24Hours ? '23:59' : hours.end}
                onChange={(e) => { setSelectedTimeSlot(null); startField.onChange(e); }}
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
                {...endField}
                min={isOpen24Hours ? '00:00' : hours.start}
                max={isOpen24Hours ? '23:59' : hours.end}
                onChange={(e) => { setSelectedTimeSlot(null); endField.onChange(e); }}
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
              <dd className="ss-num">₱{space.price}</dd>
            </div>
            <div>
              <dt>Guests</dt>
              <dd className="ss-num">{watch('guests') || 1}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{formatDuration(priceSummary.durationMinutes)} (billed as {billedLabel})</dd>
            </div>
            <div className="booking-summary__total">
              <dt>New total</dt>
              <dd className="ss-num">₱{priceSummary.total}</dd>
            </div>
            <div>
              <dt>Current total</dt>
              <dd className="ss-num">₱{booking.totalPrice}</dd>
            </div>
            <div>
              <dt>Difference</dt>
              <dd className="ss-num">{differenceText}</dd>
            </div>
          </dl>

          {nothingChanged && (
            <div className="alert alert-warning" role="alert">
              Nothing has changed yet. Change at least one detail to save.
            </div>
          )}

          <div className="change-form__actions">
            <button type="submit" className="btn btn-primary btn-lg">Save changes</button>
            <Link to={BOOKINGS_PAGE} className="btn btn-outline-primary btn-lg">Keep current booking</Link>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ChangeBooking;
