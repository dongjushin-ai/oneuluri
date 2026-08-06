import assert from "node:assert/strict";
import { generateCourses, getReplacementCandidates, replaceCourseStop, resolveMainPlace } from "./course-generator";
import { mockPlaces } from "../data/places";
import type { CourseRequest } from "../types/course";

const baseRequest: CourseRequest = {
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

function runCourseGeneratorTests(): void {
  const result = generateCourses({
    request: baseRequest,
    weather: { isRainy: false, temperature: 24 },
    detailedOptions: [],
    selectedMainPlace: mockPlaces[0],
    mainPlaceId: baseRequest.mainPlaceId,
  });

  assert.ok(result.courses.length >= 1, "Expected at least one generated course");
  assert.ok(result.courses.every((course) => course.stops.length >= 2), "Expected each course to include the fixed stop and more stops");
  assert.ok(result.courses.every((course) => course.reasons.length >= 3), "Expected each course to include at least three reasons");
  assert.ok(
    result.courses.every((course) => course.reasons.every((reason) => reason.trim().length > 0)),
    "Expected each reason to be a non-empty string",
  );
  assert.ok(
    result.courses.every((course) => course.reasons.some((reason) => reason.includes("예산") || reason.includes("영업시간") || reason.includes("동선을"))),
    "Expected the reasons to reflect the user request and course constraints",
  );

  const closedResult = generateCourses({
    request: { ...baseRequest, start_time: "23:00", end_time: "23:30" },
    weather: { isRainy: false, temperature: 24 },
    detailedOptions: [],
    selectedMainPlace: mockPlaces[0],
    mainPlaceId: baseRequest.mainPlaceId,
  });
  assert.equal(closedResult.courses.length, 0, "Closed-day schedule should be rejected");

  const budgetRequest: CourseRequest = {
    ...baseRequest,
    budget: "UNDER_10W",
  };
  const budgetResult = generateCourses({
    request: budgetRequest,
    weather: { isRainy: false, temperature: 24 },
    detailedOptions: [],
    selectedMainPlace: mockPlaces[4],
    mainPlaceId: budgetRequest.mainPlaceId,
  });
  assert.ok(budgetResult.courses.length <= 3, "Budget-constrained generation should stay within the result limit");

  const distinctResult = generateCourses({
    request: baseRequest,
    weather: { isRainy: false, temperature: 24 },
    detailedOptions: [],
    selectedMainPlace: mockPlaces[0],
    mainPlaceId: baseRequest.mainPlaceId,
  });
  const ids = distinctResult.courses.map((course) => course.type);
  assert.equal(new Set(ids).size, ids.length, "Expected distinct course types in the result");

  const selectedPlace = mockPlaces[0];
  const selectedResult = generateCourses({
    request: { ...baseRequest, mainPlaceId: selectedPlace.id },
    weather: { isRainy: false, temperature: 24 },
    detailedOptions: [],
    selectedMainPlace: selectedPlace,
    mainPlaceId: selectedPlace.id,
  });
  const selectedOccurrences = selectedResult.courses[0]?.stops.filter((stop) => stop.place.id === selectedPlace.id).length ?? 0;
  assert.equal(selectedOccurrences, 1, "Expected the selected main place to appear exactly once");

  const otherSelectedPlace = mockPlaces[1];
  const otherSelectedResult = generateCourses({
    request: { ...baseRequest, mainPlaceId: otherSelectedPlace.id },
    weather: { isRainy: false, temperature: 24 },
    detailedOptions: [],
    selectedMainPlace: otherSelectedPlace,
    mainPlaceId: otherSelectedPlace.id,
  });
  const firstStopIds = selectedResult.courses[0]?.stops.map((stop) => stop.place.id).join("|") ?? "";
  const otherStopIds = otherSelectedResult.courses[0]?.stops.map((stop) => stop.place.id).join("|") ?? "";
  assert.notEqual(firstStopIds, otherStopIds, "Expected a different selected main place to change the generated course");

  const autoSelectedPlace = resolveMainPlace(
    { ...baseRequest, mainPlaceId: "" },
    { isRainy: false, temperature: 24 },
    [],
    undefined,
    "",
  );
  assert.equal(autoSelectedPlace.category, "ACTIVITY", "Expected automatic selection to use an activity place");

  const invalidSelectedPlace = resolveMainPlace(
    { ...baseRequest, mainPlaceId: "missing-id" },
    { isRainy: false, temperature: 24 },
    [],
    undefined,
    "missing-id",
  );
  assert.equal(invalidSelectedPlace.category, "ACTIVITY", "Expected invalid mainPlaceId to fall back safely");

  const replacementCourse = result.courses[0];
  const replacementIndex = 1;
  const replacementCandidates = getReplacementCandidates(
    replacementCourse,
    baseRequest,
    { isRainy: false, temperature: 24 },
    [],
    replacementIndex,
    undefined,
    baseRequest.mainPlaceId,
  );
  assert.ok(replacementCandidates.length > 0, "Expected at least one valid replacement candidate");
  assert.equal(replacementCandidates[0].place.category, replacementCourse.stops[replacementIndex].place.category, "Expected replacements to stay in the same category");

  const updatedCourse = replaceCourseStop(
    replacementCourse,
    baseRequest,
    { isRainy: false, temperature: 24 },
    [],
    replacementIndex,
    replacementCandidates[0].place,
    undefined,
    baseRequest.mainPlaceId,
  );
  assert.ok(updatedCourse, "Expected a valid replacement to produce an updated course");
  assert.ok(
    updatedCourse.stops.every((stop) => stop.place.id !== replacementCourse.stops[replacementIndex].place.id),
    "Expected the replaced place to be different from the original place",
  );
  assert.equal(
    updatedCourse.stops.filter((stop) => stop.place.id === replacementCandidates[0].place.id).length,
    1,
    "Expected no duplicate places after replacement",
  );
  assert.ok(
    updatedCourse.totalCost !== replacementCourse.totalCost ||
      updatedCourse.totalDistanceKm !== replacementCourse.totalDistanceKm ||
      updatedCourse.totalTravelMinutes !== replacementCourse.totalTravelMinutes ||
      updatedCourse.finalScore !== replacementCourse.finalScore,
    "Expected replacement to recalculate course totals",
  );

  const mainReplacement = replaceCourseStop(
    replacementCourse,
    baseRequest,
    { isRainy: false, temperature: 24 },
    [],
    0,
    replacementCandidates[0].place,
    undefined,
    baseRequest.mainPlaceId,
  );
  assert.equal(mainReplacement, null, "Expected the selected main place to remain non-replaceable");

  console.log("course-generator tests passed");
}

runCourseGeneratorTests();
