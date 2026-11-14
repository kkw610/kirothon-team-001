import { NextResponse } from "next/server";
import { PlacesError, searchPlaces } from "@/features/places";
import type { ApiErrorBody } from "@/shared/types";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.length > 50) {
    const body: ApiErrorBody = { error: "검색어가 너무 깁니다.", code: "INVALID_REQUEST" };
    return NextResponse.json(body, { status: 400 });
  }
  try {
    return NextResponse.json(await searchPlaces(q));
  } catch (error) {
    // 호출 실패(PlacesError)는 502, 그 밖의 오류(환경변수 누락 등)는 500이다. 상세는 로그에만 남긴다.
    const upstream = error instanceof PlacesError;
    console.error(
      `places failed [${upstream ? "UPSTREAM_ERROR" : "SERVER_ERROR"}]`,
      error instanceof Error ? error.message : "unknown",
    );
    const body: ApiErrorBody = upstream
      ? { error: "장소 검색 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.", code: "UPSTREAM_ERROR", source: "places" }
      : { error: "서버에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.", code: "SERVER_ERROR" };
    return NextResponse.json(body, { status: upstream ? 502 : 500 });
  }
}
