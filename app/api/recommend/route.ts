import { NextResponse } from "next/server";
import { z } from "zod";
import { recommend } from "@/features/recommender";
import { estimateTaxi } from "@/features/taxi";
import { getTransitRoutes } from "@/features/transit";
import type { RecommendResponse } from "@/shared/types";
import { invalidRequest, toApiError } from "./errors";

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
    const failure = invalidRequest(parsed.error.issues.map((i) => i.path.join(".")).join(", "));
    console.warn("recommend invalid request:", failure.logMessage);
    return NextResponse.json(failure.body, { status: failure.status });
  }
  const { origin, destination, arrivalTime, departureTime } = parsed.data;
  const departureAt = departureTime ? new Date(departureTime) : new Date();

  try {
    const routes = await getTransitRoutes(origin, destination, departureAt);
    const result: RecommendResponse = await recommend({
      routes,
      destination,
      departureAt,
      arrivalDeadline: new Date(arrivalTime),
      estimateTaxi,
    });
    return NextResponse.json(result);
  } catch (error) {
    const failure = toApiError(error);
    console.error(`recommend failed [${failure.body.code}]`, failure.logMessage);
    return NextResponse.json(failure.body, { status: failure.status });
  }
}
