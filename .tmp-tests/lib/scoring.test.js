"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const scoring_1 = require("./scoring");
const samplePlace = {
    id: "place-1",
    name: "Rainy Outdoor Spot",
    category: "PHOTO_SPOT",
    lat: 37.5,
    lng: 127.1,
    address: "Seongsu",
    avg_price: 12000,
    avg_stay_duration_min: 45,
    tags: ["outdoor"],
    indoor: false,
    opening_hours: [{ dayOfWeek: 1, open: "10:00", close: "20:00" }],
    scores: {
        romantic: 4,
        instagram: 4,
        quiet: 3,
        activity: 2,
        value: 2,
        photo: 5,
        rain: 1,
    },
};
const preferences = {
    lovely: 4,
    sensibility: 4,
    quiet: 3,
    activity: 2,
};
function runTests() {
    const rainyScore = (0, scoring_1.calculatePlaceScore)(samplePlace, preferences, { isRainy: true, temperature: 22 }, []);
    strict_1.default.ok(rainyScore.penalties.includes("outdoor_in_rain"), "Expected rain penalty for outdoor place");
    strict_1.default.ok(rainyScore.total < 100, "Expected total score to be reduced by rain penalty");
    const budgetScore = (0, scoring_1.calculatePlaceScore)(samplePlace, preferences, { isRainy: false, temperature: 24 }, ["BUDGET_PRIORITY"]);
    strict_1.default.ok(budgetScore.penalties.includes("low_value_for_budget"), "Expected value penalty for budget priority");
    const activityMismatchScore = (0, scoring_1.calculatePlaceScore)({
        ...samplePlace,
        scores: { ...samplePlace.scores, activity: 5 },
    }, preferences, { isRainy: false, temperature: 24 }, []);
    strict_1.default.ok(activityMismatchScore.penalties.includes("activity_mismatch"), "Expected activity mismatch penalty");
    console.log("scoring tests passed");
}
runTests();
