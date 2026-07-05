"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { saveMemberIdentity } from "@/lib/session-store";
import { SessionConditions } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const stepLabels = ["条件入力", "候補取得", "招待", "投票開始"];
const genreOptions = ["すべて", "ラーメン", "寿司", "バーガー", "ピザ", "居酒屋", "カレー", "焼肉", "イタリアン"];
const transportOptions = [
  { id: "walk", label: "徒歩🚶" },
  { id: "bike", label: "自転車🚲" },
  { id: "car", label: "車🚗" },
  { id: "train", label: "電車🚃" }
];
const extraOptions = [
  "個室あり",
  "飲み放題",
  "禁煙",
  "駐車場",
  "深夜営業",
  "食べ放題",
  "ペットOK",
  "バリアフリー"
];

const PENDING_KEY = "meshispin-pending-form";

type PendingForm = SessionConditions;

export default function NewSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [genres, setGenres] = useState<string[]>(["すべて"]);
  const [budget, setBudget] = useState(2500);
  const [people, setPeople] = useState(6);
  const [transport, setTransport] = useState("walk");
  const [travelMinutes, setTravelMinutes] = useState(20);
  const [extras, setExtras] = useState<string[]>(["禁煙"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resumeAttempted = useRef(false);

  const conditions: SessionConditions = useMemo(
    () => ({
      genres,
      budget,
      people,
      transport,
      travelMinutes,
      extras
    }),
    [genres, budget, people, transport, travelMinutes, extras]
  );

  const toggleGenre = (g: string) => {
    setGenres((prev) => {
      if (g === "すべて") return ["すべて"];
      const withoutAll = prev.filter((x) => x !== "すべて");
      return withoutAll.includes(g) ? withoutAll.filter((x) => x !== g) : [...withoutAll, g];
    });
  };

  const toggleExtra = (e: string) => {
    setExtras((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  };

  const runSearchAndCreate = useCallback(async (override?: SessionConditions) => {
    const effective = override ?? conditions;
    setError(null);
    if (effective.genres.length === 0) {
      setError("ジャンルを1つ以上選んでください。");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        const pending: PendingForm = effective;
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
        const next = encodeURIComponent("/session/new?resume=1");
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${next}`
          }
        });
        return;
      }

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("位置情報が使えません。"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const res = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, conditions: effective })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "検索に失敗しました");
      }

      const places = data.places as Array<{
        placeId: string;
        name: string;
        rating?: number;
        priceLevel?: number;
        emoji?: string;
        lat?: number;
        lng?: number;
        vicinity?: string;
      }>;

      if (!places?.length) {
        throw new Error("近くにお店が見つかりませんでした。条件を変えて試してください。");
      }

      const candidates = places;
      const hostName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email?.split("@")[0] ??
        "ホスト";

      const { data: sessionRow, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          host_id: user.id,
          conditions: effective,
          candidates,
          status: "waiting"
        })
        .select("id")
        .single();

      if (sessionError || !sessionRow) {
        throw new Error(sessionError?.message ?? "セッション作成に失敗しました");
      }

      const sessionId = sessionRow.id as string;

      const { data: memberRow, error: memberError } = await supabase
        .from("members")
        .insert({
          session_id: sessionId,
          name: hostName,
          is_host: true
        })
        .select("id")
        .single();

      if (memberError || !memberRow) {
        throw new Error(memberError?.message ?? "ホスト登録に失敗しました");
      }

      saveMemberIdentity(sessionId, {
        memberId: memberRow.id as string,
        name: hostName,
        isHost: true
      });

      sessionStorage.removeItem(PENDING_KEY);
      router.push(`/session/${sessionId}/invite`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [conditions, router]);

  useEffect(() => {
    if (resumeAttempted.current) return;
    if (searchParams.get("resume") !== "1") return;
    resumeAttempted.current = true;

    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) {
      return;
    }

    let restored: SessionConditions | null = null;
    try {
      const pending = JSON.parse(raw) as Partial<PendingForm>;
      restored = {
        genres: pending.genres?.length ? pending.genres : ["すべて"],
        budget: pending.budget ?? 2500,
        people: pending.people ?? 6,
        transport: pending.transport ?? "walk",
        travelMinutes: pending.travelMinutes ?? 20,
        extras: pending.extras ?? []
      };
      setGenres(restored.genres);
      setBudget(restored.budget);
      setPeople(restored.people);
      setTransport(restored.transport);
      setTravelMinutes(restored.travelMinutes);
      setExtras(restored.extras);
    } catch {
      return;
    }

    if (restored) {
      void runSearchAndCreate(restored);
    }
  }, [searchParams, runSearchAndCreate]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[390px] px-4 pb-10 pt-6">
      <h1 className="title-font mb-4 text-center text-4xl text-yellow">条件をセット！</h1>

      <div className="mb-6 flex items-center justify-between gap-2">
        {stepLabels.map((label, index) => (
          <div key={label} className="flex w-full flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                index === 0 ? "bg-yellow text-navy" : "bg-white/15 text-white"
              }`}
            >
              {index + 1}
            </div>
            <p className="text-[10px] text-slate-200">{label}</p>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mb-4 rounded-xl2 border border-pink/50 bg-pink/10 px-3 py-2 text-sm text-pink">{error}</p>
      ) : null}

      <section className="mb-4 rounded-xl4 bg-white/10 p-4">
        <h2 className="mb-3 text-lg font-extrabold text-teal">ジャンル選択</h2>
        <div className="flex flex-wrap gap-2">
          {genreOptions.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`rounded-full px-3 py-2 text-sm font-bold ${
                genres.includes(genre) ? "bg-teal text-navy" : "bg-white/10 text-white"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-xl4 bg-white/10 p-4">
        <h2 className="mb-3 text-lg font-extrabold text-orange">予算</h2>
        <p className="mb-2 text-sm text-slate-200">¥{budget.toLocaleString()}</p>
        <input
          type="range"
          min={500}
          max={10000}
          step={500}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full accent-orange"
        />
      </section>

      <section className="mb-4 rounded-xl4 bg-white/10 p-4">
        <h2 className="mb-3 text-lg font-extrabold text-pink">人数</h2>
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="h-11 w-11 rounded-full bg-white/15 text-2xl"
            onClick={() => setPeople((p) => Math.max(2, p - 1))}
          >
            -
          </button>
          <p className="text-xl font-extrabold">{people}人</p>
          <button
            type="button"
            className="h-11 w-11 rounded-full bg-pink text-2xl text-white"
            onClick={() => setPeople((p) => Math.min(20, p + 1))}
          >
            +
          </button>
        </div>
      </section>

      <section className="mb-4 rounded-xl4 bg-white/10 p-4">
        <h2 className="mb-3 text-lg font-extrabold text-purple">移動手段と時間</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {transportOptions.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTransport(t.id)}
              className={`rounded-full px-3 py-2 text-sm font-bold ${
                transport === t.id ? "bg-purple text-white" : "bg-white/10 text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mb-2 text-sm text-slate-200">移動時間: {travelMinutes}分</p>
        <input
          type="range"
          min={5}
          max={60}
          step={5}
          value={travelMinutes}
          onChange={(e) => setTravelMinutes(Number(e.target.value))}
          className="w-full accent-purple"
        />
      </section>

      <section className="mb-6 rounded-xl4 bg-white/10 p-4">
        <h2 className="mb-3 text-lg font-extrabold text-yellow">追加条件</h2>
        <div className="flex flex-wrap gap-2">
          {extraOptions.map((extra) => (
            <button
              key={extra}
              type="button"
              onClick={() => toggleExtra(extra)}
              className={`rounded-full px-3 py-2 text-sm font-bold ${
                extras.includes(extra) ? "bg-yellow text-navy" : "bg-white/10 text-white"
              }`}
            >
              {extra}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        disabled={loading}
        onClick={() => void runSearchAndCreate()}
        className="w-full rounded-xl4 bg-gradient-to-r from-teal to-pink px-6 py-4 text-lg font-extrabold text-white shadow-pop disabled:opacity-60"
      >
        {loading ? "処理中..." : "お店を探す！"}
      </button>
    </main>
  );
}
