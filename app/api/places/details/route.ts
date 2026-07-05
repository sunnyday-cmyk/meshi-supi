import { NextRequest, NextResponse } from "next/server";
import { fetchPlacePhotoName } from "@/lib/places";

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get("placeId");
  if (!placeId?.trim()) {
    return NextResponse.json({ error: "placeId が不正です" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: "Google Places APIキーが未設定です" }, { status: 500 });
  }

  try {
    const photoName = await fetchPlacePhotoName(placeId.trim());
    return NextResponse.json({ photoName: photoName ?? null });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Place Details エラー";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
