import { describe, it, expect } from 'vitest';
import {
  getDurationMinutes,
  getBilledHours,
  formatDuration,
  getPriceSummary,
  hasBookingConflict,
  formatBookingDate,
  formatTime12h,
  formatTimeRange,
} from './bookingTime';

describe('getDurationMinutes', () => {
  it('counts minutes for a normal booking', () => {
    expect(getDurationMinutes('09:00', '13:00')).toBe(240);
    expect(getDurationMinutes('10:00', '11:45')).toBe(105);
  });

  it('adds a day for an overnight booking', () => {
    expect(getDurationMinutes('22:00', '06:00')).toBe(480);
  });

  it('returns 0 when start equals end', () => {
    expect(getDurationMinutes('10:00', '10:00')).toBe(0);
  });
});

describe('getBilledHours', () => {
  it('bills every started hour', () => {
    expect(getBilledHours(105)).toBe(2);
    expect(getBilledHours(65)).toBe(2);
  });

  it('bills exactly one hour as one hour', () => {
    expect(getBilledHours(60)).toBe(1);
  });
});

describe('formatDuration', () => {
  it('shows hours and minutes', () => {
    expect(formatDuration(105)).toBe('1h 45m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(45)).toBe('45m');
  });
});

describe('getPriceSummary', () => {
  it('multiplies billed hours by rate and guests', () => {
    expect(getPriceSummary('10:00', '11:45', 250, 1)).toEqual({
      durationMinutes: 105,
      billedHours: 2,
      total: 500,
    });
    expect(getPriceSummary('10:00', '11:45', 250, '3').total).toBe(1500);
  });
});

describe('hasBookingConflict', () => {
  const existing = [
    { spaceId: 1, bookingDate: '2026-11-10', startTime: '09:00', endTime: '13:00', status: 'confirmed' },
    { spaceId: 2, bookingDate: '2026-11-10', startTime: '22:00', endTime: '06:00', status: 'confirmed' },
  ];
  const check = (booking) => hasBookingConflict(existing, booking);

  it('detects a clear overlap (same slot)', () => {
    expect(check({ spaceId: 1, bookingDate: '2026-11-10', startTime: '09:00', endTime: '13:00' })).toBe(true);
  });

  it('detects a partial overlap', () => {
    expect(check({ spaceId: 1, bookingDate: '2026-11-10', startTime: '12:00', endTime: '15:00' })).toBe(true);
    expect(check({ spaceId: 1, bookingDate: '2026-11-10', startTime: '08:00', endTime: '09:30' })).toBe(true);
  });

  it('allows back-to-back bookings', () => {
    expect(check({ spaceId: 1, bookingDate: '2026-11-10', startTime: '13:00', endTime: '17:00' })).toBe(false);
    expect(check({ spaceId: 1, bookingDate: '2026-11-10', startTime: '07:00', endTime: '09:00' })).toBe(false);
  });

  it('does not flag the same time on a different date', () => {
    expect(check({ spaceId: 1, bookingDate: '2026-11-11', startTime: '09:00', endTime: '13:00' })).toBe(false);
  });

  it('detects an overnight booking spilling into the next day', () => {
    expect(check({ spaceId: 2, bookingDate: '2026-11-11', startTime: '05:00', endTime: '07:00' })).toBe(true);
    expect(check({ spaceId: 2, bookingDate: '2026-11-11', startTime: '06:00', endTime: '08:00' })).toBe(false);
  });

  it('does not flag a different space', () => {
    expect(check({ spaceId: 3, bookingDate: '2026-11-10', startTime: '09:00', endTime: '13:00' })).toBe(false);
  });

  it('ignores bookings that are not confirmed', () => {
    const cancelled = [{ ...existing[0], status: 'cancelled' }];
    expect(
      hasBookingConflict(cancelled, { spaceId: 1, bookingDate: '2026-11-10', startTime: '09:00', endTime: '13:00' })
    ).toBe(false);
  });
});

describe('formatBookingDate', () => {
  it('shows a readable date on the same calendar day', () => {
    expect(formatBookingDate('2026-11-10')).toBe('Tue, Nov 10, 2026');
    expect(formatBookingDate('2026-01-01')).toBe('Thu, Jan 1, 2026');
  });

  it('builds the date from local parts, not as UTC', () => {
    // new Date('2026-11-10') is midnight UTC, the previous day west of UTC
    expect(formatBookingDate('2026-11-10')).toContain('Nov 10');
  });
});

describe('formatTime12h', () => {
  it('converts 24-hour times to 12-hour times', () => {
    expect(formatTime12h('13:00')).toBe('1:00 PM');
    expect(formatTime12h('09:05')).toBe('9:05 AM');
  });

  it('handles midnight and noon', () => {
    expect(formatTime12h('00:00')).toBe('12:00 AM');
    expect(formatTime12h('12:00')).toBe('12:00 PM');
    expect(formatTime12h('23:59')).toBe('11:59 PM');
  });
});

describe('formatTimeRange', () => {
  it('joins start and end', () => {
    expect(formatTimeRange('09:00', '13:00')).toBe('9:00 AM to 1:00 PM');
  });

  it('marks an overnight end as the next day', () => {
    expect(formatTimeRange('22:00', '06:00')).toBe('10:00 PM to 6:00 AM (next day)');
  });
});
