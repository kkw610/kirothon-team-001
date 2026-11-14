import { NextResponse } from "next/server";
import { searchPlaces } from "@/features/places";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.length > 50) {
    return NextResponse.json({ error: "검색어가 너무 깁니다." }, { status: 400 });
  }
  return NextResponse.json(await searchPlaces(q));
}
