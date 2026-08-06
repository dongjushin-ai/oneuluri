import type { CourseOption, CourseRequest, TransportationMode, UserPreferences } from "../types/course";
import type { Place } from "../types/place";
import { calculatePlaceScore, type DetailedOption, type WeatherContext } from "./scoring";
import { calculateDistanceKm, estimateTravelMinutes } from "./distance";
import { isPlaceOpenAt } from "./opening-hours";
import { mockPlaces } from "../data/places";

export interface CourseStop {
  place: Place;
  arrivalTime: string;
  departureTime: string;
  travelMinutesFromPrevious: number;
}

export interface GeneratedCourse extends CourseOption {
  id: string;
  type: "SHORTEST" | "MOOD" | "PHOTO";
  totalTimeMin: number;
  totalCost: number;
  totalDistanceKm: number;
  totalTravelMinutes: number;
  stops: CourseStop[];
  averagePreferenceScore: number;
  finalScore: number;
}

export interface CourseGenerationResult {
  courses: GeneratedCourse[];
  rejected: string[];
}

export interface ReplacementCandidate {
  place: Place;
  score: number;
}

interface BuildOptions {
  request: CourseRequest;
  weather: WeatherContext;
  detailedOptions: DetailedOption[];
  selectedMainPlace?: Place;
  mainPlaceId?: string | null;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map((value) => Number.parseInt(value, 10));
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const safeMinutes = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function getBudgetLimit(request: CourseRequest): number {
  switch (request.budget) {
    case "UNDER_10W":
      return 100000;
    case "10W_TO_20W":
      return 200000;
    default:
      return 300000;
  }
}

function buildDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map((value) => Number.parseInt(value, 10));
  const [hours, minutes] = time.split(":").map((value) => Number.parseInt(value, 10));
  return new Date(year, month - 1, day, hours, minutes);
}

function getPreferenceScore(place: Place, preferences: UserPreferences): number {
  return Math.round(
    (place.scores.romantic * (preferences.lovely / 5) +
      place.scores.instagram * (preferences.sensibility / 5) +
      place.scores.quiet * (preferences.quiet / 5) +
      place.scores.activity * (preferences.activity / 5)) /
      4,
  );
}

function candidateScore(place: Place, preferences: UserPreferences, weather: WeatherContext, detailedOptions: DetailedOption[]): number {
  return calculatePlaceScore(place, preferences, weather, detailedOptions).total;
}

function computeCourseScore(stops: CourseStop[], preferences: UserPreferences, weather: WeatherContext, detailedOptions: DetailedOption[]): number {
  const averagePreference = stops.reduce((sum, stop) => sum + getPreferenceScore(stop.place, preferences), 0) / stops.length;
  const placeScore = stops.reduce((sum, stop) => sum + candidateScore(stop.place, preferences, weather, detailedOptions), 0) / stops.length;
  return Math.round((averagePreference * 4 + placeScore) / 5);
}

function exceedsBudgetByMoreThan20Percent(totalCost: number, request: CourseRequest): boolean {
  const allowed = getBudgetLimit(request) * 1.2;
  return totalCost > allowed;
}

function isCourseWithinBudgetAndTime(course: GeneratedCourse, request: CourseRequest): boolean {
  return !exceedsBudgetByMoreThan20Percent(course.totalCost, request) && course.totalTimeMin <= parseTimeToMinutes(request.end_time) - parseTimeToMinutes(request.start_time);
}

function getBudgetLabel(request: CourseRequest): string {
  switch (request.budget) {
    case "UNDER_10W":
      return "10만원";
    case "10W_TO_20W":
      return "20만원";
    default:
      return "20만원 이상";
  }
}

