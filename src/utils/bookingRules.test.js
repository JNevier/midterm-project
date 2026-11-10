import { describe, it, expect } from 'vitest';
import { checkBookingRequest, ALREADY_BOOKED_MESSAGE } from './bookingRules';

const nook = { id: 1, hours: '9:00 AM - 9:00 PM' };
const workHaven = { id: 2, hours: '24/7' };
const booking = (o) => ({ status: 'confirmed', bookingDate: '2026-11-20', ...o });

const existing = [
  booking({ id: 10, spaceId: 1, userEmail: 'b@example.com', startTime: '09:00', endTime: '13:00' }),
  booking({ id: 11, spaceId: 2, userEmail: 'a@example.com', startTime: '22:00', endTime: '06:00' }),
];

const check = (space, values, opts = {}) => checkBookingRequest({
  space,
  values: { bookingDate: '2026-11-20', ...values },
  bookings: existing,
  userEmail: 'a@example.com',
  ...opts,
});

describe('checkBookingRequest', () => {
  it('accepts a request that breaks no rule', () => {
    expect(check(nook, { startTime: '13:00', endTime: '17:00' })).toBeNull();
  });

  it('already-booked: one booking per space per user', () => {
    expect(check(workHaven, { startTime: '10:00', endTime: '12:00' }))
      .toEqual({ field: 'form', code: 'already-booked', message: ALREADY_BOOKED_MESSAGE });
  });

  it('same-time: start equal to end', () => {
    expect(check(nook, { startTime: '10:00', endTime: '10:00' }))
      .toEqual({ field: 'endTime', code: 'same-time', message: 'End time must be different from start time' });
  });

  it('closed-overnight: only 24/7 spaces take overnight bookings', () => {
    expect(check(nook, { startTime: '20:00', endTime: '09:00' })).toMatchObject({ field: 'endTime', code: 'closed-overnight' });
  });

  it('start-outside-hours and end-outside-hours', () => {
    expect(check(nook, { startTime: '08:00', endTime: '10:00' }))
      .toEqual({ field: 'startTime', code: 'start-outside-hours', message: 'Start time must be within operating hours (9:00 AM - 9:00 PM)' });
    expect(check(nook, { startTime: '20:00', endTime: '21:30' }))
      .toEqual({ field: 'endTime', code: 'end-outside-hours', message: 'End time must be within operating hours (9:00 AM - 9:00 PM)' });
  });

  it('overlap: another user already has that time', () => {
    expect(check(nook, { startTime: '12:00', endTime: '14:00' })).toMatchObject({ field: 'startTime', code: 'overlap' });
  });

  it('checks the rules in the same order as the booking form', () => {
    // already booked wins over a bad time
    expect(check(workHaven, { startTime: '10:00', endTime: '10:00' }).code).toBe('already-booked');
    // same time wins over hours
    expect(check(nook, { startTime: '07:00', endTime: '07:00' }).code).toBe('same-time');
    // overnight wins over hours
    expect(check(nook, { startTime: '22:00', endTime: '08:00' }).code).toBe('closed-overnight');
  });

  it('a booking being changed never conflicts with itself', () => {
    // User A moves their own WorkHaven booking (id 11) to an overlapping time
    expect(check(workHaven, { startTime: '23:00', endTime: '05:00' }, { ignoreBookingId: 11 })).toBeNull();
  });

  it('a booking being changed still conflicts with someone else', () => {
    const mine = booking({ id: 12, spaceId: 3, userEmail: 'a@example.com', startTime: '10:00', endTime: '12:00' });
    const result = checkBookingRequest({
      space: nook,
      values: { bookingDate: '2026-11-20', startTime: '12:00', endTime: '14:00' },
      bookings: [...existing, mine],
      userEmail: 'a@example.com',
      ignoreBookingId: 12,
    });
    expect(result).toMatchObject({ code: 'overlap' });
  });

  it('one booking per space: with and without the ignore id', () => {
    // without it, A's own WorkHaven booking blocks another at WorkHaven
    expect(check(workHaven, { startTime: '10:00', endTime: '12:00' }).code).toBe('already-booked');
    // with it, moving that same booking within WorkHaven is fine
    expect(check(workHaven, { startTime: '10:00', endTime: '12:00' }, { ignoreBookingId: 11 })).toBeNull();
    // moving a different booking to WorkHaven is still refused
    expect(check(workHaven, { startTime: '10:00', endTime: '12:00' }, { ignoreBookingId: 99 }).code).toBe('already-booked');
  });
});
