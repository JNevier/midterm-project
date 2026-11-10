import { describe, it, expect } from 'vitest';
import { getNoticeText, getNoticeTone } from './bookingNotice';

const base = { spaceName: 'The Study Nook', bookingDate: '2026-11-17', startTime: '09:00', endTime: '13:00' };

describe('getNoticeText', () => {
  it('describes a confirmed booking', () => {
    expect(getNoticeText({ ...base, type: 'confirmed' }))
      .toBe('Booking confirmed: The Study Nook on Tue, Nov 17, 2026, 9:00 AM to 1:00 PM.');
  });

  it('describes an updated booking that can still be changed', () => {
    const deadline = new Date(2026, 10, 17, 7, 0).toISOString();
    expect(getNoticeText({ ...base, type: 'updated', canChange: true, changesLeft: 1, deadline }))
      .toBe('Booking updated: The Study Nook on Tue, Nov 17, 2026, 9:00 AM to 1:00 PM. You can change it 1 more time until Tue, Nov 17, 2026, 7:00 AM.');
    expect(getNoticeText({ ...base, type: 'updated', canChange: true, changesLeft: 2, deadline }))
      .toContain('You can change it 2 more times until');
  });

  it('describes an updated booking that cannot be changed again', () => {
    expect(getNoticeText({ ...base, type: 'updated', canChange: false, changesLeft: 0, deadline: null }))
      .toBe("Booking updated: The Study Nook on Tue, Nov 17, 2026, 9:00 AM to 1:00 PM. It can't be changed again.");
  });

  it('updated notices are green', () => {
    expect(getNoticeTone({ type: 'updated' })).toBe('success');
  });

  it('describes a cancelled booking', () => {
    expect(getNoticeText({ ...base, type: 'cancelled' }))
      .toBe('Booking cancelled: The Study Nook on Tue, Nov 17, 2026, 9:00 AM to 1:00 PM.');
  });

  it('marks an overnight end as the next day', () => {
    expect(getNoticeText({ ...base, type: 'cancelled', startTime: '22:00', endTime: '06:00' }))
      .toContain('10:00 PM to 6:00 AM (next day)');
  });

  it('returns null for no notice or an unknown type', () => {
    expect(getNoticeText(null)).toBeNull();
    expect(getNoticeText({ ...base, type: 'other' })).toBeNull();
  });
});

describe('getNoticeTone', () => {
  it('is green for confirmed and neutral for cancelled', () => {
    expect(getNoticeTone({ type: 'confirmed' })).toBe('success');
    expect(getNoticeTone({ type: 'cancelled' })).toBe('neutral');
  });
});
