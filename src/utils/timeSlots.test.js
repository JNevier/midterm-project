import { describe, it, expect } from 'vitest';
import { parseTimeSlot } from './timeSlots';
import { spacesData } from '../data/spaces';

describe('parseTimeSlot', () => {
  it('fills the full day for the full-day labels', () => {
    expect(parseTimeSlot('Full Day (24 hours)')).toEqual({ startTime: '00:00', endTime: '23:59' });
    expect(parseTimeSlot('Full 24 hours')).toEqual({ startTime: '00:00', endTime: '23:59' });
  });

  it('reads the times inside pass labels', () => {
    expect(parseTimeSlot('Day Pass (6:00 AM - 6:00 PM)')).toEqual({ startTime: '06:00', endTime: '18:00' });
    expect(parseTimeSlot('Night Owl Pass (9:00 PM - 6:00 AM)')).toEqual({ startTime: '21:00', endTime: '06:00' });
    expect(parseTimeSlot('Night Pass (6:00 PM - 6:00 AM)')).toEqual({ startTime: '18:00', endTime: '06:00' });
  });

  it('reads plain ranges, including noon and 11:59 PM', () => {
    expect(parseTimeSlot('9:00 AM - 1:00 PM')).toEqual({ startTime: '09:00', endTime: '13:00' });
    expect(parseTimeSlot('Afternoon (12:00 PM - 6:00 PM)')).toEqual({ startTime: '12:00', endTime: '18:00' });
    expect(parseTimeSlot('Evening (6:00 PM - 11:59 PM)')).toEqual({ startTime: '18:00', endTime: '23:59' });
  });

  it('uses the fallback start for an unknown label', () => {
    expect(parseTimeSlot('Something else', '08:00')).toEqual({ startTime: '08:00', endTime: '10:00' });
  });

  it('turns every slot in the listings into valid times', () => {
    const allSlots = spacesData.flatMap((space) => space.time_slots);
    for (const slot of allSlots) {
      const { startTime, endTime } = parseTimeSlot(slot);
      expect(startTime, slot).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
      expect(endTime, slot).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
    }
  });
});
