import type { Place, Route } from "@/shared/types";

interface Props {
  routes: Route[];
  destination: Place;
  /** 강조할 택시 환승 정류장 이름 */
  highlightStopName?: string;
}

const SIZE = { w: 480, h: 280, pad: 24 };

/**
 * 지도 자리표시. 지금은 정류장 좌표를 SVG로 그린다.
 * 카카오 지도(KAKAO_JS_KEY)를 붙일 때 이 컴포넌트를 교체한다. props는 유지한다.
 */
export function MapView({ routes, destination, highlightStopName }: Props) {
  const stops = routes.flatMap((r) => r.stops);
  const points = [...stops, destination];
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  const sx = (x: number) =>
    SIZE.pad + ((x - minX) / (maxX - minX || 1)) * (SIZE.w - 2 * SIZE.pad);
  const sy = (y: number) =>
    SIZE.h - SIZE.pad - ((y - minY) / (maxY - minY || 1)) * (SIZE.h - 2 * SIZE.pad);

  return (
    <svg
      className="card map"
      viewBox={`0 0 ${SIZE.w} ${SIZE.h}`}
      role="img"
      aria-label="경로와 택시 환승역 위치"
    >
      {routes.map((route) => (
        <polyline
          key={route.id}
          fill="none"
          stroke="#2e9e4f"
          strokeWidth={3}
          points={route.stops.map((s) => `${sx(s.x)},${sy(s.y)}`).join(" ")}
        />
      ))}
      {stops.map((s) => (
        <circle
          key={`${s.name}:${s.x}`}
          cx={sx(s.x)}
          cy={sy(s.y)}
          r={s.name === highlightStopName ? 7 : 3}
          fill={s.name === highlightStopName ? "#e5484d" : "#2e9e4f"}
        >
          <title>{s.name}</title>
        </circle>
      ))}
      <rect x={sx(destination.x) - 6} y={sy(destination.y) - 6} width={12} height={12} fill="#1d4ed8">
        <title>{destination.name}</title>
      </rect>
    </svg>
  );
}
