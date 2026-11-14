"use client";

import { useEffect, useRef, useState } from "react";
import type { Coordinate } from "@/shared/types";
import type { MapMarker } from "./buildMapProps";
import { loadKakaoSdk } from "./loadKakaoSdk";
import styles from "./kakaoMap.module.css";

export interface KakaoMapProps {
  /** 출발 정류장부터 환승 정류장까지 */
  subwayPath: Coordinate[];
  /** 환승 정류장부터 목적지까지. 비어 있으면 그리지 않는다 */
  taxiPath: Coordinate[];
  /** true면 택시 선을 점선으로 그린다(도로 경로를 못 구해 직선으로 대신한 경우) */
  taxiFallback: boolean;
  markers: MapMarker[];
}

const SUBWAY_COLOR = "#2563eb";
const TAXI_COLOR = "#f2a007";
const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 };
const MARKER_LABEL: Record<MapMarker["kind"], string> = { origin: "출발", transfer: "택시 환승", destination: "도착" };

type Status = "loading" | "ready" | "error";

const toLatLng = (c: Coordinate) => new kakao.maps.LatLng(c.y, c.x);

function markerElement(marker: MapMarker): HTMLElement {
  const el = document.createElement("div");
  el.className = `${styles.pin} ${styles[marker.kind]}`;
  // 장소 이름이 HTML로 해석되지 않도록 textContent로 넣는다.
  el.textContent = `${MARKER_LABEL[marker.kind]} ${marker.name}`;
  return el;
}

/** 카카오 지도 위에 지하철 선, 택시 선, 마커를 그리고 전체가 보이게 범위를 맞춘다. */
export function KakaoMap({ subwayPath, taxiPath, taxiFallback, markers }: KakaoMapProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  // NEXT_PUBLIC_ 값은 빌드할 때 번들에 들어간다.
  const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

  useEffect(() => {
    if (!appKey) return;
    let cancelled = false;
    const drawn: kakao.maps.Removable[] = [];

    loadKakaoSdk(appKey)
      .then(() => {
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        const map =
          mapRef.current ??
          new kakao.maps.Map(canvas, { center: new kakao.maps.LatLng(SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng), level: 7 });
        mapRef.current = map;

        const bounds = new kakao.maps.LatLngBounds();
        const addLine = (path: Coordinate[], options: { color: string; style: string; zIndex: number }) => {
          if (path.length < 2) return;
          const latlngs = path.map(toLatLng);
          latlngs.forEach((p) => bounds.extend(p));
          drawn.push(
            new kakao.maps.Polyline({
              map,
              path: latlngs,
              strokeWeight: 6,
              strokeColor: options.color,
              strokeOpacity: 0.9,
              strokeStyle: options.style,
              zIndex: options.zIndex,
            }),
          );
        };
        addLine(subwayPath, { color: SUBWAY_COLOR, style: "solid", zIndex: 1 });
        addLine(taxiPath, { color: TAXI_COLOR, style: taxiFallback ? "dash" : "solid", zIndex: 2 });

        for (const marker of markers) {
          const position = toLatLng(marker.at);
          bounds.extend(position);
          drawn.push(
            new kakao.maps.CustomOverlay({ map, position, content: markerElement(marker), yAnchor: 1, zIndex: 3 }),
          );
        }

        map.relayout();
        map.setBounds(bounds);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      drawn.forEach((item) => item.setMap(null));
    };
  }, [appKey, subwayPath, taxiPath, taxiFallback, markers]);

  const notice = !appKey
    ? "지도 키(NEXT_PUBLIC_KAKAO_JS_KEY)가 설정되지 않았어요."
    : status === "error"
      ? "지도를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
      : status === "loading"
        ? "지도를 불러오는 중이에요"
        : null;

  return (
    <div className={styles.root} role="region" aria-label="경로 지도">
      <div ref={canvasRef} className={styles.canvas} />
      {notice && (
        <div className={styles.notice} role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
