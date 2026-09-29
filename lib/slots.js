// Business hours config — adjust to match real shop hours.
export const BUSINESS_HOURS = { startHour: 9, endHour: 17 }; // 9:00 - 17:00
const SLOT_INTERVAL_MINUTES = 30;

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const toHHMM = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

// Generates all possible start-time slots for a day, given business hours.
export const generateDaySlots = () => {
  const slots = [];
  const startMin = BUSINESS_HOURS.startHour * 60;
  const endMin = BUSINESS_HOURS.endHour * 60;
  for (let t = startMin; t < endMin; t += SLOT_INTERVAL_MINUTES) {
    slots.push(toHHMM(t));
  }
  return slots;
};

// Returns true if [aStart, aStart+aDur) overlaps [bStart, bStart+bDur)
export const rangesOverlap = (aStart, aDur, bStart, bDur) => {
  const aStartMin = toMinutes(aStart);
  const aEndMin = aStartMin + aDur;
  const bStartMin = toMinutes(bStart);
  const bEndMin = bStartMin + bDur;
  return aStartMin < bEndMin && bStartMin < aEndMin;
};
