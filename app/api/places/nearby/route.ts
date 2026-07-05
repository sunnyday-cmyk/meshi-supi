import { NextRequest, NextResponse } from "next/server";
import { searchNearbyPlaces } from "@/lib/places";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const keyword = searchParams.get("keyword") ?? undefined;
  const radius = Number(searchParams.get("radius") ?? "1500");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat/lng が不正です" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: "Google Places APIキーが未設定です" }, { status: 500 });
  }

  try {
    const places = (await searchNearbyPlaces({ lat, lng, radius, keyword })).slice(0, 12);
    return NextResponse.json({ places });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Places API エラー";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
