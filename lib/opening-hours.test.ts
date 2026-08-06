import assert from "node:assert/strict";
import { isDuringBreakTime, isPlaceOpenAt } from "./opening-hours";
import type { OpeningHour } from "../types/place";

const hours: OpeningHour[] = [
  { dayOfWeek: 1, open: "10:00", close: "22:00", breakStart: "15:00", breakEnd: "16:00" },
  { dayOfWeek: 2, open: "10:00", close: "20:00" },
];

function runOpeningHoursTests(): void {
  const openDuringNormalHours = isPlaceOpenAt(hours, new Date("2026-08-03T12:00:00+09:00"));
  assert.equal(openDuringNormalHours, true, "Should be open during regular hours");

  const openDuringBreak = isPlaceOpenAt(hours, new Date("2026-08-03T15:30:00+09:00"));
  assert.equal(openDuringBreak, false, "Should be closed during break time");

  const breakTime = isDuringBreakTime(hours, new Date("2026-08-03T15:30:00+09:00"));
  assert.equal(breakTime, true, "Should detect break period");

  const midnightCrossing = isPlaceOpenAt(
    [{ dayOfWeek: 0, open: "22:00", close: "02:00" }],
    new Date("2026-08-02T23:30:00+09:00"),
  );
  assert.equal(midnightCrossing, true, "Should be open when hours cross midnight");

  const closedDay = isPlaceOpenAt(hours, new Date("2026-08-05T12:00:00+09:00"));
  assert.equal(closedDay, false, "Should be closed when no hours are configured for the day");

  console.log("opening-hours tests passed");
}

runOpeningHoursTests();
