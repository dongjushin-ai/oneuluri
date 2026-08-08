import assert from "node:assert/strict";
import { generateCourses, getPlacesValidForDate, getReplacementCandidates, replaceCourseStop, resolveMainPlace } from "./course-generator";
import { seongsuPlaces } from "../data/places";
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
  assert.equal(seongsuPlaces.length, 30, "Expected exactly 30 curated Seongsu places");
  assert.ok(
    seongsuPlaces.every(
      (place) => place.lat > 37.535 && place.lat < 37.55 && place.lng > 127.04 && place.lng < 127.07,
    ),
    "Every place coordinate must be strictly within the Seongsu map bounds",
  );

  const expiredPlace = { ...seongsuPlaces[0], id: "expired-test-place", validUntil: "2026-08-02" };
  assert.deepEqual(
    getPlacesValidForDate([seongsuPlaces[0], expiredPlace], baseRequest.date).map((place) => place.id),
    [seongsuPlaces[0].id],
    "Expected expired places to be excluded",
  );

  assert.ok(
    seongsuPlaces.every((place) => place.sources.length > 0 || place.dataStatus === "ESTIMATED"),
    "Every place must have a source or be explicitly estimated",
  );

  const verifiedFields = ["NAME", "ADDRESS", "COORDINATES", "OPENING_HOURS"] as const;
  assert.ok(
    seongsuPlaces
      .filter((place) => place.dataStatus === "VERIFIED")
      .every((place) => {
        const supportedFields = new Set(place.sources.flatMap((source) => source.supportedFields));
        return place.sources.length > 0 && verifiedFields.every((field) => supportedFields.has(field));
      }),
    "Verified places must have sources supporting identity, location, and opening hours",
  );

  assert.ok(
    seongsuPlaces
      .filter((place) => place.openingHoursSourceType === "NOT_APPLICABLE")
      .every((place) => place.opening_hours.length === 0 && place.avg_price === 0),
    "Non-business public spaces must not contain fabricated hours or costs",
  );

  assert.ok(seongsuPlaces.every((place) => place.scoreSource === "EDITORIAL"), "Subjective scores must be editorial");

  const result = generateCourses({
    request: baseRequest,
    weather: { isRainy: false, temperature: 24 },
    detailedOptions: [],
    selectedMainPlace: seongsuPlaces[0],
    mainPlaceId: baseRequest.mainPlaceId,
  });

  const suppliedPlaces = [
    seongsuPlaces.find((place) => place.category === "RESTAURANT")!,
    seongsuPlaces.find((place) => place.category === "CAFE")!,
    seongsuPlaces.find((place) => place.category === "ACTIVITY")!,
    seongsuPlaces.find((place) => place.category === "PHOTO_SPOT")!,
  ];
  const suppliedPlaceIds = new Set(suppliedPlaces.map((place) => place.id));
  const suppliedResult = generateCourses({
    request: baseRequest,
    weather: { isRainy: false, temperature: 24 },
    places: suppliedPlaces,
    detailedOptions: [],
    selectedMainPlace: suppliedPlaces[2],
  });
  assert.ok(suppliedResult.courses.length > 0, "Expected courses from a supplied place collection");
  assert.ok(
    suppliedResult.courses.every((course) => course.stops.every((stop) => suppliedPlaceIds.has(stop.place.id))),
    "Course generation must only use the supplied place collection",
  );

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
    selectedMainPlace: seongsuPlaces[0],
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
    selectedMainPlace: seongsuPlaces[4],
    mainPlaceId: budgetRequest.mainPlaceId,
  });
  assert.ok(budgetResult.courses.length <= 3, "Budget-constrained generation should stay within the result limit");

  const distinctResult = generateCourses({
    request: baseRequest,
    weather: { isRainy: false, temperature: 24 },
    detailedOptions: [],
    selectedMainPlace: seongsuPlaces[0],
    mainPlaceId: baseRequest.mainPlaceId,
  });
  const ids = distinctResult.courses.map((course) => course.type);
  assert.equal(new Set(ids).size, ids.length, "Expected distinct course types in the result");

  const selectedPlace = seongsuPlaces[0];
  const selectedResult = generateCourses({
    request: { ...baseRequest, mainPlaceId: selectedPlace.id },
    weather: { isRainy: false, temperature: 24 },
    detailedOptions: [],
    selectedMainPlace: selectedPlace,
    mainPlaceId: selectedPlace.id,
  });
  const selectedOccurrences = selectedResult.courses[0]?.stops.filter((stop) => stop.place.id === selectedPlace.id).length ?? 0;
  assert.equal(selectedOccurrences, 1, "Expected the selected main place to appear exactly once");

  const otherSelectedPlace = seongsuPlaces[1];
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
