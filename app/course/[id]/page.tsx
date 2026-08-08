import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CourseMap from "@/components/map/CourseMap";
import { getSharedCourse, type SharedCourse } from "@/lib/supabase/shared-courses";

function formatCurrency(value: number): string {
  return `${value.toLocaleString()}원`;
}

function courseTitle(type: SharedCourse["courseType"]): string {
  if (type === "MOOD") return "분위기 중심 코스";
  if (type === "PHOTO") return "사진 중심 코스";
  return "최단 동선 코스";
}

function courseDescription(shared: SharedCourse): string {
  const placeNames = shared.course.stops.map((stop) => stop.place.name).join(" → ");
  return `${shared.request.location}에서 즐기는 ${placeNames} 코스를 확인해 보세요.`;
}

async function loadSharedCourse(id: string): Promise<SharedCourse | null> {
  try {
    return await getSharedCourse(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shared = await loadSharedCourse(id);
  const title = shared ? `${courseTitle(shared.courseType)} | 오늘우리` : "공유 코스 | 오늘우리";
  const description = shared
    ? courseDescription(shared)
    : "성수동 맞춤 데이트 코스를 확인해 보세요.";

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

function UnavailableSharedCourse() {
  return (
    <Card className="border-orange-100 bg-white/90">
      <CardHeader>
        <CardTitle>공유 코스를 불러올 수 없습니다.</CardTitle>
        <CardDescription>링크가 올바르지 않거나 만료되었을 수 있습니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/">
          <Button variant="outline" className="border-orange-200 bg-white hover:bg-orange-50">새 코스 만들기</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function SharedCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shared = await loadSharedCourse(id);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,191,167,0.35),_transparent_40%),linear-gradient(135deg,_#fff7f2_0%,_#fffdfb_100%)] px-4 py-5 text-slate-800 sm:px-6 sm:py-8 lg:px-8">
      <main className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">공유된 코스</Badge>
            <h1 className="mt-2 break-words text-2xl font-semibold text-slate-900 sm:text-3xl">
              {shared ? courseTitle(shared.courseType) : "공유 코스"}
            </h1>
          </div>
          <Link href="/"><Button variant="outline" className="border-orange-200 bg-white hover:bg-orange-50">내 코스 만들기</Button></Link>
        </div>

        {!shared ? <UnavailableSharedCourse /> : (
          <>
            <Card className="border-orange-100 bg-white/90 shadow-[0_20px_60px_-25px_rgba(251,146,60,0.35)]">
              <CardHeader>
                <CardTitle className="break-words text-lg sm:text-xl">{shared.course.stops.map((stop) => stop.place.name).join(" → ")}</CardTitle>
                <CardDescription>
                  {shared.request.date} · {shared.request.start_time} ~ {shared.request.end_time} · {shared.request.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="min-w-0 space-y-3">
                  <h2 className="text-sm font-semibold text-slate-700">타임라인</h2>
                  {shared.course.stops.map((stop, index) => (
                    <article key={`${stop.place.id}-${stop.arrivalTime}`} className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{index + 1}. {stop.place.name}</p>
                        <p className="text-sm text-orange-700">{stop.arrivalTime} ~ {stop.departureTime}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{stop.place.address}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-white px-2.5 py-1">{stop.place.category}</span>
                        <span className="rounded-full bg-white px-2.5 py-1">예상 비용 {formatCurrency(stop.place.avg_price)}</span>
                        <span className="rounded-full bg-white px-2.5 py-1">{index === 0 ? "출발" : `이동 ${stop.travelMinutesFromPrevious}분`}</span>
                      </div>
                    </article>
                  ))}
                </section>

                <aside className="min-w-0 space-y-4">
                  <div className="rounded-2xl border border-orange-100 bg-white p-4">
                    <h2 className="text-sm font-semibold text-slate-700">코스 요약</h2>
                    <dl className="mt-3 space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between"><dt>예상 총 비용</dt><dd className="font-semibold text-slate-900">{formatCurrency(shared.course.totalCost)}</dd></div>
                      <div className="flex justify-between"><dt>총 이동 시간</dt><dd className="font-semibold text-slate-900">{shared.course.totalTravelMinutes}분</dd></div>
                      <div className="flex justify-between"><dt>총 거리</dt><dd className="font-semibold text-slate-900">{shared.course.totalDistanceKm.toFixed(1)}km</dd></div>
                    </dl>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-white p-4">
                    <h2 className="text-sm font-semibold text-slate-700">추천 이유</h2>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {shared.course.reasons.map((reason) => <li key={reason} className="rounded-xl bg-orange-50/60 px-3 py-2">{reason}</li>)}
                    </ul>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white p-4">
                    <h2 className="mb-3 text-sm font-semibold text-slate-700">코스 지도</h2>
                    <CourseMap stops={shared.course.stops} />
                    <p className="mt-3 text-xs text-slate-500">현재 연결선은 코스 순서를 나타내며 실제 도보 경로와 다를 수 있습니다.</p>
                  </div>
                </aside>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
