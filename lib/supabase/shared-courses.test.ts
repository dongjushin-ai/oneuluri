import assert from "node:assert/strict";
import { seongsuPlaces } from "../../data/places";
import { generateCourses } from "../course-generator";
import type { CourseRequest } from "../../types/course";
import {
  courseRequestSchema,
  mapSharedCourseRow,
  serializeSharedCourseSnapshot,
  SharedCourseExpiredError,
  sharedCourseInputSchema,
} from "./shared-courses";

const request: CourseRequest = {
  location: "성수동",
  date: "2026-08-08",
  start_time: "12:00",
  end_time: "20:00",
  budget: "UNDER_10W",
  transportation_mode: "WALK",
  preferences: { lovely: 4, sensibility: 4, quiet: 3, activity: 2 },
  mainPlaceId: seongsuPlaces[16].id,
};

function runTests(): void {
  assert.equal(courseRequestSchema.safeParse(request).success, true, "A valid CourseRequest must be accepted");
  assert.equal(
    courseRequestSchema.safeParse({ ...request, arbitrary: "not allowed" }).success,
    false,
    "Unknown request properties must be rejected",
  );
  assert.equal(
    courseRequestSchema.safeParse({ ...request, preferences: { ...request.preferences, lovely: 9 } }).success,
    false,
    "Out-of-range preferences must be rejected",
  );

  const generated = generateCourses({
    request,
    weather: { isRainy: false, temperature: 24 },
    places: seongsuPlaces,
    detailedOptions: [],
    selectedMainPlace: seongsuPlaces[16],
  }).courses[0];
  assert.ok(generated, "A snapshot test course must be generated");

  const snapshot = serializeSharedCourseSnapshot(request, generated);
  assert.deepEqual(snapshot.request_data, request);
  assert.deepEqual(snapshot.course_data, generated);
  assert.equal(snapshot.course_type, generated.type);
  assert.equal(sharedCourseInputSchema.safeParse({ request, course: generated }).success, true);

  const row = {
    id: "c7c69ab1-16e8-4a2a-9367-1f7c7526d246",
    course_type: generated.type,
    request_data: snapshot.request_data,
    course_data: snapshot.course_data,
    created_at: "2026-08-08T04:00:00.000Z",
    expires_at: null,
  };
  const mapped = mapSharedCourseRow(row, new Date("2026-08-08T05:00:00.000Z"));
  assert.equal(mapped.id, row.id);
  assert.deepEqual(mapped.request, request);
  assert.deepEqual(mapped.course, generated, "Stored course data must deserialize without regeneration");

  assert.throws(
    () => mapSharedCourseRow({ ...row, expires_at: "2026-08-08T04:30:00.000Z" }, new Date("2026-08-08T05:00:00.000Z")),
    SharedCourseExpiredError,
    "Expired shared courses must be rejected",
  );

  console.log("shared course tests passed");
}

runTests();
