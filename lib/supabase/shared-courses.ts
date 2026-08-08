import { z } from "zod";
import type { GeneratedCourse } from "../course-generator";
import type { CourseRequest } from "../../types/course";
import { createAdminSupabaseClient } from "./admin";
import { createServerSupabaseClient } from "./server";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTimeSchema = z.string().datetime({ offset: true });
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const preferenceValueSchema = z.union([
  z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5),
]);

const preferencesSchema = z.object({
  lovely: preferenceValueSchema,
  sensibility: preferenceValueSchema,
  quiet: preferenceValueSchema,
  activity: preferenceValueSchema,
}).strict();

export const courseRequestSchema = z.object({
  location: z.string().min(1).max(100),
  date: isoDateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
  budget: z.enum(["UNDER_10W", "10W_TO_20W", "OVER_20W"]),
  transportation_mode: z.enum(["WALK", "PUBLIC", "CAR", "BICYCLE"]),
  preferences: preferencesSchema,
  mainPlaceId: z.string().min(1).nullable(),
}).strict();

const openingHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  open: timeSchema,
  close: timeSchema,
  breakStart: timeSchema.optional(),
  breakEnd: timeSchema.optional(),
}).strict();

const placeSourceSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  publisher: z.string().min(1),
  accessedAt: isoDateSchema,
  supportedFields: z.array(z.enum(["NAME", "ADDRESS", "COORDINATES", "OPENING_HOURS", "PRICE"])),
}).strict();

const scoreSchema = z.object({
  romantic: z.number().min(0).max(5),
  instagram: z.number().min(0).max(5),
  quiet: z.number().min(0).max(5),
  activity: z.number().min(0).max(5),
  value: z.number().min(0).max(5),
  photo: z.number().min(0).max(5),
  rain: z.number().min(0).max(5),
}).strict();

const placeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["RESTAURANT", "CAFE", "ACTIVITY", "PHOTO_SPOT", "WALK"]),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().min(1),
  avg_price: z.number().int().nonnegative(),
  avg_stay_duration_min: z.number().int().positive(),
  tags: z.array(z.string()),
  indoor: z.boolean(),
  opening_hours: z.array(openingHourSchema),
  dataStatus: z.enum(["VERIFIED", "PARTIAL", "ESTIMATED"]),
  sources: z.array(placeSourceSchema),
  priceSourceType: z.enum(["OFFICIAL", "THIRD_PARTY", "EDITORIAL_ESTIMATE", "NOT_APPLICABLE"]),
  openingHoursSourceType: z.enum(["OFFICIAL", "THIRD_PARTY", "ESTIMATED", "NOT_APPLICABLE"]),
  lastVerifiedAt: isoDateSchema,
  validFrom: isoDateSchema.optional(),
  validUntil: isoDateSchema.optional(),
  scoreSource: z.literal("EDITORIAL"),
  scores: scoreSchema,
}).strict();

const courseStopSchema = z.object({
  place: placeSchema,
  arrivalTime: timeSchema,
  departureTime: timeSchema,
  travelMinutesFromPrevious: z.number().int().nonnegative(),
}).strict();

export const generatedCourseSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["SHORTEST", "MOOD", "PHOTO"]),
  totalTimeMin: z.number().int().nonnegative(),
  totalCost: z.number().int().nonnegative(),
  totalDistanceKm: z.number().nonnegative(),
  totalTravelMinutes: z.number().int().nonnegative(),
  stops: z.array(courseStopSchema).min(1).max(20),
  averagePreferenceScore: z.number().min(0).max(5),
  finalScore: z.number().min(0).max(100),
  reasons: z.array(z.string().min(1)).max(20),
}).strict();

export const sharedCourseInputSchema = z.object({
  request: courseRequestSchema,
  course: generatedCourseSchema,
}).strict();

