import { PlaceCandidate } from "@/types";

export const GENRE_OPTIONS = [
  "すべて",
  "ラーメン",
  "寿司",
  "バーガー",
  "ピザ",
  "居酒屋",
  "カレー",
  "焼肉",
  "イタリアン"
] as const;

export type GenreOption = (typeof GENRE_OPTIONS)[number];

export function inferGenresFromPlaceName(name: string): string[] {
  return GENRE_OPTIONS.filter((g) => g !== "すべて" && name.includes(g));
}

export function placeMatchesGenre(place: PlaceCandidate, genre: string): boolean {
  if (genre === "すべて") return true;
  return place.genres?.includes(genre) ?? false;
}

export function enrichPlaceGenres(place: PlaceCandidate): PlaceCandidate {
  if (place.genres?.length) return place;
  return { ...place, genres: inferGenresFromPlaceName(place.name) };
}

export function enrichPlacesWithGenres(places: PlaceCandidate[]): PlaceCandidate[] {
  return places.map(enrichPlaceGenres);
}
