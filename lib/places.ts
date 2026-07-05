import { PlaceCandidate } from "@/types";

const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.location";

type NewPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  priceLevel?: string;
  location?: { latitude?: number; longitude?: number };
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

function normalizeNewPlaces(places: NewPlace[]): PlaceCandidate[] {
  return places.map((place) => {
    const name = place.displayName?.text ?? "不明な店";
    return {
      placeId: placeIdFromResourceId(place.id),
      name,
      rating: place.rating,
      priceLevel: priceLevelFromEnum(place.priceLevel),
      lat: place.location?.latitude,
      lng: place.location?.longitude,
      vicinity: place.formattedAddress,
      emoji: pickEmoji(name)
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
    body: JSON.stringify(body),
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
    return normalizeNewPlaces(data.places ?? []);
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
  return normalizeNewPlaces(data.places ?? []);
}

export function mapUrlFromPlace(place: PlaceCandidate): string {
  if (place.placeId) {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(place.placeId)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
}