function buildReasons(course: GeneratedCourse, request: CourseRequest, fixedPlace: Place): string[] {
  const reasons: string[] = [];
  reasons.push(`선택하신 ${fixedPlace.name}을 중심으로 동선을 최적화했어요`);

  if (course.totalDistanceKm <= 2.5) {
    reasons.push(`총 이동 거리 ${course.totalDistanceKm.toFixed(1)}km로 이동 부담이 적어요`);
  } else {
    reasons.push(`총 이동 거리 ${course.totalDistanceKm.toFixed(1)}km로 이동 경로를 충분히 고려했어요`);
  }

  reasons.push(`요청하신 예산(${getBudgetLabel(request)}) 내에서 알차게 구성되었어요`);
  reasons.push("브레이크 타임과 영업시간을 모두 확인했어요");

  if (request.preferences.sensibility >= 4 || course.type === "PHOTO") {
    reasons.push(`사진 촬영 선호도(${request.preferences.sensibility}점)를 높게 반영했어요`);
  } else if (request.preferences.quiet >= 4) {
    reasons.push(`조용한 분위기 선호도(${request.preferences.quiet}점)를 반영했어요`);
  } else if (request.preferences.activity >= 4) {
    reasons.push(`활동성 선호도(${request.preferences.activity}점)를 반영했어요`);
  } else {
    reasons.push(`선호도 점수 ${course.averagePreferenceScore}/5를 기준으로 만족도를 높였어요`);
  }

  return reasons.slice(0, 5);
}

function evaluateReplacementCandidate(
  candidate: Place,
  previousStop: Place,
  nextStop: Place,
  request: CourseRequest,
  weather: WeatherContext,
  detailedOptions: DetailedOption[],
  transportationMode: TransportationMode,
  currentCourse: GeneratedCourse,
  replacementIndex: number,
): number {
  const preferenceScore = getPreferenceScore(candidate, request.preferences);
  const previousTravel = estimateTravelMinutes(previousStop.lat, previousStop.lng, candidate.lat, candidate.lng, transportationMode);
  const nextTravel = estimateTravelMinutes(candidate.lat, candidate.lng, nextStop.lat, nextStop.lng, transportationMode);
  const distancePenalty = previousTravel + nextTravel;
  const budgetFit = currentCourse.totalCost + candidate.avg_price - currentCourse.stops[replacementIndex].place.avg_price;
  const budgetPenalty = exceedsBudgetByMoreThan20Percent(budgetFit, request) ? 2000 : 0;
  const score = preferenceScore * 10 + (100 - distancePenalty) + (100 - Math.max(0, budgetFit - getBudgetLimit(request))) / 10 + candidateScore(candidate, request.preferences, weather, detailedOptions);
  return score - budgetPenalty;
}

function buildCourseMetrics(
  course: GeneratedCourse,
  request: CourseRequest,
  weather: WeatherContext,
  detailedOptions: DetailedOption[],
  transportationMode: TransportationMode,
  fixedPlace: Place,
): GeneratedCourse {
  const recalculatedStops: CourseStop[] = [];
  let currentTime = parseTimeToMinutes(course.stops[0].arrivalTime);
  let previousPlace: Place | undefined;

  course.stops.forEach((stop, index) => {
    if (index === 0) {
      recalculatedStops.push({
        ...stop,
        departureTime: stop.departureTime,
      });
      previousPlace = stop.place;
      currentTime = parseTimeToMinutes(stop.departureTime);
      return;
    }

    const travelMinutes = estimateTravelMinutes(previousPlace!.lat, previousPlace!.lng, stop.place.lat, stop.place.lng, transportationMode);
    const arrivalMinutes = currentTime + travelMinutes;
    const arrivalTimeText = formatTime(arrivalMinutes);
    const departureMinutes = arrivalMinutes + stop.place.avg_stay_duration_min;
    const departureTimeText = formatTime(departureMinutes);

    recalculatedStops.push({
      ...stop,
      arrivalTime: arrivalTimeText,
      departureTime: departureTimeText,
      travelMinutesFromPrevious: travelMinutes,
    });
    previousPlace = stop.place;
    currentTime = departureMinutes;
  });

  const totalTravelMinutes = recalculatedStops.reduce((sum, stop, index) => sum + (index === 0 ? 0 : stop.travelMinutesFromPrevious), 0);
  const totalCost = recalculatedStops.reduce((sum, stop) => sum + stop.place.avg_price, 0);
  const totalDistanceKm = recalculatedStops.reduce((sum, stop, index) => {
    if (index === 0) {
      return sum;
    }
    return sum + calculateDistanceKm(recalculatedStops[index - 1].place.lat, recalculatedStops[index - 1].place.lng, stop.place.lat, stop.place.lng);
  }, 0);

  const nextCourse: GeneratedCourse = {
    ...course,
    stops: recalculatedStops,
    totalCost,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalTravelMinutes,
    totalTimeMin: parseTimeToMinutes(recalculatedStops[recalculatedStops.length - 1].departureTime) - parseTimeToMinutes(recalculatedStops[0].arrivalTime),
    averagePreferenceScore: Math.round(
      recalculatedStops.reduce((sum, stop) => sum + getPreferenceScore(stop.place, request.preferences), 0) / recalculatedStops.length,
    ),
    finalScore: computeCourseScore(recalculatedStops, request.preferences, weather, detailedOptions),
    reasons: [],
  };
  nextCourse.reasons = buildReasons(nextCourse, request, fixedPlace);
  return nextCourse;
}

