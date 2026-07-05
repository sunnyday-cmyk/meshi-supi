import { NextRequest, NextResponse } from "next/server";
import { searchNearbyPlaces } from "@/lib/places";
import { SessionConditions } from "@/types";

type RequestBody = {
  lat: number;
  lng: number;
  conditions: SessionConditions;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RequestBody;
  const { lat, lng, conditions } = body;
  const keyword = conditions.genres.join(" ");
  const radius = Math.min(Math.max(conditions.travelMinutes * 120, 500), 5000);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng が不正です" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: "Google Places APIキーが未設定です" }, { status: 500 });
  }

  try {
    const places = (await searchNearbyPlaces({ lat, lng, radius, keyword })).slice(0, 8);
    return NextResponse.json({ places });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Places API エラー";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
