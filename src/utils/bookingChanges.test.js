import { describe, it, expect } from 'vitest';
import {
  CHANGE_GRACE_MINUTES, CHANGE_CUTOFF_HOURS, MAX_CHANGES, CHANGE_WARNING_MINUTES,
  getChangeDeadline, getChangeStatus, getChangeNote,
} from './bookingChanges';

// A fixed "now": 2026-11-10 12:00 local time
const NOW = new Date(2026, 10, 10, 12, 0, 0);
const MIN = 60 * 1000;
const pad = (n) => String(n).padStart(2, '0');

// A booking that starts `startsIn` minutes after NOW and was made `bookedAgo` ms before NOW
const make = ({ startsIn, bookedAgo = 0, createdAt, ...rest }) => {
  const start = new Date(NOW.getTime() + startsIn * MIN);
  return {
    id: 1,
    status: 'confirmed',
    bookingDate: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    endTime: '23:00',
    createdAt: createdAt === undefined ? new Date(NOW.getTime() - bookedAgo).toISOString() : createdAt,
    ...rest,
  };
};
const minutesToDeadline = (b) => (getChangeDeadline(b).getTime() - NOW.getTime()) / MIN;

describe('the four constants', () => {
  it('match the decided demo rules', () => {
    expect([CHANGE_GRACE_MINUTES, CHANGE_CUTOFF_HOURS, MAX_CHANGES, CHANGE_WARNING_MINUTES]).toEqual([30, 2, 2, 5]);
  });
});

describe('getChangeDeadline and getChangeStatus', () => {
  const cases = [
    ['booked now, starts in 7 days', { startsIn: 7 * 24 * 60 }, 9960, 'ok', 9960],
    ['booked now, starts in 3 hours', { startsIn: 180 }, 60, 'ok', 60],
    ['booked now, starts in 1 hour', { startsIn: 60 }, 30, 'ok', 30],
    ['booked now, starts in 20 minutes (never after the start)', { startsIn: 20 }, 20, 'ok', 20],
    ['booked 26 minutes ago, starts in 1 hour', { startsIn: 60, bookedAgo: 26 * MIN }, 4, 'ok', 4],
    ['booked 29m30s ago, starts in 1 hour', { startsIn: 60, bookedAgo: 29.5 * MIN }, 0.5, 'ok', 1],
    ['booked exactly 30 minutes ago, starts in 1 hour', { startsIn: 60, bookedAgo: 30 * MIN }, 0, 'window-closed', 0],
    ['booked 31 minutes ago, starts in 1 hour', { startsIn: 60, bookedAgo: 31 * MIN }, -1, 'window-closed', 0],
    ['booked 31 minutes ago, starts in 3 hours', { startsIn: 180, bookedAgo: 31 * MIN }, 60, 'ok', 60],
    ['booked 5 minutes ago, starts in 10 minutes', { startsIn: 10, bookedAgo: 5 * MIN }, 10, 'ok', 10],
    ['booked 5 minutes ago, started 1 minute ago', { startsIn: -1, bookedAgo: 5 * MIN }, -1, 'started', 0],
    ['no createdAt, starts in 5 hours', { startsIn: 300, createdAt: null }, 180, 'ok', 180],
    ['no createdAt, starts in 1 hour', { startsIn: 60, createdAt: null }, -60, 'window-closed', 0],
  ];

  it.each(cases)('%s', (_, input, deadlineMinutes, reason, minutesLeft) => {
    const b = make(input);
    expect(minutesToDeadline(b)).toBeCloseTo(deadlineMinutes, 5);
    const status = getChangeStatus(b, NOW);
    expect(status.reason).toBe(reason);
    expect(status.canChange).toBe(reason === 'ok');
    expect(status.minutesLeft).toBe(minutesLeft);
  });

  it('counts the changes left', () => {
    expect(getChangeStatus(make({ startsIn: 180, changeCount: 1 }), NOW)).toMatchObject({ reason: 'ok', changesLeft: 1, minutesLeft: 60 });
    expect(getChangeStatus(make({ startsIn: 180, changeCount: 2 }), NOW)).toMatchObject({ reason: 'no-changes-left', changesLeft: 0, canChange: false });
    expect(getChangeStatus(make({ startsIn: 180 }), NOW)).toMatchObject({ reason: 'ok', changesLeft: 2 });
  });

  it('checks the reasons in order: not-confirmed, started, no-changes-left, window-closed', () => {
    expect(getChangeStatus(make({ startsIn: -10, status: 'cancelled' }), NOW).reason).toBe('not-confirmed');
    expect(getChangeStatus(make({ startsIn: -10, changeCount: 2 }), NOW).reason).toBe('started');
    expect(getChangeStatus(make({ startsIn: 60, bookedAgo: 40 * MIN, changeCount: 2 }), NOW).reason).toBe('no-changes-left');
  });

  it('moves the deadline with the start time, not with createdAt', () => {
    const before = make({ startsIn: 180, bookedAgo: 60 * MIN });
    const later = make({ startsIn: 24 * 60, bookedAgo: 60 * MIN });
    expect(minutesToDeadline(later) - minutesToDeadline(before)).toBe(24 * 60 - 180);
  });
});

