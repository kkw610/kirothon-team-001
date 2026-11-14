import type { Option } from "@/shared/types";
import { cx } from "./cx";
import { getLineColor, getLineTextColor } from "./lineColor";
import { addMinutes, formatStationName, safeTime } from "./format";
import styles from "./result.module.css";

interface Step {
  key: string;
  name: string;
  time: string;
  /** 이 단계에서 출발하는 지하철 구간 (예: "2호선 · 이대역 → 당산역") */
  leg?: string;
  dot: string;
  line?: string;
  /** 이 단계에서 타는 노선 색 (점 아래쪽 반, 아래로 이어지는 선, 노선 칩) */
  color?: string;
  /** 이 단계에 도착할 때 타고 온 노선 색 (점 위쪽 반) */
  prevColor?: string;
}

const cssVars = (vars: Record<string, string | undefined>) => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) if (v) out[k] = v;
  return out as React.CSSProperties;
};

interface Props {
  option: Option;
  originName: string;
  destinationName: string;
}

/** 출발 → 택시 환승역(또는 도보 하차역) → 도착을 세로 타임라인으로 보여 준다. */
export function RouteSummaryCard({ option, originName, destinationName }: Props) {
  const { departureTime, arrivalTime, subwayMin, taxiWaitMin } = option;
  const getOff = addMinutes(departureTime, subwayMin);
  const taxiStart = addMinutes(departureTime, subwayMin + taxiWaitMin);
  const stopTime =
    option.kind === "walk"
      ? `${safeTime(getOff)} 하차 · 도보로 이동`
      : `${safeTime(getOff)} 하차 · ${safeTime(taxiStart)} 택시 승차`;
  const legs = option.legs ?? [];
  const legLabel = (i: number) => {
    const leg = legs[i];
    return leg ? `${leg.line} · ${formatStationName(leg.fromName)} → ${formatStationName(leg.toName)}` : undefined;
  };
  // 호선이 바뀌는 환승역마다 단계를 하나씩 끼워 넣어 어느 호선으로 갈아타는지 보여 준다.
  const transferSteps = legs.slice(0, -1).map((leg, i) => ({
    key: `transfer-${i}`,
    name: formatStationName(leg.toName),
    time: `${safeTime(addMinutes(departureTime, leg.endMin))} ${leg.line} → ${legs[i + 1].line} 환승`,
    leg: legLabel(i + 1),
    dot: styles.dotSubway,
    line: styles.lineSubway,
    color: getLineColor(legs[i + 1].line),
    prevColor: getLineColor(leg.line),
  }));
  const steps: Step[] = [
    { key: "origin", name: originName, time: `${safeTime(departureTime)} 출발`, leg: legLabel(0), dot: styles.dotSubway, line: styles.lineSubway, color: getLineColor(legs[0]?.line) },
    ...transferSteps,
    {
      key: "stop",
      name: formatStationName(option.stopName),
      time: stopTime,
      dot: styles.dotTransfer,
      line: styles.lineTaxi,
      prevColor: getLineColor(legs[legs.length - 1]?.line),
    },
    { key: "dest", name: destinationName, time: `${safeTime(arrivalTime)} 도착`, dot: styles.dotDest, line: undefined },
  ];
  return (
    <section className={cx(styles.root, styles.card, styles.routeCard)}>
      <h3 className={cx(styles.heading, styles.sectionTitle)}>경로 요약</h3>
      <ol className={styles.timeline}>
        {steps.map((s) => (
          <li key={s.key} className={styles.step} style={cssVars({ "--leg-color": s.color, "--leg-prev-color": s.prevColor ?? s.color })}>
            <span className={styles.stepRail} aria-hidden="true">
              <span className={cx(styles.dot, s.dot)} />
              {s.line && <span className={cx(styles.railLine, s.line)} />}
            </span>
            <div className={styles.stepText}>
              <p className={styles.stepName}>{s.name}</p>
              <p className={styles.stepTime}>{s.time}</p>
              {s.leg && (
                <p
                  className={styles.stepLeg}
                  style={s.color ? { background: s.color, color: getLineTextColor(s.color) } : undefined}
                >
                  {s.leg}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
