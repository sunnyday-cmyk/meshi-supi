"use client";

import { PlaceCandidate } from "@/types";

type Props = {
  place: PlaceCandidate;
  selected: boolean;
  votes: number;
  maxVotes: number;
  onSelect: () => void;
};

export default function VoteCard({ place, selected, votes, maxVotes, onSelect }: Props) {
  const ratio = maxVotes > 0 ? Math.round((votes / maxVotes) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl4 border-2 p-4 text-left transition ${
        selected ? "border-yellow bg-yellow/10" : "border-white/10 bg-white/5"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-3xl">{place.emoji ?? "🍽️"}</p>
          <h3 className="mt-1 text-lg font-extrabold">{place.name}</h3>
          <p className="text-xs text-slate-300">{place.vicinity}</p>
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
    </button>
  );
}
