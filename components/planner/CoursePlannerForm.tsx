"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BudgetSelector from "@/components/planner/BudgetSelector";
import PreferenceSlider from "@/components/planner/PreferenceSlider";
import type { BudgetRange, CourseRequest, PreferenceValue, TransportationMode, UserPreferences } from "@/types/course";

type PreferenceKey = "sensibility" | "quiet" | "activity" | "valueForMoney";

type PreferencesState = Record<PreferenceKey, number>;

const storageKey = "course-request";

const mainPlaceOptions = ["서울숲", "연무장길 팝업", "디뮤지엄", "성수카페거리", "선택 안함"] as const;
const transportationOptions = ["도보", "대중교통", "차량"] as const;
const detailOptionLabels = ["짧은 동선 우선", "대기시간 회피", "비 오는 날 실내 중심"] as const;

const preferenceItems: Array<{
  key: PreferenceKey;
  label: string;
  maxLabel: string;
}> = [
  { key: "sensibility", label: "인스타 감성", maxLabel: "강함" },
  { key: "quiet", label: "조용함", maxLabel: "조용" },
  { key: "activity", label: "활동성", maxLabel: "활발" },
  { key: "valueForMoney", label: "가성비", maxLabel: "좋음" },
];

function toBudgetRange(value: number): BudgetRange {
  if (value <= 100000) {
    return "UNDER_10W";
  }

  if (value <= 200000) {
    return "10W_TO_20W";
  }

  return "OVER_20W";
}

function toPreferenceValue(value: number): PreferenceValue {
  const clamped = Math.max(0, Math.min(5, Math.round(value)));
  return clamped as PreferenceValue;
}

export default function CoursePlannerForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [budget, setBudget] = useState<number>(100000);
  const [mainPlace, setMainPlace] = useState<(typeof mainPlaceOptions)[number]>("선택 안함");
  const [transportationMode, setTransportationMode] = useState<(typeof transportationOptions)[number]>("도보");
  const [detailOptions, setDetailOptions] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<PreferencesState>({
    sensibility: 3,
    quiet: 2,
    activity: 3,
    valueForMoney: 4,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!date || !startTime || !endTime) {
      setValidationError("날짜, 시작 시간, 종료 시간을 모두 입력해주세요.");
      return;
    }

    setValidationError(null);

    const request: CourseRequest = {
      location: "성수동",
      date,
      start_time: startTime,
      end_time: endTime,
      budget: toBudgetRange(budget),
      transportation_mode: (transportationMode === "도보"
        ? "WALK"
        : transportationMode === "대중교통"
          ? "PUBLIC"
          : "CAR") as TransportationMode,
      preferences: {
        lovely: toPreferenceValue(Math.round((preferences.sensibility + preferences.valueForMoney) / 2)),
        sensibility: toPreferenceValue(preferences.sensibility),
        quiet: toPreferenceValue(preferences.quiet),
        activity: toPreferenceValue(preferences.activity),
      } satisfies UserPreferences,
    };

    window.sessionStorage.setItem(storageKey, JSON.stringify(request));
    router.push("/results");
  };

  return (
    <Card className="border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 shadow-[0_20px_60px_-25px_rgba(251,146,60,0.35)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-semibold text-slate-900">
          오늘의 코스 만들기
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-600">
          시간, 예산, 분위기만 고르면 바로 추천해드릴게요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">장소</label>
              <div className="rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700">
                성수동
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">날짜</label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-0 focus:border-orange-400"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">시작 시간</label>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">종료 시간</label>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">2인 총예산 (Total for 2)</label>
            <BudgetSelector budget={budget} onSelect={setBudget} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">메인 장소</label>
              <select
                value={mainPlace}
                onChange={(event) => setMainPlace(event.target.value as (typeof mainPlaceOptions)[number])}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
              >
                {mainPlaceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">교통 수단</label>
              <select
                value={transportationMode}
                onChange={(event) => setTransportationMode(event.target.value as (typeof transportationOptions)[number])}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
              >
                {transportationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-orange-100 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-700">상세 옵션</p>
            <div className="flex flex-wrap gap-3">
              {detailOptionLabels.map((label) => {
                const checked = detailOptions.includes(label);
                return (
                  <label key={label} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setDetailOptions((current) =>
                          current.includes(label)
                            ? current.filter((item) => item !== label)
                            : [...current, label],
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </div>

          {validationError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {validationError}
            </p>
          ) : null}

          <div className="space-y-4 rounded-2xl border border-orange-100 bg-white/80 p-4">
            {preferenceItems.map((item) => (
              <PreferenceSlider
                key={item.key}
                label={item.label}
                value={preferences[item.key]}
                maxLabel={item.maxLabel}
                onChange={(value) =>
                  setPreferences((current) => ({
                    ...current,
                    [item.key]: value,
                  }))
                }
              />
            ))}
          </div>

          <Button
            type="submit"
            className="w-full rounded-2xl bg-[#ff6f61] py-6 text-base font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-[#ff5b45]"
          >
            ✨ 오늘의 코스 만들기
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
