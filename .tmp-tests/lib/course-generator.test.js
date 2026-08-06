"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const course_generator_1 = require("./course-generator");
const places_1 = require("../data/places");
const baseRequest = {
    location: "성수동",
    date: "2026-08-03",
    start_time: "12:00",
    end_time: "20:00",
    budget: "UNDER_10W",
    transportation_mode: "WALK",
    preferences: {
        lovely: 4,
        sensibility: 4,
        quiet: 3,
        activity: 2,
    },
    mainPlaceId: null,
};
function runCourseGeneratorTests() {
    const result = (0, course_generator_1.generateCourses)({
        request: baseRequest,
        weather: { isRainy: false, temperature: 24 },
        detailedOptions: [],
        selectedMainPlace: places_1.mockPlaces[0],
        mainPlaceId: baseRequest.mainPlaceId,
    });
    strict_1.default.ok(result.courses.length >= 1, "Expected at least one generated course");
    strict_1.default.ok(result.courses.every((course) => course.stops.length >= 2), "Expected each course to include the fixed stop and more stops");
    strict_1.default.ok(result.courses.every((course) => course.reasons.length >= 3), "Expected each course to include at least three reasons");
    strict_1.default.ok(result.courses.every((course) => course.reasons.every((reason) => reason.trim().length > 0)), "Expected each reason to be a non-empty string");
    strict_1.default.ok(result.courses.every((course) => course.reasons.some((reason) => reason.includes("예산") || reason.includes("영업시간") || reason.includes("동선을"))), "Expected the reasons to reflect the user request and course constraints");
    const closedResult = (0, course_generator_1.generateCourses)({
        request: { ...baseRequest, start_time: "23:00", end_time: "23:30" },
        weather: { isRainy: false, temperature: 24 },
        detailedOptions: [],
        selectedMainPlace: places_1.mockPlaces[0],
        mainPlaceId: baseRequest.mainPlaceId,
    });
    strict_1.default.equal(closedResult.courses.length, 0, "Closed-day schedule should be rejected");
    const budgetRequest = {
        ...baseRequest,
        budget: "UNDER_10W",
    };
    const budgetResult = (0, course_generator_1.generateCourses)({
        request: budgetRequest,
        weather: { isRainy: false, temperature: 24 },
        detailedOptions: [],
        selectedMainPlace: places_1.mockPlaces[4],
        mainPlaceId: budgetRequest.mainPlaceId,
    });
    strict_1.default.ok(budgetResult.courses.length <= 3, "Budget-constrained generation should stay within the result limit");
    const distinctResult = (0, course_generator_1.generateCourses)({
        request: baseRequest,
        weather: { isRainy: false, temperature: 24 },
        detailedOptions: [],
        selectedMainPlace: places_1.mockPlaces[0],
        mainPlaceId: baseRequest.mainPlaceId,
    });
    const ids = distinctResult.courses.map((course) => course.type);
    strict_1.default.equal(new Set(ids).size, ids.length, "Expected distinct course types in the result");
    const selectedPlace = places_1.mockPlaces[0];
    const selectedResult = (0, course_generator_1.generateCourses)({
        request: { ...baseRequest, mainPlaceId: selectedPlace.id },
        weather: { isRainy: false, temperature: 24 },
        detailedOptions: [],
        selectedMainPlace: selectedPlace,
        mainPlaceId: selectedPlace.id,
    });
    const selectedOccurrences = selectedResult.courses[0]?.stops.filter((stop) => stop.place.id === selectedPlace.id).length ?? 0;
    strict_1.default.equal(selectedOccurrences, 1, "Expected the selected main place to appear exactly once");
    const otherSelectedPlace = places_1.mockPlaces[1];
    const otherSelectedResult = (0, course_generator_1.generateCourses)({
        request: { ...baseRequest, mainPlaceId: otherSelectedPlace.id },
        weather: { isRainy: false, temperature: 24 },
        detailedOptions: [],
        selectedMainPlace: otherSelectedPlace,
        mainPlaceId: otherSelectedPlace.id,
    });
    const firstStopIds = selectedResult.courses[0]?.stops.map((stop) => stop.place.id).join("|") ?? "";
    const otherStopIds = otherSelectedResult.courses[0]?.stops.map((stop) => stop.place.id).join("|") ?? "";
    strict_1.default.notEqual(firstStopIds, otherStopIds, "Expected a different selected main place to change the generated course");
    const autoSelectedPlace = (0, course_generator_1.resolveMainPlace)({ ...baseRequest, mainPlaceId: "" }, { isRainy: false, temperature: 24 }, [], undefined, "");
    strict_1.default.equal(autoSelectedPlace.category, "ACTIVITY", "Expected automatic selection to use an activity place");
    const invalidSelectedPlace = (0, course_generator_1.resolveMainPlace)({ ...baseRequest, mainPlaceId: "missing-id" }, { isRainy: false, temperature: 24 }, [], undefined, "missing-id");
    strict_1.default.equal(invalidSelectedPlace.category, "ACTIVITY", "Expected invalid mainPlaceId to fall back safely");
    const replacementCourse = result.courses[0];
    const replacementIndex = 1;
    const replacementCandidates = (0, course_generator_1.getReplacementCandidates)(replacementCourse, baseRequest, { isRainy: false, temperature: 24 }, [], replacementIndex, undefined, baseRequest.mainPlaceId);
    strict_1.default.ok(replacementCandidates.length > 0, "Expected at least one valid replacement candidate");
    strict_1.default.equal(replacementCandidates[0].place.category, replacementCourse.stops[replacementIndex].place.category, "Expected replacements to stay in the same category");
    const updatedCourse = (0, course_generator_1.replaceCourseStop)(replacementCourse, baseRequest, { isRainy: false, temperature: 24 }, [], replacementIndex, replacementCandidates[0].place, undefined, baseRequest.mainPlaceId);
    strict_1.default.ok(updatedCourse, "Expected a valid replacement to produce an updated course");
    strict_1.default.ok(updatedCourse.stops.every((stop) => stop.place.id !== replacementCourse.stops[replacementIndex].place.id), "Expected the replaced place to be different from the original place");
    strict_1.default.equal(updatedCourse.stops.filter((stop) => stop.place.id === replacementCandidates[0].place.id).length, 1, "Expected no duplicate places after replacement");
    strict_1.default.ok(updatedCourse.totalCost !== replacementCourse.totalCost ||
        updatedCourse.totalDistanceKm !== replacementCourse.totalDistanceKm ||
        updatedCourse.totalTravelMinutes !== replacementCourse.totalTravelMinutes ||
        updatedCourse.finalScore !== replacementCourse.finalScore, "Expected replacement to recalculate course totals");
    const mainReplacement = (0, course_generator_1.replaceCourseStop)(replacementCourse, baseRequest, { isRainy: false, temperature: 24 }, [], 0, replacementCandidates[0].place, undefined, baseRequest.mainPlaceId);
    strict_1.default.equal(mainReplacement, null, "Expected the selected main place to remain non-replaceable");
    console.log("course-generator tests passed");
}
runCourseGeneratorTests();