export function resolveMainPlace(
  request: CourseRequest,
  weather: WeatherContext,
  detailedOptions: DetailedOption[],
  selectedMainPlace?: Place,
  mainPlaceId?: string | null,
): Place {
  if (selectedMainPlace) {
    return selectedMainPlace;
  }

  const normalizedMainPlaceId = mainPlaceId?.trim();
  if (normalizedMainPlaceId) {
    const matchedPlace = mockPlaces.find((place) => place.id === normalizedMainPlaceId);
    if (matchedPlace) {
      return matchedPlace;
    }
  }

  const fallbackActivities = mockPlaces
    .filter((place) => place.category === "ACTIVITY")
    .sort((left, right) => {
      const leftScore = candidateScore(left, request.preferences, weather, detailedOptions);
      const rightScore = candidateScore(right, request.preferences, weather, detailedOptions);
      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }
      return left.id.localeCompare(right.id);
    });

  return fallbackActivities[0] ?? mockPlaces[0];
}

export function getReplacementCandidates(
  course: GeneratedCourse,
  request: CourseRequest,
  weather: WeatherContext,
  detailedOptions: DetailedOption[],
  index: number,
  selectedMainPlace?: Place,
  mainPlaceId?: string | null,
): ReplacementCandidate[] {
  const fixedPlace = resolveMainPlace(request, weather, detailedOptions, selectedMainPlace, mainPlaceId);
  if (index <= 0 || index >= course.stops.length) {
    return [];
  }

  const targetStop = course.stops[index];
  const previousStop = course.stops[index - 1];
  const nextStop = course.stops[index + 1] ?? course.stops[index - 1];
  const currentCategory = targetStop.place.category;
  const usedIds = new Set(course.stops.map((stop) => stop.place.id));
  const transportationMode: TransportationMode = request.transportation_mode === "PUBLIC" ? "PUBLIC" : request.transportation_mode === "CAR" ? "CAR" : "WALK";

  const candidates = mockPlaces
    .filter((place) => place.category === currentCategory)
    .filter((place) => !usedIds.has(place.id))
    .filter((place) => place.id !== fixedPlace.id)
    .filter((place) => {
      const arrivalMinutes = parseTimeToMinutes(previousStop.departureTime) + estimateTravelMinutes(previousStop.place.lat, previousStop.place.lng, place.lat, place.lng, transportationMode);
      const arrivalDate = buildDateTime(request.date, formatTime(arrivalMinutes));
      return isPlaceOpenAt(place.opening_hours, arrivalDate);
    })
    .filter((place) => {
      const arrivalMinutes = parseTimeToMinutes(previousStop.departureTime) + estimateTravelMinutes(previousStop.place.lat, previousStop.place.lng, place.lat, place.lng, transportationMode);
      const departureMinutes = arrivalMinutes + place.avg_stay_duration_min;
      const nextArrivalMinutes = departureMinutes + estimateTravelMinutes(place.lat, place.lng, nextStop.place.lat, nextStop.place.lng, transportationMode);
      return nextArrivalMinutes <= parseTimeToMinutes(request.end_time);
    })
    .filter((place) => {
      const replacementCost = course.totalCost + place.avg_price - targetStop.place.avg_price;
      return !exceedsBudgetByMoreThan20Percent(replacementCost, request);
    })
    .map((place) => ({
      place,
      score: evaluateReplacementCandidate(
        place,
        previousStop.place,
        nextStop.place,
        request,
        weather,
        detailedOptions,
        transportationMode,
        course,
        index,
      ),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  return candidates;
}

export function replaceCourseStop(
  course: GeneratedCourse,
  request: CourseRequest,
  weather: WeatherContext,
  detailedOptions: DetailedOption[],
  index: number,
  replacementPlace: Place,
  selectedMainPlace?: Place,
  mainPlaceId?: string | null,
): GeneratedCourse | null {
  const fixedPlace = resolveMainPlace(request, weather, detailedOptions, selectedMainPlace, mainPlaceId);
  if (index <= 0 || index >= course.stops.length) {
    return null;
  }

  if (course.stops[index].place.id === fixedPlace.id) {
    return null;
  }

  const usedIds = new Set(course.stops.map((stop) => stop.place.id));
  if (usedIds.has(replacementPlace.id) && replacementPlace.id !== course.stops[index].place.id) {
    return null;
  }

  const nextCourse = {
    ...course,
    stops: course.stops.map((stop, stopIndex) => {
      if (stopIndex !== index) {
        return stop;
      }
      return {
        ...stop,
        place: replacementPlace,
      };
    }),
  };

  return buildCourseMetrics(nextCourse, request, weather, detailedOptions, request.transportation_mode === "PUBLIC" ? "PUBLIC" : request.transportation_mode === "CAR" ? "CAR" : "WALK", fixedPlace);
}

export function generateCourses(options: BuildOptions): CourseGenerationResult {
  const { request, weather, detailedOptions, selectedMainPlace, mainPlaceId } = options;
  const startMinutes = parseTimeToMinutes(request.start_time);
  const endMinutes = parseTimeToMinutes(request.end_time);
  const transportationMode: TransportationMode = request.transportation_mode === "PUBLIC" ? "PUBLIC" : request.transportation_mode === "CAR" ? "CAR" : "WALK";

  const fixedPlace = resolveMainPlace(request, weather, detailedOptions, selectedMainPlace, mainPlaceId);
  const restaurants = mockPlaces.filter((place) => place.category === "RESTAURANT");
  const activities = mockPlaces.filter((place) => place.category === "ACTIVITY");
  const cafes = mockPlaces.filter((place) => place.category === "CAFE");
  const photoSpots = mockPlaces.filter((place) => place.category === "PHOTO_SPOT");

  const baseStops = [
    { category: "RESTAURANT", pick: restaurants },
    { category: "ACTIVITY", pick: activities },
    { category: "CAFE", pick: cafes },
    { category: "PHOTO_SPOT", pick: photoSpots },
  ] as const;

  const candidates: GeneratedCourse[] = [];
  const rejected: string[] = [];

  const buildCourse = (type: GeneratedCourse["type"], categoryOrder: Array<Place["category"]>, seed: number): GeneratedCourse | null => {
    const fullStops: CourseStop[] = [];
    let currentTime = startMinutes;
    let currentLat = fixedPlace.lat;
    let currentLng = fixedPlace.lng;
    let totalCost = 0;
    let totalDistanceKm = 0;
    let totalTravelMinutes = 0;

    const addStop = (place: Place, travelMinutes: number): boolean => {
      const arrivalTime = currentTime + travelMinutes;
      const arrivalDate = buildDateTime(request.date, formatTime(arrivalTime));
      if (!isPlaceOpenAt(place.opening_hours, arrivalDate)) {
        return false;
      }

      const stayDuration = place.avg_stay_duration_min;
      const departureTime = arrivalTime + stayDuration;
      if (departureTime > endMinutes) {
        return false;
      }

      fullStops.push({
        place,
        arrivalTime: formatTime(arrivalTime),
        departureTime: formatTime(departureTime),
        travelMinutesFromPrevious: travelMinutes,
      });
      currentTime = departureTime;
      totalCost += place.avg_price;
      totalDistanceKm += calculateDistanceKm(currentLat, currentLng, place.lat, place.lng);
      totalTravelMinutes += travelMinutes;
      currentLat = place.lat;
      currentLng = place.lng;
      return true;
    };

    const initialStop = fixedPlace;
    const initialArrivalDate = buildDateTime(request.date, request.start_time);
    if (!isPlaceOpenAt(initialStop.opening_hours, initialArrivalDate)) {
      return null;
    }

    const initialStay = Math.max(initialStop.avg_stay_duration_min, 45);
    const initialDeparture = startMinutes + initialStay;
    if (initialDeparture > endMinutes) {
      return null;
    }
    fullStops.push({
      place: initialStop,
      arrivalTime: request.start_time,
      departureTime: formatTime(initialDeparture),
      travelMinutesFromPrevious: 0,
    });
    currentTime = initialDeparture;
    totalCost += initialStop.avg_price;

    for (const category of categoryOrder) {
      const available = baseStops.find((item) => item.category === category)?.pick ?? [];
      const ranked = available
        .filter((place) => place.id !== fixedPlace.id)
        .sort((left, right) => {
          const leftScore = candidateScore(left, request.preferences, weather, detailedOptions);
          const rightScore = candidateScore(right, request.preferences, weather, detailedOptions);
          return rightScore - leftScore;
        });

      const chosen = ranked[seed % ranked.length] ?? ranked[0];
      if (!chosen) {
        continue;
      }

      const travelMinutes = estimateTravelMinutes(currentLat, currentLng, chosen.lat, chosen.lng, transportationMode);
      const added = addStop(chosen, travelMinutes);
      if (!added) {
        rejected.push(`unavailable:${chosen.id}`);
        continue;
      }
      if (currentTime > endMinutes) {
        return null;
      }
    }

    const course: GeneratedCourse = {
      id: `${type.toLowerCase()}-${seed}`,
      type,
      totalTimeMin: currentTime - startMinutes,
      totalCost,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalTravelMinutes,
      stops: fullStops,
      averagePreferenceScore: Math.round(
        fullStops.reduce((sum, stop) => sum + getPreferenceScore(stop.place, request.preferences), 0) / fullStops.length,
      ),
      finalScore: computeCourseScore(fullStops, request.preferences, weather, detailedOptions),
      reasons: [],
    };

    course.reasons = buildReasons(course, request, fixedPlace);

    return course;
  };

  const shortestCourse = buildCourse("SHORTEST", ["RESTAURANT", "CAFE", "PHOTO_SPOT"], 0);
  if (shortestCourse && isCourseWithinBudgetAndTime(shortestCourse, request)) {
    candidates.push(shortestCourse);
  }

  const moodCourse = buildCourse("MOOD", ["RESTAURANT", "ACTIVITY", "CAFE"], 1);
  if (moodCourse && isCourseWithinBudgetAndTime(moodCourse, request)) {
    candidates.push(moodCourse);
  }

  const photoCourse = buildCourse("PHOTO", ["RESTAURANT", "PHOTO_SPOT", "CAFE"], 2);
  if (photoCourse && isCourseWithinBudgetAndTime(photoCourse, request)) {
    candidates.push(photoCourse);
  }

  const distinctCourses = candidates.filter((course, index, all) => {
    const similar = all.findIndex((candidate) => candidate.type !== course.type && candidate.stops.map((stop) => stop.place.id).join("") === course.stops.map((stop) => stop.place.id).join(""));
    return similar < 0 || course.type === "SHORTEST" || course.type === "MOOD" || course.type === "PHOTO";
  });

  return {
    courses: distinctCourses.filter((course) => course.totalCost <= getBudgetLimit(request)).slice(0, 3),
    rejected,
  };
}
