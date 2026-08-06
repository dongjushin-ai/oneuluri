"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CourseRequest } from "@/types/course";

interface MockCourseCardData {
  id: "shortest" | "mood" | "photo";
  title: string;
  subtitle: string;
  cost: string;
  travelTime: string;
  distance: string;
  stops: string[];
}

const mockCourses: MockCourseCardData[] = [
  {
    id: "shortest",
    title: "최단 동선 코스",
    subtitle: "시간을 아끼고 싶은 날",
    cost: "약 12만원",
    travelTime: "약 45분",
    distance: "약 3.4km",
    stops: ["성수 카페", "로컬 레스토랑", "북카페", "강변 산책"],
  },
  {
    id: "mood",
    title: "분위기 중심 코스",
    subtitle: "감성적인 데이트에 딱",
    cost: "약 18만원",
    travelTime: "약 60분",
    distance: "약 4.2km",
    stops: ["감성 카페", "작은 전시 공간", "디저트 바", "야경 포인트"],
  },
  {
    id: "photo",
    title: "사진 중심 코스",
    subtitle: "인스타 감성 채우기",
    cost: "약 20만원",
    travelTime: "약 70분",
    distance: "약 5.1km",
    stops: ["포토 스팟", "베이커리", "루프탑 카페", "야간 조명 거리"],
  },
];

export default function ResultsPage() {
  const [request] = useState<CourseRequest | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const stored = window.sessionStorage.getItem("course-request");
    return stored ? (JSON.parse(stored) as CourseRequest) : null;
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,191,167,0.35),_transparent_40%),linear-gradient(135deg,_#fff7f2_0%,_#fffdfb_100%)] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <main className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-orange-600">임시 결과 화면</p>
            <h1 className="text-3xl font-semibold text-slate-900">오늘의 코스 후보</h1>
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
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          {mockCourses.map((course) => (
            <Link key={course.id} href={`/results/${course.id}`} className="block">
              <Card className="h-full border-orange-100 bg-white/90 shadow-[0_16px_40px_-20px_rgba(251,146,60,0.35)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(251,146,60,0.45)]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-slate-900">{course.title}</CardTitle>
                  <CardDescription className="text-sm text-slate-600">{course.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>예상 총 비용</span>
                      <span className="font-semibold text-slate-900">{course.cost}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>총 이동 시간</span>
                      <span className="font-semibold text-slate-900">{course.travelTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>총 거리</span>
                      <span className="font-semibold text-slate-900">{course.distance}</span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">타임라인</p>
                    <ol className="space-y-2">
                      {course.stops.map((stop, index) => (
                        <li key={stop} className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                            {index + 1}
                          </span>
                          {stop}
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
      </main>
    </div>
  );
}
