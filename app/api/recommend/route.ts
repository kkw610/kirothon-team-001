import { NextResponse } from "next/server";
import { z } from "zod";
import { recommend } from "@/features/recommender";
import { estimateTaxi } from "@/features/taxi";
import { getTransitRoutes } from "@/features/transit";
import type { RecommendResponse } from "@/shared/types";

const place = z.object({
  name: z.string().min(1).max(100),
  x: z.number().min(-180).max(180),
  y: z.number().min(-90).max(90),
});

const body = z.object({
  origin: place,
  destination: place,
  arrivalTime: z.iso.datetime(),
  departureTime: z.iso.datetime().optional(),
});

/**
 * 기능 폴더끼리는 서로 import하지 않으므로, 연결은 이 라우트에서만 한다.
 * transit -> recommender 순서로 호출하고, 택시 추정 함수(taxi)는 recommender에 주입한다.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const { origin, destination, arrivalTime, departureTime } = parsed.data;

  try {
    const routes = await getTransitRoutes(origin, destination);
    const result: RecommendResponse = await recommend({
      routes,
      destination,
      departureAt: departureTime ? new Date(departureTime) : new Date(),
      arrivalDeadline: new Date(arrivalTime),
      estimateTaxi,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("recommend failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "추천을 계산하지 못했습니다." }, { status: 500 });
  }
}
