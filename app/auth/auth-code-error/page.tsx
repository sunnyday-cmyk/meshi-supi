import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="title-font text-3xl text-pink">ログインに失敗しました</h1>
      <p className="text-sm text-slate-200">Google 認証を完了できませんでした。もう一度お試しください。</p>
      <Link href="/session/new" className="rounded-xl4 bg-yellow px-6 py-3 font-bold text-navy">
        条件入力へ戻る
      </Link>
    </main>
  );
}
