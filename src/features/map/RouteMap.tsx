"use client";

import { useEffect, useMemo, useState } from "react";
import type { Coordinate, Place, RecommendResponse, TaxiPath } from "@/shared/types";
import { buildMapProps } from "./buildMapProps";
import { KakaoMap } from "./KakaoMap";

interface Props {
  result: RecommendResponse;
  origin: Place;
  destination: Place;
}

const straight = (from: Coordinate, to: Coordinate): TaxiPath => ({ path: [from, to], fallback: true });

/**
 * 추천 결과를 지도에 그린다. 환승역에서 목적지까지 택시 도로 경로는 /api/taxi-path로 받아 오고,
 * 받는 동안에는 지하철 선과 마커만 먼저 보여 준다.
 */
export function RouteMap({ result, origin, destination }: Props) {
  const view = useMemo(() => buildMapProps(result, origin, destination), [result, origin, destination]);
  const from = view?.option.stopCoord;
  const [taxi, setTaxi] = useState<{ key: string; data: TaxiPath } | null>(null);
  const key = from ? `${from.x},${from.y}->${destination.x},${destination.y}` : "";

  useEffect(() => {
    if (!from) return;
    const to = { x: destination.x, y: destination.y };
    const controller = new AbortController();
    const query = new URLSearchParams({
      fromX: String(from.x),
      fromY: String(from.y),
      toX: String(to.x),
      toY: String(to.y),
    });
    fetch(`/api/taxi-path?${query}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<TaxiPath>) : straight(from, to)))
      .catch((error) => (error instanceof DOMException && error.name === "AbortError" ? null : straight(from, to)))
      .then((data) => {
        if (data) setTaxi({ key, data });
      });
    return () => controller.abort();
  }, [from, destination.x, destination.y, key]);

  if (!view) return null;
  const loaded = taxi && taxi.key === key ? taxi.data : null;
  return (
    <KakaoMap
      subwayPath={view.subwayPath}
      taxiPath={loaded?.path ?? EMPTY}
      taxiFallback={loaded?.fallback ?? false}
      markers={view.markers}
    />
  );
}

const EMPTY: Coordinate[] = [];
