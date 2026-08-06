"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const distance_1 = require("./distance");
function runDistanceTests() {
    const samePointDistance = (0, distance_1.calculateDistanceKm)(37.544, 127.055, 37.544, 127.055);
    strict_1.default.equal(samePointDistance, 0, "Same point should return zero distance");
    const aroundSeongsuDistance = (0, distance_1.calculateDistanceKm)(37.544, 127.055, 37.548, 127.062);
    strict_1.default.ok(aroundSeongsuDistance > 0, "Different coordinates should return positive distance");
    const walkingMinutes = (0, distance_1.estimateTravelMinutes)(37.544, 127.055, 37.548, 127.062, "WALK");
    strict_1.default.ok(walkingMinutes >= 8, "Walking travel estimate should be at least the minimum");
    const transitMinutes = (0, distance_1.estimateTravelMinutes)(37.544, 127.055, 37.548, 127.062, "PUBLIC");
    strict_1.default.ok(transitMinutes >= 12, "Transit travel estimate should include overhead");
    console.log("distance tests passed");
}
runDistanceTests();
