"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlaceOpenAt = isPlaceOpenAt;
exports.isDuringBreakTime = isDuringBreakTime;
function parseTimeToMinutes(time) {
    const [hours, minutes] = time.split(":").map((part) => Number.parseInt(part, 10));
    return hours * 60 + minutes;
}
function normalizeDay(dayOfWeek) {
    return ((dayOfWeek % 7) + 7) % 7;
}
function getOpeningHourForDay(openingHours, dayOfWeek) {
    return openingHours.find((hours) => normalizeDay(hours.dayOfWeek) === normalizeDay(dayOfWeek));
}
function isCrossMidnight(startMinutes, endMinutes) {
    return endMinutes <= startMinutes;
}
function isPlaceOpenAt(openingHours, date) {
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
function isDuringBreakTime(openingHours, date) {
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
