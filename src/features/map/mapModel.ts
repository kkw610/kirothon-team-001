import type { Place, Route } from "@/shared/types";

export interface MapModel {
  /** SVG polyline points */
  routeLines: { id: string; points: string }[];
  stops: { key: string; cx: number; cy: number; name: string; highlighted: boolean }[];
  origin?: { cx: number; cy: number; name: string };
  destination: { cx: number; cy: number; name: string };
  /** 추천 역 → 목적지 */
  taxiLine?: { x1: number; y1: number; x2: number; y2: number };
  highlight?: { cx: number; cy: number; name: string };
}

export const MAP_SIZE = { w: 480, h: 280, pad: 24 };

/** 추천 정류장 이름과 일치하는 첫 정류장의 (route, stop) 위치를 찾는다. */
function findHighlight(routes: Route[], highlightStopName?: string) {
  if (!highlightStopName) return undefined;
  for (let r = 0; r < routes.length; r++) {
    const s = routes[r].stops.findIndex((stop) => stop.name === highlightStopName);
    if (s >= 0) return { r, s };
  }
  return undefined;
}

export function buildMapModel(
  routes: Route[],
  destination: Place,
  highlightStopName?: string,
): MapModel {
  const allStops = routes.flatMap((r) => r.stops);
  const points = [...allStops, destination];
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  const { w, h, pad } = MAP_SIZE;
  // 범위가 0이면(점이 하나이거나 같은 값) 0으로 나누지 않도록 1로 대체한다.
  const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (w - 2 * pad);
  const sy = (y: number) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - 2 * pad);

  const hit = findHighlight(routes, highlightStopName);

  const stops = routes.flatMap((route, r) =>
    route.stops.map((s, i) => ({
      key: `${route.id}:${i}:${s.name}:${s.x}`,
      cx: sx(s.x),
      cy: sy(s.y),
      name: s.name,
      highlighted: hit !== undefined && hit.r === r && hit.s === i,
    })),
  );

  const originStop = routes[0]?.stops[0];
  const dest = { cx: sx(destination.x), cy: sy(destination.y), name: destination.name };

  const model: MapModel = {
    routeLines: routes.map((route) => ({
      id: route.id,
      points: route.stops.map((s) => `${sx(s.x)},${sy(s.y)}`).join(" "),
    })),
    stops,
    destination: dest,
  };
  if (originStop) {
    model.origin = { cx: sx(originStop.x), cy: sy(originStop.y), name: originStop.name };
  }
  if (hit) {
    const stop = routes[hit.r].stops[hit.s];
    const cx = sx(stop.x);
    const cy = sy(stop.y);
    model.highlight = { cx, cy, name: stop.name };
    model.taxiLine = { x1: cx, y1: cy, x2: dest.cx, y2: dest.cy };
  }
  return model;
}

export function buildMapLabel(
  routes: Route[],
  destination: Place,
  highlightStopName?: string,
): string {
  const originName = routes[0]?.stops[0]?.name?.trim() || "출발지";
  const first = routes[0]?.stops ?? [];
  const via = [...new Set(first.slice(1, -1).map((s) => s.name))];

  let label = `${originName}에서 ${destination.name}까지 경로`;
  if (via.length > 0) label += `. 경유: ${via.join(", ")}`;
  if (findHighlight(routes, highlightStopName) && highlightStopName) {
    const station = highlightStopName.endsWith("역") ? highlightStopName : `${highlightStopName}역`;
    label += `. ${station}에서 택시로 갈아탑니다.`;
  }
  return label;
}
