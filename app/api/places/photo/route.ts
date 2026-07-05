import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name || !name.startsWith("places/")) {
    return NextResponse.json({ error: "name が不正です" }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google Places APIキーが未設定です" }, { status: 500 });
  }

  const mediaUrl = `https://places.googleapis.com/v1/${name}/media?maxHeightPx=400&maxWidthPx=800`;

  const response = await fetch(mediaUrl, {
    cache: "no-store",
    redirect: "follow",
    headers: {
      "X-Goog-Api-Key": apiKey
    }
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[places/photo] fetch failed", response.status, detail.slice(0, 200));
    return NextResponse.json({ error: "写真の取得に失敗しました" }, { status: response.status });
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400"
    }
  });
}
