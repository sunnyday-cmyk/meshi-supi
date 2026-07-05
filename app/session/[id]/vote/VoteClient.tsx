"use client";

import VoteCard from "@/components/VoteCard";
import { mapUrlFromPlace } from "@/lib/places";
import { getMemberIdentity } from "@/lib/session-store";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { PlaceCandidate, SessionRecord, VoteRecord } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  sessionId: string;
};

export default function VoteClient({ sessionId }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [myPlaceId, setMyPlaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultPlace, setResultPlace] = useState<PlaceCandidate | null>(null);

  const identity = useMemo(() => getMemberIdentity(sessionId), [sessionId]);
  const isHost = Boolean(session && userId && session.host_id === userId);

  const loadSession = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error: e } = await supabase.from("sessions").select("*").eq("id", sessionId).single();
    if (e || !data) {
      setError(e?.message ?? "セッションが見つかりません");
      return;
    }
    const row = data as {
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
    setCandidates((row.candidates ?? []).slice(0, 4));
  }, [sessionId]);

  const loadVotes = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.from("votes").select("*").eq("session_id", sessionId);
    setVotes((data ?? []) as VoteRecord[]);
  }, [sessionId]);

  useEffect(() => {
    void loadSession();
    void loadVotes();
  }, [loadSession, loadVotes]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const votesChannel = supabase
      .channel(`votes-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `session_id=eq.${sessionId}` },
        () => {
          void loadVotes();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(votesChannel);
    };
  }, [sessionId, loadVotes]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadSession();
    }, 2500);
    return () => window.clearInterval(id);
  }, [loadSession]);

  useEffect(() => {
    if (!session) return;
    if (session.status === "waiting") {
      router.replace(`/session/${sessionId}/invite`);
    }
    if (session.status === "roulette") {
      router.replace(`/session/${sessionId}/roulette`);
    }
  }, [session, router, sessionId]);

  useEffect(() => {
    if (!identity) return;
    const mine = votes.find((v) => v.member_id === identity.memberId);
    setMyPlaceId(mine?.place_id ?? null);
  }, [votes, identity]);

  const tallies = useMemo(() => {
    const map = new Map<string, number>();
    votes.forEach((v) => {
      map.set(v.place_id, (map.get(v.place_id) ?? 0) + 1);
    });
    return map;
  }, [votes]);

  const maxVotes = useMemo(() => {
    let m = 0;
    tallies.forEach((n) => {
      m = Math.max(m, n);
    });
    return m;
  }, [tallies]);

  const secondsLeft = useMemo(() => {
    if (!session?.vote_ends_at) return null;
    const end = new Date(session.vote_ends_at).getTime();
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  }, [session?.vote_ends_at]);

  const castVote = async (placeId: string) => {
    if (!identity) {
      setError("招待画面から参加してください。");
      return;
    }
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const { error: voteError } = await supabase.from("votes").upsert(
      {
        session_id: sessionId,
        member_id: identity.memberId,
        place_id: placeId
      },
      { onConflict: "session_id,member_id" }
    );
    if (voteError) {
      setError(voteError.message);
      return;
    }
    setMyPlaceId(placeId);
    await loadVotes();
  };

  const resolveVotes = async () => {
    if (!candidates.length) return;
    let top = 0;
    tallies.forEach((n) => {
      top = Math.max(top, n);
    });
    const winners = candidates.filter((c) => (tallies.get(c.placeId) ?? 0) === top && top > 0);
    const supabase = getSupabaseBrowserClient();

    if (winners.length === 1) {
      setResultPlace(winners[0]);
      await supabase.from("sessions").update({ status: "done" }).eq("id", sessionId);
      await loadSession();
      return;
    }

    await supabase.from("sessions").update({ status: "roulette" }).eq("id", sessionId);
    router.push(`/session/${sessionId}/roulette`);
  };

  const goRoulette = async () => {
    if (!isHost) return;
    const supabase = getSupabaseBrowserClient();
    await supabase.from("sessions").update({ status: "roulette" }).eq("id", sessionId);
    router.push(`/session/${sessionId}/roulette`);
  };

  if (!session && !error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[390px] items-center justify-center px-4">
        <p className="text-slate-200">読み込み中...</p>
      </main>
    );
  }

  if (!identity) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[390px] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-200">この端末からはまだ参加していません。</p>
        <Link href={`/session/${sessionId}/invite`} className="rounded-xl4 bg-yellow px-6 py-3 font-bold text-navy">
          招待画面へ
        </Link>
      </main>
    );
  }

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-[390px] px-4 pb-28 pt-6">
      <div className="pointer-events-none absolute -left-10 top-24 h-40 w-40 rounded-full bg-pink/20 blur-2xl" />

      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="title-font text-3xl text-yellow">投票タイム！</h1>
          <p className="text-sm text-slate-200">タップで投票（変更OK）</p>
        </div>
        <div className="rounded-xl3 border border-pink/40 bg-pink/15 px-3 py-2 text-right">
          <p className="text-xs text-pink">残り</p>
          <p className="text-xl font-black text-pink">
            {secondsLeft === null
              ? "--:--"
              : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`}
          </p>
        </div>
      </header>

      {error ? (
        <p className="mb-3 rounded-xl2 border border-pink/40 bg-pink/10 px-3 py-2 text-sm text-pink">{error}</p>
      ) : null}

      <div className="space-y-4">
        {candidates.map((place) => (
          <VoteCard
            key={place.placeId}
            place={place}
            selected={myPlaceId === place.placeId}
            votes={tallies.get(place.placeId) ?? 0}
            maxVotes={maxVotes || 1}
            onSelect={() => void castVote(place.placeId)}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void resolveVotes()}
          className="rounded-xl4 bg-gradient-to-r from-teal to-pink py-4 text-lg font-extrabold text-white shadow-pop"
        >
          結果を見る！
        </button>
        {isHost ? (
          <button
            type="button"
            onClick={() => void goRoulette()}
            className="rounded-xl4 border border-yellow py-3 font-bold text-yellow"
          >
            決まらないならスピン！
          </button>
        ) : null}
      </div>

      {resultPlace ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-[360px] rounded-xl4 bg-white/10 p-6 text-center backdrop-blur">
            <p className="text-5xl">{resultPlace.emoji}</p>
            <h2 className="title-font mt-2 text-3xl text-yellow">{resultPlace.name}</h2>
            <p className="mt-2 text-sm text-slate-200">今夜の決定！おめでとう！</p>
            <a
              href={mapUrlFromPlace(resultPlace)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block rounded-xl4 bg-teal py-3 font-extrabold text-navy"
            >
              Googleマップで開く
            </a>
            {isHost ? (
              <button
                type="button"
                onClick={() => void goRoulette()}
                className="mt-3 w-full rounded-xl4 border border-white/20 py-3 font-bold text-white"
              >
                やっぱりスピンする
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setResultPlace(null)}
              className="mt-3 text-sm text-slate-400 underline"
            >
              閉じる
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
