import assert from "node:assert/strict";
import { fetchWeather, parseWeatherResponse } from "./weather";

const request = { date: "2026-08-06", startTime: "18:00", endTime: "20:00" };

async function runTests(): Promise<void> {
  const parsed = parseWeatherResponse(
    {
      hourly: {
        time: ["2026-08-06T17:00", "2026-08-06T18:00", "2026-08-06T19:00", "2026-08-06T20:00"],
        precipitation_probability: [5, 10, 60, 30],
        temperature_2m: [25.1, 24.4, 23.8, 23.2],
      },
      daily: {
        time: ["2026-08-06"],
        sunset: ["2026-08-06T19:22"],
      },
    },
    request,
  );

  assert.equal(parsed.precipitationProbability, 60);
  assert.equal(parsed.isRainy, true);
  assert.equal(parsed.sunsetTime, "19:22");
  assert.equal(parsed.temperature, 24);
  assert.equal(parsed.isFallback, false);

  const fallback = await fetchWeather(request, {
    fetcher: async () => {
      throw new Error("network unavailable");
    },
  });
  assert.deepEqual(fallback, {
    isRainy: false,
    precipitationProbability: 0,
    sunsetTime: "19:15",
    temperature: 22,
    isFallback: true,
  });

  console.log("weather tests passed");
}

void runTests();
