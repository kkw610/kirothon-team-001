import type { Coordinate, Option, Place, RecommendResponse } from "@/shared/types";

export interface MapMarker {
  kind: "origin" | "transfer" | "destination";
  name: string;
  at: Coordinate;
}

export interface MapProps {
  /** 지도에 그리는 옵션(추천, 없으면 가장 빨리 도착하는 옵션) */
  option: Option;
  /** 경로의 첫 정류장부터 환승 정류장까지 */
  subwayPath: Coordinate[];
  markers: MapMarker[];
}

/** 도착 시각이 가장 이른 옵션. 동률이면 배열 앞쪽. 결과 화면이 보여 주는 옵션과 같은 규칙이다. */
function pickFastest(options: Option[]): Option | undefined {
  let fastest: Option | undefined;
  let fastestTime = Infinity;
  for (const option of options) {
    const time = Date.parse(option.arrivalTime);
    if (fastest === undefined || time < fastestTime) {
      fastest = option;
      fastestTime = time;
    }
  }
  return fastest;
}

/**
 * 추천 결과를 지도에 그릴 데이터로 바꾼다. 추천(best)이 있으면 그 옵션, 없으면 가장 빨리 도착하는 옵션을 쓴다.
 * 옵션이 없으면 null이다. 해당 경로나 환승 정류장을 찾지 못하면 지하철 선은 빈 배열이다.
 */
export function buildMapProps(
  response: RecommendResponse,
  origin: Place,
  destination: Place,
): MapProps | null {
  const option = response.best ?? pickFastest(response.options);
  if (!option) return null;

  const route = response.routes.find((r) => r.id === option.routeId);
  const stopIndex = route ? route.stops.findIndex((s) => s.name === option.stopName) : -1;
  const subwayPath =
    route && stopIndex >= 0 ? route.stops.slice(0, stopIndex + 1).map((s) => ({ x: s.x, y: s.y })) : [];

  return {
    option,
    subwayPath,
    markers: [
      { kind: "origin", name: origin.name, at: { x: origin.x, y: origin.y } },
      { kind: "transfer", name: option.stopName, at: option.stopCoord },
      { kind: "destination", name: destination.name, at: { x: destination.x, y: destination.y } },
    ],
  };
}
