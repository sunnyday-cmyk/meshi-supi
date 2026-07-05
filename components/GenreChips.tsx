"use client";

import { GENRE_OPTIONS } from "@/lib/genres";

type Props = {
  activeGenre: string;
  onChange: (genre: string) => void;
  className?: string;
};

export default function GenreChips({ activeGenre, onChange, className = "mb-4" }: Props) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 ${className}`}>
      {GENRE_OPTIONS.map((genre) => (
        <button
          key={genre}
          type="button"
          onClick={() => onChange(genre)}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${
            genre === activeGenre ? "bg-yellow text-navy" : "bg-white/10 text-white"
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
}
