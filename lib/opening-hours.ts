import type { OpeningHour } from "../types/place";

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map((part) => Number.parseInt(part, 10));
  return hours * 60 + minutes;
}

function normalizeDay(dayOfWeek: number): number {
  return ((dayOfWeek % 7) + 7) % 7;
}

function getOpeningHourForDay(openingHours: OpeningHour[], dayOfWeek: number): OpeningHour | undefined {
  return openingHours.find((hours) => normalizeDay(hours.dayOfWeek) === normalizeDay(dayOfWeek));
}

function isCrossMidnight(startMinutes: number, endMinutes: number): boolean {
  return endMinutes <= startMinutes;
}

export function isPlaceOpenAt(openingHours: OpeningHour[], date: Date): boolean {
  const dayOfWeek = date.getDay();
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const openingHour = getOpeningHourForDay(openingHours, dayOfWeek);

  if (!openingHour) {
    return false;
  }

  const openMinutes = parseTimeToMinutes(openingHour.open);
  const closeMinutes = parseTimeToMinutes(openingHour.close);

  if (isCrossMidnight(openMinutes, closeMinutes)) {
    if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) {
      return !isDuringBreakTime(openingHours, date);
    }
    return false;
  }

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return !isDuringBreakTime(openingHours, date);
  }

  return false;
}

export function isDuringBreakTime(openingHours: OpeningHour[], date: Date): boolean {
  const dayOfWeek = date.getDay();
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const openingHour = getOpeningHourForDay(openingHours, dayOfWeek);

  if (!openingHour?.breakStart || !openingHour.breakEnd) {
    return false;
  }

  const breakStartMinutes = parseTimeToMinutes(openingHour.breakStart);
  const breakEndMinutes = parseTimeToMinutes(openingHour.breakEnd);

  if (isCrossMidnight(breakStartMinutes, breakEndMinutes)) {
    return currentMinutes >= breakStartMinutes || currentMinutes < breakEndMinutes;
  }

  return currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes;
}
