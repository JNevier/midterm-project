import { describe, it, expect } from 'vitest';
import { parseOperatingHours, isTimeWithinOperatingHours } from './operatinghours';
import { spacesData } from '../data/spaces';

// A frozen copy of the two helpers BookingForm used to define for itself
// (before they were replaced by this file). The tests below prove that this
// file gives the same answers for every space, so the swap changes nothing.
const oldParse = (hours) => {
  if (hours === '24/7' || hours === 'Open 24/7') return { start: '00:00', end: '23:59' };
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
      start: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
      end: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
    };
  }
  return { start: '09:00', end: '21:00' };
};
const oldIsWithin = (time, hours) => {
  if (hours === '24/7' || hours === 'Open 24/7') return true;
  const parsed = oldParse(hours);
  return time >= parsed.start && time <= parsed.end;
};

const allMinutes = Array.from({ length: 24 * 60 }, (_, m) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);

const expected = {
  1: ['09:00', '21:00'], 10: ['09:00', '21:00'],
  2: ['00:00', '23:59'], 7: ['00:00', '23:59'],
  3: ['10:00', '19:00'],
  4: ['06:00', '23:59'],
  5: ['08:00', '22:00'],
  6: ['07:00', '23:00'],
  8: ['07:00', '22:00'],
  9: ['06:00', '22:00'],
};

describe('parseOperatingHours', () => {
  it.each(spacesData.map((s) => [s.id, s.hours]))('space %i (%s) opens and closes at the expected times', (id, hours) => {
    const { start, end } = parseOperatingHours(hours);
    expect([start, end]).toEqual(expected[id]);
  });
});

describe('isTimeWithinOperatingHours', () => {
  it.each(spacesData.map((s) => [s.id, s.hours]))('space %i gives the same answer as before for every minute of the day', (id, hours) => {
    for (const time of allMinutes) {
      expect(isTimeWithinOperatingHours(time, hours), `${hours} at ${time}`).toBe(oldIsWithin(time, hours));
    }
  });

  it('accepts the opening and closing minute and refuses the minutes just outside', () => {
    expect(isTimeWithinOperatingHours('09:00', '9:00 AM - 9:00 PM')).toBe(true);
    expect(isTimeWithinOperatingHours('21:00', '9:00 AM - 9:00 PM')).toBe(true);
    expect(isTimeWithinOperatingHours('08:59', '9:00 AM - 9:00 PM')).toBe(false);
    expect(isTimeWithinOperatingHours('21:01', '9:00 AM - 9:00 PM')).toBe(false);
    expect(isTimeWithinOperatingHours('23:59', '6:00 AM - 11:59 PM')).toBe(true);
    expect(isTimeWithinOperatingHours('05:59', '6:00 AM - 11:59 PM')).toBe(false);
    expect(isTimeWithinOperatingHours('03:00', '24/7')).toBe(true);
  });
});
