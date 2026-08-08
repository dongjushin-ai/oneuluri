import { z } from "zod";
import { seongsuPlaces } from "../../data/places";
import type { Place } from "../../types/place";
import { createServerSupabaseClient } from "./server";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const openingHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  open: timeSchema,
  close: timeSchema,
  breakStart: timeSchema.optional(),
  breakEnd: timeSchema.optional(),
});

const placeSourceSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  publisher: z.string().min(1),
  accessedAt: isoDateSchema,
  supportedFields: z.array(z.enum(["NAME", "ADDRESS", "COORDINATES", "OPENING_HOURS", "PRICE"])),
});

const scoresSchema = z.object({
  romantic: z.number().min(0).max(5),
  instagram: z.number().min(0).max(5),
  quiet: z.number().min(0).max(5),
  activity: z.number().min(0).max(5),
  value: z.number().min(0).max(5),
  photo: z.number().min(0).max(5),
  rain: z.number().min(0).max(5),
});

const placeRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["RESTAURANT", "CAFE", "ACTIVITY", "PHOTO_SPOT", "WALK"]),
  latitude: z.number().gt(37.535).lt(37.55),
  longitude: z.number().gt(127.04).lt(127.07),
  address: z.string().min(1),
  avg_price: z.number().int().nonnegative(),
  avg_stay_duration_min: z.number().int().positive(),
  tags: z.array(z.string()),
  indoor: z.boolean(),
  opening_hours: z.array(openingHourSchema),
  data_status: z.enum(["VERIFIED", "PARTIAL", "ESTIMATED"]),
  sources: z.array(placeSourceSchema),
  price_source_type: z.enum(["OFFICIAL", "THIRD_PARTY", "EDITORIAL_ESTIMATE", "NOT_APPLICABLE"]),
  opening_hours_source_type: z.enum(["OFFICIAL", "THIRD_PARTY", "ESTIMATED", "NOT_APPLICABLE"]),
  last_verified_at: isoDateSchema,
  valid_from: isoDateSchema.nullish(),
  valid_until: isoDateSchema.nullish(),
  score_source: z.literal("EDITORIAL"),
  scores: scoresSchema,
});

export class PlaceDataValidationError extends Error {
  readonly code = "PLACE_DATA_VALIDATION_FAILED";

  constructor(message = "Supabase returned invalid place data.") {
    super(message);
    this.name = "PlaceDataValidationError";
  }
}

export class PlaceRepositoryError extends Error {
  readonly code = "PLACE_QUERY_FAILED";

  constructor(message: string) {
    super(message);
    this.name = "PlaceRepositoryError";
  }
}

export function mapPlaceRow(row: unknown): Place {
  const result = placeRowSchema.safeParse(row);
  if (!result.success) {
    throw new PlaceDataValidationError(result.error.issues.map((issue) => issue.message).join("; "));
  }

  const data = result.data;
  return {
    id: data.id,
    name: data.name,
    category: data.category,
    lat: data.latitude,
    lng: data.longitude,
    address: data.address,
    avg_price: data.avg_price,
    avg_stay_duration_min: data.avg_stay_duration_min,
    tags: data.tags,
    indoor: data.indoor,
    opening_hours: data.opening_hours,
    dataStatus: data.data_status,
    sources: data.sources,
    priceSourceType: data.price_source_type,
    openingHoursSourceType: data.opening_hours_source_type,
    lastVerifiedAt: data.last_verified_at,
    ...(data.valid_from ? { validFrom: data.valid_from } : {}),
    ...(data.valid_until ? { validUntil: data.valid_until } : {}),
    scoreSource: data.score_source,
    scores: data.scores,
  };
}

type PlaceRowsLoader = () => Promise<unknown>;

export interface PlaceRepository {
  getPlaces(): Promise<Place[]>;
  getPlacesWithFallback(): Promise<PlaceLoadResult>;
}

export interface PlaceLoadResult {
  places: Place[];
  source: "SUPABASE" | "LOCAL_FALLBACK";
  warning?: string;
}

function isActive(place: Place, today: string): boolean {
  return (!place.validFrom || place.validFrom <= today) && (!place.validUntil || place.validUntil >= today);
}

async function loadSupabaseRows(): Promise<unknown> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await createServerSupabaseClient()
    .from("places")
    .select("*")
    .or(`valid_from.is.null,valid_from.lte.${today}`)
    .or(`valid_until.is.null,valid_until.gte.${today}`);

  if (error) {
    throw new PlaceRepositoryError(`Unable to load places from Supabase: ${error.message}`);
  }
  return data;
}

export function createPlaceRepository(
  loadRows: PlaceRowsLoader,
  today: () => string = () => new Date().toISOString().slice(0, 10),
): PlaceRepository {
  const getRepositoryPlaces = async (): Promise<Place[]> => {
    const rows = await loadRows();
    if (!Array.isArray(rows)) {
      throw new PlaceDataValidationError("Supabase place response must be an array.");
    }
    return rows.map(mapPlaceRow).filter((place) => isActive(place, today()));
  };

  return {
    getPlaces: getRepositoryPlaces,
    async getPlacesWithFallback(): Promise<PlaceLoadResult> {
      try {
        const places = await getRepositoryPlaces();
        if (places.length === 0) {
          throw new PlaceDataValidationError("Supabase returned no usable active places.");
        }
        return { places, source: "SUPABASE" };
      } catch (error: unknown) {
        const warning = error instanceof Error ? error.message : "Unknown Supabase place loading error.";
        return { places: seongsuPlaces, source: "LOCAL_FALLBACK", warning };
      }
    },
  };
}

const defaultRepository = createPlaceRepository(loadSupabaseRows);

export function getPlaces(): Promise<Place[]> {
  return defaultRepository.getPlaces();
}

export function getPlacesWithFallback(): Promise<PlaceLoadResult> {
  return defaultRepository.getPlacesWithFallback();
}