describe('getChangeNote', () => {
  const note = (input) => {
    const b = make(input);
    return getChangeNote(getChangeStatus(b, NOW), getChangeDeadline(b));
  };

  it('far away: gives the date and time', () => {
    expect(note({ startsIn: 7 * 24 * 60 })).toEqual({
      tone: 'normal',
      text: 'You can change this booking until Tue, Nov 17, 2026, 10:00 AM. 2 changes left.',
    });
  });

  it('soon: counts the minutes', () => {
    expect(note({ startsIn: 60 })).toEqual({
      tone: 'normal',
      text: 'You can change this booking for 30 more minutes, until 12:30 PM. 2 changes left.',
    });
  });

  it('60 minutes uses the soon text, 61 the far text', () => {
    expect(note({ startsIn: 180 }).text).toBe('You can change this booking for 60 more minutes, until 1:00 PM. 2 changes left.');
    expect(note({ startsIn: 181 }).text).toBe('You can change this booking until Tue, Nov 10, 2026, 1:01 PM. 2 changes left.');
  });

  it('warning tone at 5 minutes and below, normal at 6', () => {
    expect(note({ startsIn: 60, bookedAgo: 25 * MIN })).toEqual({
      tone: 'warning',
      text: 'Only 5 minutes left to change this booking (until 12:05 PM). 2 changes left.',
    });
    expect(note({ startsIn: 60, bookedAgo: 24 * MIN }).tone).toBe('normal');
  });

  it('singular minute and change', () => {
    expect(note({ startsIn: 60, bookedAgo: 29 * MIN, changeCount: 1 }).text)
      .toBe('Only 1 minute left to change this booking (until 12:01 PM). 1 change left.');
    expect(note({ startsIn: 180, changeCount: 1 }).text)
      .toBe('You can change this booking for 60 more minutes, until 1:00 PM. 1 change left.');
    expect(note({ startsIn: 60, bookedAgo: 28 * MIN }).text)
      .toBe('Only 2 minutes left to change this booking (until 12:02 PM). 2 changes left.');
  });

  it('the two not-allowed notes', () => {
    expect(note({ startsIn: 60, bookedAgo: 31 * MIN })).toEqual({
      tone: 'muted',
      text: 'The time to change this booking has ended. You can still cancel it.',
    });
    expect(note({ startsIn: 180, changeCount: 2 })).toEqual({
      tone: 'muted',
      text: 'You have used all 2 changes for this booking. You can still cancel it.',
    });
  });

  it('no note for a booking that has started', () => {
    expect(note({ startsIn: -1 })).toBeNull();
  });
});
