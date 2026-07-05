import { PlaceCandidate, SessionConditions } from "@/types";

const FIELD_MASK =
  "places.id,places.displayName,places.rating,places.priceLevel,places.location,places.photos";

type NewPlace = {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  rating?: number;
  priceLevel?: string;
  location?: { latitude?: number; longitude?: number };
  photos?: Array<{ name?: string }>;
};

type NewPlacesResponse = {
  places?: NewPlace[];
  error?: { message?: string; status?: string };
};

function pickEmoji(name: string): string {
  if (name.includes("寿司")) return "🍣";
  if (name.includes("ラーメン")) return "🍜";
  if (name.includes("バーガー")) return "🍔";
  if (name.includes("ピザ")) return "🍕";
  if (name.includes("焼肉")) return "🥩";
  if (name.includes("カレー")) return "🍛";
  return "🍽️";
}

function placeIdFromResourceId(id?: string): string {
  if (!id) return "";
  return id.startsWith("places/") ? id.slice("places/".length) : id;
}

function priceLevelFromEnum(level?: string): number | undefined {
  const map: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4
  };
  return level ? map[level] : undefined;
}

export function priceLabel(level?: number): string {
  if (typeof level !== "number") return "¥?";
  return "¥".repeat(Math.max(1, Math.min(level, 4)));
}

export function placePhotoProxyUrl(photoName?: string): string | undefined {
  if (!photoName) return undefined;
  return `/api/places/photo?name=${encodeURIComponent(photoName)}`;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 現在地からの距離をキロ表示（例: 0.8km, 1.2km） */
export function formatDistanceKm(distanceMeters: number): string {
  const km = distanceMeters / 1000;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

export function distanceTextFromCoords(
  originLat: number,
  originLng: number,
  placeLat?: number,
  placeLng?: number
): string | undefined {
  if (placeLat === undefined || placeLng === undefined) return undefined;
  return formatDistanceKm(haversineMeters(originLat, originLng, placeLat, placeLng));
}

export function enrichPlacesWithDistance(
  places: PlaceCandidate[],
  originLat: number,
  originLng: number
): PlaceCandidate[] {
  return places.map((place) => ({
    ...place,
    distanceText: distanceTextFromCoords(originLat, originLng, place.lat, place.lng) ?? place.distanceText
  }));
}

function normalizeNewPlaces(places: NewPlace[], originLat: number, originLng: number): PlaceCandidate[] {
  return places.map((place) => {
    const name = place.displayName?.text ?? "不明な店";
    const lat = place.location?.latitude;
    const lng = place.location?.longitude;
    return {
      placeId: placeIdFromResourceId(place.id),
      name,
      rating: place.rating,
      priceLevel: priceLevelFromEnum(place.priceLevel),
      lat,
      lng,
      distanceText: distanceTextFromCoords(originLat, originLng, lat, lng),
      emoji: pickEmoji(name),
      photoName: place.photos?.[0]?.name
    };
  });
}

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error("Google Places APIキーが未設定です");
  }
  return key;
}

async function postPlacesApi<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`https://places.googleapis.com/v1/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": FIELD_MASK
    },
    body: JSON.stringify({ languageCode: "ja", ...body }),
    cache: "no-store"
  });

  const json = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(json.error?.message ?? `Places API エラー (HTTP ${response.status})`);
  }
  return json;
}

export async function searchNearbyPlaces(params: {
  lat: number;
  lng: number;
  radius: number;
  keyword?: string;
}): Promise<PlaceCandidate[]> {
  const { lat, lng, radius, keyword } = params;

  if (keyword?.trim()) {
    const data = await postPlacesApi<NewPlacesResponse>("places:searchText", {
      textQuery: `${keyword.trim()} レストラン`,
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: Math.min(radius, 50000)
        }
      }
    });
    return normalizeNewPlaces(data.places ?? [], lat, lng);
  }

  const data = await postPlacesApi<NewPlacesResponse>("places:searchNearby", {
    includedTypes: ["restaurant"],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: Math.min(radius, 50000)
      }
    }
  });
  return normalizeNewPlaces(data.places ?? [], lat, lng);
}

export function radiusFromTravelMinutes(travelMinutes: number): number {
  return Math.min(Math.max(travelMinutes * 120, 500), 5000);
}

export function maxPriceLevelForBudget(budget: number): number {
  if (budget <= 1500) return 1;
  if (budget <= 3000) return 2;
  if (budget <= 5000) return 3;
  return 4;
}

export function dedupePlacesById(places: PlaceCandidate[]): PlaceCandidate[] {
  const seen = new Set<string>();
  const result: PlaceCandidate[] = [];
  for (const place of places) {
    if (!place.placeId || seen.has(place.placeId)) continue;
    seen.add(place.placeId);
    result.push(place);
  }
  return result;
}

export function filterPlacesByConditions(
  places: PlaceCandidate[],
  conditions: SessionConditions,
  originLat: number,
  originLng: number
): PlaceCandidate[] {
  const radius = radiusFromTravelMinutes(conditions.travelMinutes);
  const maxPrice = maxPriceLevelForBudget(conditions.budget);

  return places.filter((place) => {
    if (place.lat !== undefined && place.lng !== undefined) {
      if (haversineMeters(originLat, originLng, place.lat, place.lng) > radius) {
        return false;
      }
    }
    if (typeof place.priceLevel === "number" && place.priceLevel > maxPrice) {
      return false;
    }
    return true;
  });
}

export async function searchPlacesForConditions(params: {
  lat: number;
  lng: number;
  conditions: SessionConditions;
}): Promise<PlaceCandidate[]> {
  const { lat, lng, conditions } = params;
  const radius = radiusFromTravelMinutes(conditions.travelMinutes);
  const genres = conditions.genres.filter((g) => g !== "すべて");
  const keywords = genres.length ? genres : [""];

  const batches = await Promise.all(
    keywords.map((keyword) => searchNearbyPlaces({ lat, lng, radius, keyword: keyword || undefined }))
  );

  const merged = dedupePlacesById(batches.flat());
  return filterPlacesByConditions(merged, conditions, lat, lng);
}

export function mapUrlFromPlace(place: PlaceCandidate): string {
  if (place.placeId) {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(place.placeId)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
}
