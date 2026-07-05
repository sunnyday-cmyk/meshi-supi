import { Suspense } from "react";
import NewSessionForm from "./NewSessionForm";

function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[390px] items-center justify-center px-4">
      <p className="text-slate-200">読み込み中...</p>
    </main>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewSessionForm />
    </Suspense>
  );
}