const sharedCourseRowSchema = z.object({
  id: z.uuid(),
  course_type: z.enum(["SHORTEST", "MOOD", "PHOTO"]),
  request_data: courseRequestSchema,
  course_data: generatedCourseSchema,
  created_at: isoDateTimeSchema,
  expires_at: isoDateTimeSchema.nullable(),
});

const insertedIdSchema = z.object({ id: z.uuid() });

export interface SharedCourse {
  id: string;
  courseType: GeneratedCourse["type"];
  request: CourseRequest;
  course: GeneratedCourse;
  createdAt: string;
  expiresAt?: string;
}

export class SharedCourseValidationError extends Error {
  readonly code = "SHARED_COURSE_VALIDATION_FAILED";
  constructor(message = "공유 코스 데이터가 올바르지 않습니다.") {
    super(message);
    this.name = "SharedCourseValidationError";
  }
}

export class SharedCourseNotFoundError extends Error {
  readonly code = "SHARED_COURSE_NOT_FOUND";
  constructor() {
    super("공유 코스를 찾을 수 없습니다.");
    this.name = "SharedCourseNotFoundError";
  }
}

export class SharedCourseExpiredError extends Error {
  readonly code = "SHARED_COURSE_EXPIRED";
  constructor() {
    super("공유 코스 링크가 만료되었습니다.");
    this.name = "SharedCourseExpiredError";
  }
}

export class SharedCourseRepositoryError extends Error {
  readonly code = "SHARED_COURSE_QUERY_FAILED";
  constructor(message: string) {
    super(message);
    this.name = "SharedCourseRepositoryError";
  }
}

export function serializeSharedCourseSnapshot(request: CourseRequest, course: GeneratedCourse) {
  const result = sharedCourseInputSchema.safeParse({ request, course });
  if (!result.success) {
    throw new SharedCourseValidationError(result.error.issues.map((issue) => issue.message).join("; "));
  }
  return {
    course_type: result.data.course.type,
    request_data: result.data.request,
    course_data: result.data.course,
    expires_at: null,
  };
}

export function mapSharedCourseRow(row: unknown, now = new Date()): SharedCourse {
  const result = sharedCourseRowSchema.safeParse(row);
  if (!result.success) {
    throw new SharedCourseValidationError(result.error.issues.map((issue) => issue.message).join("; "));
  }
  const data = result.data;
  if (data.expires_at && new Date(data.expires_at).getTime() <= now.getTime()) {
    throw new SharedCourseExpiredError();
  }
  return {
    id: data.id,
    courseType: data.course_type,
    request: data.request_data as CourseRequest,
    course: data.course_data as GeneratedCourse,
    createdAt: data.created_at,
    ...(data.expires_at ? { expiresAt: data.expires_at } : {}),
  };
}

export async function createSharedCourse(request: CourseRequest, course: GeneratedCourse): Promise<string> {
  const snapshot = serializeSharedCourseSnapshot(request, course);
  const { data, error } = await createAdminSupabaseClient()
    .from("shared_courses")
    .insert(snapshot)
    .select("id")
    .single();
  if (error) {
    throw new SharedCourseRepositoryError(`공유 코스를 저장하지 못했습니다: ${error.message}`);
  }
  const parsedId = insertedIdSchema.safeParse(data);
  if (!parsedId.success) {
    throw new SharedCourseValidationError("저장된 공유 코스 ID가 올바르지 않습니다.");
  }
  return parsedId.data.id;
}

export async function getSharedCourse(id: string): Promise<SharedCourse> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) {
    throw new SharedCourseNotFoundError();
  }
  const { data, error } = await createServerSupabaseClient()
    .from("shared_courses")
    .select("id, course_type, request_data, course_data, created_at, expires_at")
    .eq("id", parsedId.data)
    .maybeSingle();
  if (error) {
    throw new SharedCourseRepositoryError(`공유 코스를 불러오지 못했습니다: ${error.message}`);
  }
  if (!data) {
    throw new SharedCourseNotFoundError();
  }
  return mapSharedCourseRow(data);
}
