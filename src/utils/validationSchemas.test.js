import { describe, it, expect } from 'vitest';
import { validateTimes } from './validationSchemas';

describe('validateTimes', () => {
  it('rejects a start time equal to the end time', () => {
    expect(validateTimes('10:00', '10:00')).toBe(false);
  });

  it('accepts a normal booking', () => {
    expect(validateTimes('09:00', '13:00')).toBe(true);
  });

  it('accepts an overnight booking', () => {
    expect(validateTimes('22:00', '06:00')).toBe(true);
  });
});
