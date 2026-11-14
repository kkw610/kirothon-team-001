import { NextResponse } from "next/server";
import { z } from "zod";
import { getTaxiPath } from "@/features/taxi";
import type { ApiErrorBody } from "@/shared/types";

// 빈 문자열이 0으로 바뀌지 않도록 먼저 비어 있지 않은 문자열인지 확인한다.
const num = z.string().min(1).pipe(z.coerce.number());
const lng = num.pipe(z.number().min(-180).max(180));
const lat = num.pipe(z.number().min(-90).max(90));
const query = z.object({ fromX: lng, fromY: lat, toX: lng, toY: lat });

/**
 * 환승역에서 목적지까지 택시 도로 경로. 길찾기에 실패해도 직선으로 대신해 200으로 응답한다(fallback: true).
 * 요청 형식이 틀린 경우만 400이다.
 */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = query.safeParse(params);
  if (!parsed.success) {
    const body: ApiErrorBody = { error: "요청 형식이 올바르지 않습니다.", code: "INVALID_REQUEST" };
    return NextResponse.json(body, { status: 400 });
  }
  const { fromX, fromY, toX, toY } = parsed.data;
  return NextResponse.json(await getTaxiPath({ x: fromX, y: fromY }, { x: toX, y: toY }));
}
