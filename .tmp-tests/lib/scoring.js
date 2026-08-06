"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePlaceScore = calculatePlaceScore;
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function toScore(value) {
    return clamp(Math.round((value / 5) * 100), 0, 100);
}
function calculatePlaceScore(place, preferences, weather, detailedOptions) {
    const romantic = toScore(place.scores.romantic * (preferences.lovely / 5));
    const instagram = toScore(place.scores.instagram * (preferences.sensibility / 5));
    const quiet = toScore(place.scores.quiet * (preferences.quiet / 5));
    const activity = toScore(place.scores.activity * (preferences.activity / 5));
    const value = toScore(place.scores.value * 0.9);
    const photo = toScore(place.scores.photo * 0.9);
    const weatherScore = weather.isRainy && !place.indoor ? 20 : 100;
    const fitScore = preferences.activity <= 2 && place.scores.activity >= 4 ? 60 : 100;
    const penalties = [];
    let penaltyTotal = 0;
    if (weather.isRainy && !place.indoor) {
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
    const total = clamp(Math.round((romantic + instagram + quiet + activity + value + photo + weatherScore + fitScore) / 8 -
        penaltyTotal), 0, 100);
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
