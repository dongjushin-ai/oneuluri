import assert from "node:assert/strict";
import { seongsuPlaces } from "../../data/places";
import { createPlaceRepository, getPlacesWithFallback, mapPlaceRow } from "./places";

function toRow(index = 0, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const place = seongsuPlaces[index];
  return {
    id: place.id,
    name: place.name,
    category: place.category,
    latitude: place.lat,
    longitude: place.lng,
    address: place.address,
    avg_price: place.avg_price,
    avg_stay_duration_min: place.avg_stay_duration_min,
    tags: place.tags,
    indoor: place.indoor,
    opening_hours: place.opening_hours,
    data_status: place.dataStatus,
    sources: place.sources,
    price_source_type: place.priceSourceType,
    opening_hours_source_type: place.openingHoursSourceType,
    last_verified_at: place.lastVerifiedAt,
    valid_from: place.validFrom ?? null,
    valid_until: place.validUntil ?? null,
    score_source: place.scoreSource,
    scores: place.scores,
    ...overrides,
  };
}

async function runTests(): Promise<void> {
  const mapped = mapPlaceRow(toRow());
  assert.equal(mapped.id, seongsuPlaces[0].id);
  assert.equal(mapped.lat, seongsuPlaces[0].lat);
  assert.equal(mapped.lng, seongsuPlaces[0].lng);
  assert.equal(mapped.dataStatus, seongsuPlaces[0].dataStatus);

  const activeRow = toRow(0, { id: "active-place" });
  const expiredRow = toRow(1, { id: "expired-place", valid_until: "2026-08-06" });
  const expiryRepository = createPlaceRepository(async () => [activeRow, expiredRow], () => "2026-08-07");
  const activePlaces = await expiryRepository.getPlaces();
  assert.deepEqual(activePlaces.map((place) => place.id), ["active-place"], "Expired rows must be excluded");

  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const missingConfiguration = await getPlacesWithFallback();
  assert.equal(missingConfiguration.source, "LOCAL_FALLBACK");
  assert.equal(missingConfiguration.places.length, seongsuPlaces.length);
  assert.match(missingConfiguration.warning ?? "", /Supabase configuration is missing/);
  if (previousUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
  if (previousKey) process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;

  const invalidRepository = createPlaceRepository(async () => [toRow(0, { latitude: "invalid" })]);
  const invalidResult = await invalidRepository.getPlacesWithFallback();
  assert.equal(invalidResult.source, "LOCAL_FALLBACK");
  assert.equal(invalidResult.places.length, seongsuPlaces.length);
  assert.match(invalidResult.warning ?? "", /expected number/i);

  console.log("supabase place repository tests passed");
}

void runTests();
