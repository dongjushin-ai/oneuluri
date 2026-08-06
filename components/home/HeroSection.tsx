export default function HeroSection() {
  return (
    <div className="rounded-[32px] border border-orange-100 bg-white/80 p-8 shadow-[0_20px_60px_-25px_rgba(244,114,182,0.35)] backdrop-blur sm:p-10">
      <div className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
        ✨ 오늘의 감성 큐레이션
      </div>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        오늘, 우리 뭐하지?
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
        성수동에서 오늘의 분위기와 예산에 맞춘 데이트 코스를 미리 짜보세요.
      </p>

      <div className="mt-8 space-y-3">
        <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
          <p className="text-sm font-medium text-orange-700">샘플 타임라인 미리보기</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <span className="rounded-full bg-white px-3 py-1">12:30 Brunch</span>
            <span className="text-slate-400">→</span>
            <span className="rounded-full bg-white px-3 py-1">14:00 서울숲</span>
            <span className="text-slate-400">→</span>
            <span className="rounded-full bg-white px-3 py-1">16:00 Cafe</span>
            <span className="text-slate-400">→</span>
            <span className="rounded-full bg-white px-3 py-1">18:20 Sunset Spot</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
            <p className="text-sm font-medium text-rose-700">추천 포인트</p>
            <p className="mt-1 text-sm text-slate-600">감성적인 카페부터 가볍게 산책까지</p>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
            <p className="text-sm font-medium text-orange-700">예산 맞춤</p>
            <p className="mt-1 text-sm text-slate-600">예산 구간에 따라 자연스럽게 조정</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
            <p className="text-sm font-medium text-amber-700">분위기 조절</p>
            <p className="mt-1 text-sm text-slate-600">조용함부터 활동성까지 세밀하게</p>
          </div>
        </div>
      </div>
    </div>
  );
}
