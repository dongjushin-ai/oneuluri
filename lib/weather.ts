const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const SEONGSU_LATITUDE = 37.5445;
const SEONGSU_LONGITUDE = 127.056;
const DEFAULT_TIMEOUT_MS = 5_000;

export interface WeatherData {
  isRainy: boolean;
  precipitationProbability: number;
  sunsetTime: string;
  temperature: number;
  isFallback: boolean;
}

export interface WeatherRequest {
  date: string;
  startTime: string;
  endTime: string;
}

interface OpenMeteoResponse {
  hourly?: {
    time?: string[];
    precipitation_probability?: number[];
    temperature_2m?: number[];
  };
  daily?: {
    time?: string[];
    sunset?: string[];
  };
}

export function getFallbackWeather(): WeatherData {
  return {
    isRainy: false,
    precipitationProbability: 0,
    sunsetTime: "19:15",
    temperature: 22,
    isFallback: true,
  };
}

function hourValue(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function parseWeatherResponse(payload: OpenMeteoResponse, request: WeatherRequest): WeatherData {
  const times = payload.hourly?.time;
  const precipitation = payload.hourly?.precipitation_probability;
  const temperatures = payload.hourly?.temperature_2m;
  const sunsetIndex = payload.daily?.time?.indexOf(request.date) ?? -1;
  const sunset = sunsetIndex >= 0 ? payload.daily?.sunset?.[sunsetIndex] : undefined;

  if (!times || !precipitation || !temperatures || !sunset) {
    throw new Error("Incomplete Open-Meteo response");
  }

  const start = hourValue(request.startTime);
  const end = hourValue(request.endTime);
  const selectedIndexes = times.reduce<number[]>((indexes, timestamp, index) => {
    const [date, time] = timestamp.split("T");
    const minutes = hourValue(time);
    if (date === request.date && minutes >= start && minutes <= end) {
      indexes.push(index);
    }
    return indexes;
  }, []);

  if (selectedIndexes.length === 0) {
    throw new Error("No hourly weather data for selected time");
  }

  const precipitationProbability = Math.round(
    Math.max(...selectedIndexes.map((index) => precipitation[index] ?? 0)),
  );
  const temperature = Math.round(temperatures[selectedIndexes[0]]);

  if (!Number.isFinite(temperature)) {
    throw new Error("Invalid temperature data");
  }

  return {
    isRainy: precipitationProbability > 50,
    precipitationProbability,
    sunsetTime: sunset.slice(11, 16),
    temperature,
    isFallback: false,
  };
}

export async function fetchWeather(
  request: WeatherRequest,
  options: { fetcher?: typeof fetch; timeoutMs?: number } = {},
): Promise<WeatherData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      latitude: String(SEONGSU_LATITUDE),
      longitude: String(SEONGSU_LONGITUDE),
      hourly: "temperature_2m,precipitation_probability",
      daily: "sunset",
      timezone: "Asia/Seoul",
      start_date: request.date,
      end_date: request.date,
    });
    const response = await (options.fetcher ?? fetch)(`${OPEN_METEO_URL}?${params}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Open-Meteo returned ${response.status}`);
    }
    return parseWeatherResponse((await response.json()) as OpenMeteoResponse, request);
  } catch {
    return getFallbackWeather();
  } finally {
    clearTimeout(timeout);
  }
}
