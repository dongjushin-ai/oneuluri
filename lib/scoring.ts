import type { Place } from "../types/place";
import type { UserPreferences } from "../types/course";

export interface WeatherContext {
  isRainy: boolean;
  temperature: number;
  precipitationProbability?: number;
  sunsetTime?: string;
}

export type DetailedOption =
  | "SHORT_ROUTE"
  | "AVOID_WAITING"
  | "INDOOR_ON_RAIN"
  | "BUDGET_PRIORITY";

export interface ScoreBreakdown {
  romantic: number;
  instagram: number;
  quiet: number;
  activity: number;
  value: number;
  photo: number;
  weather: number;
  fit: number;
}

export interface ScoreResult {
  total: number;
  breakdown: ScoreBreakdown;
  penalties: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toScore(value: number): number {
  return clamp(Math.round((value / 5) * 100), 0, 100);
}

export function calculatePlaceScore(
  place: Place,
  preferences: UserPreferences,
  weather: WeatherContext,
  detailedOptions: DetailedOption[],
): ScoreResult {
  const romantic = toScore(place.scores.romantic * (preferences.lovely / 5));
  const instagram = toScore(place.scores.instagram * (preferences.sensibility / 5));
  const quiet = toScore(place.scores.quiet * (preferences.quiet / 5));
  const activity = toScore(place.scores.activity * (preferences.activity / 5));
  const value = toScore(place.scores.value * 0.9);
  const photo = toScore(place.scores.photo * 0.9);

  const isRainSensitiveOutdoor =
    weather.isRainy && !place.indoor && (place.category === "PHOTO_SPOT" || place.category === "WALK");
  const weatherScore = isRainSensitiveOutdoor ? 20 : 100;
  const fitScore =
    preferences.activity <= 2 && place.scores.activity >= 4 ? 60 : 100;

  const penalties: string[] = [];
  let penaltyTotal = 0;

  if (isRainSensitiveOutdoor) {
    const rainPenalty = clamp(Math.round((6 - place.scores.rain) * 4), 8, 24);
    penaltyTotal += rainPenalty;
    penalties.push("outdoor_in_rain");
  }

  if (detailedOptions.includes("BUDGET_PRIORITY") && place.scores.value < 3) {
    const valuePenalty = clamp((3 - place.scores.value) * 8, 8, 24);
    penaltyTotal += valuePenalty;
    penalties.push("low_value_for_budget");
  }

  if (preferences.activity <= 2 && place.scores.activity >= 4) {
    const mismatchPenalty = clamp((place.scores.activity - 2) * 4, 8, 20);
    penaltyTotal += mismatchPenalty;
    penalties.push("activity_mismatch");
  }

  const total = clamp(
    Math.round(
      (romantic + instagram + quiet + activity + value + photo + weatherScore + fitScore) / 8 -
        penaltyTotal,
    ),
    0,
    100,
  );

  return {
    total,
    breakdown: {
      romantic,
      instagram,
      quiet,
      activity,
      value,
      photo,
      weather: weatherScore,
      fit: fitScore,
    },
    penalties,
  };
}
