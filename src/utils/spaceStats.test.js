import { describe, it, expect } from 'vitest';
import { getSpaceStats } from './spaceStats';
import { spacesData } from '../data/spaces';

describe('getSpaceStats', () => {
  it('computes the stats from the real listings', () => {
    expect(getSpaceStats(spacesData)).toEqual({
      spaceCount: 10,
      cityCount: 9,
      lowestRate: 150,
      open24HoursCount: 2,
    });
  });

  it('counts two spaces in the same city once', () => {
    const spaces = [
      { city: 'Manila City', price: 280, hours: '24/7' },
      { city: 'Manila City', price: 150, hours: '6:00 AM - 10:00 PM' },
    ];
    expect(getSpaceStats(spaces).cityCount).toBe(1);
  });

  it('handles an empty list', () => {
    expect(getSpaceStats([])).toEqual({
      spaceCount: 0,
      cityCount: 0,
      lowestRate: null,
      open24HoursCount: 0,
    });
  });
});
