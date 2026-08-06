"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const opening_hours_1 = require("./opening-hours");
const hours = [
    { dayOfWeek: 1, open: "10:00", close: "22:00", breakStart: "15:00", breakEnd: "16:00" },
    { dayOfWeek: 2, open: "10:00", close: "20:00" },
];
function runOpeningHoursTests() {
    const openDuringNormalHours = (0, opening_hours_1.isPlaceOpenAt)(hours, new Date("2026-08-03T12:00:00+09:00"));
    strict_1.default.equal(openDuringNormalHours, true, "Should be open during regular hours");
    const openDuringBreak = (0, opening_hours_1.isPlaceOpenAt)(hours, new Date("2026-08-03T15:30:00+09:00"));
    strict_1.default.equal(openDuringBreak, false, "Should be closed during break time");
    const breakTime = (0, opening_hours_1.isDuringBreakTime)(hours, new Date("2026-08-03T15:30:00+09:00"));
    strict_1.default.equal(breakTime, true, "Should detect break period");
    const midnightCrossing = (0, opening_hours_1.isPlaceOpenAt)([{ dayOfWeek: 0, open: "22:00", close: "02:00" }], new Date("2026-08-02T23:30:00+09:00"));
    strict_1.default.equal(midnightCrossing, true, "Should be open when hours cross midnight");
    const closedDay = (0, opening_hours_1.isPlaceOpenAt)(hours, new Date("2026-08-05T12:00:00+09:00"));
    strict_1.default.equal(closedDay, false, "Should be closed when no hours are configured for the day");
    console.log("opening-hours tests passed");
}
runOpeningHoursTests();
