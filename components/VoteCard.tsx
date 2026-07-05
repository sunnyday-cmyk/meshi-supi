"use client";

import { placePhotoProxyUrl, priceLabel } from "@/lib/places";
import { PlaceCandidate } from "@/types";
import Image from "next/image";
import { useState } from "react";

type Props = {
  place: PlaceCandidate;
  selected: boolean;
  votes: number;
  maxVotes: number;
  onSelect: () => void;
};

export default function VoteCard({ place, selected, votes, maxVotes, onSelect }: Props) {
  const ratio = maxVotes > 0 ? Math.round((votes / maxVotes) * 100) : 0;
  const photoUrl = placePhotoProxyUrl(place.photoName);
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full overflow-hidden rounded-xl4 border-2 text-left transition ${
        selected ? "border-yellow bg-yellow/10" : "border-white/10 bg-white/5"
      }`}
    >
      {photoUrl && !photoFailed ? (
        <div className="relative h-36 w-full bg-navy/70">
          <Image
            src={photoUrl}
            alt={place.name}
            fill
            className="object-cover"
            sizes="390px"
            unoptimized
            onError={() => setPhotoFailed(true)}
          />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center bg-navy/70 text-5xl">{place.emoji ?? "🍽️"}</div>
      )}

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-extrabold">{place.name}</h3>
            <p className="mt-1 text-xs text-slate-300">
              {place.distanceText ? `約 ${place.distanceText}` : "距離不明"}
              {" ・ "}
              {priceLabel(place.priceLevel)}
              {place.rating !== undefined ? ` ・ 評価 ${place.rating.toFixed(1)}` : ""}
            </p>
          </div>
          {selected ? (
            <span className="shrink-0 rounded-full bg-yellow px-2 py-1 text-xs font-bold text-navy">あなたの票</span>
          ) : null}
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-navy/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink to-orange transition-all"
            style={{ width: `${ratio}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-slate-200">{votes}票</p>
      </div>
    </button>
  );
}
