import { NextRequest, NextResponse } from "next/server";
import { searchPlacesForConditions } from "@/lib/places";
import { SessionConditions } from "@/types";

type RequestBody = {
  lat: number;
  lng: number;
  conditions: SessionConditions;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RequestBody;
  const { lat, lng, conditions } = body;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng が不正です" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: "Google Places APIキーが未設定です" }, { status: 500 });
  }

  try {
    const places = await searchPlacesForConditions({ lat, lng, conditions });
    return NextResponse.json({ places });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Places API エラー";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
