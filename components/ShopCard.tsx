import { PlaceCandidate } from "@/types";

type Props = {
  place: PlaceCandidate;
};

function priceLabel(level?: number) {
  if (typeof level !== "number") return "¥?";
  return "¥".repeat(Math.max(1, Math.min(level, 4)));
}

export default function ShopCard({ place }: Props) {
  return (
    <article className="w-[220px] shrink-0 snap-start rounded-xl4 bg-white/10 p-4 shadow-pop backdrop-blur">
      <div className="mb-3 flex h-20 items-center justify-center rounded-xl3 bg-navy/70 text-5xl">
        {place.emoji ?? "🍽️"}
      </div>
      <h2 className="line-clamp-2 text-base font-extrabold">{place.name}</h2>
      <p className="mt-2 text-sm text-slate-200">
        評価 {place.rating?.toFixed(1) ?? "-"} ・ 価格帯 {priceLabel(place.priceLevel)}
      </p>
    </article>
  );
}
