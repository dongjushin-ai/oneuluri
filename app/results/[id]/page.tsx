"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getReplacementCandidates, replaceCourseStop } from "@/lib/course-generator";
import type { GeneratedCourse } from "@/lib/course-generator";
import type { CourseRequest } from "@/types/course";
import type { Place } from "@/types/place";

function formatCurrency(value: number): string {
  return `${value.toLocaleString()}원`;
}

function formatDuration(value: number): string {
  return `${value}분`;
}

function formatDistance(value: number): string {
  return `${value.toFixed(1)}km`;
}

function getCourseTitle(course: GeneratedCourse): string {
  switch (course.type) {
    case "MOOD":
      return "분위기 중심 코스";
    case "PHOTO":
      return "사진 중심 코스";
    default:
      return "최단 동선 코스";
  }
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const [request] = useState<CourseRequest | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedRequest = window.sessionStorage.getItem("course-request");
    return storedRequest ? (JSON.parse(storedRequest) as CourseRequest) : null;
  });
  const [courses, setCourses] = useState<GeneratedCourse[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const storedCourses = window.sessionStorage.getItem("generated-courses");
    return storedCourses ? (JSON.parse(storedCourses) as GeneratedCourse[]) : [];
  });
  const [activeReplacementIndex, setActiveReplacementIndex] = useState<number | null>(null);
  const [replacementCandidates, setReplacementCandidates] = useState<Place[]>([]);

  const selectedCourse = useMemo(() => {
    if (!courses.length) {
      return null;
    }
    return courses.find((course) => course.id === params.id) ?? courses[0];
  }, [courses, params.id]);

  const handleReplaceStop = (index: number) => {
    if (!selectedCourse || !request) {
      return;
    }

    const candidates = getReplacementCandidates(selectedCourse, request, { isRainy: false, temperature: 24 }, [], index, undefined, request.mainPlaceId);
    setActiveReplacementIndex(index);
    setReplacementCandidates(candidates.map((candidate) => candidate.place));
  };

  const applyReplacement = (index: number, replacementPlace: Place) => {
    if (!selectedCourse || !request) {
      return;
    }

    const updatedCourse = replaceCourseStop(selectedCourse, request, { isRainy: false, temperature: 24 }, [], index, replacementPlace, undefined, request.mainPlaceId);
    if (!updatedCourse) {
      return;
    }

    const nextCourses = courses.map((course) => (course.id === selectedCourse.id ? updatedCourse : course));
    setCourses(nextCourses);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("generated-courses", JSON.stringify(nextCourses));
    }
    setActiveReplacementIndex(null);
    setReplacementCandidates([]);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,191,167,0.35),_transparent_40%),linear-gradient(135deg,_#fff7f2_0%,_#fffdfb_100%)] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <main className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-orange-600">상세 일정</p>
            <h1 className="text-3xl font-semibold text-slate-900">{selectedCourse ? getCourseTitle(selectedCourse) : "코스 상세"}</h1>
          </div>
          <Link href="/results">
            <Button variant="outline" className="border-orange-200 bg-white text-slate-700 hover:bg-orange-50">
              결과로 돌아가기
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
          </Card>
        ) : null}

        {selectedCourse ? (
          <Card className="border-orange-100 bg-white/90 shadow-[0_20px_60px_-25px_rgba(251,146,60,0.35)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">
                {selectedCourse.stops.map((stop) => stop.place.name).join(" → ")}
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                총 {selectedCourse.stops.length}개 장소 · 이동 {selectedCourse.totalTravelMinutes}분 · 거리 {formatDistance(selectedCourse.totalDistanceKm)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                  <p className="text-sm font-semibold text-slate-700">타임라인</p>
                  <div className="mt-3 space-y-3">
                    {selectedCourse.stops.map((stop, index) => (
                      <div key={`${stop.place.id}-${stop.arrivalTime}`} className="rounded-xl border border-orange-100 bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{stop.arrivalTime} ~ {stop.departureTime}</p>
                          <p className="text-sm text-orange-600">{index + 1}. {stop.place.name}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-orange-100 px-2.5 py-1">예상 비용 {formatCurrency(stop.place.avg_price)}</span>
                          <span className="rounded-full bg-orange-100 px-2.5 py-1">
                            {index === 0 ? "출발" : `이동 ${stop.travelMinutesFromPrevious}분`}
                          </span>
                          <span className="rounded-full bg-orange-100 px-2.5 py-1">점수 {stop.place.scores.photo}/5</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{stop.place.address}</p>
                        {index > 0 ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-orange-200 bg-white text-slate-700 hover:bg-orange-50"
                              onClick={() => handleReplaceStop(index)}
                            >
                              장소 바꾸기
                            </Button>
                            {activeReplacementIndex === index && replacementCandidates.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {replacementCandidates.map((candidate) => (
                                  <Button
                                    key={candidate.id}
                                    type="button"
                                    size="sm"
                                    className="bg-orange-500 text-white hover:bg-orange-600"
                                    onClick={() => applyReplacement(index, candidate)}
                                  >
                                    {candidate.name}
                                  </Button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-orange-100 bg-rose-50/70 p-4">
                  <p className="text-sm font-semibold text-slate-700">이 코스를 추천한 이유</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {selectedCourse.reasons.map((reason) => (
                      <li key={reason} className="rounded-xl border border-orange-100 bg-white px-3 py-2">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-rose-50/70 p-4">
                  <p className="text-sm font-semibold text-slate-700">코스 요약</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>예상 총 비용</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(selectedCourse.totalCost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>총 이동 시간</span>
                      <span className="font-semibold text-slate-900">{formatDuration(selectedCourse.totalTravelMinutes)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>총 거리</span>
                      <span className="font-semibold text-slate-900">{formatDistance(selectedCourse.totalDistanceKm)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>선호도 점수</span>
                      <span className="font-semibold text-slate-900">{selectedCourse.averagePreferenceScore}/5</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-700">지도 미리보기</p>
                  <div className="mt-3 flex h-56 items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 text-sm text-slate-500">
                    mock map container
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger className="w-full rounded-2xl bg-[#ff6f61] py-6 text-base font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-[#ff5b45]">
                    🚨 여기서 일정 다시 짜기 (스마트 재조정)
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>스마트 재조정</DialogTitle>
                      <DialogDescription>
                        현재 선택된 코스 기준으로 일정 다시 짜기를 준비해요.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>선택된 코스: {getCourseTitle(selectedCourse)}</p>
                      <p>총 {selectedCourse.stops.length}개 장소 · 예상 비용 {formatCurrency(selectedCourse.totalCost)}</p>
                      <p>다음으로 추천되는 흐름은 현재 타임라인을 바탕으로 다시 조정됩니다.</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-orange-100 bg-white/90 shadow-[0_16px_40px_-20px_rgba(251,146,60,0.35)]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">코스를 불러올 수 없습니다.</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                결과 페이지에서 다시 코스를 생성한 뒤 다시 시도해 주세요.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>
    </div>
  );
}
