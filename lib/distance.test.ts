import assert from "node:assert/strict";
import { calculateDistanceKm, estimateTravelMinutes } from "./distance";

function runDistanceTests(): void {
  const samePointDistance = calculateDistanceKm(37.544, 127.055, 37.544, 127.055);
  assert.equal(samePointDistance, 0, "Same point should return zero distance");

  const aroundSeongsuDistance = calculateDistanceKm(37.544, 127.055, 37.548, 127.062);
  assert.ok(aroundSeongsuDistance > 0, "Different coordinates should return positive distance");

  const walkingMinutes = estimateTravelMinutes(37.544, 127.055, 37.548, 127.062, "WALK");
  assert.ok(walkingMinutes >= 8, "Walking travel estimate should be at least the minimum");

  const transitMinutes = estimateTravelMinutes(37.544, 127.055, 37.548, 127.062, "PUBLIC");
  assert.ok(transitMinutes >= 12, "Transit travel estimate should include overhead");

  console.log("distance tests passed");
}

runDistanceTests();
