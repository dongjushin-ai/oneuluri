import HeroSection from "@/components/home/HeroSection";
import CoursePlannerForm from "@/components/planner/CoursePlannerForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,191,167,0.35),_transparent_40%),linear-gradient(135deg,_#fff7f2_0%,_#fffdfb_100%)] px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <main className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <HeroSection />
          <CoursePlannerForm />
        </section>
      </main>
    </div>
  );
}
