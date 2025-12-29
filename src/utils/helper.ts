import { Slot } from "./types";

export function generateSlots(availability: Slot, interval: number) {
  const slots = [];
  let { startTime, endTime } = availability;
  let cursor = new Date(startTime);

  while (cursor < endTime) {
    const next = new Date(cursor.getTime() + interval * 60 * 1000);

    if (next > endTime) {
      break;
    }

    slots.push({
      startTime: new Date(cursor),
      endTime: next,
    });

    cursor = next;
  }

  return slots;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export const getFormattedSpeechData = (speechData: {
  medicine: string[];
  diagnosis: string;
  advice: string;
}): String => {
  const medicine = speechData.medicine.join("\n");

  let formattedSpeechData = `Diagnosing for, ${speechData.diagnosis}.`;
  formattedSpeechData += ` Medicines prescribed, ${medicine}. `;
  formattedSpeechData += speechData.advice.length
    ? `Advice, ${speechData.advice}`
    : "";
  return formattedSpeechData;
};

export const timeToDate = (time: string): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(Date.UTC(1970, 0, 1));
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
};

export function timeParts(d: Date) {
  return {
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
  };
}

export const isSlotWithinAvailability = (
  slotStart: Date,
  slotEnd: Date,
  availabilityStart: Date,
  availabilityEnd: Date
): boolean => {
  let slotStartMin = minutesSinceMidnight(slotStart);
  let slotEndMin = minutesSinceMidnight(slotEnd);
  let availabilityStartMin = minutesSinceMidnight(availabilityStart);
  let availabilityEndMin = minutesSinceMidnight(availabilityEnd);

  return (
    slotStartMin >= availabilityStartMin && slotEndMin <= availabilityEndMin
  );
};

const minutesSinceMidnight = (d: Date) => {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};
