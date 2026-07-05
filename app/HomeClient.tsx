"use client";

import GenreChips from "@/components/GenreChips";
import ShopCard from "@/components/ShopCard";
import { PlaceCandidate } from "@/types";
import Link from "next/link";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";

const logoChars = [
  { char: "M", color: "text-yellow" },
  { char: "e", color: "text-orange" },
  { char: "s", color: "text-pink" },
  { char: "h", color: "text-teal" },
  { char: "i", color: "text-purple" },
  { char: "S", color: "text-yellow" },
  { char: "p", color: "text-orange" },
  { char: "i", color: "text-pink" },
  { char: "n", color: "text-teal" }
];

export default function HomeClient({ intro }: { intro?: ReactNode }) {
  const [activeGenre, setActiveGenre] = useState("すべて");
  const [places, setPlaces] = useState<PlaceCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const keyword = useMemo(() => (activeGenre === "すべて" ? "" : activeGenre), [activeGenre]);

  const loadNearby = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("位置情報が使えません"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000
        });
      });
      const params = new URLSearchParams({
        lat: String(pos.coords.latitude),
        lng: String(pos.coords.longitude),
        radius: "1200"
      });
      if (keyword) params.set("keyword", keyword);
      const res = await fetch(`/api/places/nearby?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "取得に失敗しました");
      }
      setPlaces(data.places ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    void loadNearby();
  }, [loadNearby]);

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-[390px] overflow-hidden px-4 pb-10 pt-8">
      <div className="pointer-events-none absolute -left-24 -top-20 h-64 w-64 rounded-full bg-pink/20 blur-2xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-teal/20 blur-2xl" />

      <header className="mb-6">
        <h1 className="title-font text-center text-5xl tracking-wide">
          {logoChars.map((item, index) => (
            <span key={`${item.char}-${index}`} className={`inline-block ${item.color}`}>
              {item.char}
            </span>
          ))}
        </h1>
        <p className="mt-3 text-center text-sm text-slate-200">
          近くの候補をサクッと見て、みんなで楽しく決めよう！
        </p>
      </header>

      {intro}

      <section>
        <GenreChips activeGenre={activeGenre} onChange={setActiveGenre} />

        {error ? (
          <p className="mb-3 rounded-xl2 border border-pink/40 bg-pink/10 px-3 py-2 text-sm text-pink">{error}</p>
        ) : null}

        {loading ? (
          <p className="py-8 text-center text-slate-300">周辺のお店を読み込み中...</p>
        ) : (
          <div className="flex snap-x gap-3 overflow-x-auto pb-3">
            {places.map((place) => (
              <ShopCard key={place.placeId} place={place} />
            ))}
          </div>
        )}
      </section>

      <Link
        href="/session/new"
        className="mt-8 block rounded-xl4 bg-gradient-to-r from-orange to-pink px-6 py-4 text-center text-lg font-extrabold text-white shadow-pop"
      >
        グループを作る
      </Link>
    </main>
  );
}
