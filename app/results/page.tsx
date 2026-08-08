"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { seongsuPlaces } from "@/data/places";
import { generateCourses, resolveMainPlace, type GeneratedCourse } from "@/lib/course-generator";
import type { CourseRequest } from "@/types/course";
import { fetchWeather, getFallbackWeather, type WeatherData } from "@/lib/weather";
import { getPlacesWithFallback, type PlaceLoadResult } from "@/lib/supabase/places";
import type { Place } from "@/types/place";

const courseTypeMeta: Record<GeneratedCourse["type"], { title: string; subtitle: string }> = {
  SHORTEST: {
    title: "최단 동선 코스",
    subtitle: "시간을 아끼고 싶은 날",
  },
  MOOD: {
    title: "분위기 중심 코스",
    subtitle: "감성적인 데이트에 딱",
  },
  PHOTO: {
    title: "사진 중심 코스",
    subtitle: "인스타 감성 채우기",
  },
};

function formatCurrency(value: number): string {
  return `${value.toLocaleString()}원`;
}

function formatDuration(value: number): string {
  return `${value}분`;
}

function formatDistance(value: number): string {
  return `${value.toFixed(1)}km`;
}

const subscribeToHydration = () => () => undefined;

export default function ResultsPage() {
  const hasHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const request = useMemo(() => {
    if (!hasHydrated) return null;
    try {
      const storedRequest = window.sessionStorage.getItem("course-request");
      return storedRequest ? (JSON.parse(storedRequest) as CourseRequest) : null;
    } catch {
      return null;
    }
  }, [hasHydrated]);
  const [courses, setCourses] = useState<GeneratedCourse[]>([]);
  const [weather, setWeather] = useState<WeatherData>(getFallbackWeather);
  const [availablePlaces, setAvailablePlaces] = useState<Place[]>(seongsuPlaces);
  const [placeDataSource, setPlaceDataSource] = useState<PlaceLoadResult["source"] | null>(null);

  useEffect(() => {
    if (!request) {
      return;
    }

    let active = true;
    const weatherPromise = fetchWeather({
      date: request.date,
      startTime: request.start_time,
      endTime: request.end_time,
    });
    const placesPromise = getPlacesWithFallback().catch(
      (): PlaceLoadResult => ({
        places: seongsuPlaces,
        source: "LOCAL_FALLBACK",
        warning: "Unexpected place loading failure.",
      }),
    );

    void Promise.all([weatherPromise, placesPromise]).then(([weatherData, placeResult]) => {
      if (!active) {
        return;
      }
      const resolvedMainPlace = resolveMainPlace(
        request,
        weatherData,
        [],
        undefined,
        request.mainPlaceId,
        placeResult.places,
      );
      const result = generateCourses({
        request,
        weather: weatherData,
        places: placeResult.places,
        detailedOptions: [],
        selectedMainPlace: resolvedMainPlace,
        mainPlaceId: request.mainPlaceId,
      });
      setWeather(weatherData);
      setAvailablePlaces(placeResult.places);
      setPlaceDataSource(placeResult.source);
      setCourses(result.courses);
      window.sessionStorage.setItem("generated-courses", JSON.stringify(result.courses));
    });

    return () => {
      active = false;
    };
  }, [request]);

  const hasCourses = courses.length > 0;
  const isLoading = Boolean(request && placeDataSource === null && !hasCourses);
  const usesAutoFallback = Boolean(
    request &&
      (request.mainPlaceId === null || request.mainPlaceId.trim() === "" || !availablePlaces.some((place) => place.id === request.mainPlaceId))
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,191,167,0.35),_transparent_40%),linear-gradient(135deg,_#fff7f2_0%,_#fffdfb_100%)] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <main className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-orange-600">실제 코스 추천 결과</p>
            <h1 className="text-3xl font-semibold text-slate-900">오늘의 코스 후보</h1>
            <div className="mt-2 inline-flex rounded-full border border-orange-200 bg-white/90 px-3 py-1 text-xs text-slate-700 shadow-sm">
              {weather.isRainy ? "🌧️" : "🌤️"} 성수동 {weather.temperature}°C | 🌅 일몰 {weather.sunsetTime} | 강수확률 {weather.precipitationProbability}%
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-orange-200 bg-white text-slate-700 hover:bg-orange-50">
              플래너로 돌아가기
            </Button>
          </Link>
        </div>

        {request ? (
          <Card className="border-orange-100 bg-white/80 shadow-[0_20px_60px_-25px_rgba(244,114,182,0.35)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">
                선택한 조건
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                {request.date} · {request.start_time} ~ {request.end_time} · {request.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              예산: {request.budget} · 분위기: 인스타 감성 {request.preferences.sensibility}/5, 조용함 {request.preferences.quiet}/5
              {usesAutoFallback ? (
                <p className="mt-2 text-sm text-orange-600">
                  {request.mainPlaceId === null || request.mainPlaceId.trim() === ""
                    ? "선택 안 함으로 설정해 활동성 높은 장소를 기준으로 추천합니다."
                    : "선택한 메인 장소를 찾지 못해 활동성 높은 장소로 자동 선택해 추천합니다."}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <Card className="border-orange-100 bg-white/90">
            <CardContent className="py-8 text-center text-sm text-slate-600">날씨를 반영해 코스를 만들고 있어요…</CardContent>
          </Card>
        ) : hasCourses ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {courses.map((course) => (
              <Link key={course.id} href={`/results/${course.id}`} className="block">
                <Card className="h-full border-orange-100 bg-white/90 shadow-[0_16px_40px_-20px_rgba(251,146,60,0.35)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(251,146,60,0.45)]">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-slate-900">{courseTypeMeta[course.type].title}</CardTitle>
                    <CardDescription className="text-sm text-slate-600">{courseTypeMeta[course.type].subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 text-sm text-slate-700">
                      <div className="flex items-center justify-between">
                        <span>예상 총 비용</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(course.totalCost)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>총 이동 시간</span>
                        <span className="font-semibold text-slate-900">{formatDuration(course.totalTravelMinutes)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>총 거리</span>
                        <span className="font-semibold text-slate-900">{formatDistance(course.totalDistanceKm)}</span>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold text-slate-700">추천 이유</p>
                      <ul className="space-y-2">
                        {course.reasons.slice(0, 3).map((reason) => (
                          <li key={reason} className="rounded-full border border-orange-200 bg-white px-3 py-2 text-xs text-slate-600">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold text-slate-700">타임라인</p>
                      <ol className="space-y-2">
                        {course.stops.map((stop, index) => (
                          <li key={`${stop.place.id}-${stop.arrivalTime}`} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800">{stop.place.name}</p>
                              <p className="text-xs text-slate-500">
                                {stop.arrivalTime} ~ {stop.departureTime}
                                {stop.travelMinutesFromPrevious > 0 ? ` · 이동 ${stop.travelMinutesFromPrevious}분` : ""}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <Button variant="outline" className="w-full border-orange-200 bg-white text-slate-700 hover:bg-orange-50">
                      상세 일정 보기
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-orange-100 bg-white/90 shadow-[0_16px_40px_-20px_rgba(251,146,60,0.35)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">해당 조건에 맞는 코스를 찾을 수 없습니다.</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                해당 조건에 맞는 코스를 찾을 수 없습니다. 조건을 조금 완화해 주세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button variant="outline" className="border-orange-200 bg-white text-slate-700 hover:bg-orange-50">
                  조건 다시 설정하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        <footer className="border-t border-orange-100 pt-4 text-center text-xs text-slate-500">
          <p>
            날씨 데이터: Open-Meteo · 장소 데이터: {placeDataSource === "SUPABASE" ? "Supabase" : placeDataSource === "LOCAL_FALLBACK" ? "로컬 데이터" : "확인 중"}
          </p>
          {placeDataSource === "LOCAL_FALLBACK" ? (
            <p className="mt-1 text-amber-700">일부 장소 정보를 로컬 데이터로 불러왔습니다.</p>
          ) : null}
        </footer>
      </main>
    </div>
  );
}
