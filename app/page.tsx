import { Suspense } from "react";
import HomeIntro from "@/components/HomeIntro";
import HomeClient from "./HomeClient";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-[390px] items-center justify-center px-4">
          <p className="text-slate-200">読み込み中...</p>
        </main>
      }
    >
      <HomeClient intro={<HomeIntro />} />
    </Suspense>
  );
}
