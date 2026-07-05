"use client";

import QRDisplay from "@/components/QRDisplay";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getMemberIdentity, saveMemberIdentity } from "@/lib/session-store";
import { MemberRecord, PlaceCandidate, SessionConditions, SessionRecord } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const avatarPool = ["🎮", "🍙", "🍥", "🌮", "🍱", "🧃", "🍿", "🎪", "🎯", "🎲"];

function avatarForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i)) % avatarPool.length;
  }
  return avatarPool[hash];
}

type Props = {
  sessionId: string;
};

export default function InviteClient({ sessionId }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number | null>(null);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/session/${sessionId}/invite`;
  }, [sessionId]);

  const isHost = Boolean(session && userId && session.host_id === userId);
  const [identity, setIdentity] = useState(() => getMemberIdentity(sessionId));

  useEffect(() => {
    setIdentity(getMemberIdentity(sessionId));
  }, [sessionId, members.length]);

  const loadSession = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error: fetchError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (fetchError || !data) {
      setError(fetchError?.message ?? "セッションが見つかりません");
      return;
    }

    const row = data as {
      id: string;
      host_id: string | null;
      conditions: SessionConditions;
      candidates: PlaceCandidate[];
      status: SessionRecord["status"];
      vote_ends_at: string | null;
      created_at: string;
    };

    setSession({
      id: row.id,
      host_id: row.host_id,
      conditions: row.conditions,
      candidates: row.candidates ?? [],
      status: row.status,
      vote_ends_at: row.vote_ends_at,
      created_at: row.created_at
    });
  }, [sessionId]);

  const loadMembers = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error: fetchError } = await supabase
      .from("members")
      .select("*")
      .eq("session_id", sessionId)
      .order("joined_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setMembers((data ?? []) as MemberRecord[]);
  }, [sessionId]);

  useEffect(() => {
    void loadSession();
    void loadMembers();
  }, [loadSession, loadMembers]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`members-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members", filter: `session_id=eq.${sessionId}` },
        () => {
          void loadMembers();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, loadMembers]);

  useEffect(() => {
    if (!session?.created_at) return;
    const expires = new Date(session.created_at).getTime() + 10 * 60 * 1000;
    const tick = () => {
      const left = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setQrSecondsLeft(left);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session?.created_at]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadSession();
    }, 2500);
    return () => window.clearInterval(id);
  }, [loadSession]);

  useEffect(() => {
    if (session?.status === "voting") {
      router.push(`/session/${sessionId}/vote`);
    }
  }, [session?.status, router, sessionId]);

  const startVoting = async () => {
    if (!session) return;
    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("sessions")
      .update({ status: "voting" })
      .eq("id", sessionId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push(`/session/${sessionId}/vote`);
  };

  const joinAsGuest = async () => {
    if (!guestName.trim()) {
      setError("名前を入力してください");
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: insertError } = await supabase
        .from("members")
        .insert({
          session_id: sessionId,
          name: guestName.trim(),
          is_host: false
        })
        .select("id")
        .single();

      if (insertError || !data) {
        throw new Error(insertError?.message ?? "参加に失敗しました");
      }

      saveMemberIdentity(sessionId, {
        memberId: data.id as string,
        name: guestName.trim(),
        isHost: false
      });
      setIdentity(getMemberIdentity(sessionId));
      await loadMembers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "参加に失敗しました");
    } finally {
      setJoining(false);
    }
  };

  const expectedPeople = session?.conditions.people ?? 4;
  const slots = useMemo(() => {
    const list = [...members];
    return Array.from({ length: expectedPeople }, (_, index) => list[index] ?? null);
  }, [members, expectedPeople]);

  if (!session && !error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[390px] items-center justify-center px-4">
        <p className="text-slate-200">読み込み中...</p>
      </main>
    );
  }

  if (error && !session) {
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
    <main className="relative mx-auto min-h-screen w-full max-w-[390px] overflow-hidden px-4 pb-10 pt-6">
      <div className="pointer-events-none absolute -right-16 top-10 h-48 w-48 rounded-full bg-purple/20 blur-2xl" />

      <h1 className="title-font mb-2 text-center text-3xl text-yellow">メンバーを集めよう</h1>
      <p className="mb-4 text-center text-sm text-slate-200">QRを共有して、みんなで投票の準備を完了しよう</p>

      {error ? (
        <p className="mb-3 rounded-xl2 border border-pink/40 bg-pink/10 px-3 py-2 text-sm text-pink">{error}</p>
      ) : null}

      <div className="mb-6 flex flex-col items-center gap-3">
        {inviteUrl ? <QRDisplay value={inviteUrl} /> : null}
        <p className="text-sm text-teal">
          QRの有効目安:{" "}
          {qrSecondsLeft !== null
            ? `${Math.floor(qrSecondsLeft / 60)}:${String(qrSecondsLeft % 60).padStart(2, "0")}`
            : "--:--"}
        </p>
      </div>

      {!isHost && !identity ? (
        <section className="mb-6 rounded-xl4 bg-white/10 p-4">
          <h2 className="mb-2 text-lg font-extrabold text-orange">ゲスト参加</h2>
          <p className="mb-3 text-sm text-slate-200">表示名を入力して参加してください</p>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="ニックネーム"
            className="mb-3 w-full rounded-xl2 border border-white/10 bg-navy/60 px-3 py-3 text-white outline-none"
          />
          <button
            type="button"
            disabled={joining}
            onClick={() => void joinAsGuest()}
            className="w-full rounded-xl4 bg-gradient-to-r from-orange to-pink py-3 font-extrabold text-white disabled:opacity-60"
          >
            {joining ? "参加中..." : "参加する"}
          </button>
        </section>
      ) : null}

      {identity ? (
        <p className="mb-4 text-center text-sm text-teal">
          あなた: <span className="font-bold text-white">{identity.name}</span>
          {identity.isHost ? "（ホスト）" : ""}
        </p>
      ) : null}

      <section className="mb-6 rounded-xl4 bg-white/10 p-4">
        <h2 className="mb-3 text-lg font-extrabold text-pink">参加メンバー</h2>
        <ul className="space-y-3">
          {slots.map((member, index) => (
            <li
              key={member?.id ?? `slot-${index}`}
              className="flex items-center gap-3 rounded-xl3 border border-white/10 bg-navy/40 px-3 py-2"
            >
              <span className="text-2xl">{member ? avatarForId(member.id) : "⏳"}</span>
              <div className="flex-1">
                <p className="font-bold">
                  {member ? member.name : "待機中..."}
                  {member?.is_host ? (
                    <span className="ml-2 rounded-full bg-yellow px-2 py-0.5 text-xs text-navy">ホスト</span>
                  ) : null}
                </p>
                {!member ? <p className="animate-pulse text-xs text-slate-400">参加待ち</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {isHost ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void startVoting()}
            className="rounded-xl4 bg-gradient-to-r from-teal to-purple py-4 text-lg font-extrabold text-white shadow-pop"
          >
            投票をスタート！
          </button>
          <button
            type="button"
            onClick={() => void startVoting()}
            className="rounded-xl4 border border-white/20 py-3 font-bold text-white"
          >
            全員揃ってなくても始める
          </button>
        </div>
      ) : null}

      <Link href="/session/new" className="mt-8 block text-center text-sm text-slate-400 underline">
        別のグループを作る
      </Link>
    </main>
  );
}
