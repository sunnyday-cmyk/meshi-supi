"use client";

import RouletteWheel from "@/components/RouletteWheel";
import { mapUrlFromPlace } from "@/lib/places";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PlaceCandidate, RouletteAdditionRecord, SessionRecord } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const wheelColors = ["#FFE135", "#FF6B35", "#FF3D7F", "#00C9A7", "#7B2FBE"];

type WheelItem = {
  key: string;
  label: string;
  place: PlaceCandidate;
};

type Props = {
  sessionId: string;
};

export default function RouletteClient({ sessionId }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [items, setItems] = useState<WheelItem[]>([]);
  const [spinKey, setSpinKey] = useState(0);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<PlaceCandidate | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const targetIndexRef = useRef<number | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const loadAll = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: sessionRow, error: se } = await supabase.from("sessions").select("*").eq("id", sessionId).single();
    if (se || !sessionRow) {
      setError(se?.message ?? "セッションが見つかりません");
      return;
    }

    const row = sessionRow as {
      id: string;
      host_id: string | null;
      conditions: SessionRecord["conditions"];
      candidates: PlaceCandidate[];
      status: SessionRecord["status"];
      vote_ends_at: string | null;
      created_at: string;
    };

    setSession({
      id: row.id,
      host_id: row.host_id,
      conditions: { ...row.conditions, voteSeconds: row.conditions?.voteSeconds ?? 120 },
      candidates: row.candidates ?? [],
      status: row.status,
      vote_ends_at: row.vote_ends_at,
      created_at: row.created_at
    });

    const { data: adds } = await supabase.from("roulette_additions").select("*").eq("session_id", sessionId);

    const base = (row.candidates ?? []) as PlaceCandidate[];
    const merged: WheelItem[] = base.map((p) => ({
      key: p.placeId,
      label: p.name,
      place: p
    }));

    (adds as RouletteAdditionRecord[] | null)?.forEach((a) => {
      merged.push({
        key: `add-${a.id}`,
        label: a.place_name,
        place: {
          placeId: a.place_id ?? "",
          name: a.place_name,
          emoji: "✨",
          rating: undefined,
          priceLevel: undefined
        }
      });
    });

    setItems(merged);
  }, [sessionId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!session) return;
    if (session.status === "waiting") {
      router.replace(`/session/${sessionId}/invite`);
    }
    if (session.status === "voting") {
      router.replace(`/session/${sessionId}/vote`);
    }
  }, [session, router, sessionId]);

  const labels = useMemo(() => items.map((i) => i.label), [items]);

  const startSpin = () => {
    if (!items.length || spinning) return;
    setError(null);
    setResult(null);
    setConfetti(false);
    const idx = Math.floor(Math.random() * items.length);
    targetIndexRef.current = idx;
    setTargetIndex(idx);
    setSpinning(true);
    setSpinKey((k) => k + 1);
  };

  const onSpinDone = useCallback(() => {
    setSpinning(false);
    const idx = targetIndexRef.current;
    const list = itemsRef.current;
    if (idx !== null && list[idx]) {
      setResult(list[idx].place);
    }
    setConfetti(true);
    window.setTimeout(() => setConfetti(false), 3500);

    void (async () => {
      const supabase = getSupabaseBrowserClient();
      await supabase.from("sessions").update({ status: "done" }).eq("id", sessionId);
      await loadAll();
    })();
  }, [sessionId, loadAll]);

  if (!session && !error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[390px] items-center justify-center px-4">
        <p className="text-slate-200">読み込み中...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[390px] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-pink">{error}</p>
        <Link href="/" className="text-teal underline">
          トップへ
        </Link>
      </main>
    );
  }

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-[390px] overflow-hidden px-4 pb-28 pt-6">
      {confetti ? (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${(i * 7) % 100}%`,
                animationDelay: `${(i % 10) * 0.05}s`,
                backgroundColor: wheelColors[i % wheelColors.length]
              }}
            />
          ))}
        </div>
      ) : null}

      <h1 className="title-font mb-2 text-center text-4xl text-orange">ルーレット</h1>
      <p className="mb-6 text-center text-sm text-slate-200">タップしてスピン！</p>

      <RouletteWheel
        labels={labels}
        colors={wheelColors}
        spinKey={spinKey}
        targetIndex={targetIndex}
        onSpinComplete={onSpinDone}
      />

      <button
        type="button"
        disabled={spinning || !items.length}
        onClick={startSpin}
        className="mx-auto mt-8 flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-pink to-purple text-lg font-black text-white shadow-pop disabled:opacity-50"
      >
        {spinning ? "..." : "SPIN"}
      </button>

      {result ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-[360px] rounded-xl4 bg-white/10 p-6 text-center backdrop-blur">
            <p className="text-5xl">{result.emoji ?? "🎉"}</p>
            <h2 className="title-font mt-2 text-3xl text-yellow">{result.name}</h2>
            <p className="mt-2 text-sm text-slate-200">
              評価 {result.rating?.toFixed(1) ?? "-"} ・ 価格帯{" "}
              {typeof result.priceLevel === "number" ? "¥".repeat(result.priceLevel) : "-"}
            </p>
            <a
              href={mapUrlFromPlace(result)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block rounded-xl4 bg-teal py-3 font-extrabold text-navy"
            >
              Googleマップで開く
            </a>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                startSpin();
              }}
              className="mt-3 w-full rounded-xl4 border border-white/20 py-3 font-bold text-white"
            >
              もう一回スピン
            </button>
          </div>
        </div>
      ) : null}

      <Link href={`/session/${sessionId}/vote`} className="mt-10 block text-center text-sm text-slate-400 underline">
        投票に戻る
      </Link>
    </main>
  );
}
