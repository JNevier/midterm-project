// Turns a quick-select slot label into start and end times ("HH:MM", 24-hour).
// Pure function (no React), so it can be unit tested.

const FULL_DAY_LABELS = ['Full Day (24 hours)', 'Full 24 hours'];

// "6:00 PM" parts -> "18:00"
const to24Hour = (hour, minutes, period) => {
  let h = parseInt(hour, 10);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(parseInt(minutes, 10)).padStart(2, '0')}`;
};

// Finds the first "h:mm AM - h:mm PM" range in a label
const parseTimeRange = (label) => {
  const match = label.match(/(\d+):(\d+) (AM|PM) - (\d+):(\d+) (AM|PM)/);
  if (!match) return null;
  return {
    startTime: to24Hour(match[1], match[2], match[3]),
    endTime: to24Hour(match[4], match[5], match[6]),
  };
};

export const parseTimeSlot = (slot, fallbackStart = '09:00') => {
  if (FULL_DAY_LABELS.some((label) => slot.includes(label))) {
    return { startTime: '00:00', endTime: '23:59' };
  }

  if (slot.includes('Day Pass')) {
    return parseTimeRange(slot) ?? { startTime: '06:00', endTime: '18:00' };
  }

  if (slot.includes('Night Pass') || slot.includes('Night Owl Pass')) {
    return parseTimeRange(slot) ?? { startTime: '21:00', endTime: '06:00' };
  }

  // Standard format, for example "12:00 PM - 6:00 PM" or "Morning (7:00 AM - 11:00 AM)"
  const range = parseTimeRange(slot);
  if (range) return range;

  // Session names without times
  if (slot.includes('Morning Session') || slot.includes('Morning')) {
    if (slot.includes('Early Morning')) return { startTime: '06:00', endTime: '10:00' };
    if (slot.includes('Creative Morning')) return { startTime: '09:00', endTime: '13:00' };
    if (slot.includes('Executive Morning')) return { startTime: '07:00', endTime: '12:00' };
    return { startTime: '10:00', endTime: '14:00' };
  }
  if (slot.includes('Afternoon Session') || slot.includes('Afternoon')) {
    if (slot.includes('Creative Afternoon')) return { startTime: '13:00', endTime: '17:00' };
    if (slot.includes('Executive Afternoon')) return { startTime: '12:00', endTime: '18:00' };
    return { startTime: '14:00', endTime: '18:00' };
  }
  if (slot.includes('Evening') || slot.includes('Night')) {
    if (slot.includes('Creative Evening')) return { startTime: '17:00', endTime: '21:00' };
    return { startTime: '18:00', endTime: '22:00' };
  }
  if (slot.includes('Early Bird')) {
    return { startTime: '06:00', endTime: '12:00' };
  }

  return { startTime: fallbackStart, endTime: '10:00' };
};
