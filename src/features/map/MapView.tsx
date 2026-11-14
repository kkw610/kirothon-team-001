import type { Place, Route } from "@/shared/types";
import { MAP_SIZE, buildMapLabel, buildMapModel } from "./mapModel";
import styles from "./map.module.css";

interface Props {
  routes: Route[];
  destination: Place;
  /** 강조할 택시 환승 정류장 이름 */
  highlightStopName?: string;
}

/**
 * 지도 자리표시. 지금은 정류장 좌표를 SVG로 그린다.
 * 카카오 지도는 KakaoMap 컴포넌트(NEXT_PUBLIC_KAKAO_JS_KEY)가 맡는다. 이 SVG는 키 없이 쓰는 대체용이다.
 */
export function MapView({ routes, destination, highlightStopName }: Props) {
  const model = buildMapModel(routes, destination, highlightStopName);
  const label = buildMapLabel(routes, destination, highlightStopName);
  const { origin, highlight, taxiLine } = model;

  return (
    <svg
      className={`${styles.root} ${styles.mapCard}`}
      viewBox={`0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}`}
      role="img"
      aria-label={label}
    >
      {model.routeLines.map((line) => (
        <polyline key={line.id} className={styles.line} points={line.points} />
      ))}
      {taxiLine && (
        <line
          className={styles.taxiLine}
          x1={taxiLine.x1}
          y1={taxiLine.y1}
          x2={taxiLine.x2}
          y2={taxiLine.y2}
        />
      )}
      {model.stops.map((s) => (
        <circle
          key={s.key}
          className={s.highlighted ? styles.stopHighlight : styles.stopDot}
          cx={s.cx}
          cy={s.cy}
          r={s.highlighted ? 7 : 3}
        >
          <title>{s.name}</title>
        </circle>
      ))}
      {origin && (
        <g>
          <circle className={styles.originDot} cx={origin.cx} cy={origin.cy} r={6}>
            <title>출발: {origin.name}</title>
          </circle>
          <text className={styles.label} x={origin.cx + 10} y={origin.cy - 8}>
            출발
          </text>
        </g>
      )}
      <rect
        className={styles.destMark}
        x={model.destination.cx - 6}
        y={model.destination.cy - 6}
        width={12}
        height={12}
      >
        <title>{model.destination.name}</title>
      </rect>
      <text className={styles.label} x={model.destination.cx + 10} y={model.destination.cy - 8}>
        도착
      </text>
      {highlight && (
        <text className={styles.labelStrong} x={highlight.cx + 10} y={highlight.cy + 16}>
          여기서 내리세요
        </text>
      )}
    </svg>
  );
}
