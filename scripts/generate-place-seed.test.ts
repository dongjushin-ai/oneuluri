import assert from "node:assert/strict";
import { seongsuPlaces } from "../data/places";
import { generatePlaceSeedSql, placeToDatabaseRow } from "./generate-place-seed";

function runTests(): void {
  assert.equal(seongsuPlaces.length, 30, "The seed must contain exactly 30 curated places");
  assert.equal(new Set(seongsuPlaces.map((place) => place.id)).size, 30, "Every seeded place ID must be unique");

  const place = seongsuPlaces[0];
  const row = placeToDatabaseRow(place);
  assert.deepEqual(
    row,
    {
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
    },
    "The database row must preserve every Place field",
  );

  const firstOutput = generatePlaceSeedSql(seongsuPlaces);
  const secondOutput = generatePlaceSeedSql(seongsuPlaces);
  assert.equal(firstOutput, secondOutput, "Seed generation must be deterministic");
  assert.equal((firstOutput.match(/^  \('/gm) ?? []).length, 30, "The SQL must contain exactly 30 value rows");
  assert.match(firstOutput, /on conflict \(id\) do update set/);

  const quotedName = generatePlaceSeedSql([{ ...place, id: "quoted-place", name: "Chef's Place" }]);
  assert.match(quotedName, /Chef''s Place/, "SQL string values must escape apostrophes");

  assert.throws(
    () => generatePlaceSeedSql([place, { ...place }]),
    /place IDs must be unique/,
    "Duplicate IDs must be rejected",
  );

  console.log("place seed generator tests passed");
}

runTests();
