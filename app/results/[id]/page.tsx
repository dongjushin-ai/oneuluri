"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const courseDetails = {
  shortest: {
    title: "최단 동선 코스",
    subtitle: "12:30 Brunch → 14:00 서울숲 → 16:00 Cafe → 18:20 Sunset Spot",
    summary: "효율적인 이동과 여유로운 시간을 함께 잡은 짧은 코스예요.",
    timeline: [
      { time: "12:30", title: "브런치", note: "가벼운 식사와 대화" },
      { time: "14:00", title: "서울숲 산책", note: "자연을 느끼며 천천히 이동" },
      { time: "16:00", title: "카페 휴식", note: "디저트와 커피로 쉬어가기" },
      { time: "18:20", title: "노을 포인트", note: "사진 촬영과 마무리" },
    ],
  },
  mood: {
    title: "분위기 중심 코스",
    subtitle: "14:00 전시 → 15:30 디저트 → 17:00 루프탑 → 19:00 야경",
    summary: "감성적인 공간과 조용한 분위기를 우선한 코스예요.",
    timeline: [
      { time: "14:00", title: "전시 공간", note: "아늑한 분위기에서 천천히 둘러보기" },
      { time: "15:30", title: "디저트 스팟", note: "달콤한 간식으로 리셋" },
      { time: "17:00", title: "루프탑 카페", note: "노을과 함께 쉬어가기" },
      { time: "19:00", title: "야경 산책", note: "분위기 있는 마무리" },
    ],
  },
  photo: {
    title: "사진 중심 코스",
    subtitle: "13:00 포토 스팟 → 15:00 베이커리 → 17:30 카페 → 20:00 야간 조명",
    summary: "인스타 감성을 채우는 포토 위주의 일정이에요.",
    timeline: [
      { time: "13:00", title: "포토 스팟", note: "포즈를 취하기 좋은 장소" },
      { time: "15:00", title: "베이커리 방문", note: "수다와 디저트 타임" },
      { time: "17:30", title: "카페", note: "조명 좋은 공간에서 휴식" },
      { time: "20:00", title: "야간 조명 거리", note: "마지막 장면을 남기기" },
    ],
  },
} as const;

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const course = courseDetails[params.id as keyof typeof courseDetails] ?? courseDetails.shortest;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,191,167,0.35),_transparent_40%),linear-gradient(135deg,_#fff7f2_0%,_#fffdfb_100%)] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <main className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-orange-600">상세 일정</p>
            <h1 className="text-3xl font-semibold text-slate-900">{course.title}</h1>
          </div>
          <Link href="/results">
            <Button variant="outline" className="border-orange-200 bg-white text-slate-700 hover:bg-orange-50">
              결과로 돌아가기
            </Button>
          </Link>
        </div>

        <Card className="border-orange-100 bg-white/90 shadow-[0_20px_60px_-25px_rgba(251,146,60,0.35)]">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">{course.subtitle}</CardTitle>
            <CardDescription className="text-sm text-slate-600">{course.summary}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                <p className="text-sm font-semibold text-slate-700">타임라인</p>
                <div className="mt-3 space-y-3">
                  {course.timeline.map((item) => (
                    <div key={item.time} className="rounded-xl border border-orange-100 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{item.time}</p>
                        <p className="text-sm text-orange-600">{item.title}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-100 bg-rose-50/70 p-4">
                <p className="text-sm font-semibold text-slate-700">지도 미리보기</p>
                <div className="mt-3 flex h-56 items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-white text-sm text-slate-500">
                  mock map container
                </div>
              </div>

              <Button className="w-full rounded-2xl bg-[#ff6f61] py-6 text-base font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-[#ff5b45]">
                🚨 여기서 일정 다시 짜기 (스마트 재조정)
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
